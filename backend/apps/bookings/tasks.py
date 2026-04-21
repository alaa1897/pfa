"""
Bookings – Celery Tasks
-----------------------
Background tasks related to booking lifecycle.

cancel_pending_booking:
    Fires 15 minutes after a booking is created.
    If the booking is still pending (payment not completed),
    it cancels the booking and frees the slot.
"""

import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def cancel_pending_booking(booking_id):
    from .models import Booking

    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return

    if booking.status == Booking.Status.PENDING:
        booking.status = Booking.Status.CANCELLED
        booking.save()
        logger.info(f"Booking #{booking_id} auto-cancelled after 15 minutes — payment not completed.")