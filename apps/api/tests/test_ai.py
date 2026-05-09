"""
AI endpoint and service tests.

Strategy:
  - Route tests   → mock the entire ai_service so no Gemini calls happen.
                    Verifies auth, HTTP status codes, and response shape.
  - Service tests → mock model.generate_content_async at the SDK level.
                    Verifies JSON parsing, fallback behaviour, and error handling.
"""
from __future__ import annotations
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.ai_service import AIService


# ── Helpers ───────────────────────────────────────────────────────────────────

def _gemini_response(payload: dict | str) -> MagicMock:
    """Fake Gemini response object with a .text attribute."""
    mock = MagicMock()
    mock.text = json.dumps(payload) if isinstance(payload, dict) else payload
    return mock


PARSED_EXPENSE = {
    "amount": 5000.0,
    "currency": "NGN",
    "category": "Food",
    "description": "Bought lunch",
    "date": "2026-04-27",
}

BUDGET_ADVICE = {
    "allocations": [
        {"category": "Food", "percentage": 30.0, "amount": 30000.0, "current": 25000.0}
    ],
    "insights": ["You spend well on food."],
    "actions": ["Reduce transport costs."],
}

INVESTMENT_SUGGESTIONS = {
    "suggestions": [
        {
            "name": "Treasury Bills",
            "type": "Fixed Income",
            "expected_return": "12-15% p.a.",
            "risk_level": "low",
            "minimum_amount": 50000.0,
            "description": "Safe government-backed investment.",
            "platforms": ["CBN", "Cowrywise"],
        }
    ]
}


# ── Route tests (mock the whole service) ─────────────────────────────────────

class TestParseVoiceRoute:
    async def test_requires_auth(self, client):
        res = await client.post("/api/v1/ai/parse-voice", json={"text": "spent 5k on food"})
        assert res.status_code == 401

    async def test_returns_parsed_expense(self, client, auth_headers):
        with patch(
            "app.routers.ai.ai_service.parse_voice_expense",
            new_callable=AsyncMock,
            return_value=MagicMock(**PARSED_EXPENSE),
        ):
            res = await client.post(
                "/api/v1/ai/parse-voice",
                json={"text": "spent 5k on food", "base_currency": "NGN"},
                headers=auth_headers,
            )
        assert res.status_code == 200
        data = res.json()
        assert data["amount"] == 5000.0
        assert data["currency"] == "NGN"
        assert data["category"] == "Food"

    async def test_uses_user_base_currency_as_default(self, client, auth_headers):
        captured = {}

        async def _fake_parse(text, base_currency):
            captured["base_currency"] = base_currency
            return MagicMock(**PARSED_EXPENSE)

        with patch("app.routers.ai.ai_service.parse_voice_expense", side_effect=_fake_parse):
            await client.post(
                "/api/v1/ai/parse-voice",
                json={"text": "spent 5k on food"},   # no base_currency in body
                headers=auth_headers,
            )
        # SAMPLE_USER registers with base_currency NGN
        assert captured["base_currency"] == "NGN"


