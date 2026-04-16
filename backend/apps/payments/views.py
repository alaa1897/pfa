import stripe
import json
from django.conf import settings
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.bookings.models import Booking
from .models import Payment

stripe.api_key = settings.STRIPE_SECRET_KEY


class CreatePaymentIntentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get('booking_id')

        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        amount = int(booking.total_price * 100)  # Stripe expects cents

        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd',
            metadata={'booking_id': booking.id}
        )

        Payment.objects.create(
            booking=booking,
            stripe_payment_intent_id=intent['id'],
            amount=booking.total_price,
        )

        return Response({
            'client_secret': intent['client_secret'],
            'publishable_key': settings.STRIPE_PUBLISHABLE_KEY
        })


class StripeWebhookView(APIView):
    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        webhook_secret = settings.STRIPE_WEBHOOK_SECRET

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return HttpResponse(status=400)

        if event['type'] == 'payment_intent.succeeded':
            intent = event['data']['object']
            booking_id = intent['metadata']['booking_id']
            Payment.objects.filter(
                stripe_payment_intent_id=intent['id']
            ).update(status='succeeded')
            Booking.objects.filter(id=booking_id).update(status='confirmed')

        elif event['type'] == 'payment_intent.payment_failed':
            intent = event['data']['object']
            Payment.objects.filter(
                stripe_payment_intent_id=intent['id']
            ).update(status='failed')

        return HttpResponse(status=200)