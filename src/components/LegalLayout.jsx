import { Link } from 'react-router-dom';
import { Splash } from '../elements/Splash';

export const LegalLayout = ({ title, children }) => (
  <div
    className="relative min-h-screen flex flex-col overflow-hidden"
    style={{ background: 'var(--holi-cream)' }}
  >
    <Splash color="purple" size={200} opacity={0.3} style={{ top: -60, left: -40 }} />
    <header className="px-5 pt-4 pb-2 flex items-center gap-3 relative">
      <Link
        to="/"
        className="border-0 inline-flex items-center justify-center rounded-full text-lg cursor-pointer no-underline"
        style={{
          background: 'rgba(109,40,217,0.08)',
          color: 'var(--holi-purple-ink)',
          width: 36,
          height: 36,
        }}
        aria-label="Zurück"
      >
        ←
      </Link>
      <div
        className="font-CaveatBrush text-[28px] leading-none"
        style={{ color: 'var(--holi-purple)', transform: 'rotate(-1deg)' }}
      >
        {title}
      </div>
    </header>
    <article
      className="flex-1 overflow-y-auto px-5 pb-12 relative"
      style={{ color: 'var(--holi-ink)' }}
    >
      <div className="text-sm leading-relaxed font-DMSans">{children}</div>
    </article>
  </div>
);
