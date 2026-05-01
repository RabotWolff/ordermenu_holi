import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCartStore } from '../stores/useCartStore';
import { usePickupStore } from '../stores/usePickupStore';
import { useGetRandomAlterEgo, formatAlterEgo } from '../hooks/useGetRandomAlterEgo';
import { useCreatePaymentIntent } from '../hooks/useCreatePaymentIntent';
import { useSubmitOrder } from '../hooks/useSubmitOrder';
import { Splash } from '../elements/Splash';
import { SpeckCluster } from '../elements/SpeckCluster';
import { ConsentCheckbox } from '../components/ConsentCheckbox';
import { ConsumptionToggle } from '../components/ConsumptionToggle';

const formatEuro = (v) => `${Number(v).toFixed(2).replace('.', ',')} €`;

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

// Holy Checkout: PaymentIntent vorab anfordern (für PaymentElement-Mount),
// dann beim Bezahlen-Klick zuerst createOrder (Backend legt Order an,
// status=NEW), dann stripe.confirmPayment → Redirect → /payment-complete.
export default function CheckoutPage() {
  const lines = useCartStore((s) => s.lines);
  const total = useCartStore((s) => s.total());
  const navigate = useNavigate();

  // Cart leer? Zurück zur Karte (z. B. nach Refresh nach erfolgreicher Bestellung).
  useEffect(() => {
    if (lines.length === 0) navigate('/', { replace: true });
  }, [lines.length, navigate]);

  const { mutate: createPaymentIntent, isPending: isCreatingIntent, data: intentData, error: intentError } =
    useCreatePaymentIntent();

  const orderItemsForBackend = useMemo(
    () => buildOrderItems(lines),
    [lines]
  );

  const stripeAmountCents = useMemo(() => Math.round(total * 100), [total]);

  // Beim Mount: PaymentIntent erzeugen.
  useEffect(() => {
    if (lines.length === 0) return;
    createPaymentIntent({
      amount: stripeAmountCents,
      orderItems: orderItemsForBackend,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!stripePromise) {
    return (
      <FallbackError
        title="Stripe nicht konfiguriert"
        message="VITE_STRIPE_PUBLISHABLE_KEY fehlt im .env der Holy-App."
      />
    );
  }

  if (intentError) {
    return (
      <FallbackError
        title="Zahlung konnte nicht vorbereitet werden"
        message={intentError.message}
      />
    );
  }

  if (isCreatingIntent || !intentData?.clientSecret) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--holi-cream)' }}>
        <span style={{ color: 'var(--holi-ink-soft)' }}>Zahlung wird vorbereitet…</span>
      </div>
    );
  }

  const options = {
    clientSecret: intentData.clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#6D28D9',
        colorBackground: '#ffffff',
        colorText: '#2A1B3D',
        borderRadius: '12px',
        fontFamily: 'DM Sans, system-ui, sans-serif',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm
        intentData={intentData}
        orderItemsForBackend={orderItemsForBackend}
        total={total}
      />
    </Elements>
  );
}

const FallbackError = ({ title, message }) => (
  <div className="flex items-center justify-center h-screen p-6 text-center">
    <div>
      <div className="font-Fraunces text-lg mb-2" style={{ color: 'var(--holi-ink)' }}>
        {title}
      </div>
      <div className="text-sm" style={{ color: 'var(--holi-ink-soft)' }}>
        {message}
      </div>
      <Link
        to="/cart"
        className="inline-block mt-4 px-5 py-2.5 rounded-2xl text-white no-underline"
        style={{ background: 'var(--holi-purple)' }}
      >
        Zurück zum Warenkorb
      </Link>
    </div>
  </div>
);

// Backend erwartet pro Cart-Line ein Item-Objekt mit orderCount.
// price = Basispreis + Layer-Delta (line.unitPrice). Backend re-validiert.
const buildOrderItems = (lines) =>
  lines.map((line) => {
    const product = line.product;
    return {
      name: line.layerNames?.length
        ? `${product.nameAdvertising || product.name} (${line.layerNames.join(', ')})`
        : product.nameAdvertising || product.name,
      type: product.type || product.category?.orderType,
      price: line.unitPrice,
      priceDiscounted: 0,
      isDiscounted: false,
      productGroupId: product.productGroup?.code,
      productGroup: product.productGroup?.name,
      vatPercent: product.vatPercent,
      orderCount: line.qty,
      refId: product.id,
      selectedSidedish: null,
      selectedLayers: line.selectedLayers || null,
    };
  });

