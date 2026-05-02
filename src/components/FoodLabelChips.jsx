import { useEffect, useRef, useState } from 'react';
import { displayCode } from '../utils/foodLabels';

// Two visual variants so guests can distinguish allergens (warning amber)
// from additives (neutral blue). Tapping a chip opens a small popover with
// the full name + optional description. No portal — popover is anchored to
// the chip so it stays inside scrollable parents (menu list, layer sheet).
const VARIANTS = {
  allergen: {
    bg: 'rgba(217, 119, 6, 0.12)',
    border: '1px solid rgba(217, 119, 6, 0.35)',
    color: '#92400e',
    label: 'Allergen',
  },
  additive: {
    bg: 'rgba(37, 99, 235, 0.10)',
    border: '1px solid rgba(37, 99, 235, 0.30)',
    color: '#1e3a8a',
    label: 'Zusatzstoff',
  },
};

const Chip = ({ item, variant, size }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const v = VARIANTS[variant];
  const code = displayCode(item);
  const small = size === 'sm';

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block align-middle">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label={`${v.label}: ${item.name}`}
        aria-expanded={open}
        className={`inline-flex items-center justify-center font-bold tracking-wide rounded-full cursor-pointer border-0 ${
          small ? 'text-[9px] px-1.5 py-px min-w-[18px]' : 'text-[10px] px-2 py-0.5 min-w-[22px]'
        }`}
        style={{
          background: v.bg,
          border: v.border,
          color: v.color,
          lineHeight: 1.2,
        }}
      >
        {code}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-50 left-1/2 bottom-full mb-1 -translate-x-1/2 w-max max-w-[220px] rounded-xl px-3 py-2 text-left text-[12px]"
          style={{
            background: 'white',
            color: 'var(--holi-ink)',
            boxShadow: '0 8px 24px rgba(36,14,60,0.18)',
            border: '1px solid rgba(109,40,217,0.12)',
          }}
        >
          <span className="block font-bold mb-0.5" style={{ color: v.color }}>
            {item.code ? `${item.code} · ${item.name}` : item.name}
          </span>
          <span
            className="block text-[10px] uppercase tracking-wider mb-1"
            style={{ color: 'var(--holi-ink-soft)' }}
          >
            {v.label}
          </span>
          {item.description && (
            <span className="block leading-snug" style={{ color: 'var(--holi-ink-soft)' }}>
              {item.description}
            </span>
          )}
        </span>
      )}
    </span>
  );
};

// Renders allergens + additives. Allergens come first (food-safety priority),
// then a slim divider, then additives. Both groups are optional.
export const FoodLabelChips = ({ allergens = [], additives = [], size = 'sm', className = '' }) => {
  const a = Array.isArray(allergens) ? allergens : [];
  const z = Array.isArray(additives) ? additives : [];
  if (a.length === 0 && z.length === 0) return null;

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {a.map((item) => (
        <Chip key={`al-${item.id}`} item={item} variant="allergen" size={size} />
      ))}
      {a.length > 0 && z.length > 0 && (
        <span
          aria-hidden
          className="inline-block"
          style={{ width: 1, height: 12, background: 'rgba(109,40,217,0.18)', margin: '0 2px' }}
        />
      )}
      {z.map((item) => (
        <Chip key={`ad-${item.id}`} item={item} variant="additive" size={size} />
      ))}
    </span>
  );
};

// Bottom-of-page legend listing all labels currently on the menu.
export const FoodLabelLegend = ({ allergens = [], additives = [] }) => {
  const a = Array.isArray(allergens) ? allergens : [];
  const z = Array.isArray(additives) ? additives : [];
  if (a.length === 0 && z.length === 0) return null;

  const Row = ({ items, variant, title }) => {
    if (items.length === 0) return null;
    const v = VARIANTS[variant];
    return (
      <div className="mb-2.5 last:mb-0">
        <div
          className="font-bold uppercase tracking-wider text-[10px] mb-1.5"
          style={{ color: v.color }}
        >
          {title}
        </div>
        <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[11px]" style={{ color: 'var(--holi-ink-soft)' }}>
          {items.map((item) => (
            <span key={`${variant}-${item.id}`}>
              <b style={{ color: v.color }}>{displayCode(item)}</b> = {item.name}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="mt-7 p-3.5 rounded-xl"
      style={{ background: 'rgba(109,40,217,0.05)' }}
    >
      <Row items={a} variant="allergen" title="Allergene" />
      <Row items={z} variant="additive" title="Zusatzstoffe" />
    </div>
  );
};
