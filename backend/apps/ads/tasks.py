"""
Ads – Celery Tasks
------------------
This is where the scheduling magic happens.

The flow:
  1. User creates a booking → BookingViewSet.create() calls:
         schedule_ad_display.apply_async(args=[booking.id], eta=booking.start_time)

  2. Celery stores this task with the ETA (estimated time of arrival).
     The task sits in the Redis queue doing nothing until the ETA arrives.

  3. At exactly booking.start_time, Celery wakes up and calls schedule_ad_display.
     The task finds the booking, gets the ad file URL, and calls send_ad_to_board().

  4. send_ad_to_board() pushes a WebSocket message to the channel group
     "board_<board_id>". Every simulator connected to that board receives it
     and starts displaying the ad.

  5. After all repetitions are done, clear_board is called to reset the screen.

Why Celery + Redis?
  - Django itself is synchronous and can't "wait" until a future time.
  - Celery is a dedicated worker process that can schedule tasks with ETAs.
  - Redis acts as the message broker between Django and Celery.
"""

import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def schedule_ad_display(self, booking_id: int):
    """
    Fires at booking.start_time. Pushes the ad to the target board via WebSocket.

    bind=True          → gives us access to self (the task instance)
    max_retries=3      → retry up to 3 times if it fails
    default_retry_delay→ wait 30 seconds between retries
    """
    from apps.bookings.models import Booking
    from apps.boards.consumers import send_ad_to_board

    try:
        booking = Booking.objects.select_related("board", "ad").get(pk=booking_id)
    except Booking.DoesNotExist:
        logger.error(f"schedule_ad_display: Booking #{booking_id} not found.")
        return

    # Don't display if booking was cancelled
    if booking.status == Booking.Status.CANCELLED:
        logger.info(f"Booking #{booking_id} is cancelled. Skipping ad display.")
        return

    # Don't display if the ad hasn't been uploaded yet
    if not hasattr(booking, "ad"):
        logger.warning(f"Booking #{booking_id} has no ad uploaded. Skipping.")
        return

    ad = booking.ad

    # Don't display if the ad wasn't approved
    if ad.status != "approved":
        logger.warning(f"Ad for Booking #{booking_id} is not approved. Skipping.")
        return

    logger.info(
        f"Pushing ad '{ad.title}' to Board #{booking.board_id} "
        f"(repeat {booking.repeat_count}×)"
    )

    # Push the ad to the board via WebSocket
    send_ad_to_board(
        board_id=booking.board_id,
        ad_url=ad.file_url,
        duration_seconds=ad.duration_seconds,
        repeat_count=booking.repeat_count,
        booking_id=booking.id,
    )

    # Mark the booking as confirmed/playing
    booking.status = Booking.Status.CONFIRMED
    booking.save(update_fields=["status"])

    # Schedule the "clear screen" task for when the ad finishes
    total_display_time = ad.duration_seconds * booking.repeat_count
    clear_board_screen.apply_async(
        args=[booking.id],
        countdown=total_display_time,  # seconds from now
    )


@shared_task
def clear_board_screen(booking_id: int):
    """
    Fires after the ad has finished playing all its repetitions.
    Sends a 'clear screen' signal to the board and marks the booking complete.
    """
    from apps.bookings.models import Booking
    from apps.boards.consumers import BoardConsumer
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    try:
        booking = Booking.objects.select_related("board").get(pk=booking_id)
    except Booking.DoesNotExist:
        return

    # Push a clear signal to the board's WebSocket channel
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"board_{booking.board_id}",
        {
            "type": "clear_screen",
            "message": f"Booking #{booking_id} completed.",
        }
    )

    # Mark booking as completed
    booking.status = Booking.Status.COMPLETED
    booking.save(update_fields=["status"])

    logger.info(f"Booking #{booking_id} completed. Board #{booking.board_id} cleared.")
