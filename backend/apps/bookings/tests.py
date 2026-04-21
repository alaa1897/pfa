"""
Bookings – Tests
----------------
Tests for booking lifecycle tasks.
"""

import datetime
from django.test import TestCase
from django.utils import timezone
from apps.accounts.models import User
from apps.boards.models import Board
from apps.bookings.models import Booking
from apps.bookings.tasks import cancel_pending_booking


class CancelPendingBookingTaskTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )

        self.board = Board.objects.create(
            name='Test Board',
            latitude=36.8,
            longitude=10.1,
            address='Test Address',
            city='Tunis',
            width_cm=300,
            height_cm=200,
            price_per_slot=50.00
        )

        self.booking = Booking.objects.create(
            user=self.user,
            board=self.board,
            start_time=timezone.now() + datetime.timedelta(hours=1),
            end_time=timezone.now() + datetime.timedelta(hours=2),
            repeat_count=1,
            total_price=50.00,
            status=Booking.Status.PENDING
        )

    def test_pending_booking_gets_cancelled(self):
        cancel_pending_booking(self.booking.id)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.Status.CANCELLED)

    def test_confirmed_booking_not_touched(self):
        self.booking.status = Booking.Status.CONFIRMED
        self.booking.save()
        cancel_pending_booking(self.booking.id)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.Status.CONFIRMED)

    def test_nonexistent_booking_does_not_crash(self):
        try:
            cancel_pending_booking(99999)
        except Exception as e:
            self.fail(f"Task crashed with exception: {e}")