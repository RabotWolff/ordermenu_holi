import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePickupStore } from '../stores/usePickupStore';
import { useGetOrderStatus } from '../hooks/useGetOrderStatus';
import { Splash } from '../elements/Splash';
import { SpeckCluster } from '../elements/SpeckCluster';
import { HoliWordmark } from '../elements/HoliWordmark';
import { StatusTimeline, statusToStepIndex } from '../components/StatusTimeline';

export default function StatusPage() {
  const navigate = useNavigate();
  const txId = usePickupStore((s) => s.txId);
  const pickupName = usePickupStore((s) => s.pickupName);
  const clearActiveOrder = usePickupStore((s) => s.clearActiveOrder);

  const { data, error, isPending } = useGetOrderStatus(txId);

  // Push-artige Banner-Anzeige bei Status-Wechsel.
  const [justChanged, setJustChanged] = useState(false);
  const prevStatus = useRef(null);
  useEffect(() => {
    if (!data?.status) return;
    if (prevStatus.current && prevStatus.current !== data.status) {
      setJustChanged(true);
      const t = setTimeout(() => setJustChanged(false), 4000);
      return () => clearTimeout(t);
    }
    prevStatus.current = data.status;
  }, [data?.status]);

  // Kein aktiver Order-Token? Zurück zum Menü.
  useEffect(() => {
    if (!txId) navigate('/', { replace: true });
  }, [txId, navigate]);

  const handleNewOrder = () => {
    clearActiveOrder();
    navigate('/', { replace: true });
  };

  const status = data?.status;
  const items = data?.items || [];
  const statusIndex = statusToStepIndex(status);
  const isReady = status === 'READY' || status === 'COMPLETED';

  return (
    <div
      className="relative flex flex-col min-h-screen overflow-hidden"
      style={{ background: 'var(--holi-cream)' }}
    >
      <Splash color="purple" size={260} opacity={0.35} style={{ top: -100, left: -80 }} />
      <Splash color="mango" size={200} opacity={0.4} style={{ top: 60, right: -90 }} />
      <Splash color="blush" size={180} opacity={0.4} style={{ bottom: -80, left: -40 }} />
      <SpeckCluster color="saffron" count={26} size={160} style={{ top: 40, right: 30 }} />
      <SpeckCluster color="purple" count={22} size={140} style={{ bottom: 120, right: 30, opacity: 0.6 }} />

      {justChanged && (
        <div
          className="absolute left-3 right-3 z-30 flex items-center gap-3 rounded-2xl px-3.5 py-3"
          style={{
            top: 12,
            background: 'rgba(36, 14, 60, 0.92)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            className="inline-flex items-center justify-center rounded-lg flex-shrink-0 text-lg"
            style={{ width: 32, height: 32, background: 'var(--holi-saffron)' }}
          >
            🔔
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold opacity-70">HOLI</div>
            <div className="text-[13px] font-semibold">
              Status: {status || '–'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setJustChanged(false)}
            className="border-0 bg-transparent text-lg cursor-pointer p-1"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            ×
          </button>
        </div>
      )}

      <header className="px-5 pt-4 pb-1 flex-shrink-0 relative">
        <HoliWordmark height={26} withTagline={false} />
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-24 relative flex flex-col">
        {/* Pickup name (huge) */}
        <div className="text-center mt-2.5 relative">
          <div
            className="text-[10px] uppercase font-bold mb-1"
            style={{ letterSpacing: '0.18em', color: 'var(--holi-purple)' }}
          >
            wir rufen dich
          </div>
          <div
            className="font-CaveatBrush leading-none inline-block"
            style={{
              fontSize: 56,
              color: 'var(--holi-purple)',
              transform: 'rotate(-2deg)',
            }}
          >
            {pickupName || '—'}
          </div>
          <div className="text-[11px] mt-1.5" style={{ color: 'var(--holi-ink-soft)' }}>
            {data?.receiptNumber
              ? `Bestellung #${data.receiptNumber}`
              : data?.id
              ? `Bestellung #${data.id}`
              : ''}
          </div>
        </div>

        {error && (
          <div
            className="mt-6 text-center text-sm rounded-2xl p-4"
            style={{ color: 'var(--holi-ink)', background: 'rgba(255,255,255,0.55)' }}
          >
            Status konnte gerade nicht geladen werden.
            <br />
            <span className="text-xs" style={{ color: 'var(--holi-ink-soft)' }}>
              {error.message}
            </span>
          </div>
        )}

        {!error && status && <StatusTimeline status={status} />}

        {!error && status && statusIndex < 2 && (
          <div
            className="mt-3.5 text-center text-xs relative"
            style={{ color: 'var(--holi-ink-soft)' }}
          >
            Wir melden uns hier, sobald deine Bestellung fertig ist.
          </div>
        )}
        {!error && isReady && (
          <div
            className="mt-3.5 px-3.5 py-3 rounded-2xl text-center text-[13px] font-semibold relative"
            style={{ background: 'var(--holi-saffron)', color: 'var(--holi-purple-ink)' }}
          >
            🎉 Komm zur Theke und sag deinen Namen!
          </div>
        )}

        {/* Items */}
        {items.length > 0 && (
          <div
            className="mt-4 p-3.5 rounded-2xl relative"
            style={{ background: 'rgba(255,255,255,0.55)' }}
          >
            <div
              className="text-[10px] uppercase font-bold mb-2"
              style={{ letterSpacing: '0.12em', color: 'var(--holi-ink-soft)' }}
            >
              Deine Bestellung
            </div>
            {items.map((it) => (
              <div
                key={it.id}
                className="flex text-[12.5px] py-1"
                style={{ color: 'var(--holi-ink)' }}
              >
                <span className="flex-1">{it.name}</span>
                <span
                  className="text-[10px] uppercase font-semibold ml-2"
                  style={{ color: 'var(--holi-purple-ink)' }}
                >
                  {it.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {isPending && !data && (
          <div
            className="mt-6 text-center text-sm"
            style={{ color: 'var(--holi-ink-soft)' }}
          >
            Status wird geladen…
          </div>
        )}

        <div className="mt-6 relative">
          {isReady ? (
            <button
              type="button"
              onClick={handleNewOrder}
              className="w-full border-0 text-white px-4 py-3.5 rounded-2xl text-sm font-bold cursor-pointer"
              style={{
                background: 'var(--holi-purple)',
                boxShadow: '0 8px 24px rgba(109,40,217,0.4)',
              }}
            >
              Neue Bestellung
            </button>
          ) : (
            <Link
              to="/"
              className="block w-full text-center px-4 py-2.5 rounded-2xl text-[12px] font-semibold no-underline"
              style={{
                border: '1px dashed rgba(109,40,217,0.3)',
                background: 'rgba(255,255,255,0.5)',
                color: 'var(--holi-purple-ink)',
              }}
            >
              Zur Karte
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
