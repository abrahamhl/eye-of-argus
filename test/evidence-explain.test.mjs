import test from 'node:test';
import assert from 'node:assert/strict';
import { explainEstimate } from '../src/argus/evidence/explain.js';
import { createArnhemFixture } from '../src/argus/regional/arnhem/fixtures.js';
import { crowdIndex } from '../src/argus/crowd/crowdIndex.js';
import { filterByProfile, PROFILE } from '../src/argus/sources/registry.js';

const NOW = Date.parse('2026-09-20T18:00:00Z');

test('explainEstimate produces a readable why-chain without magic numbers', () => {
  const fixture = createArnhemFixture(NOW);
  const place = fixture.places[0];
  const crowd = crowdIndex({
    observations: filterByProfile(place.crowd, fixture.registry, PROFILE.COMMERCIAL_SAFE).kept,
    manifestsById: fixture.manifestsById,
    nowMs: NOW,
  });
  const explain = explainEstimate({ estimate: crowd.estimate, contributions: crowd.contributions, place: place.name });

  assert.equal(explain.signal, 'crowd');
  assert.ok(explain.steps.length > 0);
  for (const step of explain.steps) {
    assert.equal(typeof step.rawValue, 'number');
    assert.equal(typeof step.normalized, 'number');
    assert.equal(typeof step.baseWeight, 'number');
    assert.equal(typeof step.correlationFactor, 'number');
    assert.equal(typeof step.effectiveWeight, 'number');
    assert.equal(typeof step.license, 'string');
  }
  assert.match(explain.explanation, /crowd = /);
  assert.match(explain.explanation, /evidence confidence/);
  assert.match(explain.explanation, /data class SYNTHETIC/);
});

test('correlated sources are labelled as damped in the inspector', () => {
  const fixture = createArnhemFixture(NOW);
  const place = fixture.places[0];
  const crowd = crowdIndex({
    observations: filterByProfile(place.crowd, fixture.registry, PROFILE.COMMERCIAL_SAFE).kept,
    manifestsById: fixture.manifestsById,
    nowMs: NOW,
  });
  const explain = explainEstimate({ estimate: crowd.estimate, contributions: crowd.contributions });
  const mobility = explain.steps.filter((s) => s.correlationGroup === 'mobility-pressure');
  assert.ok(mobility.length >= 2);
  assert.ok(mobility.some((s) => s.correlationFactor < 1 && /damped/.test(s.note)));
  assert.equal(mobility.filter((s) => s.correlationFactor === 1).length, 1);
});
