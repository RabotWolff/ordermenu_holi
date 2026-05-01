import { create } from 'zustand';

const STORAGE_KEY = 'holy.activeOrder';
const HISTORY_KEY = 'holy.orderHistory';

const todayString = () => new Date().toISOString().slice(0, 10);

const readFromStorage = () => {
  if (typeof window === 'undefined') return { pickupName: '', txId: null, orderId: null, total: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { pickupName: '', txId: null, orderId: null, total: null };
    const parsed = JSON.parse(raw);
    return {
      pickupName: parsed.pickupName || '',
      txId: parsed.txId || null,
      orderId: parsed.orderId || null,
      total: parsed.total ?? null,
    };
  } catch {
    return { pickupName: '', txId: null, orderId: null, total: null };
  }
};

const writeToStorage = (state) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        pickupName: state.pickupName,
        txId: state.txId,
        orderId: state.orderId,
        total: state.total,
      })
    );
  } catch {
    /* ignore quota errors */
  }
};

const readHistory = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw);
    const today = todayString();
    return Array.isArray(all) ? all.filter((e) => e.orderedAt?.startsWith(today)) : [];
  } catch {
    return [];
  }
};

const writeHistory = (history) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    /* ignore quota errors */
  }
};

const initial = readFromStorage();

export const usePickupStore = create((set) => ({
  pickupName: initial.pickupName,
  txId: initial.txId,
  orderId: initial.orderId,
  total: initial.total,
  history: readHistory(),

  setPickupName: (pickupName) =>
    set((state) => {
      const next = { ...state, pickupName };
      writeToStorage(next);
      return { pickupName };
    }),

  setActiveOrder: ({ txId, orderId, pickupName, total }) =>
    set((state) => {
      const resolvedPickupName = pickupName ?? state.pickupName;
      const resolvedTxId = txId ?? state.txId;
      const next = {
        pickupName: resolvedPickupName,
        txId: resolvedTxId,
        orderId: orderId ?? state.orderId,
        total: total ?? state.total,
      };
      writeToStorage(next);

      // Append to today's history (deduplicated by txId).
      let history = state.history;
      if (resolvedTxId && !history.some((e) => e.txId === resolvedTxId)) {
        history = [
          ...history,
          {
            txId: resolvedTxId,
            pickupName: resolvedPickupName,
            orderedAt: new Date().toISOString(),
            total: total ?? null,
          },
        ];
        writeHistory(history);
      }

      return { ...next, history };
    }),

  clearActiveOrder: () =>
    set((state) => {
      const next = { pickupName: '', txId: null, orderId: null, total: null };
      writeToStorage(next);
      // History is intentionally kept — user can revisit past orders of the day.
      return next;
    }),
}));
