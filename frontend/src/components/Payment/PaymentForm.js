import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const CheckoutForm = ({ bookingId, onPaymentSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Step 1 — ask backend to create a payment intent
            const { data } = await axios.post(
                '/api/payments/create-intent/',
                { booking_id: bookingId },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`
                    }
                }
            );

            // Step 2 — confirm the card payment with Stripe
            const result = await stripe.confirmCardPayment(data.client_secret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                }
            });

            if (result.error) {
                setError(result.error.message);
            } else if (result.paymentIntent.status === 'succeeded') {
                onPaymentSuccess();
            }
        } catch (err) {
            setError('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="card-element-container">
                <CardElement options={{
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': { color: '#aab7c4' }
                        },
                        invalid: { color: '#9e2146' }
                    }
                }} />
            </div>
            {error && <div className="payment-error">{error}</div>}
            <button type="submit" disabled={!stripe || loading}>
                {loading ? 'Processing...' : 'Pay Now'}
            </button>
        </form>
    );
};

const PaymentForm = ({ bookingId, onPaymentSuccess }) => {
    const [stripePromise, setStripePromise] = useState(null);

    useEffect(() => {
        const key = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
        setStripePromise(loadStripe(key));
    }, []);

    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm
                bookingId={bookingId}
                onPaymentSuccess={onPaymentSuccess}
            />
        </Elements>
    );
};

export default PaymentForm;