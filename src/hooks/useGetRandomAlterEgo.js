import { useQuery } from '@tanstack/react-query';

const apiBaseUrl = import.meta.env.VITE_API_URL || '';

// Backend liefert {firstName, surname} oder einen kompletten String – wir
// normalisieren auf einen einzigen Anzeigenamen für den Pickup.
export function useGetRandomAlterEgo(options = {}) {
  return useQuery({
    queryKey: ['getRandomAlterEgo'],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/api/getRandomAlterEgo`);
      if (!response.ok) throw new Error('Failed to fetch alter ego');
      return response.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export const formatAlterEgo = (data) => {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (data.alterEgo) return data.alterEgo;
  if (data.firstName || data.surname) return `${data.firstName || ''} ${data.surname || ''}`.trim();
  return '';
};
