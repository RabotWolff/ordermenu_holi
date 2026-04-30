import { useQuery } from '@tanstack/react-query';

const apiBaseUrl = import.meta.env.VITE_API_URL || '';

// Wiederverwendung des öffentlichen /api/getMenus Endpunkts.
// Identisch mit kantine/src/hooks/useGetMenus.js – kein Auth nötig.
export function useGetMenus(location, options = {}) {
  const { fromDate, toDate, ...rest } = options;
  const params = new URLSearchParams({ location });
  if (fromDate) params.set('fromDate', fromDate);
  if (toDate) params.set('toDate', toDate);

  return useQuery({
    queryKey: ['getMenus', location, fromDate, toDate],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/api/getMenus?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch menus');
      return response.json();
    },
    ...rest,
  });
}
