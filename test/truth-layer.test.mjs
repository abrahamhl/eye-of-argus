import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTruthSnapshot, countTests, REPO_ROOT } from '../src/argus/product/truthSnapshot.js';
import {
  XYZ_ENTRIES, XYZ_STATUS, publicEntries, verifiedEntries, renderEntry, validateXyzRegistry, resolveTokens,
} from '../src/argus/product/xyz.js';
import { scanForbidden } from '../src/argus/product/boundary.js';
import { LIVE_MANIFESTS } from '../src/argus/sources/adapters/index.js';

const snapshot = buildTruthSnapshot();

test('the snapshot test count is derived and non-zero', () => {
  assert.equal(snapshot.tests.total, countTests());
  assert.ok(snapshot.tests.total > 0);
  assert.equal(snapshot.tests.pass, snapshot.tests.total);
  assert.equal(snapshot.tests.fail, 0);
});

test('the snapshot reports zero runtime dependencies', () => {
  assert.equal(snapshot.runtimeDependencies, 0);
});

test('the snapshot reflects the adapter registry with distinct statuses', () => {
  assert.equal(snapshot.adapters.total, LIVE_MANIFESTS.length);
  assert.equal(snapshot.adapters.liveCapable, snapshot.adapters.total);
  for (const record of snapshot.adapters.records) {
    assert.equal(record.implementationStatus, 'IMPLEMENTED');
    assert.ok(['FIXTURE_VERIFIED', 'NO_FIXTURE'].includes(record.fixtureStatus));
    assert.ok(['LIVE_VERIFIED', 'LIVE_NOT_VERIFIED', 'NOT_LIVE_VERIFIED'].includes(record.liveStatus));
  }
});

test('calibration and Cesium are reported honestly', () => {
  assert.equal(snapshot.calibration.status, 'NOT_YET_CALIBRATED');
  assert.equal(snapshot.cesium.available, false);
});

test('the XYZ registry is valid with no missing evidence', () => {
  assert.deepEqual(validateXyzRegistry({ rootDir: REPO_ROOT, snapshot }), []);
});

test('every VERIFIED claim carries X, Y, Z and at least one evidence pointer', () => {
  const verified = verifiedEntries();
  assert.ok(verified.length > 0);
  for (const entry of verified) {
    assert.ok(entry.x && entry.y && entry.z, `${entry.id} missing X/Y/Z`);
    const pointers = [...(entry.evidence?.tests ?? []), ...(entry.evidence?.source ?? [])];
    assert.ok(pointers.length > 0, `${entry.id} has no evidence pointers`);
  }
});

test('rendered VERIFIED claims have no unresolved tokens and no stale counts', () => {
  for (const entry of verifiedEntries()) {
    const rendered = renderEntry(entry, snapshot);
    const text = `${rendered.x} ${rendered.y} ${rendered.z}`;
    assert.ok(!text.includes('{{'), `${entry.id} has an unresolved token`);
    assert.doesNotMatch(text, /\b65\/65\b|\b85\/85\b|\b43\/43\b/, `${entry.id} carries a stale test count`);
  }
});

test('no RETIRED entry is exported publicly', () => {
  for (const entry of publicEntries()) {
    assert.notEqual(entry.status, XYZ_STATUS.RETIRED);
  }
});

test('a BLOCKED feature is never marked VERIFIED', () => {
  const blocked = XYZ_ENTRIES.filter((e) => e.status === XYZ_STATUS.BLOCKED);
  assert.ok(blocked.length > 0, 'expected at least one BLOCKED entry (Cesium)');
  for (const entry of blocked) assert.notEqual(entry.status, XYZ_STATUS.VERIFIED);
});

test('the truth-layer claim about claims is itself VERIFIED with tests', () => {
  const entry = XYZ_ENTRIES.find((e) => e.id === 'xyz-truth-layer');
  assert.ok(entry, 'xyz-truth-layer missing');
  assert.equal(entry.status, XYZ_STATUS.VERIFIED);
  assert.ok((entry.evidence.tests ?? []).length > 0);
});

test('tokens resolve against the snapshot', () => {
  assert.equal(resolveTokens('{{runtimeDependencies}} deps', snapshot), `${snapshot.runtimeDependencies} deps`);
  assert.equal(resolveTokens('{{missing.key}}', snapshot), '{{missing.key}}');
});

test('no forbidden private filenames exist outside .private/', () => {
  assert.deepEqual(scanForbidden(REPO_ROOT), []);
});
