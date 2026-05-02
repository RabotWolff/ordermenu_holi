// Helper: pulls allergens/additives off the MenuProduct payload from
// /api/getMenus. Backend already derives a flat `allergens` + `additives`
// array per MenuProduct from its direct ingredients (NOT from layers).
// For per-layer-option chips and the effective cart-line set, we walk the
// layer/sidedish ingredient lines manually.

const dedupeById = (arr) => {
  const map = new Map();
  for (const x of arr) {
    if (x?.id != null) map.set(x.id, x);
  }
  return [...map.values()];
};

/** Base allergens that ALWAYS apply to a MenuProduct (no layer choices needed). */
export const baseAllergens = (menuProduct) =>
  Array.isArray(menuProduct?.allergens) ? menuProduct.allergens : [];

/** Base additives that ALWAYS apply to a MenuProduct. */
export const baseAdditives = (menuProduct) =>
  Array.isArray(menuProduct?.additives) ? menuProduct.additives : [];

const labelsFromSidedish = (sidedish) => {
  const allergens = [];
  const additives = [];
  for (const line of sidedish?.sidedishIngredientLines || []) {
    for (const a of line?.ingredient?.allergens || []) allergens.push(a);
    for (const a of line?.ingredient?.additives || []) additives.push(a);
  }
  return { allergens, additives };
};

/** Allergens + additives a single layer option contributes (via its sidedish). */
export const labelsForOption = (option) => labelsFromSidedish(option?.sidedish);

/** Effective allergens/additives for a cart line: base ∪ all picked options. */
export const effectiveLabels = (menuProduct, selectedLayers) => {
  const allergens = [...baseAllergens(menuProduct)];
  const additives = [...baseAdditives(menuProduct)];

  const layers = menuProduct?.layers || [];
  for (const sl of selectedLayers || []) {
    const layer = layers.find((l) => l.id === sl.layerId);
    if (!layer) continue;
    for (const pick of sl.picks || []) {
      const opt = (layer.options || []).find((o) => o.id === pick.optionId);
      if (!opt) continue;
      const { allergens: oa, additives: oad } = labelsForOption(opt);
      allergens.push(...oa);
      additives.push(...oad);
    }
  }
  return {
    allergens: dedupeById(allergens),
    additives: dedupeById(additives),
  };
};

/** Union of every label a product could possibly have (base + every option). */
export const allPossibleLabelsForProduct = (menuProduct) => {
  const allergens = [...baseAllergens(menuProduct)];
  const additives = [...baseAdditives(menuProduct)];
  for (const layer of menuProduct?.layers || []) {
    for (const opt of layer?.options || []) {
      const { allergens: oa, additives: oad } = labelsForOption(opt);
      allergens.push(...oa);
      additives.push(...oad);
    }
  }
  return {
    allergens: dedupeById(allergens),
    additives: dedupeById(additives),
  };
};

/** Same, but for an array of products (whole menu legend). */
export const allPossibleLabelsForProducts = (menuProducts) => {
  const allergens = [];
  const additives = [];
  for (const p of menuProducts || []) {
    const { allergens: a, additives: z } = allPossibleLabelsForProduct(p);
    allergens.push(...a);
    additives.push(...z);
  }
  return {
    allergens: dedupeById(allergens),
    additives: dedupeById(additives),
  };
};

/** Display fallback: code → first 1–2 letters of name → "?". */
export const displayCode = (item) => {
  if (item?.code) return item.code;
  if (item?.name) {
    const t = String(item.name).trim();
    return t.length <= 2 ? t.toUpperCase() : t.slice(0, 1).toUpperCase();
  }
  return '?';
};
