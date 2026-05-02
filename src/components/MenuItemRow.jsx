import { useMemo } from 'react';
import { useCartStore } from '../stores/useCartStore';
import { computeMinimumLayeredUnitPrice } from '../utils/layerPricing';
import { FoodLabelChips } from './FoodLabelChips';
import { baseAllergens, baseAdditives } from '../utils/foodLabels';

const formatEuro = (v) => `${Number(v).toFixed(2).replace('.', ',')} €`;

// Holi-Style Menüzeile: kein Bild, aber Name, Beschreibung, Allergen-Chips,
// Preis und ein +/-/×n Counter, der direkt im Cart-Store schreibt.
// Bei Produkten mit Layern öffnet das + den Bottom-Sheet (über onAddWithLayers).
export const MenuItemRow = ({ product, onAddWithLayers }) => {
  const addLine = useCartStore((s) => s.addLine);
  const decrementLatestForProduct = useCartStore((s) => s.decrementLatestForProduct);
  const count = useCartStore((s) => s.countForProduct(product.id));

  const layers = useMemo(() => {
    const raw = product?.layers ?? product?.product?.layers ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [product]);
  const hasLayers = layers.length > 0;

  /** „ab“-Preis: Basis + günstigste erlaubte Pflichtwahl pro Layer (minSelections, freeCount). */
  const displayUnitPrice = useMemo(() => {
    if (!hasLayers) return Number(product?.price) || 0;
    return computeMinimumLayeredUnitPrice(product, layers);
  }, [hasLayers, product, layers]);

  // Backend liefert auf jedem MenuProduct ein bereits aggregiertes
  // `allergens` + `additives` (aus den direkt verknüpften Ingredients).
  // Layer-/Beilagen-bedingte Labels werden hier bewusst NICHT eingerechnet:
  // Die ändern sich pro Auswahl und werden im LayerSheet pro Option gezeigt
  // bzw. auf der CartLine als effektive Menge.
  const allergens = useMemo(() => baseAllergens(product), [product]);
  const additives = useMemo(() => baseAdditives(product), [product]);

  const description = product.description || product.descriptionLong || '';
  const displayName = product.nameAdvertising || product.name;

  const handleAdd = () => {
    if (hasLayers) {
      onAddWithLayers?.(product, layers);
      return;
    }
    addLine({ product, selectedLayers: null, layerNames: [], totalDelta: 0 });
  };

  return (
    <div
      className="flex items-start gap-2.5 py-3.5"
      style={{ borderBottom: '1px dashed rgba(109,40,217,0.18)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <h3
            className="font-Fraunces font-semibold text-[17px] leading-tight m-0"
            style={{ color: 'var(--holi-ink)' }}
          >
            {displayName}
          </h3>
          {hasLayers && (
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-px rounded"
              style={{ color: 'var(--holi-purple)', background: 'rgba(109,40,217,0.08)' }}
            >
              wählbar
            </span>
          )}
        </div>
        {description && (
          <p
            className="text-[12.5px] leading-snug m-0 mt-0.5 mb-1"
            style={{ color: 'var(--holi-ink-soft)' }}
          >
            {description}
          </p>
        )}
        <div className="mt-1">
          <FoodLabelChips allergens={allergens} additives={additives} />
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 pt-px">
        <span
          className="font-Fraunces font-semibold text-[15px] whitespace-nowrap"
          style={{ color: 'var(--holi-purple-ink)' }}
        >
          {hasLayers && (
            <span
              className="text-[10px] mr-0.5"
              style={{ color: 'var(--holi-ink-soft)' }}
            >
              ab
            </span>
          )}
          {formatEuro(displayUnitPrice)}
        </span>

        {count > 0 ? (
          <div
            className="flex items-center rounded-full overflow-hidden"
            style={{
              background: 'var(--holi-purple)',
              boxShadow: '0 2px 8px rgba(109,40,217,0.3)',
            }}
          >
            <button
              type="button"
              onClick={() => decrementLatestForProduct(product.id)}
              className="border-0 bg-transparent text-white w-[30px] h-[30px] text-lg font-bold cursor-pointer"
              aria-label="Entfernen"
            >
              −
            </button>
            <span className="text-white font-bold text-[13px] min-w-[18px] text-center">
              {count}
            </span>
            <button
              type="button"
              onClick={handleAdd}
              className="border-0 bg-transparent text-white w-[30px] h-[30px] text-lg font-bold cursor-pointer"
              aria-label="Hinzufügen"
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            className="border-0 text-white w-[30px] h-[30px] rounded-full text-lg font-bold cursor-pointer"
            style={{
              background: 'var(--holi-purple)',
              boxShadow: '0 2px 8px rgba(109,40,217,0.3)',
            }}
            aria-label={hasLayers ? 'Optionen wählen' : 'Hinzufügen'}
          >
            +
          </button>
        )}
      </div>
    </div>
  );
};
