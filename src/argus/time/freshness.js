/**
 * Freshness states. These are never collapsed: an inferred value is never
 * reported as live, and a cached value is never reported as live.
 */
export const FRESHNESS = Object.freeze({
  LIVE: 'LIVE',
  CACHED: 'CACHED',
  STALE: 'STALE',
  STATIC: 'STATIC',
  INFERRED: 'INFERRED',
  UNAVAILABLE: 'UNAVAILABLE',
});

/**
 * Default freshness policy, in seconds. A source manifest may override it.
 */
export const DEFAULT_FRESHNESS_POLICY = Object.freeze({
  liveWithinSeconds: 120,
  cachedWithinSeconds: 900,
});

/**
 * Observations declare whether they were observed, inferred or static.
 * `kind` dominates: inferred never becomes live, static is always static.
 */
export function classifyFreshness({ kind, observedAtMs, nowMs, policy } = {}) {
  if (kind === 'inferred') return FRESHNESS.INFERRED;
  if (kind === 'static') return FRESHNESS.STATIC;
  if (!Number.isFinite(observedAtMs)) return FRESHNESS.UNAVAILABLE;
  if (!Number.isFinite(nowMs)) return FRESHNESS.UNAVAILABLE;

  const { liveWithinSeconds, cachedWithinSeconds } = {
    ...DEFAULT_FRESHNESS_POLICY,
    ...(policy || {}),
  };
  if (
    !(liveWithinSeconds > 0) ||
    !(cachedWithinSeconds > 0) ||
    liveWithinSeconds > cachedWithinSeconds
  ) {
    throw new Error(
      `freshness policy invalid: need 0 < liveWithinSeconds (${liveWithinSeconds}) <= cachedWithinSeconds (${cachedWithinSeconds})`,
    );
  }

  const ageSeconds = (nowMs - observedAtMs) / 1000;
  if (ageSeconds < 0) {
    // Future timestamps are untrusted; treat as unavailable rather than live.
    return FRESHNESS.UNAVAILABLE;
  }
  if (ageSeconds <= liveWithinSeconds) return FRESHNESS.LIVE;
  if (ageSeconds <= cachedWithinSeconds) return FRESHNESS.CACHED;
  return FRESHNESS.STALE;
}

/**
 * Freshness multiplier applied to a source's confidence prior.
 * Stale and inferred contributions are down-weighted, never dropped silently.
 */
export const FRESHNESS_WEIGHT = Object.freeze({
  [FRESHNESS.LIVE]: 1,
  [FRESHNESS.CACHED]: 0.7,
  [FRESHNESS.STATIC]: 0.9,
  [FRESHNESS.INFERRED]: 0.45,
  [FRESHNESS.STALE]: 0.25,
  [FRESHNESS.UNAVAILABLE]: 0,
});

export function freshnessWeight(state) {
  return FRESHNESS_WEIGHT[state] ?? 0;
}
