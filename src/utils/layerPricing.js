// Gemeinsame Layer-Preislogik für Holi (MenuItemRow „ab … €“, LayeredSelectionSheet).
// Aligniert mit Backend: erste freeCount Gewählte in einem Layer sind preisfrei, danach je priceDelta.

export const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeLayers = (rawLayers) => {
  if (!Array.isArray(rawLayers)) return [];
  return [...rawLayers]
    .map((l) => ({
      id: l.id,
      name: l.name || '',
      description: l.description || '',
      position: l.position ?? 0,
      minSelections: Number.isFinite(l.minSelections) ? l.minSelections : 0,
      maxSelections: Number.isFinite(l.maxSelections) ? l.maxSelections : 1,
      freeCount: Number.isFinite(l.freeCount) ? l.freeCount : 0,
      options: (l.options || [])
        .map((o) => ({
          id: o.id,
          name: o.name || '',
          priceDelta: toNumber(o.priceDelta),
          priceDeltaDiscounted: toNumber(o.priceDeltaDiscounted),
          position: o.position ?? 0,
          available: o.available !== false,
          hint: o.hint || '',
        }))
        .sort((a, b) => a.position - b.position),
    }))
    .sort((a, b) => a.position - b.position);
};

export const computeLayerDelta = (layer, picks) => {
  let delta = 0;
  let used = 0;
  for (const pick of picks) {
    const opt = layer.options.find((o) => o.id === pick.optionId);
    if (!opt) continue;
    used += 1;
    if (used <= (layer.freeCount || 0)) continue;
    delta += opt.priceDelta;
  }
  return delta;
};

/**
 * Günstigster möglicher Aufpreis eines Layers bei Erfüllung von minSelections,
 * unter Annahme nicht-negativer priceDeltas: k billigste Optionen wählen,
 * freeCount Plätze streichen die teuersten der k (wie ein optimaler Abrechnungsvorgang).
 */
export const minimumLayerDeltaForMinSelections = (layer) => {
  const k = layer.minSelections;
  if (k <= 0) return 0;
  const prices = layer.options
    .filter((o) => o.available !== false)
    .map((o) => toNumber(o.priceDelta))
    .sort((a, b) => a - b);
  if (prices.length < k) return null;
  const free = Math.max(0, toNumber(layer.freeCount));
  const payCount = Math.max(0, k - free);
  if (payCount === 0) return 0;
  return prices.slice(0, payCount).reduce((sum, p) => sum + p, 0);
};

/**
 * Basispreis + minimaler Layer-Aufpreis über alle Layer (nur Pflichtauswahlen minSelections).
 */
export const computeMinimumLayeredUnitPrice = (product, rawLayers) => {
  const base = toNumber(product?.price);
  const layers = normalizeLayers(rawLayers);
  if (layers.length === 0) return base;
  let extra = 0;
  for (const layer of layers) {
    const d = minimumLayerDeltaForMinSelections(layer);
    if (d === null) return base;
    extra += d;
  }
  return base + extra;
};
