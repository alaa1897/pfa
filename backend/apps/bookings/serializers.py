"""
Bookings – Serializers
"""

from rest_framework import serializers
from django.utils import timezone
from .models import Booking
from apps.boards.serializers import BoardMapSerializer


class BookingCreateSerializer(serializers.ModelSerializer):
    # ... keep everything here but REMOVE get_has_ad from here
    class Meta:
        model = Booking
        fields = ["board", "start_time", "end_time", "repeat_count", "notes"]

    def validate_start_time(self, value):
        if value < timezone.now():
            raise serializers.ValidationError("Start time cannot be in the past.")
        return value

    def validate(self, data):
        if data["start_time"] >= data["end_time"]:
            raise serializers.ValidationError("End time must be after start time.")
        return data

    def create(self, validated_data):
        user = self.context["request"].user
        booking = Booking(user=user, **validated_data)
        booking.save()
        return booking


class BookingDetailSerializer(serializers.ModelSerializer):
    board_detail = BoardMapSerializer(source="board", read_only=True)
    user_email = serializers.ReadOnlyField(source="user.email")
    duration_minutes = serializers.ReadOnlyField()
    is_cancellable = serializers.ReadOnlyField()
    has_ad = serializers.SerializerMethodField()

    def get_has_ad(self, obj):          # ← correct: hasattr not obj.ads.exists()
        return hasattr(obj, "ad")

    class Meta:
        model = Booking
        fields = [
            "id", "user_email", "board", "board_detail",
            "start_time", "end_time", "duration_minutes",
            "repeat_count", "status", "total_price",
            "is_cancellable", "notes", "created_at", "has_ad",
        ]
        read_only_fields = ["id", "status", "total_price", "created_at"]

class AvailabilityRequestSerializer(serializers.Serializer):
    """
    Validates the query parameters for the availability check endpoint.

    GET /api/v1/bookings/availability/?board_id=3&date=2025-04-15
    """
    board_id = serializers.IntegerField()
    date = serializers.DateField()


class AvailabilitySlotSerializer(serializers.Serializer):
    """Represents a single 30-minute slot in the availability response."""
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    is_available = serializers.BooleanField()
    booking_id = serializers.IntegerField(allow_null=True)
