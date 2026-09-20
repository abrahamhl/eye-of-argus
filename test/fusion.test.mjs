import test from 'node:test';
import assert from 'node:assert/strict';
import { fuse, normalizeValue } from '../src/argus/fusion/fuse.js';
import { mkManifest, mkObs, manifestsById, NOW } from './helpers.mjs';

test('normalizeValue maps a declared domain to 0..100', () => {
  assert.equal(normalizeValue(100, { min: 0, max: 200 }), 50);
  assert.equal(normalizeValue(0, { min: 0, max: 200 }), 0);
  assert.equal(normalizeValue(200, { min: 0, max: 200 }), 100);
  assert.equal(normalizeValue(80, undefined), 80);
  assert.equal(normalizeValue(80, undefined, true), 20);
  assert.equal(normalizeValue(80, { min: 0, max: 100 }, true), 20);
});

test('weighted mean of two equal sources is the midpoint', () => {
  const manifests = [mkManifest({ id: 'a', provider: 'A' }), mkManifest({ id: 'b', provider: 'B' })];
  const result = fuse({
    signal: 'crowd',
    observations: [mkObs({ sourceId: 'a', value: 40 }), mkObs({ sourceId: 'b', value: 60 })],
    manifestsById: manifestsById(...manifests),
    nowMs: NOW,
  });
  assert.equal(result.estimate.score, 50);
});

test('an outlier is demoted but kept in the audit trail', () => {
  const manifests = [
    mkManifest({ id: 'a', provider: 'A' }),
    mkManifest({ id: 'b', provider: 'B' }),
    mkManifest({ id: 'c', provider: 'C' }),
  ];
  const result = fuse({
    signal: 'crowd',
    observations: [
      mkObs({ sourceId: 'a', value: 40 }),
      mkObs({ sourceId: 'b', value: 42 }),
      mkObs({ sourceId: 'c', value: 90 }),
    ],
    manifestsById: manifestsById(...manifests),
    nowMs: NOW,
  });
  const demoted = result.evidence.filter((e) => e.reason === 'outlier-demoted');
  assert.equal(demoted.length, 1);
  assert.equal(demoted[0].included, false);
  assert.ok(result.estimate.score < 50, 'outlier must not drag the score up');
});

test('outlier rejection still works when the majority agree exactly (zero MAD)', () => {
  const manifests = [
    mkManifest({ id: 'a', provider: 'A' }),
    mkManifest({ id: 'b', provider: 'B' }),
    mkManifest({ id: 'c', provider: 'C' }),
    mkManifest({ id: 'd', provider: 'D' }),
  ];
  const result = fuse({
    signal: 'crowd',
    observations: [
      mkObs({ sourceId: 'a', value: 50 }),
      mkObs({ sourceId: 'b', value: 50 }),
      mkObs({ sourceId: 'c', value: 50 }),
      mkObs({ sourceId: 'd', value: 99 }),
    ],
    manifestsById: manifestsById(...manifests),
    nowMs: NOW,
  });
  assert.equal(result.estimate.score, 50);
  assert.equal(result.evidence.filter((e) => e.reason === 'outlier-demoted').length, 1);
});

test('an invert flag without a domain is honoured (noise must lower calm)', () => {
  const manifests = [mkManifest({ id: 'noise', provider: 'Noise' })];
  const result = fuse({
    signal: 'calm-environment',
    observations: [mkObs({ sourceId: 'noise', value: 80 })],
    manifestsById: manifestsById(...manifests),
    nowMs: NOW,
    invert: { noise: true },
  });
  assert.equal(result.estimate.score, 20);
});

test('all-unavailable evidence yields an UNAVAILABLE estimate, not a fake number', () => {
  const manifests = [mkManifest({ id: 'a', provider: 'A' })];
  const result = fuse({
    signal: 'crowd',
    observations: [mkObs({ sourceId: 'a', value: 70, minutesAgo: -10 })],
    manifestsById: manifestsById(...manifests),
    nowMs: NOW,
  });
  assert.equal(result.estimate.score, null);
  assert.equal(result.estimate.band, 'UNAVAILABLE');
  assert.equal(result.estimate.confidence, 0);
});

test('fusion is deterministic across repeated runs', () => {
  const manifests = [mkManifest({ id: 'a', provider: 'A' }), mkManifest({ id: 'b', provider: 'B' })];
  const input = {
    signal: 'crowd',
    observations: [mkObs({ sourceId: 'a', value: 40 }), mkObs({ sourceId: 'b', value: 60 })],
    manifestsById: manifestsById(...manifests),
    nowMs: NOW,
  };
  assert.equal(JSON.stringify(fuse(input)), JSON.stringify(fuse(input)));
});
