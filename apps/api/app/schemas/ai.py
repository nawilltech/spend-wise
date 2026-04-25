from pydantic import BaseModel


class ParseVoiceRequest(BaseModel):
    text: str
    base_currency: str = "NGN"


class ParsedExpenseResponse(BaseModel):
    amount: float
    currency: str
    category: str
    description: str
    date: str


class AskQuestionRequest(BaseModel):
    question: str


class AskQuestionResponse(BaseModel):
    answer: str


class BudgetAllocation(BaseModel):
    category: str
    percentage: float
    amount: float
    current: float


class BudgetAdviceResponse(BaseModel):
    allocations: list[BudgetAllocation]
    insights: list[str]
    actions: list[str]


class InvestmentSuggestion(BaseModel):
    name: str
    type: str
    expected_return: str
    risk_level: str
    minimum_amount: float
    description: str
    platforms: list[str] = []


class InvestmentSuggestionsResponse(BaseModel):
    suggestions: list[InvestmentSuggestion]
    monthly_surplus: float
    currency: str
