import { hashOf } from '../sources/observation.js';

/**
 * Evidence links an estimate back to the observations and sources that
 * produced it. Nothing on screen may assert a number without a chain that
 * resolves to a manifest.
 */
export function createEvidenceRecord({
  observation,
  manifestId,
  normalized,
  weight,
  freshness,
  included = true,
  reason = 'included',
  rawValue = null,
  domain = null,
  invert = false,
  outlierCutoff = null,
}) {
  const body = {
    observationId: observation.id,
    sourceId: observation.sourceId,
    manifestId,
    normalized,
    weight,
    freshness,
    included,
    reason,
    rawValue,
    domain,
    invert,
    outlierCutoff,
  };
  return Object.freeze({ ...body, id: `ev_${hashOf(body).slice(0, 16)}` });
}

export function createEstimate({
  signal,
  score,
  band,
  range,
  confidence,
  confidenceState = 'UNKNOWN',
  evidence,
  computedAtMs,
  methodologyVersion,
  runId,
  configurationHash,
  derivedFromEstimateIds = [],
}) {
  const evidenceIds = evidence.map((e) => e.id);
  const body = {
    signal,
    score,
    band,
    range,
    confidence,
    confidenceState,
    evidenceIds,
    derivedFromEstimateIds,
    methodologyVersion,
    runId,
    configurationHash,
  };
  return Object.freeze({
    ...body,
    computedAtMs,
    id: `est_${hashOf(body).slice(0, 16)}`,
  });
}

/**
 * Resolve an estimate back to source ids through its evidence records.
 * Returns the unique, ordered source ids.
 */
export function traceSources(estimate, evidenceRecords) {
  const byId = new Map(evidenceRecords.map((e) => [e.id, e]));
  const sources = [];
  for (const id of estimate.evidenceIds) {
    const record = byId.get(id);
    if (record && !sources.includes(record.sourceId)) sources.push(record.sourceId);
  }
  return sources;
}
