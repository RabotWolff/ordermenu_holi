import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentCompletePage from './pages/PaymentCompletePage';
import StatusPage from './pages/StatusPage';
import AGBPage from './pages/AGBPage';
import DatenschutzPage from './pages/DatenschutzPage';
import ImpressumPage from './pages/ImpressumPage';

import './App.css';

const queryClient = new QueryClient();
const apiBaseUrl = import.meta.env.VITE_API_URL || '';

export default function App() {
  // Karte vorab laden, damit der Menü-Screen ohne Spinner erscheint.
  // RESTAURANT_MENU = ein statisches Menü, daher kein Datumsfilter.
  useEffect(() => {
    const slug = import.meta.env.VITE_LOCATION_SLUG || 'HOLY';
    const params = new URLSearchParams({ location: slug });
    queryClient.prefetchQuery({
      queryKey: ['getMenus', slug, undefined, undefined],
      queryFn: async () => {
        const response = await fetch(`${apiBaseUrl}/api/getMenus?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch menus');
        return response.json();
      },
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {import.meta.env.DEV && <ReactQueryDevtools />}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment-complete" element={<PaymentCompletePage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/agb" element={<AGBPage />} />
          <Route path="/datenschutz" element={<DatenschutzPage />} />
          <Route path="/impressum" element={<ImpressumPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
