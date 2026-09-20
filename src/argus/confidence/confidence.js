import { classifyFreshness, freshnessWeight } from '../time/freshness.js';

export const CONFIDENCE_STATE = Object.freeze({
  VERIFIED: 'VERIFIED',
  SUPPORTED: 'SUPPORTED',
  INFERRED: 'INFERRED',
  UNKNOWN: 'UNKNOWN',
  CONTRADICTED: 'CONTRADICTED',
});

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Confidence is derived from evidence quality only. It is never a function of
 * the crowd score, so a strong crowd reading can still be uncertain.
 *
 * Inputs:
 *  - observations: normalized observations carrying sourceId, value, kind
 *  - manifestsById: sourceId -> SourceManifest
 *
 * Outputs a 0..1 number plus a discrete state. All-inferred evidence is capped
 * below VERIFIED by construction.
 */
export function computeConfidence({ observations, manifestsById, nowMs }) {
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
  const average = mean(values);
  const mad = mean(values.map((v) => Math.abs(v - average)));
  const dispersion = average > 0 ? Math.min(1, mad / average) : 1;

  const bestWeight = Math.max(...active.map((s) => s.weight));
  const providers = new Set(active.map((s) => s.manifest.provider)).size;
  const coverage = Math.min(1, providers / 3);
  const agreement = 1 - dispersion;

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
