import test from 'node:test';
import assert from 'node:assert/strict';

import { wilsonInterval, midpoint, expectedCalibrationError, mean } from '../src/argus/calibration/stats.js';
import { fleissKappa, percentAgreement, modalBand, kappaLabel } from '../src/argus/calibration/agreement.js';
import { evaluateModel } from '../src/argus/calibration/modelMetrics.js';
import { validateRun, consensusTruth, matchPredictions } from '../src/argus/calibration/validate.js';
import { parseJsonl, toJsonl } from '../src/argus/calibration/jsonl.js';
import { mergeRecords } from '../src/argus/calibration/merge.js';

test('Wilson interval returns a proportion and bounded interval', () => {
  const interval = wilsonInterval(5, 10);
  assert.equal(interval.p, 0.5);
  assert.ok(interval.low > 0 && interval.low < 0.5);
  assert.ok(interval.high > 0.5 && interval.high < 1);
  assert.deepEqual(wilsonInterval(0, 0), { low: null, high: null, p: null });
});

test('midpoint averages a count range', () => {
  assert.equal(midpoint(30, 50), 40);
  assert.equal(midpoint(null, 10), 10);
  assert.equal(midpoint(null, null), null);
});

test('expected calibration error is zero for perfectly calibrated bins', () => {
  assert.equal(expectedCalibrationError([{ confidence: 1, outcome: 1 }, { confidence: 1, outcome: 1 }]), 0);
  assert.equal(expectedCalibrationError([{ confidence: 0.8, outcome: 0 }]), 0.8);
  assert.equal(expectedCalibrationError([]), null);
});

test('Fleiss kappa is 1 when all raters agree', () => {
  const result = fleissKappa([['LOW', 'LOW'], ['HIGH', 'HIGH']]);
  assert.equal(result.kappa, 1);
  assert.equal(kappaLabel(result.kappa), 'ALMOST PERFECT');
  assert.equal(percentAgreement([['LOW', 'LOW'], ['HIGH', 'HIGH']]), 1);
});

test('Fleiss kappa detects disagreement and is deterministic', () => {
  const result = fleissKappa([['LOW', 'LOW'], ['LOW', 'HIGH']]);
  assert.equal(result.kappa, -0.3333);
  assert.equal(kappaLabel(result.kappa), 'POOR');
  assert.equal(percentAgreement([['LOW', 'LOW'], ['LOW', 'HIGH']]), 0.5);
});

test('modalBand resolves ties deterministically', () => {
  assert.equal(modalBand(['LOW', 'HIGH', 'LOW']), 'LOW');
  assert.equal(modalBand([]), null);
});

test('evaluateModel reports accuracy, confusion, false rates, MAE and Brier', () => {
  const pairs = [
    { predictedBand: 'HIGH', truthBand: 'HIGH', predictedScore: 70, confidence: 0.8, truthCountLow: 30, truthCountHigh: 50 },
    { predictedBand: 'HIGH', truthBand: 'LOW', predictedScore: 80, confidence: 0.9, truthCountLow: 0, truthCountHigh: 5 },
    { predictedBand: 'LOW', truthBand: 'HIGH', predictedScore: 20, confidence: 0.4, truthCountLow: 60, truthCountHigh: 80 },
  ];
  const result = evaluateModel(pairs);
  assert.equal(result.n, 3);
  assert.equal(result.correct, 1);
  assert.equal(result.accuracy, 0.3333);
  assert.equal(result.confusion.HIGH.HIGH, 1);
  assert.equal(result.confusion.LOW.HIGH, 1);
  assert.equal(result.falseHigh.rate, 1);
  assert.equal(result.falseLow.rate, 0.5);
  assert.equal(result.mae, 52.5);
  assert.ok(result.brier > 0 && result.brier < 1);
  assert.ok(result.ece >= 0 && result.ece <= 1);
});

test('evaluateModel with no matched predictions does not fabricate metrics', () => {
  const result = evaluateModel([]);
  assert.equal(result.n, 0);
  assert.ok(result.note);
});

