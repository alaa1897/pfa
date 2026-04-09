"""
Celery Configuration
--------------------
Celery is a distributed task queue. In this platform, it does one critical job:
at the exact scheduled time of a booking, Celery fires a background task that
pushes the ad content to the target board via WebSocket.

Flow:
  Booking saved → Celery task scheduled with ETA → ETA reached →
  Task runs → WebSocket message sent to board channel → Board displays ad
"""

import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("dooh")

# Read all CELERY_* settings from Django's settings.py
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks.py in every installed app
app.autodiscover_tasks()
