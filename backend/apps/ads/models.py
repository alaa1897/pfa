"""
Ads – Models
------------
An Ad is the creative content uploaded by an advertiser for a specific booking.
It can be an image or a short video.

Relationship:
  User → Booking → Ad (one-to-one: each booking has exactly one ad)

The Ad model stores the file, its metadata, and which booking it belongs to.
Once the Celery task fires, it reads the ad's file URL and sends it to
the board simulator via WebSocket.
"""

import os
from django.db import models
from django.core.validators import FileExtensionValidator
from apps.accounts.models import User
from apps.bookings.models import Booking


def ad_upload_path(instance, filename):
    """
    Generates the upload path: media/ads/<user_id>/<booking_id>/<filename>
    Keeps files organised per user and booking.
    """
    return f"ads/{instance.booking.user_id}/{instance.booking_id}/{filename}"


class Ad(models.Model):
    """
    The creative asset uploaded for a booking.
    """

    class AdType(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"

    class AdStatus(models.TextChoices):
        PENDING_REVIEW = "pending_review", "Pending Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    # The booking this ad belongs to (one-to-one)
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name="ad"
    )

    # The uploaded file — validated to only allow safe media types
    file = models.FileField(
        upload_to=ad_upload_path,
        validators=[
            FileExtensionValidator(
                allowed_extensions=["jpg", "jpeg", "png", "gif", "mp4", "webm"]
            )
        ]
    )

    ad_type = models.CharField(max_length=10, choices=AdType.choices)
    title = models.CharField(max_length=200)

    # Duration in seconds — for images this is how long the image is shown
    # For videos this should match the video length
    duration_seconds = models.PositiveIntegerField(default=30)

    status = models.CharField(
        max_length=20,
        choices=AdStatus.choices,
        default=AdStatus.APPROVED  # Auto-approve for now; add review flow later
    )

    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ads_ad"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Ad '{self.title}' for Booking #{self.booking_id}"

    @property
    def file_url(self):
        """Returns the absolute URL path to the ad file."""
        return self.file.url if self.file else None

    @property
    def file_size_mb(self):
        """Returns the file size in megabytes."""
        try:
            return round(self.file.size / (1024 * 1024), 2)
        except (FileNotFoundError, AttributeError):
            return None
