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
 * `invert` is honoured with or without a domain (a high noise reading must
 * lower calm even when the source is already on a 0..100 index).
 */
export function normalizeValue(value, domain, invert = false) {
  const clean = (n) => Math.round(n * 1e6) / 1e6;
  if (!domain) {
    const clamped = Math.max(0, Math.min(100, value));
    return clean(invert ? 100 - clamped : clamped);
  }
  const { min, max } = domain;
  const span = max - min;
  if (span <= 0) return 50;
  let ratio = (value - min) / span;
  ratio = Math.max(0, Math.min(1, ratio));
  const scaled = ratio * 100;
  return clean(invert ? 100 - scaled : scaled);
}

const OUTLIER_FLOOR = 15;

/**
 * Evidence fusion.
 *
 * - observations are processed in id order so accumulation is deterministic
 * - each is normalized to 0..100 and weighted by prior x freshness
 * - a median/MAD filter demotes (never deletes) outliers, with an absolute
 *   floor so a zero-MAD sample cannot disable outlier rejection
 * - fewer than three observations are never outlier-rejected (no consensus)
 * - demoted points keep a full evidence record so the audit stays complete
 * - the range widens with disagreement and low confidence
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
      confidenceState: confidence.state,
      evidence: [],
      computedAtMs: nowMs,
      methodologyVersion,
      runId,
      configurationHash,
    });
    return { estimate, evidence: [], contributions: [], confidence };
  }

  const ordered = [...observations].sort((a, b) => a.id.localeCompare(b.id));

  const normalized = ordered.map((observation) => {
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
      included: false,
    };
  });

  const active = normalized.filter((n) => n.weight > 0);
  const med = median(active.map((n) => n.normalizedValue));
  const mad = median(active.map((n) => Math.abs(n.normalizedValue - med)));
  const outlierCutoff = active.length >= 3 ? Math.max(3 * mad, OUTLIER_FLOOR) : Infinity;

  let weightedSum = 0;
  let weightTotal = 0;
  const evidence = [];
  const contributions = [];

  for (const entry of normalized) {
    const { observation, manifest, freshness, weight, normalizedValue } = entry;
    const isOutlier = weight > 0 && Number.isFinite(outlierCutoff)
      && Math.abs(normalizedValue - med) > outlierCutoff;
    const included = weight > 0 && !isOutlier;
    entry.included = included;
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
        rawValue: observation.value,
        domain: domains[observation.sourceId] ?? null,
        invert: Boolean(invert[observation.sourceId]),
        outlierCutoff: Number.isFinite(outlierCutoff) ? outlierCutoff : null,
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
  const confidence = computeConfidence({
    observations: normalized.filter((n) => n.included).map((n) => n.observation),
    manifestsById,
    nowMs,
  });

  let range = null;
  if (score !== null) {
    const spread = meanAbsoluteDeviation(
      normalized.filter((n) => n.included).map((n) => n.normalizedValue),
    );
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
    confidenceState: confidence.state,
    evidence,
    computedAtMs: nowMs,
    methodologyVersion,
    runId,
    configurationHash,
  });

  return { estimate, evidence, contributions, confidence };
}

function meanAbsoluteDeviation(values) {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((a, b) => a + Math.abs(b - avg), 0) / values.length;
}
