import { CONFIG } from '../config/methodology.js';

export const CONFIDENCE_STATE = Object.freeze({
  VERIFIED: 'VERIFIED',
  SUPPORTED: 'SUPPORTED',
  INFERRED: 'INFERRED',
  UNKNOWN: 'UNKNOWN',
  CONTRADICTED: 'CONTRADICTED',
});

/** The number returned here is EVIDENCE QUALITY, never a calibrated probability. */
export const CONFIDENCE_SEMANTICS = 'evidence-quality';

/**
 * Evidence-quality confidence.
 *
 * CRITICAL: agreement is measured on NORMALIZED values (0..100), never on raw
 * values. Raw readings from different units (vehicles/hour, %, arrivals, dB)
 * are not comparable; dispersion over raw values would be meaningless. Callers
 * pass the same normalized contributions the fusion engine used, so confidence
 * always describes agreement within one estimated signal.
 *
 * Each contribution: { normalizedValue, weight, provider, freshness, kind }.
 *
 * This number is evidence quality, NOT P(correct). Do not label it as a
 * probability until calibration against ground truth exists.
 */
export function computeEvidenceConfidence({ contributions, scale = CONFIG.confidence.scale } = {}) {
  const base = { value: 0, state: CONFIDENCE_STATE.UNKNOWN, contributors: 0, providers: 0, dispersion: 1, semantics: CONFIDENCE_SEMANTICS };
  if (!Array.isArray(contributions) || contributions.length === 0) return base;

  const active = contributions.filter((c) => c && Number.isFinite(c.weight) && c.weight > 0 && Number.isFinite(c.normalizedValue));
  if (active.length === 0) return base;

  const values = active.map((c) => c.normalizedValue);
  const spread = Math.max(...values) - Math.min(...values);
  const dispersion = active.length > 1 ? Math.min(1, spread / scale) : 0;
  const agreement = 1 - dispersion;

  const bestWeight = Math.max(...active.map((c) => c.weight));
  const providers = new Set(active.map((c) => c.provider)).size;
  const coverage = Math.min(1, providers / 3);

  const w = CONFIG.confidence.weights;
  const raw = w.prior * bestWeight + w.coverage * coverage + w.agreement * agreement;
  const value = Math.max(0, Math.min(1, raw));

  const allInferred = active.every((c) => c.kind === 'inferred');
  const capped = allInferred ? Math.min(value, CONFIG.confidence.inferredCap) : value;

  let state;
  if (dispersion > CONFIG.confidence.contradictionDispersion) state = CONFIDENCE_STATE.CONTRADICTED;
  else if (capped >= CONFIG.confidence.verifiedMin && active.some((c) => c.freshness === 'LIVE')) state = CONFIDENCE_STATE.VERIFIED;
  else if (allInferred) state = CONFIDENCE_STATE.INFERRED;
  else if (capped >= CONFIG.confidence.supportedMin) state = CONFIDENCE_STATE.SUPPORTED;
  else state = CONFIDENCE_STATE.INFERRED;

  return {
    value: Number(capped.toFixed(3)),
    state,
    contributors: active.length,
    providers,
    dispersion: Number(dispersion.toFixed(3)),
    semantics: CONFIDENCE_SEMANTICS,
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