test('consensusTruth groups by window and collapses observers to a modal band', () => {
  const truth = [
    { placeId: 'p1', windowStart: '2026-10-05T12:00:00Z', band: 'HIGH', countLow: 30, countHigh: 60, observer: 'AB' },
    { placeId: 'p1', windowStart: '2026-10-05T12:00:00Z', band: 'HIGH', countLow: 35, countHigh: 65, observer: 'CD' },
    { placeId: 'p2', windowStart: '2026-10-05T13:00:00Z', band: 'LOW', countLow: 0, countHigh: 5, observer: 'AB' },
  ];
  const { consensus } = consensusTruth(truth, 5);
  assert.equal(consensus.length, 2);
  const p1 = consensus.find((c) => c.placeId === 'p1');
  assert.equal(p1.band, 'HIGH');
  assert.equal(p1.countLow, 30);
  assert.equal(p1.countHigh, 65);
  assert.deepEqual(p1.observers.sort(), ['AB', 'CD']);
});

test('validateRun reports reliability and matched model metrics', () => {
  const truth = [
    { placeId: 'p1', windowStart: '2026-10-05T12:00:00Z', band: 'HIGH', countLow: 30, countHigh: 60, observer: 'AB' },
    { placeId: 'p1', windowStart: '2026-10-05T12:00:00Z', band: 'HIGH', countLow: 35, countHigh: 65, observer: 'CD' },
    { placeId: 'p2', windowStart: '2026-10-05T13:00:00Z', band: 'LOW', countLow: 0, countHigh: 5, observer: 'AB' },
  ];
  const predictions = [
    { placeId: 'p1', windowStart: '2026-10-05T12:00:00Z', band: 'HIGH', score: 70, confidence: 0.8 },
    { placeId: 'p2', windowStart: '2026-10-05T13:00:00Z', band: 'HIGH', score: 75, confidence: 0.9 },
  ];
  const report = validateRun({ truth, predictions, toleranceMinutes: 5 });
  assert.equal(report.status, 'MEASURED');
  assert.equal(report.matchedPairs, 2);
  assert.equal(report.model.accuracy, 0.5);
  assert.equal(report.agreement.percentAgreement, 1);
  // Fleiss kappa is undefined (null) when every rating is the same category.
  assert.ok(report.agreement.fleiss);
});

test('validateRun without predictions reports reliability only', () => {
  const truth = [{ placeId: 'p1', windowStart: '2026-10-05T12:00:00Z', band: 'LOW', observer: 'AB' }];
  const report = validateRun({ truth, predictions: [] });
  assert.equal(report.model, null);
  assert.equal(report.status, 'NOT_YET_CALIBRATED');
});

test('tolerance lets a slightly different prediction window match the truth', () => {
  const truth = [{ placeId: 'p1', windowStart: '2026-10-05T12:00:00Z', band: 'HIGH', observer: 'AB' }];
  const predictions = [{ placeId: 'p1', windowStart: '2026-10-05T12:02:00Z', band: 'HIGH', score: 70, confidence: 0.8 }];
  const { consensus } = consensusTruth(truth, 5);
  const { pairs } = matchPredictions(consensus, predictions, 5);
  assert.equal(pairs.length, 1);
});

test('JSONL parsing tolerates BOM, blank lines and comments and rejects bad lines', () => {
  const text = '\uFEFF# comment\n\n{"a":1}\n{"b":2}\n';
  assert.deepEqual(parseJsonl(text), [{ a: 1 }, { b: 2 }]);
  assert.throws(() => parseJsonl('{oops}'), /invalid JSONL/);
  assert.equal(toJsonl([{ a: 1 }]), '{"a":1}\n');
});

test('mergeRecords deduplicates and sorts by window start', () => {
  const a = [
    { placeId: 'p1', windowStart: '2026-10-05T13:00:00Z', observer: 'AB' },
    { placeId: 'p1', windowStart: '2026-10-05T12:00:00Z', observer: 'AB' },
  ];
  const b = [
    { placeId: 'p1', windowStart: '2026-10-05T13:00:00Z', observer: 'AB' },
    { placeId: 'p2', windowStart: '2026-10-05T12:00:00Z', observer: 'CD' },
  ];
  const { merged, total, duplicates } = mergeRecords([a, b]);
  assert.equal(total, 4);
  assert.equal(duplicates, 1);
  assert.equal(merged.length, 3);
  assert.equal(merged[0].windowStart, '2026-10-05T12:00:00Z');
});
