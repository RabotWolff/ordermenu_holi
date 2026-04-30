import { create } from 'zustand';

// Persistiert pickupName + txId der zuletzt aufgegebenen Bestellung in
// localStorage, damit ein Refresh oder Stripe-Redirect den Status-Screen
// wiederfindet. Der txId ist die Capability für den Status-Lookup.

const STORAGE_KEY = 'holy.activeOrder';

const readFromStorage = () => {
  if (typeof window === 'undefined') return { pickupName: '', txId: null, orderId: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { pickupName: '', txId: null, orderId: null };
    const parsed = JSON.parse(raw);
    return {
      pickupName: parsed.pickupName || '',
      txId: parsed.txId || null,
      orderId: parsed.orderId || null,
    };
  } catch {
    return { pickupName: '', txId: null, orderId: null };
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
      })
    );
  } catch {
    /* ignore quota errors */
  }
};

const initial = readFromStorage();

export const usePickupStore = create((set) => ({
  pickupName: initial.pickupName,
  txId: initial.txId,
  orderId: initial.orderId,

  setPickupName: (pickupName) =>
    set((state) => {
      const next = { ...state, pickupName };
      writeToStorage(next);
      return { pickupName };
    }),

  setActiveOrder: ({ txId, orderId, pickupName }) =>
    set((state) => {
      const next = {
        pickupName: pickupName ?? state.pickupName,
        txId: txId ?? state.txId,
        orderId: orderId ?? state.orderId,
      };
      writeToStorage(next);
      return next;
    }),

  clearActiveOrder: () =>
    set(() => {
      const next = { pickupName: '', txId: null, orderId: null };
      writeToStorage(next);
      return next;
    }),
}));
