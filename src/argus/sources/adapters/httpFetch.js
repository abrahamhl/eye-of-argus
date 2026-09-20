/**
 * Bounded HTTP fetch with an explicit timeout and error state.
 *
 * Returns a result object instead of throwing, so an adapter can degrade to
 * cached/offline mode without a try/catch in every caller. `fetchImpl` is
 * injectable so tests never touch the network.
 */
export async function httpFetch(url, { timeoutMs = 8000, fetchImpl = globalThis.fetch, accept } = {}) {
  if (typeof fetchImpl !== 'function') {
    return { ok: false, status: 0, error: 'no-fetch-implementation' };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = accept ? { Accept: accept } : undefined;
    const response = await fetchImpl(url, { signal: controller.signal, headers });
    if (!response.ok) {
      return { ok: false, status: response.status, error: `http-${response.status}` };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return { ok: true, status: response.status, body: buffer };
  } catch (error) {
    const aborted = error && error.name === 'AbortError';
    return { ok: false, status: 0, error: aborted ? 'timeout' : String((error && error.message) || error) };
  } finally {
    clearTimeout(timer);
  }
}

export function parseJson(body) {
  return JSON.parse(body.toString('utf8'));
}
