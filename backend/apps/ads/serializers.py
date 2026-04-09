"""
Ads – Serializers
"""

from rest_framework import serializers
from .models import Ad
from apps.bookings.models import Booking


class AdUploadSerializer(serializers.ModelSerializer):
    """Used when an advertiser uploads their ad creative."""

    class Meta:
        model = Ad
        fields = ["booking", "file", "title", "duration_seconds"]

    def validate_booking(self, booking):
        """Ensure the booking belongs to the requesting user."""
        user = self.context["request"].user
        if not user.is_admin_user and booking.user != user:
            raise serializers.ValidationError("This booking does not belong to you.")
        if hasattr(booking, "ad"):
            raise serializers.ValidationError(
                "An ad has already been uploaded for this booking."
            )
        return booking

    def validate(self, data):
        file = data.get("file")
        if file:
            # Auto-detect ad_type from file extension
            ext = file.name.split(".")[-1].lower()
            if ext in ("mp4", "webm"):
                data["ad_type"] = Ad.AdType.VIDEO
            else:
                data["ad_type"] = Ad.AdType.IMAGE

            # Enforce 50 MB size limit
            if file.size > 50 * 1024 * 1024:
                raise serializers.ValidationError(
                    {"file": "File size must not exceed 50 MB."}
                )
        return data

    def create(self, validated_data):
        # ad_type is set in validate() but not a form field — inject it here
        if "ad_type" not in validated_data:
            file = validated_data.get("file")
            if file:
                ext = file.name.split(".")[-1].lower()
                validated_data["ad_type"] = (
                    Ad.AdType.VIDEO if ext in ("mp4", "webm") else Ad.AdType.IMAGE
                )
        return super().create(validated_data)


class AdDetailSerializer(serializers.ModelSerializer):
    """Used for reading ad details."""
    file_size_mb = serializers.ReadOnlyField()
    file_url = serializers.ReadOnlyField()
    booking_start_time = serializers.ReadOnlyField(source="booking.start_time")
    board_name = serializers.ReadOnlyField(source="booking.board.name")

    class Meta:
        model = Ad
        fields = [
            "id", "booking", "booking_start_time", "board_name",
            "file_url", "title", "ad_type", "duration_seconds",
            "file_size_mb", "status", "created_at",
        ]
