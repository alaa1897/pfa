"""
Bookings – Views
----------------
The booking views handle the full booking lifecycle and the critical
availability calendar that powers the frontend date/time picker.
"""

from datetime import datetime, timedelta
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from .tasks import cancel_pending_booking
from apps.ads.tasks import schedule_ad_display

from .models import Booking
from .serializers import (
    BookingCreateSerializer,
    BookingDetailSerializer,
    AvailabilityRequestSerializer,
    AvailabilitySlotSerializer,
)
from apps.boards.models import Board
from apps.accounts.permissions import IsAdminUser


class BookingViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/bookings/                  → list user's bookings
    POST   /api/v1/bookings/                  → create a booking
    GET    /api/v1/bookings/<id>/             → booking detail
    DELETE /api/v1/bookings/<id>/cancel/      → cancel a booking
    GET    /api/v1/bookings/availability/     → check board availability
    GET    /api/v1/bookings/all/              → admin: all bookings
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Regular users only see their own bookings
        # Admins see all bookings
        if self.request.user.is_admin_user:
            return Booking.objects.select_related("user", "board").all()
        return Booking.objects.select_related("board").filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        return BookingDetailSerializer
   
    def create(self, request, *args, **kwargs):
        """
        POST /api/v1/bookings/
        Creates a booking and schedules the Celery task.
        Returns 409 Conflict if the slot is taken.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            booking = serializer.save()
            
            # Cancel booking if payment not completed in 15 minutes
            cancel_pending_booking.apply_async(
                args=[booking.id],
                countdown=60 * 15
            )
            
            # Schedule ad display at booking start time
            schedule_ad_display.apply_async(
                args=[booking.id],
                eta=booking.start_time,
            )

        except ValidationError as e:
            return Response(
                {"detail": e.messages[0] if e.messages else str(e)},
                status=status.HTTP_409_CONFLICT
            )

        return Response(
            BookingDetailSerializer(booking, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        """
        POST /api/v1/bookings/<id>/cancel/
        Cancels a booking and revokes the Celery task.
        """
        booking = self.get_object()

        if not booking.is_cancellable:
            return Response(
                {"detail": "This booking cannot be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Revoke the Celery task so the ad doesn't play
        if booking.celery_task_id:
            from config.celery import app as celery_app
            celery_app.control.revoke(booking.celery_task_id, terminate=True)

        booking.status = Booking.Status.CANCELLED
        booking.save(update_fields=["status"])

        return Response({"detail": "Booking cancelled successfully."})

    @action(detail=False, methods=["get"], url_path="availability")
    def availability(self, request):
        """
        GET /api/v1/bookings/availability/?board_id=3&date=2025-04-15

        Returns all 30-minute slots for a given board on a given day,
        with is_available=True/False for each slot.

        This powers the time-slot calendar in the frontend booking form.

        How it works:
          1. Generate all 30-min slots for the day (48 slots × 24 hours)
          2. Query confirmed/pending bookings for this board on this day
          3. For each slot, check if any booking overlaps it
        """
        params = AvailabilityRequestSerializer(data=request.query_params)
        params.is_valid(raise_exception=True)

        board = get_object_or_404(Board, pk=params.validated_data["board_id"])
        date = params.validated_data["date"]

        # Build the full list of 30-min slots for the day
        day_start = timezone.make_aware(datetime.combine(date, datetime.min.time()))
        day_end = day_start + timedelta(days=1)

        slots = []
        current = day_start
        while current < day_end:
            slot_end = current + timedelta(minutes=30)
            slots.append({"start_time": current, "end_time": slot_end})
            current = slot_end

        # Fetch all non-cancelled bookings for this board on this day
        booked = Booking.objects.filter(
            board=board,
            status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED],
            start_time__lt=day_end,
            end_time__gt=day_start,
        )

        # Build a list of (start, end, booking_id) tuples for quick lookup
        booked_windows = [(b.start_time, b.end_time, b.id) for b in booked]

        # Mark each slot as available or not
        result = []
        for slot in slots:
            booking_id = None
            is_available = True

            for b_start, b_end, b_id in booked_windows:
                # Overlap condition (same as in Booking.clean)
                if slot["start_time"] < b_end and slot["end_time"] > b_start:
                    is_available = False
                    booking_id = b_id
                    break

            # Skip slots in the past
            if slot["start_time"] < timezone.now():
                is_available = False

            result.append({
                "start_time": slot["start_time"],
                "end_time": slot["end_time"],
                "is_available": is_available,
                "booking_id": booking_id,
            })

        return Response(AvailabilitySlotSerializer(result, many=True).data)

    @action(detail=False, methods=["get"], url_path="all",
            permission_classes=[IsAdminUser])
    def all_bookings(self, request):
        """GET /api/v1/bookings/all/ — admin only, returns every booking."""
        bookings = Booking.objects.select_related("user", "board").all()
        serializer = BookingDetailSerializer(bookings, many=True,
                                             context={"request": request})
        return Response(serializer.data)
