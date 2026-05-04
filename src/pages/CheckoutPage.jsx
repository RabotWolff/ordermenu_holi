import { useEffect, useMemo, useRef, useState } from 'react';
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

const SUMUP_WIDGET_SRC = 'https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

// Holy Checkout: PaymentIntent vorab anfordern (für PaymentElement-Mount),
// dann beim Bezahlen-Klick zuerst createOrder (Backend legt Order an,
// status=NEW), dann stripe.confirmPayment → Redirect → /payment-complete.
//
// SumUp-Variante: Backend liefert den Checkout (id wird als
// paymentIntentId verwendet). Im Frontend wird das SumUp-Card-Widget
// gemountet (Karteneingabe in iframe, kein PAN-Touchpoint bei uns).
// onResponse('sent') legt die Order an, onResponse('success') leitet
// auf /payment-complete weiter. Der Webhook holt anschließend den
// Checkout per API nach und promotet die Order auf CONFIRMED.
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

  const provider = intentData.provider || 'STRIPE';

  if (provider === 'SUMUP') {
    return (
      <CheckoutFormSumup
        intentData={intentData}
        orderItemsForBackend={orderItemsForBackend}
        total={total}
      />
    );
  }

  if (!stripePromise) {
    return (
      <FallbackError
        title="Stripe nicht konfiguriert"
        message="VITE_STRIPE_PUBLISHABLE_KEY fehlt im .env der Holy-App."
      />
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
      <CheckoutFormStripe
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

// Hook für die UI-Felder, die beide Provider teilen.
function useCheckoutLayoutState() {
  const lines = useCartStore((s) => s.lines);
  const isTakeaway = useCartStore((s) => s.isTakeaway);
  const pickupName = usePickupStore((s) => s.pickupName);
  const setPickupName = usePickupStore((s) => s.setPickupName);
  const setActiveOrder = usePickupStore((s) => s.setActiveOrder);

  const { data: alterEgoData, refetch: refetchAlterEgo } = useGetRandomAlterEgo({
    enabled: !pickupName,
  });

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

  return {
    lines,
    isTakeaway,
    pickupName,
    setPickupName,
    setActiveOrder,
    regenerateName,
    agbOk, setAgbOk,
    datenschutzOk, setDatenschutzOk,
    submitting, setSubmitting,
    errorMessage, setErrorMessage,
  };
}

// Layout-Shell, identisch für Stripe und SumUp. Nur das Karten-Eingabe-
// Element und der Pay-Button werden vom jeweiligen Provider gestellt.
const CheckoutLayout = ({
  state,
  cardArea,
  payButton,
  total,
  providerNote,
}) => {
  const navigate = useNavigate();
  const {
    lines,
    pickupName,
    regenerateName,
    agbOk, setAgbOk,
    datenschutzOk, setDatenschutzOk,
    errorMessage,
  } = state;

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

        {/* Card input area – provider-spezifisch */}
        <div
          className="rounded-2xl p-3.5 mb-3.5"
          style={{ background: 'white', border: '1px solid rgba(109,40,217,0.1)' }}
        >
          {cardArea}
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

      {/* Pay button slot – provider-spezifisch */}
      <div className="fixed left-0 right-0 bottom-0 px-3.5 pb-4 z-20 pointer-events-none">
        <div className="max-w-[420px] mx-auto pointer-events-auto">
          {payButton}
          <p
            className="text-[10px] text-center mt-2"
            style={{ color: 'var(--holi-ink-soft)' }}
          >
            🔒 {providerNote}
          </p>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------- Stripe

const CheckoutFormStripe = ({ intentData, orderItemsForBackend, total }) => {
  const stripe = useStripe();
  const elements = useElements();
  const state = useCheckoutLayoutState();
  const { mutateAsync: submitOrder } = useSubmitOrder();

  const canPay =
    stripe && elements && state.agbOk && state.datenschutzOk && !state.submitting &&
    state.pickupName && typeof state.isTakeaway === 'boolean';

  const handlePay = async () => {
    if (!canPay) return;
    state.setSubmitting(true);
    state.setErrorMessage('');

    try {
      const orderResp = await submitOrder({
        location: 'HOLY',
        paymentIntentId: intentData.paymentIntentId,
        paymentProvider: 'STRIPE',
        paymentMethod: 'WEB',
        paymentAmount: { tip: 0, total },
        items: orderItemsForBackend,
        pickupName: state.pickupName,
        isTakeaway: state.isTakeaway,
      });

      state.setActiveOrder({
        orderId: orderResp.id,
        txId: orderResp.txId,
        pickupName: state.pickupName,
        total,
      });

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-complete`,
        },
      });
      if (error) {
        state.setErrorMessage(error.message || 'Bezahlung fehlgeschlagen.');
      }
    } catch (err) {
      state.setErrorMessage(err.message || 'Bestellung konnte nicht angelegt werden.');
    } finally {
      state.setSubmitting(false);
    }
  };

  const payButton = (
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
        {state.submitting ? 'Wird verarbeitet…' : `Jetzt bezahlen · ${formatEuro(total)}`}
      </span>
    </button>
  );

  return (
    <CheckoutLayout
      state={state}
      cardArea={<PaymentElement />}
      payButton={payButton}
      total={total}
      providerNote="Sichere Zahlung über Stripe — Karte, Apple Pay, Google Pay"
    />
  );
};

// ------------------------------------------------------------------ SumUp

// Lädt das SumUp Card-Widget einmalig in window. Mehrfacher Mount benutzt
// das schon geladene Script.
let sumupScriptPromise = null;
function loadSumupScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.SumUpCard) return Promise.resolve(window.SumUpCard);
  if (sumupScriptPromise) return sumupScriptPromise;

  sumupScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SUMUP_WIDGET_SRC;
    s.async = true;
    s.onload = () => resolve(window.SumUpCard);
    s.onerror = () => {
      sumupScriptPromise = null;
      reject(new Error('SumUp Widget konnte nicht geladen werden'));
    };
    document.head.appendChild(s);
  });
  return sumupScriptPromise;
}

const CheckoutFormSumup = ({ intentData, orderItemsForBackend, total }) => {
  const navigate = useNavigate();
  const state = useCheckoutLayoutState();
  const { mutateAsync: submitOrder } = useSubmitOrder();
  const cardContainerRef = useRef(null);
  const widgetMountedRef = useRef(false);
  // Damit wir submitOrder nur einmal pro Checkout schicken, auch wenn der
  // Nutzer mehrfach versucht zu zahlen.
  const orderSubmittedRef = useRef(false);

  const checkoutId = intentData.paymentIntentId; // = SumUp checkout.id

  const canMountWidget =
    state.agbOk && state.datenschutzOk && state.pickupName &&
    typeof state.isTakeaway === 'boolean';

  // Order in DB anlegen, sobald der Nutzer alle Bedingungen erfüllt hat
  // und das Widget gleich gemountet wird. Damit existiert die Order
  // bevor der Webhook eintrifft – wenn er trotzdem zuerst feuert,
  // bringt SumUp's Webhook-Retry den Treffer beim nächsten Versuch.
  const ensureOrderSubmitted = async () => {
    if (orderSubmittedRef.current) return true;
    orderSubmittedRef.current = true;
    try {
      const orderResp = await submitOrder({
        location: 'HOLY',
        paymentIntentId: checkoutId,
        paymentProvider: 'SUMUP',
        paymentMethod: 'WEB',
        paymentAmount: { tip: 0, total },
        items: orderItemsForBackend,
        pickupName: state.pickupName,
        isTakeaway: state.isTakeaway,
      });
      state.setActiveOrder({
        orderId: orderResp.id,
        txId: orderResp.txId,
        pickupName: state.pickupName,
        total,
      });
      return true;
    } catch (err) {
      orderSubmittedRef.current = false; // erlaubt erneuten Versuch
      state.setErrorMessage(err.message || 'Bestellung konnte nicht angelegt werden.');
      return false;
    }
  };

  useEffect(() => {
    if (!canMountWidget || widgetMountedRef.current || !cardContainerRef.current) return;
    if (!checkoutId) return;

    let cancelled = false;
    loadSumupScript()
      .then((SumUpCard) => {
        if (cancelled || !cardContainerRef.current) return;
        widgetMountedRef.current = true;
        SumUpCard.mount({
          id: cardContainerRef.current.id,
          checkoutId,
          showSubmitButton: true,
          onResponse: async (type, body) => {
            // type: 'sent' | 'invalid' | 'auth-screen' | 'error' | 'success' | 'fail'
            if (type === 'sent') {
              await ensureOrderSubmitted();
            } else if (type === 'success') {
              const ok = await ensureOrderSubmitted();
              if (ok) {
                // SumUp-Widget hat den Erfolg bereits bestätigt – die
                // Stripe-Zwischenseite /payment-complete würde mit dem
                // SumUp-Redirect (kein client_secret in der URL) hängen
                // bleiben. Direkt zum Status-Screen mit explizitem txId
                // (nicht nur über den Store), damit kein Race entsteht
                // falls die Store-Persistierung minimal verzögert.
                const txId = usePickupStore.getState().txId;
                useCartStore.getState().clear();
                navigate('/status', { replace: true, state: { txId } });
              }
            } else if (type === 'error' || type === 'fail') {
              state.setErrorMessage(body?.message || 'Bezahlung fehlgeschlagen.');
              orderSubmittedRef.current = false;
            }
          },
        });
      })
      .catch((err) => {
        state.setErrorMessage(err.message || 'SumUp-Widget konnte nicht geladen werden.');
      });

    return () => {
      cancelled = true;
    };
  }, [canMountWidget, checkoutId]);

  const cardArea = canMountWidget ? (
    <div
      id="sumup-card-container"
      ref={cardContainerRef}
      style={{ minHeight: 200 }}
    />
  ) : (
    <div className="text-sm" style={{ color: 'var(--holi-ink-soft)' }}>
      Bitte zuerst Abhol-Namen festlegen und AGB / Datenschutz bestätigen.
      Dann erscheint hier die Zahlungsmaske.
    </div>
  );

  // SumUp-Widget hat seinen eigenen Submit-Button – wir zeigen statt einer
  // separaten Pay-Button-Schaltfläche einen passiven Hinweis.
  const payButton = (
    <div
      className="w-full text-center text-sm font-semibold rounded-2xl px-4 py-4"
      style={{
        background: 'rgba(255,255,255,0.7)',
        color: 'var(--holi-ink-soft)',
      }}
    >
      {state.submitting ? 'Wird verarbeitet…' : `Zahlung über das Widget oben · ${formatEuro(total)}`}
    </div>
  );

  return (
    <CheckoutLayout
      state={state}
      cardArea={cardArea}
      payButton={payButton}
      total={total}
      providerNote="Sichere Zahlung über SumUp — Karte"
    />
  );
};
