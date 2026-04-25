from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai import (
    ParseVoiceRequest, ParsedExpenseResponse,
    AskQuestionRequest, AskQuestionResponse,
    BudgetAdviceResponse, InvestmentSuggestionsResponse,
)
from app.services.ai_service import ai_service
from app.services.analysis_service import analysis_service

router = APIRouter()


@router.post("/parse-voice", response_model=ParsedExpenseResponse)
async def parse_voice_expense(
    body: ParseVoiceRequest,
    user: User = Depends(get_current_user),
):
    return await ai_service.parse_voice_expense(body.text, body.base_currency or user.base_currency)


@router.get("/budget-advice", response_model=BudgetAdviceResponse)
async def get_budget_advice(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    summary = await analysis_service.get_monthly_summary(db, user.id, user.base_currency)
    return await ai_service.get_budget_advice(summary, user)


@router.get("/investment-suggestions", response_model=InvestmentSuggestionsResponse)
async def get_investment_suggestions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    summary = await analysis_service.get_monthly_summary(db, user.id, user.base_currency)
    return await ai_service.get_investment_suggestions(summary, user)


@router.post("/ask", response_model=AskQuestionResponse)
async def ask_question(
    body: AskQuestionRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    context = await analysis_service.get_monthly_summary(db, user.id, user.base_currency)
    answer = await ai_service.answer_question(body.question, context, user)
    return AskQuestionResponse(answer=answer)
