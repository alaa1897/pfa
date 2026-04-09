"""
Bookings – Models
-----------------
The booking model is the core of the platform's business logic.

Key concepts:
  - A booking links a User, a Board, a time window, and an Ad.
  - Time slots are 30 seconds each. A user picks how many consecutive
    slots they want and how many times the ad repeats in each slot.
  - Conflict detection ensures no two bookings overlap on the same board.

Timeline example:
  Board #3, 14:00–14:30
    Slot 1 (14:00–14:30): Ad A plays 3 times → 3 × 30s = 90s total
    Slot 2 (14:30–15:00): Ad B plays 2 times → already booked → CONFLICT
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.accounts.models import User
from apps.boards.models import Board


class Booking(models.Model):
    """
    A booking reserves a board for a specific time window.

    States:
      PENDING    → just created, not yet confirmed (e.g. awaiting payment)
      CONFIRMED  → paid / approved, Celery task has been scheduled
      CANCELLED  → cancelled by user or admin
      COMPLETED  → the ad has finished playing
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    # Relationships
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name="bookings")

    # Time window
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    # Repeat count — how many times the ad plays within this booking window
    repeat_count = models.PositiveIntegerField(default=1)

    # Status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    # Pricing snapshot — we store the price at booking time so future price
    # changes don't affect existing bookings
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    # Celery task ID — stored so we can cancel the task if booking is cancelled
    celery_task_id = models.CharField(max_length=255, blank=True)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bookings_booking"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Booking #{self.id} — {self.board.name} by {self.user.email}"

    def clean(self):
        """
        Django calls clean() before saving. We use it to enforce business rules.
        This is where conflict detection lives.
        """
        self._validate_time_window()
        self._check_board_availability()
        self._check_conflicts()

    def _validate_time_window(self):
        """Start time must be in the future and before end time."""
        if self.start_time and self.end_time:
            if self.start_time >= self.end_time:
                raise ValidationError("Start time must be before end time.")
            if self.start_time < timezone.now():
                raise ValidationError("Cannot book a time slot in the past.")

    def _check_board_availability(self):
        """The board must be active to accept bookings."""
        if self.board and not self.board.is_available:
            raise ValidationError(
                f"Board '{self.board.name}' is not available for booking."
            )

    def _check_conflicts(self):
        """
        The critical conflict detection query.

        Two bookings conflict if their time windows overlap. In database terms,
        booking A overlaps booking B if:
            A.start_time < B.end_time  AND  A.end_time > B.start_time

        We exclude CANCELLED bookings (they free up the slot) and the current
        booking itself (when updating).
        """
        if not (self.board and self.start_time and self.end_time):
            return

        conflicting = Booking.objects.filter(
            board=self.board,
            status__in=[self.Status.PENDING, self.Status.CONFIRMED],
            start_time__lt=self.end_time,   # existing booking starts before ours ends
            end_time__gt=self.start_time,   # existing booking ends after ours starts
        )

        # Exclude self when updating an existing booking
        if self.pk:
            conflicting = conflicting.exclude(pk=self.pk)

        if conflicting.exists():
            conflict = conflicting.first()
            raise ValidationError(
                f"This time slot conflicts with booking #{conflict.id} "
                f"({conflict.start_time.strftime('%H:%M')} – "
                f"{conflict.end_time.strftime('%H:%M')})."
            )

    def calculate_price(self):
        """
        Price = board's price_per_slot × number of 30-minute slots × repeat_count
        """
        if self.start_time and self.end_time and self.board:
            duration_minutes = (self.end_time - self.start_time).seconds / 60
            num_slots = max(1, int(duration_minutes / 30))
            return self.board.price_per_slot * num_slots * self.repeat_count
        return 0

    def save(self, *args, **kwargs):
        # Auto-calculate price if not set
        if not self.total_price:
            self.total_price = self.calculate_price()
        self.full_clean()  # Run validation before every save
        super().save(*args, **kwargs)

    @property
    def duration_minutes(self):
        return int((self.end_time - self.start_time).seconds / 60)

    @property
    def is_cancellable(self):
        """A booking can only be cancelled if it hasn't started yet."""
        return (
            self.status in (self.Status.PENDING, self.Status.CONFIRMED)
            and self.start_time > timezone.now()
        )
