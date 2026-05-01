import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetMenus } from '../hooks/useGetMenus';
import { useCartStore } from '../stores/useCartStore';
import { usePickupStore } from '../stores/usePickupStore';
import { Splash } from '../elements/Splash';
import { SpeckCluster } from '../elements/SpeckCluster';
import { HoliWordmark } from '../elements/HoliWordmark';
import { MenuTabs } from '../components/MenuTabs';
import { MenuItemRow } from '../components/MenuItemRow';
import { LayeredSelectionSheet } from '../components/LayeredSelectionSheet';
import { AllergenLegend } from '../components/AllergenChips';

const formatEuro = (v) => `${Number(v).toFixed(2).replace('.', ',')} €`;

// HOLY ist als RESTAURANT_MENU konfiguriert: ein einziges, statisches Menü
// (kein Tagesturnus). Wir fragen daher /api/getMenus ohne Datumsfilter ab
// und nehmen das erste – und einzige – Menü.
const formatEuroShort = (v) => `${Number(v).toFixed(2).replace('.', ',')} €`;

export default function MenuPage() {
  const navigate = useNavigate();
  const history = usePickupStore((s) => s.history);
  const setActiveOrder = usePickupStore((s) => s.setActiveOrder);

  const {
    data: menusData,
    isPending,
    error,
  } = useGetMenus(import.meta.env.VITE_LOCATION_SLUG || 'HOLY');

  const products = useMemo(() => {
    if (!menusData || !Array.isArray(menusData) || menusData.length === 0) return [];
    return menusData[0].products || [];
  }, [menusData]);

  const { dishes, drinks } = useMemo(() => {
    const dishMap = {};
    const drinkMap = {};
    for (const p of products) {
      if (p.hidden || p.available === false) continue;
      const groupName = p.productGroup?.name || 'Sonstiges';
      const target = p.type === 'DRINK' ? drinkMap : dishMap;
      (target[groupName] ||= []).push(p);
    }
    return { dishes: dishMap, drinks: drinkMap };
  }, [products]);

  const tabs = useMemo(() => {
    const out = [{ id: 'all', label: 'Alles' }];
    Object.keys(dishes).forEach((g) => out.push({ id: `dish::${g}`, label: g }));
    Object.keys(drinks).forEach((g) => out.push({ id: `drink::${g}`, label: g }));
    return out;
  }, [dishes, drinks]);

  const [activeTab, setActiveTab] = useState('all');
  const scrollerRef = useRef(null);
  const [layerSheetItem, setLayerSheetItem] = useState(null);
  const [layerSheetLayers, setLayerSheetLayers] = useState([]);

  const cartCount = useCartStore((s) => s.itemCount());
  const cartTotal = useCartStore((s) => s.total());

  const reopenOrder = (entry) => {
    setActiveOrder({ txId: entry.txId, pickupName: entry.pickupName });
    navigate('/status');
  };

  const scrollToCategory = (tabId) => {
    setActiveTab(tabId);
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (tabId === 'all') {
      scroller.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const anchorId = `cat-${tabId}`;
    const el = document.getElementById(anchorId);
    if (!el) return;
    // Abstand des Ankers vom oberen Inhaltsrand des Scroll-Containers (nicht nur offsetTop).
    const relativeTop =
      el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    scroller.scrollTo({ top: Math.max(0, relativeTop - 110), behavior: 'smooth' });
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span style={{ color: 'var(--holi-ink-soft)' }}>Lädt…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-6 text-center">
        <div>
          <div className="font-Fraunces text-lg mb-2" style={{ color: 'var(--holi-ink)' }}>
            Karte konnte nicht geladen werden
          </div>
          <div className="text-sm" style={{ color: 'var(--holi-ink-soft)' }}>
            {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col h-[100dvh] overflow-hidden"
      style={{ background: 'var(--holi-cream)' }}
    >
      {/* Header */}
      <header className="relative px-5 pt-3.5 pb-2.5 overflow-hidden flex-shrink-0">
        <Splash color="purple" size={180} opacity={0.45} style={{ top: -60, left: -50 }} />
        <Splash color="saffron" size={140} opacity={0.45} style={{ top: -40, right: -40 }} />
        <SpeckCluster color="mango" count={18} size={90} style={{ top: 10, right: 80 }} />
        <div className="relative flex items-center justify-between">
          <HoliWordmark height={34} withTagline />
        </div>
        <p
          className="font-CaveatBrush relative m-0 mt-2 text-lg"
          style={{ color: 'var(--holi-ink)', transform: 'rotate(-1deg)' }}
        >
          colorful food. <span style={{ color: 'var(--holi-mango)' }}>good mood.</span>
        </p>
      </header>

      <MenuTabs tabs={tabs} activeTab={activeTab} onSelect={scrollToCategory} />

      {/* Scrollable list */}
      <div
        ref={scrollerRef}
        className="flex-1 min-h-0 overflow-y-auto px-5 pb-32 relative touch-pan-y"
      >
        {Object.keys(dishes).length === 0 && Object.keys(drinks).length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--holi-ink-soft)' }}>
            Heute ist nichts auf der Karte. Komm morgen wieder.
          </div>
        )}

        {Object.keys(dishes).length > 0 && (
          <SectionHeader title="Speisen" sub="Brunch · Currys · Sweets" />
        )}
        {Object.entries(dishes).map(([cat, items]) => (
          <div key={cat} id={`cat-dish::${cat}`}>
            <SubHeader title={cat} />
            {items.map((p) => (
              <MenuItemRow
                key={p.id}
                product={p}
                onAddWithLayers={(prod, layers) => {
                  setLayerSheetItem(prod);
                  setLayerSheetLayers(layers);
                }}
              />
            ))}
          </div>
        ))}

        {Object.keys(drinks).length > 0 && (
          <div className="relative mt-6">
            <Splash color="blush" size={160} opacity={0.4} style={{ top: 0, right: -60 }} />
            <Splash color="mango" size={120} opacity={0.4} style={{ top: 30, left: -50 }} />
            <SectionHeader title="Getränke" sub="heiß & kalt" />
          </div>
        )}
        {Object.entries(drinks).map(([cat, items]) => (
          <div key={cat} id={`cat-drink::${cat}`}>
            <SubHeader title={cat} />
            {items.map((p) => (
              <MenuItemRow
                key={p.id}
                product={p}
                onAddWithLayers={(prod, layers) => {
                  setLayerSheetItem(prod);
                  setLayerSheetLayers(layers);
                }}
              />
            ))}
          </div>
        ))}

        {history.length > 0 && (
          <div className="mt-8 mb-2">
            <div
              className="text-[10px] uppercase font-bold mb-2.5"
              style={{ letterSpacing: '0.18em', color: 'var(--holi-ink-soft)' }}
            >
              Meine heutigen Bestellungen
            </div>
            {history.map((entry) => (
              <button
                key={entry.txId}
                type="button"
                onClick={() => reopenOrder(entry)}
                className="w-full text-left rounded-2xl px-3.5 py-3 mb-2 flex items-center gap-3 cursor-pointer"
                style={{
                  background: 'rgba(109,40,217,0.06)',
                  border: '1px solid rgba(109,40,217,0.14)',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div
                    className="font-CaveatBrush text-[20px] leading-none"
                    style={{ color: 'var(--holi-purple)' }}
                  >
                    {entry.pickupName}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--holi-ink-soft)' }}>
                    {new Date(entry.orderedAt).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    Uhr
                    {entry.total != null
                      ? ` · ${formatEuroShort(entry.total)}`
                      : ''}
                  </div>
                </div>
                <span
                  className="text-[11px] font-semibold flex-shrink-0"
                  style={{ color: 'var(--holi-purple-ink)' }}
                >
                  Status →
                </span>
              </button>
            ))}
          </div>
        )}

        <AllergenLegend />
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div className="fixed left-0 right-0 bottom-0 px-3.5 pb-4 z-20 pointer-events-none">
          <div className="max-w-[420px] mx-auto pointer-events-auto">
            <Link
              to="/cart"
              className="w-full border-0 text-white px-4 py-3.5 rounded-2xl flex items-center justify-between cursor-pointer no-underline"
              style={{
                background: 'var(--holi-purple)',
                boxShadow: '0 8px 24px rgba(109,40,217,0.4)',
              }}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className="inline-flex items-center justify-center font-bold text-[13px] rounded-full"
                  style={{
                    width: 26,
                    height: 26,
                    background: 'var(--holi-saffron)',
                    color: 'var(--holi-purple-ink)',
                  }}
                >
                  {cartCount}
                </span>
                <span className="text-sm font-semibold">Warenkorb ansehen</span>
              </span>
              <span className="font-Fraunces text-base font-semibold">
                {formatEuro(cartTotal)}
              </span>
            </Link>
          </div>
        </div>
      )}

      <LayeredSelectionSheet
        open={!!layerSheetItem}
        onOpenChange={(o) => {
          if (!o) {
            setLayerSheetItem(null);
            setLayerSheetLayers([]);
          }
        }}
        product={layerSheetItem}
        layers={layerSheetLayers}
        onConfirm={(payload) => {
          useCartStore.getState().addLine({
            product: layerSheetItem,
            selectedLayers: payload.selectedLayers,
            layerNames: payload.layerNames,
            totalDelta: payload.totalDelta,
          });
        }}
      />
    </div>
  );
}

const SectionHeader = ({ title, sub }) => (
  <div className="relative pt-4 pb-1.5">
    <div
      className="font-CaveatBrush text-[26px] leading-none inline-block"
      style={{ color: 'var(--holi-purple)', transform: 'rotate(-1.5deg)' }}
    >
      {title}
    </div>
    {sub && (
      <div
        className="font-CaveatBrush text-[13px] mt-0.5"
        style={{ color: 'var(--holi-saffron)' }}
      >
        {sub}
      </div>
    )}
  </div>
);

const SubHeader = ({ title }) => (
  <div className="flex items-center gap-2 my-3.5 mb-0.5">
    <span
      className="font-Fraunces text-[13px] uppercase font-semibold"
      style={{ color: 'var(--holi-ink)', letterSpacing: '0.18em' }}
    >
      {title}
    </span>
    <span className="flex-1 h-px" style={{ background: 'rgba(109,40,217,0.2)' }} />
  </div>
);
