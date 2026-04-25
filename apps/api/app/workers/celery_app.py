from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery_app = Celery(
    "spendwise",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "refresh-exchange-rates": {
            "task": "app.workers.tasks.refresh_exchange_rates",
            "schedule": crontab(hour=0, minute=0),  # daily at midnight UTC
        },
        "monthly-ai-reports": {
            "task": "app.workers.tasks.generate_monthly_reports",
            "schedule": crontab(day_of_month=1, hour=8, minute=0),
        },
        "weekly-summary": {
            "task": "app.workers.tasks.send_weekly_summaries",
            "schedule": crontab(day_of_week="monday", hour=8, minute=0),
        },
    },
)
