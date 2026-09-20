import test from 'node:test';
import assert from 'node:assert/strict';
import { computeEvidenceConfidence, bandFor, CONFIDENCE_STATE, CONFIDENCE_SEMANTICS } from '../src/argus/confidence/confidence.js';

function c(normalizedValue, { weight = 0.8, provider = 'A', freshness = 'LIVE', kind = 'observed' } = {}) {
  return { normalizedValue, weight, provider, freshness, kind };
}

test('no contributions yields UNKNOWN with zero evidence confidence', () => {
  const result = computeEvidenceConfidence({ contributions: [] });
  assert.equal(result.value, 0);
  assert.equal(result.state, CONFIDENCE_STATE.UNKNOWN);
  assert.equal(result.semantics, CONFIDENCE_SEMANTICS);
});

test('the returned number is labelled evidence-quality, never a probability', () => {
  const result = computeEvidenceConfidence({ contributions: [c(50)] });
  assert.equal(result.semantics, 'evidence-quality');
});

test('all-inferred evidence is capped below VERIFIED and labelled INFERRED', () => {
  const result = computeEvidenceConfidence({
    contributions: [c(50, { provider: 'A', kind: 'inferred' }), c(50, { provider: 'B', kind: 'inferred' }), c(50, { provider: 'C', kind: 'inferred' })],
  });
  assert.ok(result.value <= 0.5);
  assert.equal(result.state, CONFIDENCE_STATE.INFERRED);
});

test('contradictory normalized evidence is flagged CONTRADICTED', () => {
  const result = computeEvidenceConfidence({
    contributions: [c(15, { provider: 'A' }), c(82, { provider: 'B' }), c(45, { provider: 'C' })],
  });
  assert.equal(result.state, CONFIDENCE_STATE.CONTRADICTED);
});

test('agreeing live normalized evidence from several providers can reach VERIFIED', () => {
  const result = computeEvidenceConfidence({
    contributions: [c(50, { provider: 'A', weight: 0.9 }), c(50, { provider: 'B', weight: 0.9 }), c(50, { provider: 'C', weight: 0.9 })],
  });
  assert.equal(result.state, CONFIDENCE_STATE.VERIFIED);
  assert.ok(result.value >= 0.8);
});

test('small normalized disagreement is not CONTRADICTED', () => {
  const result = computeEvidenceConfidence({ contributions: [c(0, { provider: 'A' }), c(2, { provider: 'B' })] });
  assert.notEqual(result.state, CONFIDENCE_STATE.CONTRADICTED);
});

test('identical zero normalized readings are agreement, not contradiction', () => {
  const result = computeEvidenceConfidence({ contributions: [c(0, { provider: 'A' }), c(0, { provider: 'B' })] });
  assert.equal(result.dispersion, 0);
  assert.notEqual(result.state, CONFIDENCE_STATE.CONTRADICTED);
});

test('the same normalized spread yields the same confidence regardless of scale', () => {
  const low = computeEvidenceConfidence({ contributions: [c(10, { provider: 'A' }), c(12, { provider: 'B' })] });
  const high = computeEvidenceConfidence({ contributions: [c(90, { provider: 'A' }), c(92, { provider: 'B' })] });
  assert.equal(low.dispersion, high.dispersion);
  assert.equal(low.value, high.value);
});

test('bandFor boundaries are correct', () => {
  assert.equal(bandFor(0), 'LOW');
  assert.equal(bandFor(24.9), 'LOW');
  assert.equal(bandFor(25), 'MODERATE');
  assert.equal(bandFor(50), 'HIGH');
  assert.equal(bandFor(75), 'VERY HIGH');
  assert.equal(bandFor(1000), 'VERY HIGH');
});
