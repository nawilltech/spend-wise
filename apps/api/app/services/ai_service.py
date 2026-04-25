import json
import google.generativeai as genai
from app.config import settings
from app.models.user import User
from app.schemas.ai import (
    ParsedExpenseResponse, BudgetAdviceResponse, BudgetAllocation,
    InvestmentSuggestionsResponse, InvestmentSuggestion,
)

genai.configure(api_key=settings.gemini_api_key)

SYSTEM_PROMPT = """You are SpendWise, an expert personal finance advisor.
You provide practical, actionable financial advice tailored to the user's income, location, and goals.
Always respond in JSON format as specified. Be concise and specific."""


class AIService:
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT,
        )

    async def parse_voice_expense(self, text: str, base_currency: str) -> ParsedExpenseResponse:
        prompt = f"""
        Extract expense details from this voice input: "{text}"
        Base currency if not mentioned: {base_currency}

        Return JSON only:
        {{
          "amount": <number>,
          "currency": "<3-letter code>",
          "category": "<category name>",
          "description": "<short description>",
          "date": "<ISO date string, today if not mentioned>"
        }}
        """
        try:
            response = await self.model.generate_content_async(prompt)
            data = self._parse_json(response.text)
            return ParsedExpenseResponse(**data)
        except Exception:
            return ParsedExpenseResponse(
                amount=0, currency=base_currency,
                category="Miscellaneous", description=text,
                date="",
            )

    async def get_budget_advice(self, summary: dict, user: User) -> BudgetAdviceResponse:
        prompt = f"""
        Analyse this user's financial data and provide budget recommendations.

        User location: {user.location}
        Monthly income: {summary.get('total_income', 0)} {user.base_currency}
        Monthly expenses by category: {json.dumps(summary.get('by_category', []))}

        Return JSON only:
        {{
          "allocations": [
            {{"category": "str", "percentage": number, "amount": number, "current": number}}
          ],
          "insights": ["insight 1", "insight 2", "insight 3"],
          "actions": ["action 1", "action 2", "action 3"]
        }}
        """
        try:
            response = await self.model.generate_content_async(prompt)
            data = self._parse_json(response.text)
            return BudgetAdviceResponse(
                allocations=[BudgetAllocation(**a) for a in data.get("allocations", [])],
                insights=data.get("insights", []),
                actions=data.get("actions", []),
            )
        except Exception:
            return BudgetAdviceResponse(allocations=[], insights=["Unable to generate advice at this time."], actions=[])

    async def get_investment_suggestions(self, summary: dict, user: User) -> InvestmentSuggestionsResponse:
        monthly_surplus = summary.get("total_income", 0) - summary.get("total_expense", 0)
        prompt = f"""
        Suggest investment options for this user.

        Location: {user.location}
        Risk tolerance: {user.risk_tolerance}
        Monthly surplus: {monthly_surplus} {user.base_currency}

        Return JSON only:
        {{
          "suggestions": [
            {{
              "name": "str",
              "type": "str",
              "expected_return": "str (e.g. 8-12% p.a.)",
              "risk_level": "low|medium|high",
              "minimum_amount": number,
              "description": "str",
              "platforms": ["platform1", "platform2"]
            }}
          ]
        }}
        """
        try:
            response = await self.model.generate_content_async(prompt)
            data = self._parse_json(response.text)
            return InvestmentSuggestionsResponse(
                suggestions=[InvestmentSuggestion(**s) for s in data.get("suggestions", [])],
                monthly_surplus=monthly_surplus,
                currency=user.base_currency,
            )
        except Exception:
            return InvestmentSuggestionsResponse(suggestions=[], monthly_surplus=monthly_surplus, currency=user.base_currency)

    async def answer_question(self, question: str, context: dict, user: User) -> str:
        prompt = f"""
        User financial context:
        - Location: {user.location}
        - Base currency: {user.base_currency}
        - Monthly income: {context.get('total_income', 0)}
        - Monthly expenses: {context.get('total_expense', 0)}
        - Savings rate: {context.get('savings_rate', 0)}%

        User question: {question}

        Provide a concise, practical answer in 2-4 sentences.
        """
        try:
            response = await self.model.generate_content_async(prompt)
            return response.text.strip()
        except Exception:
            return "I'm unable to answer that right now. Please try again."

    def _parse_json(self, text: str) -> dict:
        text = text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text.strip())


ai_service = AIService()
