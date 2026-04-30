const apiBaseUrl = import.meta.env.VITE_API_URL || '';

// Öffentlicher Fetch-Wrapper für die HOLY-Routen. Kein Authorization-Header,
// kein Cookie. Fehlerformat ist mit fetchWithAuth (Kantine) identisch, damit
// Hooks/Komponenten gleich reagieren können.
export async function fetchPublic(endpoint, options = {}) {
  const response = await fetch(`${apiBaseUrl}/api/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.error) errorMessage = errorData.error;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
