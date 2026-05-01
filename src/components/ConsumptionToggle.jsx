import { useCartStore } from '../stores/useCartStore';

// HOLY: Vor Ort vs Außer Haus. Pflichtfeld vor dem Bezahlen.
// Wir speichern als Boolean im Cart-Store (true = takeaway).
// Optisch zwei große Pill-Buttons im Holi-Stil (Purple = aktiv, weiß = inaktiv).
export const ConsumptionToggle = () => {
  const isTakeaway = useCartStore((s) => s.isTakeaway);
  const setIsTakeaway = useCartStore((s) => s.setIsTakeaway);

  return (
    <div className="mb-3.5">
      <div
        className="text-[10px] uppercase font-bold mb-2"
        style={{ letterSpacing: '0.16em', color: 'var(--holi-ink-soft)' }}
      >
        Wie möchtest du genießen?
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <ToggleOption
          active={isTakeaway === false}
          emoji="🍽️"
          title="Vor Ort"
          subtitle="essen & trinken hier"
          onClick={() => setIsTakeaway(false)}
        />
        <ToggleOption
          active={isTakeaway === true}
          emoji="🥡"
          title="Mitnehmen"
          subtitle="zum Mitnehmen"
          onClick={() => setIsTakeaway(true)}
        />
      </div>
      {isTakeaway === null && (
        <div
          className="text-[11px] mt-2 leading-snug"
          style={{ color: 'var(--holi-mango)' }}
        >
          Bitte wählen, damit wir wissen, wie wir packen.
        </div>
      )}
    </div>
  );
};

const ToggleOption = ({ active, emoji, title, subtitle, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="border-0 rounded-2xl px-3 py-3 text-left cursor-pointer transition-all"
    style={{
      background: active ? 'var(--holi-purple)' : 'white',
      color: active ? 'white' : 'var(--holi-ink)',
      boxShadow: active
        ? '0 6px 18px rgba(109,40,217,0.35)'
        : '0 1px 0 rgba(109,40,217,0.06)',
      border: active
        ? '1px solid var(--holi-purple)'
        : '1px solid rgba(109,40,217,0.15)',
    }}
  >
    <div className="flex items-center gap-2.5">
      <span className="text-2xl leading-none flex-shrink-0">{emoji}</span>
      <div className="min-w-0">
        <div className="font-Fraunces text-[15px] font-bold leading-tight">
          {title}
        </div>
        <div
          className="text-[11px] leading-tight mt-0.5"
          style={{
            color: active ? 'rgba(255,255,255,0.85)' : 'var(--holi-ink-soft)',
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  </button>
);
