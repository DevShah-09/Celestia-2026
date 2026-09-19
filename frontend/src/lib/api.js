const baseUrl = (import.meta.env.VITE_BACKEND_URL || '/api').replace(/\/$/, '');
export async function api(path, { body, token, signal, timeoutMs = 15000, method } = {}) {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: method || (body === undefined ? 'GET' : 'POST'),
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal || AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Cannot reach the server. Please try again.');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) {
    const error = new Error(result?.message || 'The server could not complete your request.');
    error.status = response.status;
    error.data = result?.data;
    throw error;
  }
  return result.data;
}
