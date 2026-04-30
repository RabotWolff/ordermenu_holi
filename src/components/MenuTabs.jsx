// Sticky Tab-Strip oben in der Karte. Klick scrollt zum jeweiligen Anchor.
export const MenuTabs = ({ tabs, activeTab, onSelect }) => (
  <div
    className="sticky top-0 z-10 py-2 border-b"
    style={{ background: 'var(--holi-cream)', borderColor: 'rgba(109,40,217,0.12)' }}
  >
    <div className="flex gap-1.5 overflow-x-auto px-4 holi-no-scrollbar">
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className="flex-shrink-0 border-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            style={{
              background: isActive ? 'var(--holi-purple)' : 'rgba(109,40,217,0.07)',
              color: isActive ? 'white' : 'var(--holi-purple-ink)',
              letterSpacing: '0.02em',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  </div>
);
