import { classifyFreshness, freshnessWeight } from '../time/freshness.js';
import { computeConfidence, bandFor } from '../confidence/confidence.js';
import { createEvidenceRecord, createEstimate } from '../evidence/evidence.js';

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Normalize a raw observation to 0..100 using the source's declared domain.
 * Sources without an explicit domain are assumed already 0..100.
 */
export function normalizeValue(value, domain, invert = false) {
  const clean = (n) => Math.round(n * 1e6) / 1e6;
  if (!domain) return clean(Math.max(0, Math.min(100, value)));
  const { min, max } = domain;
  const span = max - min;
  if (span <= 0) return 50;
  let ratio = (value - min) / span;
  ratio = Math.max(0, Math.min(1, ratio));
  const scaled = invert ? 1 - ratio : ratio;
  return clean(scaled * 100);
}

/**
 * Evidence fusion.
 *
 * - each observation is normalized to 0..100
 * - weight = source confidencePrior x freshness weight
 * - a median/MAD filter demotes (never deletes) outliers; demoted points keep
 *   an evidence record with included=false so the audit stays complete
 * - the score is the weight-weighted mean of the included points
 * - the range widens with disagreement and low confidence
 *
 * No scoring logic lives in any UI component.
 */
export function fuse({
  signal,
  observations,
  manifestsById,
  nowMs,
  domains = {},
  invert = {},
  methodologyVersion = 'm0.1',
  runId = 'run-local',
  configurationHash = 'cfg-local',
}) {
  if (!observations || observations.length === 0) {
    const confidence = computeConfidence({ observations: [], manifestsById, nowMs });
    const estimate = createEstimate({
      signal,
      score: null,
      band: 'UNAVAILABLE',
      range: null,
      confidence: confidence.value,
      evidence: [],
      computedAtMs: nowMs,
      methodologyVersion,
      runId,
      configurationHash,
    });
    return { estimate, evidence: [], contributions: [], confidence };
  }

  const normalized = observations.map((observation) => {
    const manifest = manifestsById[observation.sourceId];
    if (!manifest) throw new Error(`fuse: no manifest for "${observation.sourceId}"`);
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
      normalizedValue: normalizeValue(observation.value, domains[observation.sourceId], invert[observation.sourceId]),
    };
  });

  const active = normalized.filter((n) => n.weight > 0);
  const med = median(active.map((n) => n.normalizedValue));
  const deviations = active.map((n) => Math.abs(n.normalizedValue - med));
  const mad = median(deviations);
  const outlierCutoff = mad > 0 ? 3 * mad : Infinity;

  let weightedSum = 0;
  let weightTotal = 0;
  const evidence = [];
  const contributions = [];

  for (const entry of normalized) {
    const { observation, manifest, freshness, weight, normalizedValue } = entry;
    const isOutlier = weight > 0 && Number.isFinite(outlierCutoff) && Math.abs(normalizedValue - med) > outlierCutoff;
    const included = weight > 0 && !isOutlier;
    const reason = weight === 0 ? 'unavailable' : isOutlier ? 'outlier-demoted' : 'included';

    evidence.push(
      createEvidenceRecord({
        observation,
        manifestId: manifest.id,
        normalized: normalizedValue,
        weight,
        freshness,
        included,
        reason,
      }),
    );

    if (included) {
      weightedSum += normalizedValue * weight;
      weightTotal += weight;
    }

    contributions.push({
      sourceId: observation.sourceId,
      provider: manifest.provider,
      rawValue: observation.value,
      unit: observation.unit,
      normalized: Number(normalizedValue.toFixed(2)),
      weight: Number(weight.toFixed(4)),
      freshness,
      kind: observation.kind,
      observedAtMs: observation.observedAtMs,
      included,
      reason,
      license: manifest.license,
      commercialUse: manifest.commercialUse,
      sourceURL: manifest.sourceURL,
    });
  }

  const score = weightTotal > 0 ? weightedSum / weightTotal : null;
  const includedObservations = normalized.filter((n) => n.weight > 0 && !(Number.isFinite(outlierCutoff) && Math.abs(n.normalizedValue - med) > outlierCutoff));
  const confidence = computeConfidence({
    observations: includedObservations.map((n) => n.observation),
    manifestsById,
    nowMs,
  });

  let range = null;
  if (score !== null) {
    const spread = includedObservations.length > 1
      ? meanAbsoluteDeviation(includedObservations.map((n) => n.normalizedValue))
      : 0;
    const halfWidth = Math.round(4 + (1 - confidence.value) * 24 + spread * 0.5);
    range = {
      low: Math.max(0, Math.round(score - halfWidth)),
      high: Math.min(100, Math.round(score + halfWidth)),
    };
  }

  const estimate = createEstimate({
    signal,
    score: score === null ? null : Number(score.toFixed(2)),
    band: score === null ? 'UNAVAILABLE' : bandFor(score),
    range,
    confidence: confidence.value,
    evidence,
    computedAtMs: nowMs,
    methodologyVersion,
    runId,
    configurationHash,
  });

  return { estimate, evidence, contributions, confidence };
}

function meanAbsoluteDeviation(values) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((a, b) => a + Math.abs(b - avg), 0) / values.length;
}
