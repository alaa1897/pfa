from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
import datetime
from apps.boards.models import Board
from apps.bookings.models import Booking
from apps.payments.models import Payment

User = get_user_model()


# ─── Unit Tests ───────────────────────────────────────────────────────────────

class PaymentModelTest(TestCase):
    """Test the Payment model behaves correctly."""

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
            width_cm=200,
            height_cm=150,
            price_per_slot=50.00
        )
        self.booking = Booking.objects.create(
            user=self.user,
            board=self.board,
            start_time=timezone.now() + datetime.timedelta(days=1),
            end_time=timezone.now() + datetime.timedelta(days=1, minutes=30),
            repeat_count=1,
        )

    def test_payment_creation(self):
        """Payment can be created and linked to a booking."""
        payment = Payment.objects.create(
            booking=self.booking,
            stripe_payment_intent_id='pi_test_123',
            amount=50.00,
        )
        self.assertEqual(payment.status, 'pending')
        self.assertEqual(payment.booking, self.booking)

    def test_payment_str(self):
        """Payment __str__ returns expected format."""
        payment = Payment.objects.create(
            booking=self.booking,
            stripe_payment_intent_id='pi_test_456',
            amount=50.00,
        )
        self.assertIn('pi_test_456', str(payment))
        self.assertIn('pending', str(payment))

    def test_one_payment_per_booking(self):
        """A booking cannot have two payments (OneToOne)."""
        Payment.objects.create(
            booking=self.booking,
            stripe_payment_intent_id='pi_test_789',
            amount=50.00,
        )
        with self.assertRaises(Exception):
            Payment.objects.create(
                booking=self.booking,
                stripe_payment_intent_id='pi_test_999',
                amount=50.00,
            )


# ─── Integration Tests ────────────────────────────────────────────────────────

class CreatePaymentIntentTest(APITestCase):
    """Test the create-intent endpoint."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser2',
            email='test2@test.com',
            password='testpass123'
        )
        self.board = Board.objects.create(
            name='Test Board',
            latitude=36.8,
            longitude=10.1,
            address='Test Address',
            city='Tunis',
            width_cm=200,
            height_cm=150,
            price_per_slot=50.00
        )
        self.booking = Booking.objects.create(
            user=self.user,
            board=self.board,
            start_time=timezone.now() + datetime.timedelta(days=1),
            end_time=timezone.now() + datetime.timedelta(days=1, minutes=30),
            repeat_count=1,
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('create-payment-intent')

    def test_unauthenticated_request_rejected(self):
        """Unauthenticated users cannot create a payment intent."""
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, {'booking_id': self.booking.id})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_booking_returns_404(self):
        """Requesting a payment for a non-existent booking returns 404."""
        response = self.client.post(self.url, {'booking_id': 99999})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch('apps.payments.views.stripe.PaymentIntent.create')
    def test_create_intent_success(self, mock_stripe):
        """Valid request creates a payment intent and returns client_secret."""
        mock_stripe.return_value = {
            'id':'pi_test_mock_123',
            'client_secret':'secret_test_abc'
        }
        response = self.client.post(self.url, {'booking_id': self.booking.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('client_secret', response.data)
        self.assertTrue(Payment.objects.filter(
            stripe_payment_intent_id='pi_test_mock_123'
        ).exists())


class StripeWebhookTest(APITestCase):
    """Test the Stripe webhook endpoint."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser3',
            email='test3@test.com',
            password='testpass123'
        )
        self.board = Board.objects.create(
            name='Test Board',
            latitude=36.8,
            longitude=10.1,
            address='Test Address',
            city='Tunis',
            width_cm=200,
            height_cm=150,
            price_per_slot=50.00
        )
        self.booking = Booking.objects.create(
            user=self.user,
            board=self.board,
            start_time=timezone.now() + datetime.timedelta(days=1),
            end_time=timezone.now() + datetime.timedelta(days=1, minutes=30),
            repeat_count=1,
        )
        self.payment = Payment.objects.create(
            booking=self.booking,
            stripe_payment_intent_id='pi_webhook_test',
            amount=50.00,
        )
        self.url = reverse('stripe-webhook')

    @patch('apps.payments.views.stripe.Webhook.construct_event')
    def test_payment_succeeded_updates_status(self, mock_webhook):
        """When Stripe sends payment_intent.succeeded, booking becomes confirmed."""
        mock_webhook.return_value = {
            'type': 'payment_intent.succeeded',
            'data': {
                'object': {
                    'id': 'pi_webhook_test',
                    'metadata': {'booking_id': self.booking.id}
                }
            }
        }
        response = self.client.post(
            self.url,
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_sig'
        )
        self.assertEqual(response.status_code, 200)
        self.payment.refresh_from_db()
        self.booking.refresh_from_db()
        self.assertEqual(self.payment.status, 'succeeded')
        self.assertEqual(self.booking.status, 'confirmed')

    @patch('apps.payments.views.stripe.Webhook.construct_event')
    def test_payment_failed_updates_status(self, mock_webhook):
        """When Stripe sends payment_intent.payment_failed, payment becomes failed."""
        mock_webhook.return_value = {
            'type': 'payment_intent.payment_failed',
            'data': {
                'object': {
                    'id': 'pi_webhook_test',
                    'metadata': {'booking_id': self.booking.id}
                }
            }
        }
        response = self.client.post(
            self.url,
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_sig'
        )
        self.assertEqual(response.status_code, 200)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'failed')