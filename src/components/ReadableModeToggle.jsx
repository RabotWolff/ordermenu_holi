import { useReadableMode } from '../hooks/useReadableMode';

// Schwebender Schalter unten links, immer erreichbar.
// Toggelt Lesemodus (data-mode="readable" auf <html>); persistiert via localStorage.
export const ReadableModeToggle = () => {
  const { enabled, toggle } = useReadableMode();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={
        enabled
          ? 'Lesemodus ist aktiv. Klicken zum Deaktivieren.'
          : 'Lesemodus aktivieren – höherer Kontrast, ohne Animationen und Hintergrunddekoration.'
      }
      title={enabled ? 'Lesemodus aus' : 'Lesemodus an'}
      className="fixed bottom-4 left-3 z-50 inline-flex items-center justify-center rounded-full cursor-pointer print:hidden"
      style={{
        width: 44,
        height: 44,
        border: enabled ? '2px solid var(--holi-purple)' : '1px solid rgba(109,40,217,0.25)',
        background: enabled ? 'var(--holi-purple)' : 'rgba(255,255,255,0.92)',
        color: enabled ? '#fff' : 'var(--holi-purple-ink)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 700,
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      <span aria-hidden="true">Aa</span>
    </button>
  );
};
