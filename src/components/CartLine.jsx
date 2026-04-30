import { useCartStore } from '../stores/useCartStore';

const formatEuro = (v) => `${Number(v).toFixed(2).replace('.', ',')} €`;

export const CartLine = ({ line }) => {
  const incrementLine = useCartStore((s) => s.incrementLine);
  const decrementLine = useCartStore((s) => s.decrementLine);

  const displayName = line.product.nameAdvertising || line.product.name;

  return (
    <div
      className="rounded-2xl p-3.5 mb-2.5"
      style={{
        background: 'white',
        border: '1px solid rgba(109,40,217,0.1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex-1 min-w-0">
          <div
            className="font-Fraunces text-base font-semibold"
            style={{ color: 'var(--holi-ink)' }}
          >
            {displayName}
          </div>
          {line.layerNames?.length > 0 && (
            <div
              className="mt-1 text-xs leading-snug"
              style={{ color: 'var(--holi-ink-soft)' }}
            >
              {line.layerNames.join(' · ')}
            </div>
          )}
        </div>
        <div
          className="font-Fraunces text-[15px] font-semibold whitespace-nowrap"
          style={{ color: 'var(--holi-purple-ink)' }}
        >
          {formatEuro(line.unitPrice * line.qty)}
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <div className="text-[11px]" style={{ color: 'var(--holi-ink-soft)' }}>
          {formatEuro(line.unitPrice)} pro Stück
        </div>
        <div
          className="inline-flex items-center rounded-full overflow-hidden"
          style={{ background: 'rgba(109,40,217,0.08)' }}
        >
          <button
            type="button"
            onClick={() => decrementLine(line.lineId)}
            className="border-0 bg-transparent w-8 h-[30px] text-base font-bold cursor-pointer"
            style={{ color: 'var(--holi-purple-ink)' }}
            aria-label="weniger"
          >
            −
          </button>
          <span
            className="min-w-[22px] text-center font-bold"
            style={{ color: 'var(--holi-purple-ink)' }}
          >
            {line.qty}
          </span>
          <button
            type="button"
            onClick={() => incrementLine(line.lineId)}
            className="border-0 bg-transparent w-8 h-[30px] text-base font-bold cursor-pointer"
            style={{ color: 'var(--holi-purple-ink)' }}
            aria-label="mehr"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};
