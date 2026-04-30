import { useMutation } from '@tanstack/react-query';
import { fetchPublic } from '../api/fetchPublic';

// POST /api/holy/createOrder – Backend setzt location=HOLY, paymentMethod=WEB
// und den seedten Guest-User automatisch. Wir liefern items + paymentIntentId
// + pickupName.
export function useSubmitOrder() {
  return useMutation({
    mutationFn: async (payload) =>
      fetchPublic('holy/createOrder', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });
}
