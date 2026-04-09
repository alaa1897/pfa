"""
Boards – Serializers
"""

from rest_framework import serializers
from .models import Board, BoardImage


class BoardImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardImage
        fields = ["id", "image", "caption", "order"]


class BoardSerializer(serializers.ModelSerializer):
    """Full board details — used when fetching a single board."""
    images = BoardImageSerializer(many=True, read_only=True)
    is_available = serializers.ReadOnlyField()

    class Meta:
        model = Board
        fields = [
            "id", "name", "description", "latitude", "longitude",
            "address", "city", "resolution", "width_cm", "height_cm",
            "price_per_slot", "status", "thumbnail", "images",
            "is_available", "created_at",
        ]


class BoardMapSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for the map view.
    Only returns the fields needed to render the map markers — keeps the
    response small since we might return dozens of boards at once.
    """
    class Meta:
        model = Board
        fields = [
            "id", "name", "latitude", "longitude", "city",
            "status", "price_per_slot", "thumbnail",
        ]


class BoardCreateUpdateSerializer(serializers.ModelSerializer):
    """Used by admins to create or update boards."""
    class Meta:
        model = Board
        fields = [
            "name", "description", "latitude", "longitude",
            "address", "city", "resolution", "width_cm", "height_cm",
            "price_per_slot", "status", "thumbnail",
        ]