const CheckoutForm = ({ intentData, orderItemsForBackend, total }) => {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const lines = useCartStore((s) => s.lines);
  const isTakeaway = useCartStore((s) => s.isTakeaway);

  const pickupName = usePickupStore((s) => s.pickupName);
  const setPickupName = usePickupStore((s) => s.setPickupName);
  const setActiveOrder = usePickupStore((s) => s.setActiveOrder);

  const { data: alterEgoData, refetch: refetchAlterEgo } = useGetRandomAlterEgo({
    enabled: !pickupName, // nur abrufen, wenn noch keiner gesetzt ist
  });

  // Ersten Pickup-Namen einsetzen, wenn noch keiner persistiert ist.
  useEffect(() => {
    if (!pickupName && alterEgoData) {
      const name = formatAlterEgo(alterEgoData);
      if (name) setPickupName(name);
    }
  }, [alterEgoData, pickupName, setPickupName]);

  const regenerateName = async () => {
    const result = await refetchAlterEgo();
    const name = formatAlterEgo(result?.data);
    if (name) setPickupName(name);
  };

  const [agbOk, setAgbOk] = useState(false);
  const [datenschutzOk, setDatenschutzOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { mutateAsync: submitOrder } = useSubmitOrder();

  const canPay = stripe && elements && agbOk && datenschutzOk && !submitting && pickupName && typeof isTakeaway === 'boolean';

  const handlePay = async () => {
    if (!canPay) return;
    setSubmitting(true);
    setErrorMessage('');

    try {
      // 1) Order in DB anlegen (status=NEW). Stripe-Webhook promotet später auf CONFIRMED.
      // Response liefert { success, id, txId } – txId ist die Capability
      // für den späteren Status-Lookup auf /api/holy/orderStatus/:txId.
      const orderResp = await submitOrder({
        location: 'HOLY',
        paymentIntentId: intentData.paymentIntentId,
        paymentMethod: 'WEB',
        paymentAmount: { tip: 0, total },
        items: orderItemsForBackend,
        pickupName,
        isTakeaway,
      });

      setActiveOrder({
        orderId: orderResp.id,
        txId: orderResp.txId,
        pickupName,
        total,
      });

      // 2) Stripe-Confirm. Redirect zur Payment-Complete-Page.
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-complete`,
        },
      });
      if (error) {
        setErrorMessage(error.message || 'Bezahlung fehlgeschlagen.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Bestellung konnte nicht angelegt werden.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative flex flex-col min-h-screen overflow-hidden"
      style={{ background: 'var(--holi-cream)' }}
    >
      <Splash color="saffron" size={180} opacity={0.35} style={{ top: -60, left: -50 }} />
      <Splash color="purple" size={150} opacity={0.4} style={{ top: 200, right: -50 }} />

      <header className="px-5 pt-4 pb-2 flex items-center gap-3 flex-shrink-0 relative">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="border-0 inline-flex items-center justify-center rounded-full text-lg cursor-pointer"
          style={{
            background: 'rgba(109,40,217,0.08)',
            color: 'var(--holi-purple-ink)',
            width: 36,
            height: 36,
          }}
          aria-label="Zurück"
        >
          ←
        </button>
        <div>
          <div
            className="font-CaveatBrush text-[28px] leading-none"
            style={{ color: 'var(--holi-purple)', transform: 'rotate(-1deg)' }}
          >
            Bestellen
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--holi-ink-soft)' }}>
            Letzter Schritt — fast geschafft.
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-44 relative">
        <ConsumptionToggle />

        {/* Pickup name card */}
        <div
          className="rounded-3xl mb-3.5 px-5 pt-4 pb-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--holi-purple) 0%, #8b3fe8 100%)',
            color: 'white',
            boxShadow: '0 8px 24px rgba(109,40,217,0.3)',
          }}
        >
          <SpeckCluster color="saffron" count={20} size={120} style={{ top: -10, right: -10, opacity: 0.6 }} />
          <SpeckCluster color="blush" count={16} size={100} style={{ bottom: -20, left: -10, opacity: 0.5 }} />
          <div
            className="text-[10px] uppercase font-bold relative mb-1"
            style={{ letterSpacing: '0.16em', opacity: 0.85 }}
          >
            Dein Abhol-Name
          </div>
          <div className="flex items-center gap-2.5 relative">
            <div
              className="font-CaveatBrush flex-1 leading-none"
              style={{ fontSize: 36, transform: 'rotate(-1deg)' }}
            >
              {pickupName || '—'}
            </div>
            <button
              type="button"
              onClick={regenerateName}
              className="text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap cursor-pointer"
              style={{
                border: '1px solid rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.15)',
              }}
            >
              ↻ neu
            </button>
          </div>
          <div
            className="text-[11.5px] mt-1.5 leading-snug relative"
            style={{ opacity: 0.85 }}
          >
            Wir rufen dich mit diesem Namen, wenn deine Bestellung fertig ist.
          </div>
        </div>

        {/* Order summary */}
        <div
          className="rounded-2xl p-3.5 mb-3.5"
          style={{ background: 'white', border: '1px solid rgba(109,40,217,0.1)' }}
        >
          <div
            className="text-[10px] uppercase font-bold mb-2"
            style={{ letterSpacing: '0.14em', color: 'var(--holi-ink-soft)' }}
          >
            Deine Bestellung
          </div>
          {lines.map((line) => (
            <div
              key={line.lineId}
              className="flex py-1.5"
              style={{ borderBottom: '1px dashed rgba(109,40,217,0.12)' }}
            >
              <span className="w-[22px] font-bold text-[13px]" style={{ color: 'var(--holi-purple)' }}>
                {line.qty}×
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium" style={{ color: 'var(--holi-ink)' }}>
                  {line.product.nameAdvertising || line.product.name}
                </div>
                {line.layerNames?.length > 0 && (
                  <div className="text-[11px]" style={{ color: 'var(--holi-ink-soft)' }}>
                    {line.layerNames.join(' · ')}
                  </div>
                )}
              </div>
              <span
                className="font-Fraunces text-[13px] font-semibold whitespace-nowrap pl-2"
                style={{ color: 'var(--holi-purple-ink)' }}
              >
                {formatEuro(line.unitPrice * line.qty)}
              </span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2.5">
            <span
              className="font-Fraunces text-base font-bold"
              style={{ color: 'var(--holi-ink)' }}
            >
              Gesamt
            </span>
            <span
              className="font-Fraunces text-xl font-bold"
              style={{ color: 'var(--holi-purple-ink)' }}
            >
              {formatEuro(total)}
            </span>
          </div>
          <div
            className="text-[10px] text-right mt-0.5"
            style={{ color: 'var(--holi-ink-soft)' }}
          >
            inkl. MwSt.
          </div>
        </div>

        {/* Stripe PaymentElement */}
        <div
          className="rounded-2xl p-3.5 mb-3.5"
          style={{ background: 'white', border: '1px solid rgba(109,40,217,0.1)' }}
        >
          <PaymentElement />
        </div>

        {/* Consent */}
        <div className="flex flex-col gap-2.5 mb-3.5">
          <ConsentCheckbox
            checked={agbOk}
            onToggle={() => setAgbOk(!agbOk)}
            label={
              <>
                Ich akzeptiere die{' '}
                <Link
                  to="/agb"
                  target="_blank"
                  className="font-semibold no-underline"
                  style={{ color: 'var(--holi-purple)' }}
                >
                  AGB
                </Link>
                .
              </>
            }
          />
          <ConsentCheckbox
            checked={datenschutzOk}
            onToggle={() => setDatenschutzOk(!datenschutzOk)}
            label={
              <>
                Ich habe die{' '}
                <Link
                  to="/datenschutz"
                  target="_blank"
                  className="font-semibold no-underline"
                  style={{ color: 'var(--holi-purple)' }}
                >
                  Datenschutzerklärung
                </Link>{' '}
                gelesen.
              </>
            }
          />
        </div>

        {errorMessage && (
          <div className="text-sm text-red-600 mb-3">{errorMessage}</div>
        )}
      </div>

      {/* Pay button */}
      <div className="fixed left-0 right-0 bottom-0 px-3.5 pb-4 z-20 pointer-events-none">
        <div className="max-w-[420px] mx-auto pointer-events-auto">
          <button
            type="button"
            onClick={handlePay}
            disabled={!canPay}
            className="w-full border-0 text-white px-4 py-4 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold"
            style={{
              background: canPay ? 'var(--holi-purple)' : 'rgba(109,40,217,0.3)',
              cursor: canPay ? 'pointer' : 'not-allowed',
              boxShadow: canPay ? '0 8px 24px rgba(109,40,217,0.4)' : 'none',
            }}
          >
            <span>
              {submitting ? 'Wird verarbeitet…' : `Mit Stripe bezahlen · ${formatEuro(total)}`}
            </span>
          </button>
          <p
            className="text-[10px] text-center mt-2"
            style={{ color: 'var(--holi-ink-soft)' }}
          >
            🔒 Sichere Zahlung über Stripe — Karte, Apple Pay, Google Pay
          </p>
        </div>
      </div>
    </div>
  );
};
