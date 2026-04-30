import { useMutation } from '@tanstack/react-query';
import { fetchPublic } from '../api/fetchPublic';

// POST /api/holy/createPaymentIntent
// Reuse des bestehenden createPaymentIntend Controllers, gewrapped durch
// das holyGuestAuth Middleware (req.id = Guest-UUID).
export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: async (payload) =>
      fetchPublic('holy/createPaymentIntent', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });
}
