import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Offline cache for live adapters. Stores the last known observation per source
 * with a payload hash and adapter version. It never upgrades freshness: a
 * cached value keeps its original observedAt, so the freshness classifier will
 * mark it CACHED or STALE, never LIVE.
 */

export function payloadHash(payload) {
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

export function createMemoryCache(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    get: (sourceId) => store.get(sourceId) ?? null,
    set: (sourceId, entry) => { store.set(sourceId, entry); },
    all: () => Object.fromEntries(store),
  };
}

export function createFileCache(path) {
  const read = () => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {});
  return {
    get: (sourceId) => read()[sourceId] ?? null,
    set: (sourceId, entry) => {
      const all = read();
      all[sourceId] = entry;
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, JSON.stringify(all, null, 2));
    },
    all: () => read(),
  };
}

export function cacheEntry({ sourceId, observedAtMs, receivedAtMs, adapterVersion, dataClass, value, unit, hash }) {
  return { sourceId, observedAtMs, receivedAtMs, adapterVersion, dataClass, value, unit, hash };
}

/**
 * Resolve an adapter run to an observation using cache fallback.
 * Returns { value, observedAtMs, cached: boolean, reason } or null.
 */
export function resolveWithCache({ fresh, cache, sourceId, nowMs, staleAfterMs = 24 * 3600 * 1000 }) {
  if (fresh && fresh.ok) {
    return { value: fresh.value, observedAtMs: fresh.observedAtMs, cached: false, reason: 'live' };
  }
  const entry = cache ? cache.get(sourceId) : null;
  if (!entry) return { value: null, observedAtMs: null, cached: false, reason: fresh?.error ?? 'no-data' };
  if (nowMs - entry.observedAtMs > staleAfterMs) {
    return { value: entry.value, observedAtMs: entry.observedAtMs, cached: true, reason: 'cache-too-old' };
  }
  return { value: entry.value, observedAtMs: entry.observedAtMs, cached: true, reason: 'cached-fallback' };
}
