import test from 'node:test';
import assert from 'node:assert/strict';
import { forecast, DEFAULT_HORIZONS } from '../src/argus/forecast/temporal.js';

const priors = Array.from({ length: 24 }, (_, h) => h * 4);
const now = Date.parse('2026-09-20T12:00:00Z');

test('forecast returns the four required horizons with labels', () => {
  const result = forecast({ currentScore: 60, currentConfidence: 0.8, priorsByHour: priors, nowMs: now });
  assert.deepEqual(result.map((r) => r.horizonMinutes), [...DEFAULT_HORIZONS]);
  assert.deepEqual(result.map((r) => r.label), ['NOW', '+15m', '+30m', '+60m']);
});

test('uncertainty widens with the horizon', () => {
  const result = forecast({ currentScore: 60, currentConfidence: 0.8, priorsByHour: priors, nowMs: now });
  for (let i = 1; i < result.length; i += 1) {
    const prev = result[i - 1].range.high - result[i - 1].range.low;
    const next = result[i].range.high - result[i].range.low;
    assert.ok(next >= prev, 'range must not narrow as the horizon grows');
  }
});

test('confidence decays with the horizon', () => {
  const result = forecast({ currentScore: 60, currentConfidence: 0.9, priorsByHour: priors, nowMs: now });
  for (let i = 1; i < result.length; i += 1) {
    assert.ok(result[i].confidence <= result[i - 1].confidence);
  }
});

test('a missing current score falls back to the historical prior', () => {
  const result = forecast({ currentScore: null, currentConfidence: 0, priorsByHour: priors, nowMs: now });
  assert.ok(result.every((r) => r.score >= 0 && r.score <= 100));
  assert.equal(result[0].score, 48); // 12:00 -> prior[12] = 48
});

test('estimates stay within 0..100 even with extreme inputs', () => {
  const result = forecast({ currentScore: 100, currentConfidence: 0.1, priorsByHour: priors, nowMs: now });
  assert.ok(result.every((r) => r.score >= 0 && r.score <= 100));
  assert.ok(result.every((r) => r.range.low >= 0 && r.range.high <= 100));
});
