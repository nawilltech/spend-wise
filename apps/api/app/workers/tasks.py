from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.refresh_exchange_rates")
def refresh_exchange_rates():
    import asyncio
    from app.services.currency_service import currency_service

    async def _run():
        for base in ["USD", "NGN", "GBP", "EUR", "GHS"]:
            await currency_service._fetch_from_api(base)

    asyncio.run(_run())


@celery_app.task(name="app.workers.tasks.generate_monthly_reports")
def generate_monthly_reports():
    # Fetch all users and generate AI insights for each
    # Full implementation: query all users, call analysis_service + ai_service per user,
    # store results, send push notifications
    pass


@celery_app.task(name="app.workers.tasks.send_weekly_summaries")
def send_weekly_summaries():
    # Weekly digest: top category, savings rate, vs. last week
    pass


@celery_app.task(name="app.workers.tasks.generate_report_for_user")
def generate_report_for_user(user_id: str):
    import asyncio
    from app.database import AsyncSessionLocal
    from app.services.analysis_service import analysis_service

    async def _run():
        async with AsyncSessionLocal() as db:
            summary = await analysis_service.get_monthly_summary(db, user_id, "NGN")
            return summary

    return asyncio.run(_run())
