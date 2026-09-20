import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { parseVehiclePositions } from '../src/argus/sources/adapters/gtfsRealtime.js';
import { parseOpenMeteoCurrent, weatherCalmContext } from '../src/argus/sources/adapters/openMeteo.js';
import { collectLive, transitActivity, ARNHEM_BBOX, TRANSIT_REFERENCE_COUNT, FIXTURE_DIR } from '../src/argus/sources/adapters/index.js';
import { httpFetch } from '../src/argus/sources/adapters/httpFetch.js';
import { createMemoryCache, resolveWithCache, payloadHash } from '../src/argus/sources/adapters/offlineCache.js';
import { classifyFreshness } from '../src/argus/time/freshness.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NOW = Date.parse('2026-09-20T22:00:00Z');

test('the recorded GTFS-RT fixture parses into coordinates only', () => {
  const buf = readFileSync(join(FIXTURE_DIR, 'gtfs-vehiclePositions.arnhem.pb'));
  const { feedTimestamp, vehicles } = parseVehiclePositions(buf);
  assert.ok(vehicles.length >= 5, 'expected several vehicles');
  assert.ok(typeof feedTimestamp === 'number');
  for (const v of vehicles) {
    assert.ok(Number.isFinite(v.lat) && Number.isFinite(v.lon));
    assert.deepEqual(Object.keys(v).sort(), ['lat', 'lon']);
  }
});

test('transit activity counts vehicles inside the Arnhem bbox and scales to 0..100', () => {
  const buf = readFileSync(join(FIXTURE_DIR, 'gtfs-vehiclePositions.arnhem.pb'));
  const { vehicles } = parseVehiclePositions(buf);
  const { count, value } = transitActivity(vehicles);
  assert.equal(count, vehicles.filter((v) => v.lat >= ARNHEM_BBOX.minLat && v.lat <= ARNHEM_BBOX.maxLat && v.lon >= ARNHEM_BBOX.minLon && v.lon <= ARNHEM_BBOX.maxLon).length);
  assert.equal(value, Math.min(100, Math.round((count / TRANSIT_REFERENCE_COUNT) * 100)));
  assert.ok(value >= 0 && value <= 100);
});

test('the recorded weather fixture parses and normalizes to a calm context', () => {
  const wrapped = JSON.parse(readFileSync(join(FIXTURE_DIR, 'open-meteo-arnhem.json'), 'utf8'));
  const current = parseOpenMeteoCurrent(wrapped.response);
  assert.equal(typeof current.temperatureC, 'number');
  assert.equal(typeof current.windSpeedKmh, 'number');
  const value = weatherCalmContext(current);
  assert.ok(value >= 0 && value <= 100);
});

test('fixture mode returns both live-capable sources, marked as recorded', async () => {
  const { observations, results } = await collectLive({ mode: 'fixture', nowMs: NOW });
  assert.equal(observations.length, 2);
  assert.equal(results.length, 2);
  assert.ok(results.every((r) => r.ok));
  assert.ok(observations.every((o) => o.meta.recorded === true));
});

test('a recorded fixture with an old timestamp is never classified LIVE', async () => {
  const { observations } = await collectLive({ mode: 'fixture', nowMs: NOW });
  const gtfs = observations.find((o) => o.meta.recorded);
  const freshness = classifyFreshness({ kind: gtfs.kind, observedAtMs: gtfs.observedAtMs, nowMs: NOW });
  assert.notEqual(freshness, 'LIVE');
});

test('httpFetch reports a timeout and an http error without throwing', async () => {
  const timeout = await httpFetch('https://example.test', {
    fetchImpl: () => { const e = new Error('aborted'); e.name = 'AbortError'; return Promise.reject(e); },
  });
  assert.equal(timeout.ok, false);
  assert.equal(timeout.error, 'timeout');

  const http500 = await httpFetch('https://example.test', {
    fetchImpl: async () => ({ ok: false, status: 500 }),
  });
  assert.equal(http500.ok, false);
  assert.equal(http500.error, 'http-500');
});

test('a failed adapter falls back to the offline cache, never upgrading freshness', async () => {
  const cache = createMemoryCache({
    'ovapi-transit-live': { sourceId: 'ovapi-transit-live', observedAtMs: NOW - 600_000, receivedAtMs: NOW - 600_000, value: 55 },
  });
  const { observations, results } = await collectLive({ mode: 'fixture', fixtureDir: join(ROOT, 'does-not-exist'), nowMs: NOW, cache });
  const cached = observations.find((o) => o.sourceId === 'ovapi-transit-live');
  assert.ok(cached, 'expected a cached observation');
  assert.equal(cached.meta.cached, true);
  assert.equal(cached.observedAtMs, NOW - 600_000);
  const freshness = classifyFreshness({ kind: cached.kind, observedAtMs: cached.observedAtMs, nowMs: NOW });
  assert.notEqual(freshness, 'LIVE');
  assert.ok(results.some((r) => r.cached === true));
});

test('resolveWithCache marks an aged cache entry as too old', () => {
  const cache = createMemoryCache({ s: { observedAtMs: NOW - 10 * 24 * 3600 * 1000, value: 5 } });
  const result = resolveWithCache({ fresh: null, cache, sourceId: 's', nowMs: NOW });
  assert.equal(result.reason, 'cache-too-old');
  assert.equal(result.cached, true);
});

test('payload hashing is stable and distinguishes content', () => {
  assert.equal(payloadHash('abc'), payloadHash('abc'));
  assert.notEqual(payloadHash('abc'), payloadHash('abd'));
});
