import { fuse } from '../fusion/fuse.js';
import { createEstimate, createEvidenceRecord } from '../evidence/evidence.js';
import { bandFor, CONFIDENCE_STATE } from '../confidence/confidence.js';

/**
 * Calm Index: estimated environmental/social calm, 0..100.
 *
 * Calm is not the inverse of crowd. A busy park can be calm while a cramped
 * restaurant beside heavy traffic is not. Calm blends:
 *   - inverted crowd pressure (55%)
 *   - environmental evidence (greenery positive, noise negative) (45%)
 *
 * The crowd component is recorded as an explicit derived EvidenceRecord, so the
 * final number is traceable from its own evidence list, not only through a
 * pointer to another estimate. When environmental evidence is missing, calm
 * falls back to crowd pressure but its confidence is capped.
 */
export function calmIndex({
  crowdEstimate,
  calmObservations,
  manifestsById,
  nowMs,
  domains = {},
  invert = {},
  methodologyVersion = 'm0.1',
  runId = 'run-local',
  configurationHash = 'cfg-local',
}) {
  const environmental = calmObservations && calmObservations.length
    ? fuse({
        signal: 'calm-environment',
        observations: calmObservations,
        manifestsById,
        nowMs,
        domains,
        invert,
        methodologyVersion,
        runId,
        configurationHash,
      })
    : null;

  const crowdPressure = crowdEstimate.score === null ? null : 100 - crowdEstimate.score;
  const envScore = environmental && environmental.estimate.score !== null ? environmental.estimate.score : null;

  let score = null;
  if (crowdPressure !== null && envScore !== null) score = 0.55 * crowdPressure + 0.45 * envScore;
  else if (crowdPressure !== null) score = crowdPressure;
  else if (envScore !== null) score = envScore;

  const crowdConfidence = crowdEstimate.confidence ?? 0;
  let confidence;
  if (crowdPressure !== null && envScore !== null) {
    confidence = Math.min(1, 0.5 * crowdConfidence + 0.5 * (environmental?.confidence.value ?? 0));
  } else if (crowdPressure !== null) {
    confidence = Math.min(0.6, crowdConfidence);
  } else {
    confidence = environmental?.confidence.value ?? 0;
  }

  const evidence = [];
  if (crowdPressure !== null) {
    evidence.push(
      createEvidenceRecord({
        observation: { id: crowdEstimate.id, sourceId: 'derived:crowd-pressure' },
        manifestId: 'derived:crowd-pressure',
        normalized: crowdPressure,
        weight: 0.55,
        freshness: 'STATIC',
        included: true,
        reason: 'derived-from-crowd-estimate',
      }),
    );
  }
  if (environmental) evidence.push(...environmental.evidence);

  const states = [crowdEstimate.confidenceState, environmental?.estimate.confidenceState].filter(Boolean);
  let confidenceState;
  if (states.includes(CONFIDENCE_STATE.CONTRADICTED)) confidenceState = CONFIDENCE_STATE.CONTRADICTED;
  else if (confidence >= 0.8 && envScore !== null && crowdPressure !== null) confidenceState = CONFIDENCE_STATE.VERIFIED;
  else if (confidence >= 0.5) confidenceState = CONFIDENCE_STATE.SUPPORTED;
  else confidenceState = CONFIDENCE_STATE.INFERRED;

  const range = score === null
    ? null
    : {
        low: Math.max(0, Math.round(score - (4 + (1 - confidence) * 24))),
        high: Math.min(100, Math.round(score + (4 + (1 - confidence) * 24))),
      };

  const estimate = createEstimate({
    signal: 'calm',
    score: score === null ? null : Number(score.toFixed(2)),
    band: score === null ? 'UNAVAILABLE' : bandFor(score),
    range,
    confidence,
    confidenceState,
    evidence,
    computedAtMs: nowMs,
    methodologyVersion,
    runId,
    configurationHash,
    derivedFromEstimateIds: [crowdEstimate.id, ...(environmental ? [environmental.estimate.id] : [])],
  });

  return {
    estimate,
    environmental,
    confidence,
    contributions: environmental?.contributions ?? [],
    evidence,
  };
}
