import { classifyFreshness, freshnessWeight } from '../time/freshness.js';

export const CONFIDENCE_STATE = Object.freeze({
  VERIFIED: 'VERIFIED',
  SUPPORTED: 'SUPPORTED',
  INFERRED: 'INFERRED',
  UNKNOWN: 'UNKNOWN',
  CONTRADICTED: 'CONTRADICTED',
});

/**
 * Confidence is derived from evidence quality only.
 *
 * Dispersion is measured as the *range* of the contributing values relative to
 * a scale (default 100, the index domain), so it is scale-free and does not
 * reward large magnitudes or punish small ones. This keeps confidence
 * independent of the score's magnitude, as documented.
 */
export function computeConfidence({ observations, manifestsById, nowMs, scale = 100 }) {
  if (!observations || observations.length === 0) {
    return { value: 0, state: CONFIDENCE_STATE.UNKNOWN, contributors: 0, providers: 0, dispersion: 1 };
  }

  const scored = observations.map((observation) => {
    const manifest = manifestsById[observation.sourceId];
    if (!manifest) throw new Error(`confidence: no manifest for "${observation.sourceId}"`);
    const freshness = classifyFreshness({
      kind: observation.kind,
      observedAtMs: observation.observedAtMs,
      nowMs,
      policy: manifest.freshnessPolicy,
    });
    return {
      observation,
      manifest,
      freshness,
      weight: manifest.confidencePrior * freshnessWeight(freshness),
    };
  });

  const active = scored.filter((s) => s.weight > 0);
  if (active.length === 0) {
    return { value: 0, state: CONFIDENCE_STATE.UNKNOWN, contributors: 0, providers: 0, dispersion: 1 };
  }

  const values = active.map((s) => s.observation.value);
  const spread = Math.max(...values) - Math.min(...values);
  const dispersion = active.length > 1 ? Math.min(1, spread / scale) : 0;
  const agreement = 1 - dispersion;

  const bestWeight = Math.max(...active.map((s) => s.weight));
  const providers = new Set(active.map((s) => s.manifest.provider)).size;
  const coverage = Math.min(1, providers / 3);

  const value = Math.max(0, Math.min(1, 0.55 * bestWeight + 0.15 * coverage + 0.3 * agreement));

  const allInferred = active.every((s) => s.observation.kind === 'inferred');
  const capped = allInferred ? Math.min(value, 0.5) : value;

  let state;
  if (dispersion > 0.6) state = CONFIDENCE_STATE.CONTRADICTED;
  else if (capped >= 0.8 && active.some((s) => s.freshness === 'LIVE')) state = CONFIDENCE_STATE.VERIFIED;
  else if (allInferred) state = CONFIDENCE_STATE.INFERRED;
  else if (capped >= 0.5) state = CONFIDENCE_STATE.SUPPORTED;
  else state = CONFIDENCE_STATE.INFERRED;

  return {
    value: Number(capped.toFixed(3)),
    state,
    contributors: active.length,
    providers,
    dispersion: Number(dispersion.toFixed(3)),
  };
}

const BANDS = [
  [25, 'LOW'],
  [50, 'MODERATE'],
  [75, 'HIGH'],
  [Infinity, 'VERY HIGH'],
];

export function bandFor(score) {
  const clamped = Math.max(0, Math.min(100, score));
  for (const [limit, label] of BANDS) if (clamped < limit) return label;
  return 'VERY HIGH';
}
