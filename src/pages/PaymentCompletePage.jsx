import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripe, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCartStore } from '../stores/useCartStore';
import { Splash } from '../elements/Splash';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

// Stripe-Redirect-Landing-Page. Liest den client_secret aus der URL,
// prüft den PaymentIntent-Status und schickt den Gast weiter zu /status.
// Cart wird hier geleert, damit der Status-Screen sauber neu aufgebaut werden kann.
export default function PaymentCompletePage() {
  if (!stripePromise) return <PaymentCompleteInner />;
  return (
    <Elements stripe={stripePromise}>
      <PaymentCompleteInner />
    </Elements>
  );
}

const PaymentCompleteInner = () => {
  const stripe = useStripe();
  const navigate = useNavigate();
  const clearCart = useCartStore((s) => s.clear);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );
    if (!stripe || !clientSecret) return;

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          setStatus('succeeded');
          clearCart();
          // Status-Screen übernimmt von hier (Polling über txId aus localStorage).
          setTimeout(() => navigate('/status', { replace: true }), 600);
          break;
        case 'processing':
          setStatus('processing');
          // Auch hier weiter zum Status-Screen — die Bestellung steht bereits in der DB.
          setTimeout(() => navigate('/status', { replace: true }), 1200);
          break;
        case 'requires_payment_method':
          setStatus('failed');
          break;
        default:
          setStatus('unknown');
          break;
      }
    });
  }, [stripe, clearCart, navigate]);

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-6 text-center overflow-hidden"
      style={{ background: 'var(--holi-cream)' }}
    >
      <Splash color="purple" size={260} opacity={0.3} style={{ top: -100, left: -80 }} />
      <Splash color="saffron" size={200} opacity={0.4} style={{ bottom: -80, right: -60 }} />
      <div className="relative">
        {status === 'loading' && (
          <span style={{ color: 'var(--holi-ink-soft)' }}>
            Bezahlung wird geprüft…
          </span>
        )}
        {status === 'succeeded' && (
          <div>
            <div
              className="font-CaveatBrush text-3xl"
              style={{ color: 'var(--holi-purple)', transform: 'rotate(-1deg)' }}
            >
              Danke! Bezahlung erfolgreich.
            </div>
            <div className="text-sm mt-2" style={{ color: 'var(--holi-ink-soft)' }}>
              Wir leiten dich zum Status-Screen weiter…
            </div>
          </div>
        )}
        {status === 'processing' && (
          <div>
            <div
              className="font-Fraunces text-lg"
              style={{ color: 'var(--holi-ink)' }}
            >
              Bezahlung wird verarbeitet…
            </div>
          </div>
        )}
        {status === 'failed' && (
          <div>
            <div
              className="font-Fraunces text-lg"
              style={{ color: 'var(--holi-ink)' }}
            >
              Bezahlung ist gescheitert.
            </div>
            <button
              type="button"
              onClick={() => navigate('/checkout', { replace: true })}
              className="mt-4 border-0 text-white px-5 py-2.5 rounded-2xl font-semibold cursor-pointer"
              style={{ background: 'var(--holi-purple)' }}
            >
              Erneut versuchen
            </button>
          </div>
        )}
        {status === 'unknown' && (
          <div className="text-sm" style={{ color: 'var(--holi-ink-soft)' }}>
            Status konnte nicht bestimmt werden. Bitte an der Theke melden.
          </div>
        )}
      </div>
    </div>
  );
};
