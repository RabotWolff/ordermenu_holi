// Mapping vom Backend OrderStatus auf die drei sichtbaren Schritte:
//   NEW              → Schritt 0 (Bezahlt) noch laufend (Stripe-Confirm pending)
//   CONFIRMED        → Schritt 0 abgeschlossen, Schritt 1 läuft
//   IN_PROGRESS      → Schritt 1 läuft (Küche dran)
//   READY            → Schritt 2 (Bereit zur Abholung)
//   COMPLETED        → alle Schritte abgeschlossen
export const STATUS_STEPS = [
  { key: 'received', label: 'Bezahlt', sub: 'Wir haben deine Bestellung.' },
  { key: 'preparing', label: 'In Zubereitung', sub: 'Die Küche legt los.' },
  { key: 'ready', label: 'Bereit zur Abholung', sub: "Hol's dir an der Theke." },
];

export const statusToStepIndex = (status) => {
  switch (status) {
    case 'NEW':
      return 0;
    case 'CONFIRMED':
    case 'IN_PROGRESS':
      return 1;
    case 'READY':
      return 2;
    case 'COMPLETED':
      return 2;
    default:
      return 0;
  }
};

export const StatusTimeline = ({ status }) => {
  const statusIndex = statusToStepIndex(status);
  const isCompleted = status === 'COMPLETED';

  return (
    <div
      className="mt-6 px-4 py-5 rounded-3xl relative"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(109,40,217,0.1)',
      }}
    >
      {STATUS_STEPS.map((step, i) => {
        const done = i < statusIndex || isCompleted;
        const active = i === statusIndex && !isCompleted;
        const isLast = i === STATUS_STEPS.length - 1;
        return (
          <div
            key={step.key}
            className="flex items-start gap-3 relative"
            style={{ paddingBottom: isLast ? 0 : 14 }}
          >
            {!isLast && (
              <span
                className="absolute"
                style={{
                  left: 13,
                  top: 28,
                  bottom: 0,
                  width: 2,
                  background: done
                    ? 'var(--holi-purple)'
                    : 'rgba(109,40,217,0.15)',
                }}
              />
            )}
            <span
              className="rounded-full inline-flex items-center justify-center text-[13px] font-bold flex-shrink-0 transition-all duration-300"
              style={{
                width: 28,
                height: 28,
                background:
                  done || active
                    ? 'var(--holi-purple)'
                    : 'rgba(109,40,217,0.12)',
                color: 'white',
                boxShadow: active ? '0 0 0 6px rgba(109,40,217,0.15)' : 'none',
                zIndex: 1,
              }}
            >
              {done ? '✓' : i + 1}
            </span>
            <div className="flex-1 pt-0.5">
              <div
                className="font-Fraunces text-base font-semibold"
                style={{
                  color:
                    done || active
                      ? 'var(--holi-ink)'
                      : 'var(--holi-ink-soft)',
                }}
              >
                {step.label}
                {active && (
                  <span
                    className="ml-2 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full align-middle"
                    style={{
                      color: 'var(--holi-purple)',
                      background: 'rgba(109,40,217,0.1)',
                    }}
                  >
                    <span className="holi-pulse" /> jetzt
                  </span>
                )}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: 'var(--holi-ink-soft)' }}
              >
                {step.sub}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
