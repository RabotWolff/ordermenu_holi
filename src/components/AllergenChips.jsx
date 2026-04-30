// Zeigt Allergen-Codes (z. B. "G", "M") als kleine Chips. Quelle ist die
// Ingredient-Allergens-Beziehung im MenuProduct (s. backend Schema). Die
// Codes werden vom Backend bereitgestellt; wir mappen sie hier nur visuell.
const ALLERGEN_LABELS = {
  G: 'Gluten',
  E: 'Ei',
  M: 'Milch',
  N: 'Nüsse',
  S: 'Soja',
  F: 'Fisch',
  K: 'Krebstiere',
  L: 'Sellerie',
  W: 'Weichtiere',
  Sf: 'Senf',
  Se: 'Sesam',
  Su: 'Sulfite',
};

export const AllergenChips = ({ codes }) => {
  if (!Array.isArray(codes) || codes.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap gap-1 ml-1.5">
      {codes.map((c) => (
        <span
          key={c}
          title={ALLERGEN_LABELS[c] || c}
          className="text-[9px] font-bold tracking-wide px-1.5 py-px rounded-full"
          style={{
            color: 'var(--holi-purple-ink)',
            background: 'rgba(109,40,217,0.1)',
          }}
        >
          {c}
        </span>
      ))}
    </span>
  );
};

export const AllergenLegend = () => (
  <div
    className="mt-7 p-3.5 rounded-xl text-[11px]"
    style={{ background: 'rgba(109,40,217,0.05)', color: 'var(--holi-ink-soft)' }}
  >
    <div
      className="font-bold uppercase tracking-wider text-[10px] mb-1.5"
      style={{ color: 'var(--holi-ink)' }}
    >
      Allergene & Zusatzstoffe
    </div>
    <div className="flex flex-wrap gap-x-2.5 gap-y-1">
      {Object.entries(ALLERGEN_LABELS).map(([k, v]) => (
        <span key={k}>
          <b style={{ color: 'var(--holi-purple-ink)' }}>{k}</b> = {v}
        </span>
      ))}
    </div>
  </div>
);
