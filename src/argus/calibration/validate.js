import { BANDS, fleissKappa, percentAgreement, modalBand, kappaLabel } from './agreement.js';
import { evaluateModel } from './modelMetrics.js';

/**
 * Validation orchestrator.
 *
 * Two independent questions:
 *  1. Do observers agree? (rubric reliability — needs only ground truth)
 *  2. Does the model match the ground truth? (needs predictions too)
 *
 * This never invents predictions. If no predictions are supplied it reports
 * reliability only.
 */

export function windowKey(record, toleranceMinutes = 0) {
  const ms = Date.parse(record.windowStart);
  if (!Number.isFinite(ms)) return `${record.placeId}|unknown`;
  const bucketMs = toleranceMinutes > 0 ? toleranceMinutes * 60_000 : 60_000;
  return `${record.placeId}|${Math.round(ms / bucketMs)}`;
}

export function consensusTruth(truthRecords, toleranceMinutes = 5) {
  const groups = new Map();
  for (const record of truthRecords) {
    const key = windowKey(record, toleranceMinutes);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  const items = [];
  const consensus = [];
  for (const [key, records] of groups) {
    const bands = records.map((r) => r.band).filter((b) => BANDS.includes(b));
    if (bands.length) items.push(bands);
    const lows = records.map((r) => r.countLow).filter(Number.isFinite);
    const highs = records.map((r) => r.countHigh).filter(Number.isFinite);
    consensus.push({
      key,
      placeId: records[0].placeId,
      windowStart: records[0].windowStart,
      band: modalBand(bands) ?? records[0].band ?? null,
      countLow: lows.length ? Math.min(...lows) : null,
      countHigh: highs.length ? Math.max(...highs) : null,
      observers: records.map((r) => r.observer).filter(Boolean),
      ratings: bands.length,
    });
  }
  return { items, consensus };
}

export function matchPredictions(consensus, predictions, toleranceMinutes = 5) {
  const index = new Map(consensus.map((c) => [c.key, c]));
  const pairs = [];
  const unmatched = [];
  for (const prediction of predictions) {
    const truth = index.get(windowKey(prediction, toleranceMinutes));
    if (!truth) { unmatched.push(prediction); continue; }
    pairs.push({
      key: truth.key,
      placeId: truth.placeId,
      windowStart: truth.windowStart,
      predictedBand: prediction.band,
      truthBand: truth.band,
      predictedScore: prediction.score,
      confidence: prediction.confidence,
      truthCountLow: truth.countLow,
      truthCountHigh: truth.countHigh,
    });
  }
  return { pairs, unmatched };
}

export function validateRun({ truth, predictions = [], toleranceMinutes = 5 }) {
  const { items, consensus } = consensusTruth(truth, toleranceMinutes);
  const agreement = {
    windows: items.length,
    percentAgreement: percentAgreement(items),
    fleiss: fleissKappa(items),
  };
  if (agreement.fleiss) agreement.fleiss.label = kappaLabel(agreement.fleiss.kappa);

  const { pairs, unmatched } = matchPredictions(consensus, predictions, toleranceMinutes);
  const model = predictions.length ? evaluateModel(pairs) : null;

  return {
    truth: { records: truth.length, windows: consensus.length, observers: [...new Set(truth.map((r) => r.observer).filter(Boolean))] },
    agreement,
    model,
    matchedPairs: pairs.length,
    unmatchedPredictions: unmatched.length,
    status: model && model.n > 0 ? 'MEASURED' : 'NOT_YET_CALIBRATED',
  };
}
