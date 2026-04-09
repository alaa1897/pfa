"""
Boards – Models
---------------
The Board model represents a physical (or simulated) digital display screen.
Each board has a GPS location (so it appears on the map), a status, and
resolution metadata.

Key design decision:
  Boards are the inventory of the platform. Advertisers browse boards on
  the map and book time slots on them. The board's real-time state is managed
  via WebSocket connections to the simulator.
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Board(models.Model):
    """
    Represents a digital out-of-home display screen.
    
    Each board connects to the platform via WebSocket (simulated in a browser tab).
    When a scheduled ad is due, the backend pushes a message to the board's
    WebSocket channel, and the simulator displays it.
    """

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"           # Online and available for booking
        INACTIVE = "inactive", "Inactive"     # Offline / under maintenance
        MAINTENANCE = "maintenance", "Maintenance"

    class Resolution(models.TextChoices):
        HD = "1920x1080", "Full HD (1920×1080)"
        UHD = "3840x2160", "4K UHD (3840×2160)"
        PORTRAIT = "1080x1920", "Portrait HD (1080×1920)"
        SQUARE = "1080x1080", "Square (1080×1080)"

    # Identity
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    # Location — stored as decimal lat/lng for use with Leaflet.js
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100)

    # Hardware specs
    resolution = models.CharField(max_length=20, choices=Resolution.choices, default=Resolution.HD)
    width_cm = models.PositiveIntegerField(help_text="Physical width in centimetres")
    height_cm = models.PositiveIntegerField(help_text="Physical height in centimetres")

    # Pricing — cost per 30-second slot
    price_per_slot = models.DecimalField(max_digits=10, decimal_places=2)

    # Status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    # Thumbnail shown on the map popup
    thumbnail = models.ImageField(upload_to="boards/thumbnails/", blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "boards_board"
        ordering = ["city", "name"]

    def __str__(self):
        return f"{self.name} — {self.city}"

    @property
    def is_available(self):
        return self.status == self.Status.ACTIVE


class BoardImage(models.Model):
    """Optional gallery images for a board (shown in the map popup)."""

    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="boards/gallery/")
    caption = models.CharField(max_length=200, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "boards_board_image"
        ordering = ["order"]
