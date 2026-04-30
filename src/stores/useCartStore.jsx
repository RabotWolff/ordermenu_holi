import { create } from 'zustand';

// HOLY-Cart. Eine "line" ist eine Variante eines MenuProducts inkl. ggf.
// Layered-Auswahl. Verschiedene Layer-Kombinationen desselben Produkts
// bleiben separate Lines (so wie im Service/Kantine-Flow), damit der Bon
// die Picks pro Stück eindeutig auflisten kann.
//
// Felder pro Line:
//   lineId           – stabiler Schlüssel "<productId>::<layerHash>"
//   product          – komplettes MenuProduct vom Backend
//   selectedLayers   – [{ layerId, picks: [{ optionId }] }] | null
//   layerNames       – ["Vanille", "Sahne"] für UI/Bon-Suffix
//   unitPrice        – Basispreis + Layer-Delta (regular)
//   qty              – Anzahl

const buildLayerHash = (selectedLayers) => {
  if (!selectedLayers || selectedLayers.length === 0) return '';
  return selectedLayers
    .map((l) => `${l.layerId}:${(l.picks || []).map((p) => p.optionId).join(',')}`)
    .join('|');
};

export const useCartStore = create((set, get) => ({
  lines: [],

  addLine: ({ product, selectedLayers, layerNames, totalDelta }) => {
    const layerHash = buildLayerHash(selectedLayers);
    const lineId = `${product.id}::${layerHash}`;
    const unitPrice = Number(product.price || 0) + Number(totalDelta || 0);

    set((state) => {
      const existing = state.lines.find((l) => l.lineId === lineId);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.lineId === lineId ? { ...l, qty: l.qty + 1 } : l
          ),
        };
      }
      return {
        lines: [
          ...state.lines,
          {
            lineId,
            product,
            selectedLayers: selectedLayers || null,
            layerNames: layerNames || [],
            unitPrice,
            qty: 1,
          },
        ],
      };
    });
  },

  incrementLine: (lineId) =>
    set((state) => ({
      lines: state.lines.map((l) =>
        l.lineId === lineId ? { ...l, qty: l.qty + 1 } : l
      ),
    })),

  decrementLine: (lineId) =>
    set((state) => {
      const line = state.lines.find((l) => l.lineId === lineId);
      if (!line) return state;
      if (line.qty <= 1) {
        return { lines: state.lines.filter((l) => l.lineId !== lineId) };
      }
      return {
        lines: state.lines.map((l) =>
          l.lineId === lineId ? { ...l, qty: l.qty - 1 } : l
        ),
      };
    }),

  // Aus einer MenuItemRow heraus: zieht das jüngste Line-Item (mit beliebigen
  // Layer-Picks) für dieses Produkt um -1, weil die Row nur eine aggregierte
  // Anzahl pro Produkt-Id zeigt.
  decrementLatestForProduct: (productId) =>
    set((state) => {
      for (let i = state.lines.length - 1; i >= 0; i--) {
        if (state.lines[i].product.id === productId) {
          const next = [...state.lines];
          if (next[i].qty <= 1) {
            next.splice(i, 1);
          } else {
            next[i] = { ...next[i], qty: next[i].qty - 1 };
          }
          return { lines: next };
        }
      }
      return state;
    }),

  countForProduct: (productId) =>
    get().lines
      .filter((l) => l.product.id === productId)
      .reduce((s, l) => s + l.qty, 0),

  total: () =>
    get().lines.reduce((s, l) => s + l.unitPrice * l.qty, 0),

  itemCount: () => get().lines.reduce((s, l) => s + l.qty, 0),

  clear: () => set({ lines: [] }),
}));
