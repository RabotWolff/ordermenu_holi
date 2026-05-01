import { useMutation } from '@tanstack/react-query';

const apiBaseUrl = import.meta.env.VITE_API_URL || '';

// Lädt das PDF für eine HOLY-Bestellung über den Capability-txId und triggert
// einen Datei-Download. Backend-Route: GET /api/holy/invoice/:txId.
export function useDownloadInvoice() {
  return useMutation({
    mutationFn: async ({ txId, receiptNumber }) => {
      if (!txId) throw new Error('Kein Beleg-Token vorhanden.');
      const response = await fetch(`${apiBaseUrl}/api/holy/invoice/${txId}`, { method: 'GET' });
      if (!response.ok) {
        let msg = `Beleg-Download fehlgeschlagen (${response.status})`;
        try { msg = (await response.text()) || msg; } catch { /* ignore */ }
        throw new Error(msg);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = receiptNumber ? `Beleg-${receiptNumber}.pdf` : 'Beleg.pdf';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { ok: true };
    },
  });
}
