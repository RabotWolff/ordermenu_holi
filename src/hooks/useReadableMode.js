import { useEffect, useState } from 'react';

const STORAGE_KEY = 'holy.readableMode';

const readInitial = () => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

// Setzt data-mode="readable" auf <html>. Wird auch synchron im Inline-Script
// von index.html appliziert, damit beim ersten Paint kein Flash entsteht.
const apply = (enabled) => {
  if (typeof document === 'undefined') return;
  if (enabled) document.documentElement.dataset.mode = 'readable';
  else document.documentElement.removeAttribute('data-mode');
};

export function useReadableMode() {
  const [enabled, setEnabled] = useState(readInitial);

  useEffect(() => {
    apply(enabled);
    try {
      window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    } catch {
      /* ignore quota */
    }
  }, [enabled]);

  return { enabled, toggle: () => setEnabled((v) => !v) };
}
