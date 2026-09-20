import test from 'node:test';
import assert from 'node:assert/strict';
import { computeConfidence, bandFor, CONFIDENCE_STATE } from '../src/argus/confidence/confidence.js';
import { mkManifest, mkObs, manifestsById, NOW } from './helpers.mjs';

test('no observations yields UNKNOWN with zero confidence', () => {
  const result = computeConfidence({ observations: [], manifestsById: {}, nowMs: NOW });
  assert.equal(result.value, 0);
  assert.equal(result.state, CONFIDENCE_STATE.UNKNOWN);
});

test('all-inferred evidence is capped below VERIFIED and labelled INFERRED', () => {
  const manifests = [
    mkManifest({ id: 'a', provider: 'A', confidencePrior: 0.95 }),
    mkManifest({ id: 'b', provider: 'B', confidencePrior: 0.95 }),
    mkManifest({ id: 'c', provider: 'C', confidencePrior: 0.95 }),
  ];
  const observations = [
    mkObs({ sourceId: 'a', value: 50, kind: 'inferred' }),
    mkObs({ sourceId: 'b', value: 50, kind: 'inferred' }),
    mkObs({ sourceId: 'c', value: 50, kind: 'inferred' }),
  ];
  const result = computeConfidence({ observations, manifestsById: manifestsById(...manifests), nowMs: NOW });
  assert.ok(result.value <= 0.5, `expected cap, got ${result.value}`);
  assert.equal(result.state, CONFIDENCE_STATE.INFERRED);
});

test('contradictory live evidence is flagged CONTRADICTED', () => {
  const manifests = [
    mkManifest({ id: 'a', provider: 'A' }),
    mkManifest({ id: 'b', provider: 'B' }),
    mkManifest({ id: 'c', provider: 'C' }),
  ];
  const observations = [
    mkObs({ sourceId: 'a', value: 0 }),
    mkObs({ sourceId: 'b', value: 100 }),
    mkObs({ sourceId: 'c', value: 50 }),
  ];
  const result = computeConfidence({ observations, manifestsById: manifestsById(...manifests), nowMs: NOW });
  assert.equal(result.state, CONFIDENCE_STATE.CONTRADICTED);
});

test('agreeing live sources from several providers can reach VERIFIED', () => {
  const manifests = [
    mkManifest({ id: 'a', provider: 'A', confidencePrior: 0.9 }),
    mkManifest({ id: 'b', provider: 'B', confidencePrior: 0.9 }),
    mkManifest({ id: 'c', provider: 'C', confidencePrior: 0.9 }),
  ];
  const observations = [
    mkObs({ sourceId: 'a', value: 50 }),
    mkObs({ sourceId: 'b', value: 50 }),
    mkObs({ sourceId: 'c', value: 50 }),
  ];
  const result = computeConfidence({ observations, manifestsById: manifestsById(...manifests), nowMs: NOW });
  assert.equal(result.state, CONFIDENCE_STATE.VERIFIED);
  assert.ok(result.value >= 0.8);
});

test('bandFor boundaries are correct', () => {
  assert.equal(bandFor(0), 'LOW');
  assert.equal(bandFor(24.9), 'LOW');
  assert.equal(bandFor(25), 'MODERATE');
  assert.equal(bandFor(50), 'HIGH');
  assert.equal(bandFor(75), 'VERY HIGH');
  assert.equal(bandFor(1000), 'VERY HIGH');
});
