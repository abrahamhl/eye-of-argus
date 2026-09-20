import { classifyFreshness, freshnessWeight } from '../time/freshness.js';
import { computeEvidenceConfidence, bandFor } from '../confidence/confidence.js';
import { createEvidenceRecord, createEstimate } from '../evidence/evidence.js';
import { CONFIG, METHODOLOGY_VERSION, configurationHash as hashConfig } from '../config/methodology.js';

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

function correlationFactorFor(sourceId) {
  const groups = CONFIG.fusion.correlationGroups;
  for (const [group, members] of Object.entries(groups)) {
    if (members.includes(sourceId)) return group;
  }
  return null;
}

/**
 * Evidence fusion.
 *
 * - observations are processed in id order so accumulation is deterministic
 * - each is normalized to 0..100 and weighted by prior x freshness
 * - correlation groups damp all but the strongest member (naive but honest)
 * - a median/MAD filter demotes (never deletes) outliers, with an absolute
 *   floor so a zero-MAD sample cannot disable outlier rejection
 * - fewer than three observations are never outlier-rejected (no consensus)
 * - confidence is computed on NORMALIZED values, never raw values
 * - the range widens with disagreement and low confidence
 */
export function fuse({
  signal,
  observations,
  manifestsById,
  nowMs,
  domains = {},
  invert = {},
  methodologyVersion = METHODOLOGY_VERSION,
  runId = 'run-local',
  configurationHash = hashConfig(),
}) {
  if (!observations || observations.length === 0) {
    const confidence = computeEvidenceConfidence({ contributions: [] });
    const estimate = createEstimate({
      signal,
      score: null,
      band: 'UNAVAILABLE',
      range: null,
      confidence: confidence.value,
      confidenceState: confidence.state,
      confidenceSemantics: confidence.semantics,
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
      baseWeight: manifest.confidencePrior * freshnessWeight(freshness),
      correlationGroup: correlationFactorFor(observation.sourceId),
      correlationFactor: 1,
      normalizedValue: normalizeValue(observation.value, domains[observation.sourceId], invert[observation.sourceId]),
      included: false,
    };
  });

  // Correlation damping: within a group, the strongest included member keeps its
  // weight; the rest are damped so related signals are not double-counted.
  const groups = new Map();
  for (const entry of normalized) {
    if (!entry.correlationGroup || entry.baseWeight <= 0) continue;
    if (!groups.has(entry.correlationGroup)) groups.set(entry.correlationGroup, []);
    groups.get(entry.correlationGroup).push(entry);
  }
  for (const members of groups.values()) {
    const ranked = [...members].sort((a, b) => b.baseWeight - a.baseWeight);
    ranked.forEach((entry, index) => { entry.correlationFactor = index === 0 ? 1 : CONFIG.fusion.correlationDamping; });
  }

  for (const entry of normalized) entry.weight = entry.baseWeight * entry.correlationFactor;

  const active = normalized.filter((n) => n.weight > 0);
  const med = median(active.map((n) => n.normalizedValue));
  const mad = median(active.map((n) => Math.abs(n.normalizedValue - med)));
  const outlierCutoff = active.length >= CONFIG.fusion.minObservationsForOutlier
    ? Math.max(CONFIG.fusion.outlierMadMultiplier * mad, CONFIG.fusion.outlierFloor)
    : Infinity;

  let weightedSum = 0;
  let weightTotal = 0;
  const evidence = [];
  const contributions = [];

  for (const entry of normalized) {
    const { observation, manifest, freshness, baseWeight, weight, correlationFactor, normalizedValue } = entry;
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
        baseWeight,
        correlationFactor,
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
      baseWeight: Number(baseWeight.toFixed(4)),
      correlationFactor,
      correlationGroup: entry.correlationGroup,
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

  const includedClasses = new Set(normalized.filter((n) => n.included).map((n) => n.manifest.dataClass ?? 'unknown'));
  let dataClass = 'unknown';
  if (includedClasses.size === 1) [dataClass] = includedClasses;
  else if (includedClasses.size > 1) dataClass = 'mixed';

  // Confidence uses the SAME normalized space the score used.
  const confidence = computeEvidenceConfidence({
    contributions: normalized
      .filter((n) => n.included)
      .map((n) => ({
        normalizedValue: n.normalizedValue,
        weight: n.weight,
        provider: n.manifest.provider,
        freshness: n.freshness,
        kind: n.observation.kind,
      })),
  });

  let range = null;
  if (score !== null) {
    const spread = meanAbsoluteDeviation(
      normalized.filter((n) => n.included).map((n) => n.normalizedValue),
    );
    const halfWidth = Math.round(
      CONFIG.forecast.baseHalfWidth + (1 - confidence.value) * CONFIG.forecast.confidenceHalfWidth + spread * 0.5,
    );
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
    confidenceSemantics: confidence.semantics,
    dataClass,
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
