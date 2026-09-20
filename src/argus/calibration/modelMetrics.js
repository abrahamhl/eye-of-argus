import { BANDS } from './agreement.js';
import { wilsonInterval, midpoint, expectedCalibrationError, mean } from './stats.js';

const HIGH_BANDS = new Set(['HIGH', 'VERY HIGH']);
const LOW_BANDS = new Set(['LOW', 'MODERATE']);

export function confusionMatrix(pairs) {
  const matrix = {};
  for (const truth of BANDS) matrix[truth] = Object.fromEntries(BANDS.map((p) => [p, 0]));
  for (const pair of pairs) {
    if (matrix[pair.truthBand] && matrix[pair.truthBand][pair.predictedBand] !== undefined) {
      matrix[pair.truthBand][pair.predictedBand] += 1;
    }
  }
  return matrix;
}

/**
 * Model-vs-truth metrics. Every metric reports N so a number can never be read
 * without its denominator.
 */
export function evaluateModel(pairs) {
  const valid = (pairs ?? []).filter((p) => BANDS.includes(p.predictedBand) && BANDS.includes(p.truthBand));
  const n = valid.length;
  if (n === 0) return { n: 0, note: 'no matched predictions' };

  const correct = valid.filter((p) => p.predictedBand === p.truthBand).length;
  const falseHigh = valid.filter((p) => LOW_BANDS.has(p.truthBand) && HIGH_BANDS.has(p.predictedBand)).length;
  const truthLow = valid.filter((p) => LOW_BANDS.has(p.truthBand)).length;
  const falseLow = valid.filter((p) => HIGH_BANDS.has(p.truthBand) && LOW_BANDS.has(p.predictedBand)).length;
  const truthHigh = valid.filter((p) => HIGH_BANDS.has(p.truthBand)).length;

  const withCounts = valid.filter((p) => Number.isFinite(p.predictedScore) && Number.isFinite(midpoint(p.truthCountLow, p.truthCountHigh)));
  const mae = withCounts.length ? mean(withCounts.map((p) => Math.abs(p.predictedScore - midpoint(p.truthCountLow, p.truthCountHigh)))) : null;

  const brierPairs = valid
    .filter((p) => Number.isFinite(p.confidence))
    .map((p) => ({ confidence: p.confidence, outcome: p.predictedBand === p.truthBand ? 1 : 0 }));
  const brier = brierPairs.length ? mean(brierPairs.map((p) => (p.confidence - p.outcome) ** 2)) : null;
  const ece = expectedCalibrationError(brierPairs);

  return {
    n,
    correct,
    accuracy: Number((correct / n).toFixed(4)),
    accuracyInterval: wilsonInterval(correct, n),
    confusion: confusionMatrix(valid),
    falseHigh: { count: falseHigh, ofTruthLow: truthLow, rate: truthLow ? Number((falseHigh / truthLow).toFixed(4)) : null },
    falseLow: { count: falseLow, ofTruthHigh: truthHigh, rate: truthHigh ? Number((falseLow / truthHigh).toFixed(4)) : null },
    mae: mae === null ? null : Number(mae.toFixed(3)),
    maeN: withCounts.length,
    brier: brier === null ? null : Number(brier.toFixed(4)),
    brierN: brierPairs.length,
    ece,
  };
}
