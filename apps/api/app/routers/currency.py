from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.models.user import User
from app.services.currency_service import currency_service

router = APIRouter()


@router.get("/rates/{base}")
async def get_rates(base: str, user: User = Depends(get_current_user)):
    rates = await currency_service.get_rates(base.upper())
    return {"base": base.upper(), "rates": rates}


@router.get("/convert")
async def convert(
    amount: float, from_currency: str, to_currency: str,
    user: User = Depends(get_current_user),
):
    rates = await currency_service.get_rates(to_currency.upper())
    converted = currency_service.convert(amount, from_currency.upper(), to_currency.upper(), rates)
    return {"amount": amount, "from": from_currency, "to": to_currency, "result": converted}
