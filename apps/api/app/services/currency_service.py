from __future__ import annotations
import json
import httpx
import redis.asyncio as aioredis
from app.config import settings

CACHE_TTL = 86_400  # 24 hours
CACHE_KEY  = "exchange_rates:{base}"


class CurrencyService:
    def __init__(self):
        self._redis: aioredis.Redis | None = None

    async def _get_redis(self) -> aioredis.Redis:
        if not self._redis:
            self._redis = aioredis.from_url(settings.redis_url, decode_responses=True)
        return self._redis

    async def get_rates(self, base: str = "USD") -> dict[str, float]:
        try:
            redis = await self._get_redis()
            cache_key = CACHE_KEY.format(base=base)
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
            rates = await self._fetch_from_api(base)
            await redis.setex(cache_key, CACHE_TTL, json.dumps(rates))
            return rates
        except Exception:
            return await self._fetch_from_api(base)

    async def _fetch_from_api(self, base: str) -> dict[str, float]:
        import logging
        app_id = settings.open_exchange_rates_app_id
        if not app_id or app_id.startswith("your-"):
            return self._fallback_rates()

        try:
            url = f"https://openexchangerates.org/api/latest.json?app_id={app_id}&base={base}"
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                return data["rates"]
        except (httpx.HTTPError, KeyError) as e:
            logging.getLogger("uvicorn").warning(f"Exchange rate API error ({e}), using fallback rates")
            return self._fallback_rates()

    def convert(self, amount: float, from_currency: str, to_currency: str, rates: dict[str, float]) -> float:
        if from_currency == to_currency:
            return amount
        if from_currency not in rates or to_currency not in rates:
            return amount
        usd_amount = amount / rates[from_currency]
        return round(usd_amount * rates[to_currency], 2)

    def _fallback_rates(self) -> dict[str, float]:
        return {"USD": 1, "NGN": 1500, "GBP": 0.79, "EUR": 0.92, "GHS": 15.5, "KES": 130}


currency_service = CurrencyService()