class TestBudgetAdviceRoute:
    async def test_requires_auth(self, client):
        res = await client.get("/api/v1/ai/budget-advice")
        assert res.status_code == 401

    async def test_returns_advice(self, client, auth_headers):
        fake_advice = MagicMock(
            allocations=[],
            insights=["Save more."],
            actions=["Cut subscriptions."],
        )
        with patch("app.routers.ai.ai_service.get_budget_advice", new_callable=AsyncMock, return_value=fake_advice):
            res = await client.get("/api/v1/ai/budget-advice", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert "allocations" in data
        assert "insights" in data
        assert "actions" in data


class TestInvestmentSuggestionsRoute:
    async def test_requires_auth(self, client):
        res = await client.get("/api/v1/ai/investment-suggestions")
        assert res.status_code == 401

    async def test_returns_suggestions(self, client, auth_headers):
        fake = MagicMock(suggestions=[], monthly_surplus=50000.0, currency="NGN")
        with patch(
            "app.routers.ai.ai_service.get_investment_suggestions",
            new_callable=AsyncMock,
            return_value=fake,
        ):
            res = await client.get("/api/v1/ai/investment-suggestions", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert "suggestions" in data
        assert "monthly_surplus" in data
        assert "currency" in data


class TestAskRoute:
    async def test_requires_auth(self, client):
        res = await client.post("/api/v1/ai/ask", json={"question": "Am I saving enough?"})
        assert res.status_code == 401

    async def test_returns_answer(self, client, auth_headers):
        with patch(
            "app.routers.ai.ai_service.answer_question",
            new_callable=AsyncMock,
            return_value="Yes, your savings rate is healthy.",
        ):
            res = await client.post(
                "/api/v1/ai/ask",
                json={"question": "Am I saving enough?"},
                headers=auth_headers,
            )
        assert res.status_code == 200
        assert res.json()["answer"] == "Yes, your savings rate is healthy."


# ── Service unit tests (mock model.generate_content_async) ────────────────────

@pytest.fixture
def svc():
    """Fresh AIService with a mocked Gemini model."""
    service = AIService.__new__(AIService)
    service.model = MagicMock()
    return service


class TestParseVoiceService:
    async def test_happy_path(self, svc):
        svc.model.generate_content_async = AsyncMock(return_value=_gemini_response(PARSED_EXPENSE))
        result = await svc.parse_voice_expense("spent 5k on food", "NGN")
        assert result.amount == 5000.0
        assert result.currency == "NGN"
        assert result.category == "Food"

    async def test_code_fenced_json(self, svc):
        """Gemini often wraps JSON in ```json ... ``` blocks."""
        fenced = f"```json\n{json.dumps(PARSED_EXPENSE)}\n```"
        svc.model.generate_content_async = AsyncMock(return_value=_gemini_response(fenced))
        result = await svc.parse_voice_expense("lunch 5k", "NGN")
        assert result.amount == 5000.0

    async def test_malformed_json_returns_fallback(self, svc):
        svc.model.generate_content_async = AsyncMock(return_value=_gemini_response("not json at all"))
        result = await svc.parse_voice_expense("lunch 5k", "NGN")
        # Fallback: amount=0, description=original text
        assert result.amount == 0
        assert result.description == "lunch 5k"
        assert result.currency == "NGN"

    async def test_api_exception_returns_fallback(self, svc):
        svc.model.generate_content_async = AsyncMock(side_effect=Exception("Gemini unavailable"))
        result = await svc.parse_voice_expense("dinner 3k", "NGN")
        assert result.amount == 0
        assert result.category == "Miscellaneous"


class TestBudgetAdviceService:
    async def test_happy_path(self, svc):
        svc.model.generate_content_async = AsyncMock(return_value=_gemini_response(BUDGET_ADVICE))
        user = MagicMock(location="Lagos", base_currency="NGN")
        summary = {"total_income": 100000, "by_category": []}
        result = await svc.get_budget_advice(summary, user)
        assert len(result.allocations) == 1
        assert result.allocations[0].category == "Food"
        assert result.insights == ["You spend well on food."]

    async def test_exception_returns_empty_fallback(self, svc):
        svc.model.generate_content_async = AsyncMock(side_effect=Exception("timeout"))
        user = MagicMock(location="Lagos", base_currency="NGN")
        result = await svc.get_budget_advice({}, user)
        assert result.allocations == []
        assert "Unable to generate advice" in result.insights[0]


class TestInvestmentSuggestionsService:
    async def test_happy_path(self, svc):
        svc.model.generate_content_async = AsyncMock(
            return_value=_gemini_response(INVESTMENT_SUGGESTIONS)
        )
        user = MagicMock(location="Lagos", base_currency="NGN", risk_tolerance="medium")
        summary = {"total_income": 150000, "total_expense": 100000}
        result = await svc.get_investment_suggestions(summary, user)
        assert len(result.suggestions) == 1
        assert result.suggestions[0].name == "Treasury Bills"
        assert result.monthly_surplus == 50000
        assert result.currency == "NGN"

    async def test_computes_surplus_from_summary(self, svc):
        svc.model.generate_content_async = AsyncMock(
            return_value=_gemini_response({"suggestions": []})
        )
        user = MagicMock(location="Lagos", base_currency="NGN", risk_tolerance="low")
        summary = {"total_income": 200000, "total_expense": 80000}
        result = await svc.get_investment_suggestions(summary, user)
        assert result.monthly_surplus == 120000

    async def test_exception_returns_empty_fallback(self, svc):
        svc.model.generate_content_async = AsyncMock(side_effect=Exception("rate limit"))
        user = MagicMock(base_currency="NGN", risk_tolerance="low", location="Lagos")
        result = await svc.get_investment_suggestions({"total_income": 0, "total_expense": 0}, user)
        assert result.suggestions == []


class TestAnswerQuestionService:
    async def test_happy_path(self, svc):
        svc.model.generate_content_async = AsyncMock(
            return_value=_gemini_response("  Your savings rate is healthy.  ")
        )
        user = MagicMock(location="Lagos", base_currency="NGN")
        answer = await svc.answer_question("Am I saving enough?", {}, user)
        # Service strips whitespace from the raw text
        assert "savings rate" in answer

    async def test_exception_returns_fallback_string(self, svc):
        svc.model.generate_content_async = AsyncMock(side_effect=Exception("network error"))
        user = MagicMock(location="Lagos", base_currency="NGN")
        answer = await svc.answer_question("Help?", {}, user)
        assert "unable" in answer.lower()


class TestParseJsonHelper:
    def test_plain_json(self):
        svc = AIService.__new__(AIService)
        data = svc._parse_json('{"key": "value"}')
        assert data == {"key": "value"}

    def test_code_fenced_json(self):
        svc = AIService.__new__(AIService)
        fenced = "```json\n{\"key\": \"value\"}\n```"
        data = svc._parse_json(fenced)
        assert data == {"key": "value"}

    def test_code_fence_without_language_tag(self):
        svc = AIService.__new__(AIService)
        fenced = "```\n{\"key\": 1}\n```"
        data = svc._parse_json(fenced)
        assert data == {"key": 1}

    def test_malformed_raises(self):
        svc = AIService.__new__(AIService)
        with pytest.raises(Exception):
            svc._parse_json("not valid json")
