import { useQuery } from '@tanstack/react-query';
import { fetchPublic } from '../api/fetchPublic';

// Capability-basierter Status-Lookup über die Order.txId.
// Polling startet automatisch beim Mount und stoppt, sobald die Bestellung
// READY oder COMPLETED erreicht – kein "Ich bin da"-Toggle nötig, weil HOLY-
// Gäste durch das Bezahlen bereits implizit signalisieren, dass sie da sind.
export function useGetOrderStatus(txId) {
  return useQuery({
    queryKey: ['holyOrderStatus', txId],
    queryFn: () => fetchPublic(`holy/orderStatus/${txId}`, { method: 'GET' }),
    enabled: Boolean(txId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return 4000;
      if (status === 'READY' || status === 'COMPLETED') return false;
      return 4000;
    },
    refetchIntervalInBackground: true,
    retry: false,
  });
}
