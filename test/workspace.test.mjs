import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createWorkspace, offlineStatus } from '../src/argus/workspace/store.js';

const NOW = Date.parse('2026-09-20T22:00:00Z');

test('a workspace persists places across instances', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'eoa-ws-')), 'workspace.json');
  const ws = createWorkspace(path);
  ws.savePlace({ id: 'sonsbeek', name: 'Park Sonsbeek', lat: 51.993, lon: 5.874 });
  const reopened = createWorkspace(path);
  const places = reopened.listPlaces();
  assert.equal(places.length, 1);
  assert.equal(places[0].id, 'sonsbeek');
});

test('a workspace persists last-known observations without upgrading freshness', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'eoa-ws-')), 'workspace.json');
  const ws = createWorkspace(path);
  ws.saveObservation('ndw-traffic-live', { value: 42, observedAtMs: NOW - 600_000, kind: 'observed' });
  const stored = createWorkspace(path).getObservation('ndw-traffic-live');
  assert.equal(stored.value, 42);
  const status = offlineStatus({ observation: stored, nowMs: NOW, freshnessPolicy: { liveWithinSeconds: 300, cachedWithinSeconds: 1800 } });
  assert.equal(status.state, 'CACHED');
  assert.equal(status.label, 'CACHED');
  assert.equal(status.usable, true);
});

test('stale and missing offline data are not usable', () => {
  const stale = offlineStatus({ observation: { value: 1, observedAtMs: NOW - 10 * 24 * 3600 * 1000 }, nowMs: NOW });
  assert.equal(stale.usable, false);
  const missing = offlineStatus({ observation: null, nowMs: NOW });
  assert.equal(missing.state, 'UNAVAILABLE');
  assert.equal(missing.usable, false);
});

test('a corrupted workspace file degrades to empty instead of throwing', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'eoa-ws-')), 'workspace.json');
  const ws = createWorkspace(path);
  ws.savePlace({ id: 'a', lat: 51.98, lon: 5.9 });
  // Corrupt it.
  writeFileSync(path, '{ not json');
  assert.deepEqual(createWorkspace(path).listPlaces(), []);
});
