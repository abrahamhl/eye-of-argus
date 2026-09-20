import test from 'node:test';
import assert from 'node:assert/strict';
import { createManifest } from '../src/argus/sources/manifest.js';
import { createRegistry, filterByProfile, isAllowed, PROFILE } from '../src/argus/sources/registry.js';
import { mkManifest, mkObs } from './helpers.mjs';

test('a manifest missing a required field is rejected', () => {
  assert.throws(() => createManifest({ id: 'x' }), /missing field/);
});

test('commercialUse must be a boolean', () => {
  assert.throws(() => mkManifest({ commercialUse: 'yes' }), /commercialUse/);
});

test('confidencePrior must be within [0,1]', () => {
  assert.throws(() => mkManifest({ confidencePrior: 1.5 }), /confidencePrior/);
});

test('duplicate source ids are rejected', () => {
  assert.throws(() => createRegistry([mkManifest(), mkManifest()]), /duplicate source id/);
});

test('COMMERCIAL_SAFE excludes noncommercial sources', () => {
  const nc = mkManifest({ id: 'nc', commercialUse: false });
  assert.equal(isAllowed(nc, PROFILE.COMMERCIAL_SAFE), false);
  assert.equal(isAllowed(nc, PROFILE.PERSONAL), true);
});

test('COMMERCIAL_SAFE excludes sources that forbid redistribution', () => {
  const noRedist = mkManifest({ id: 'nr', redistribution: 'prohibited' });
  assert.equal(isAllowed(noRedist, PROFILE.COMMERCIAL_SAFE), false);
});

test('OPEN_SOURCE excludes a non-commercial licence even if redistribution is allowed', () => {
  const nc = mkManifest({ id: 'nc2', license: 'CC-BY-NC-4.0', commercialUse: false, redistribution: 'allowed' });
  assert.equal(isAllowed(nc, PROFILE.OPEN_SOURCE), false);
});

test('a non-commercial licence string blocks COMMERCIAL_SAFE even if commercialUse is true', () => {
  const sneaky = mkManifest({ id: 'sneaky', license: 'CC-BY-NC-4.0', commercialUse: true, redistribution: 'allowed' });
  assert.equal(isAllowed(sneaky, PROFILE.COMMERCIAL_SAFE), false);
});

test('licence matching is case-insensitive', () => {
  assert.equal(isAllowed(mkManifest({ id: 'lower', license: 'mit' }), PROFILE.OPEN_SOURCE), true);
});

test('filterByProfile keeps allowed observations and reports exclusions', () => {
  const registry = createRegistry([
    mkManifest({ id: 'ok' }),
    mkManifest({ id: 'nc', commercialUse: false }),
  ]);
  const observations = [mkObs({ sourceId: 'ok' }), mkObs({ sourceId: 'nc' })];
  const { kept, excluded } = filterByProfile(observations, registry, PROFILE.COMMERCIAL_SAFE);
  assert.deepEqual(kept.map((o) => o.sourceId), ['ok']);
  assert.deepEqual(excluded, ['nc']);
});
