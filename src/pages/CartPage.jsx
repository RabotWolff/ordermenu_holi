import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/useCartStore';
import { CartLine } from '../components/CartLine';
import { Splash } from '../elements/Splash';

const formatEuro = (v) => `${Number(v).toFixed(2).replace('.', ',')} €`;

export default function CartPage() {
  const navigate = useNavigate();
  const lines = useCartStore((s) => s.lines);
  const total = useCartStore((s) => s.total());
  const itemCount = useCartStore((s) => s.itemCount());
  const empty = lines.length === 0;

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--holi-cream)' }}>
      <Splash color="purple" size={200} opacity={0.3} style={{ top: -80, right: -60 }} />
      <Splash color="blush" size={140} opacity={0.4} style={{ top: 100, left: -50 }} />

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
            Warenkorb
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--holi-ink-soft)' }}>
            {itemCount} Artikel · zur Mitnahme
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pt-2.5 pb-32 relative">
        {empty ? (
          <div className="text-center py-16" style={{ color: 'var(--holi-ink-soft)' }}>
            <div
              className="font-CaveatBrush text-3xl mb-2"
              style={{ color: 'var(--holi-purple)' }}
            >
              noch nichts hier
            </div>
            <p className="text-[13px] leading-relaxed">
              Geh zurück zur Karte und stell dir was Buntes zusammen.
            </p>
            <Link
              to="/"
              className="inline-block mt-4 px-5 py-2.5 rounded-2xl font-semibold text-white no-underline"
              style={{
                background: 'var(--holi-purple)',
                boxShadow: '0 6px 18px rgba(109,40,217,0.35)',
              }}
            >
              Zur Karte
            </Link>
          </div>
        ) : (
          lines.map((line) => <CartLine key={line.lineId} line={line} />)
        )}
      </div>

      {!empty && (
        <div className="fixed left-0 right-0 bottom-0 px-3.5 pb-4 z-20 pointer-events-none">
          <div className="max-w-[420px] mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full border-0 text-white px-4 py-3.5 rounded-2xl flex items-center justify-between cursor-pointer"
              style={{
                background: 'var(--holi-purple)',
                boxShadow: '0 8px 24px rgba(109,40,217,0.4)',
              }}
            >
              <span className="text-sm font-bold">Zur Kasse</span>
              <span className="font-Fraunces text-base font-bold">
                {formatEuro(total)}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
