"""
Ads – Views
"""

from rest_framework import generics, permissions
from .models import Ad
from .serializers import AdUploadSerializer, AdDetailSerializer


class AdUploadView(generics.CreateAPIView):
    """
    POST /api/v1/ads/upload/
    Uploads the ad creative for a confirmed booking.
    Accepts multipart/form-data (required for file uploads).
    """
    serializer_class = AdUploadSerializer
    permission_classes = [permissions.IsAuthenticated]


class AdListView(generics.ListAPIView):
    """
    GET /api/v1/ads/
    Returns all ads belonging to the current user.
    """
    serializer_class = AdDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_admin_user:
            return Ad.objects.select_related("booking__board").all()
        return Ad.objects.select_related("booking__board").filter(
            booking__user=self.request.user
        )


class AdDetailView(generics.RetrieveAPIView):
    """GET /api/v1/ads/<id>/"""
    serializer_class = AdDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_admin_user:
            return Ad.objects.all()
        return Ad.objects.filter(booking__user=self.request.user)
