import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bandAccuracy,
  meanAbsoluteError,
  brierScore,
  calibrationCurve,
  evaluate,
} from '../src/argus/calibration/metrics.js';

test('empty input returns null, never a fabricated metric', () => {
  assert.equal(bandAccuracy([]), null);
  assert.equal(meanAbsoluteError([]), null);
  assert.equal(brierScore([]), null);
  assert.deepEqual(calibrationCurve([]), []);
});

test('band accuracy is the fraction of matching bands', () => {
  const pairs = [
    { predictedBand: 'HIGH', truthBand: 'HIGH' },
    { predictedBand: 'LOW', truthBand: 'HIGH' },
    { predictedBand: 'MODERATE', truthBand: 'MODERATE' },
    { predictedBand: 'LOW', truthBand: 'LOW' },
  ];
  assert.equal(bandAccuracy(pairs), 0.75);
});

test('mean absolute error ignores non-finite entries', () => {
  const pairs = [
    { predicted: 10, truth: 12 },
    { predicted: 20, truth: 18 },
    { predicted: NaN, truth: 5 },
  ];
  assert.equal(meanAbsoluteError(pairs), 2);
});

test('Brier score is zero for perfectly confident correct predictions', () => {
  const pairs = [
    { probability: 1, outcome: 1 },
    { probability: 1, outcome: 1 },
  ];
  assert.equal(brierScore(pairs), 0);
});

test('Brier score penalises confident wrong predictions', () => {
  const pairs = [{ probability: 0.9, outcome: 0 }];
  assert.equal(brierScore(pairs), 0.81);
});

test('calibration curve bins confidence and reports observed frequency', () => {
  const pairs = [
    { confidence: 0.1, outcome: 0 },
    { confidence: 0.1, outcome: 0 },
    { confidence: 0.9, outcome: 1 },
    { confidence: 0.9, outcome: 0 },
  ];
  const curve = calibrationCurve(pairs, 5);
  assert.equal(curve.length, 2);
  const low = curve[0];
  const high = curve[1];
  assert.equal(low.observedFrequency, 0);
  assert.equal(high.observedFrequency, 0.5);
  assert.ok(high.meanConfidence > low.meanConfidence);
});

test('evaluate composes the metrics with the observation count', () => {
  const fixture = [
    { predictedBand: 'HIGH', truthBand: 'HIGH', predictedScore: 80, truthValue: 78, probability: 0.8, confidence: 0.8, outcome: 1 },
  ];
  const result = evaluate(fixture);
  assert.equal(result.observations, 1);
  assert.equal(result.bandAccuracy, 1);
  assert.equal(result.meanAbsoluteError, 2);
  assert.ok(result.brierScore >= 0);
  assert.ok(Array.isArray(result.calibrationCurve));
});
