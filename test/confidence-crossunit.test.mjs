import test from 'node:test';
import assert from 'node:assert/strict';
import { fuse } from '../src/argus/fusion/fuse.js';
import { CONFIDENCE_STATE } from '../src/argus/confidence/confidence.js';
import { mkManifest, mkObs, manifestsById, NOW } from './helpers.mjs';

/**
 * Regression for the raw-unit confidence defect. Sources with different units
 * must be compared in normalized space, not on their raw magnitudes.
 */

function unitSource(id, provider) {
  return mkManifest({ id, provider, confidencePrior: 0.7 });
}

test('different raw units that normalize to compatible values read as agreement', () => {
  const manifests = [unitSource('a', 'Traffic'), unitSource('b', 'Parking'), unitSource('c', 'Transit')];
  const result = fuse({
    signal: 'crowd',
    observations: [
      mkObs({ sourceId: 'a', value: 1500 }), // vehicles/hour
      mkObs({ sourceId: 'b', value: 78 }),   // percent
      mkObs({ sourceId: 'c', value: 25 }),   // arrivals
    ],
    manifestsById: manifestsById(...manifests),
    nowMs: NOW,
    domains: { a: { min: 0, max: 2000 }, b: { min: 0, max: 100 }, c: { min: 0, max: 40 } },
  });
  assert.notEqual(result.confidence.state, CONFIDENCE_STATE.CONTRADICTED);
  assert.ok(result.confidence.value > 0.5, `expected agreement, got confidence ${result.confidence.value}`);
  // Normalized values: 75, 78, 62.5 — not the raw 1500/78/25.
  assert.deepEqual(result.contributions.map((x) => x.normalized).sort((x, y) => x - y), [62.5, 75, 78]);
});

test('different raw units that normalize far apart are flagged as contradiction', () => {
  const manifests = [unitSource('a', 'Traffic'), unitSource('b', 'Parking'), unitSource('c', 'Transit')];
  const result = fuse({
    signal: 'crowd',
    observations: [
      mkObs({ sourceId: 'a', value: 300 }), // -> 15
      mkObs({ sourceId: 'b', value: 82 }),  // -> 82
      mkObs({ sourceId: 'c', value: 18 }),  // -> 45
    ],
    manifestsById: manifestsById(...manifests),
    nowMs: NOW,
    domains: { a: { min: 0, max: 2000 }, b: { min: 0, max: 100 }, c: { min: 0, max: 40 } },
  });
  assert.equal(result.confidence.state, CONFIDENCE_STATE.CONTRADICTED);
});

test('correlated sources are damped so related pressure is not double counted', () => {
  const manifests = [
    unitSource('ndw-traffic', 'NDW'),
    unitSource('parking-arnhem', 'Arnhem parking'),
    unitSource('ovapi-transit', 'OVapi'),
  ];
  const observations = [
    mkObs({ sourceId: 'ndw-traffic', value: 80 }),
    mkObs({ sourceId: 'parking-arnhem', value: 80 }),
    mkObs({ sourceId: 'ovapi-transit', value: 80 }),
  ];
  const result = fuse({ signal: 'crowd', observations, manifestsById: manifestsById(...manifests), nowMs: NOW });
  const group = result.contributions.filter((c) => c.correlationGroup === 'mobility-pressure');
  assert.equal(group.length, 3);
  const leaders = group.filter((c) => c.correlationFactor === 1);
  assert.equal(leaders.length, 1, 'exactly one member of a correlation group keeps full weight');
  assert.equal(group.filter((c) => c.correlationFactor === 0.5).length, 2);
});
