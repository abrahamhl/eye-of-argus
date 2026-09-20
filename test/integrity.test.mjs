import test from 'node:test';
import assert from 'node:assert/strict';
import { createObservation } from '../src/argus/sources/observation.js';
import { createEstimate } from '../src/argus/evidence/evidence.js';
import { createClock } from '../src/argus/time/clock.js';

const NOW = Date.parse('2026-09-20T18:00:00Z');

test('observation hashes cover nested meta, so different meta cannot collide', () => {
  const a = createObservation({ sourceId: 's', observedAtMs: NOW, value: 1, meta: { foo: 1 } });
  const b = createObservation({ sourceId: 's', observedAtMs: NOW, value: 1, meta: { foo: 2 } });
  assert.notEqual(a.id, b.id);
});

test('an estimate id changes when only the range changes', () => {
  const base = {
    signal: 'crowd',
    score: 50,
    band: 'HIGH',
    confidence: 0.6,
    confidenceState: 'SUPPORTED',
    evidence: [],
    computedAtMs: NOW,
    methodologyVersion: 'm0.1',
    runId: 'r',
    configurationHash: 'c',
  };
  const a = createEstimate({ ...base, range: { low: 1, high: 2 } });
  const b = createEstimate({ ...base, range: { low: 40, high: 60 } });
  assert.notEqual(a.id, b.id);
});

test('createClock rejects a timezone-less timestamp that would differ per machine', () => {
  assert.throws(() => createClock('2026-09-20T18:00:00'), /timezone/);
  assert.equal(createClock('2026-09-20T18:00:00Z').nowMs(), NOW);
});
