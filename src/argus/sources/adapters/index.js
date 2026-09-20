import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createManifest, PRIVACY_CLASS } from '../manifest.js';
import { createObservation } from '../observation.js';
import { httpFetch, parseJson } from './httpFetch.js';
import { parseVehiclePositions } from './gtfsRealtime.js';
import { parseOpenMeteoCurrent, weatherCalmContext } from './openMeteo.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const FIXTURE_DIR = join(HERE, '..', '..', '..', '..', 'test', 'fixtures');

/** Bounding box around Arnhem (roughly 12 km). */
export const ARNHEM_BBOX = { minLat: 51.93, maxLat: 52.05, minLon: 5.80, maxLon: 6.00 };

export const TRANSIT_REFERENCE_COUNT = 40;

export const LIVE_MANIFESTS = [
  createManifest({
    id: 'ovapi-transit-live',
    provider: 'OVapi / Stichting OpenGeo',
    type: 'transit-vehicle-positions',
    geographicCoverage: 'NL',
    spatialResolution: 'vehicle',
    temporalResolution: '~30 s',
    license: 'CC-BY-4.0',
    commercialUse: true,
    redistribution: 'allowed',
    privacyClass: PRIVACY_CLASS.PUBLIC_AGGREGATE,
    sourceURL: 'https://gtfs.ovapi.nl/nl/vehiclePositions.pb',
    termsURL: 'https://gtfs.ovapi.nl/',
    adapterVersion: '0.1.0',
    confidencePrior: 0.6,
    dataClass: 'live',
    correlationGroup: 'mobility-pressure',
    freshnessPolicy: { liveWithinSeconds: 180, cachedWithinSeconds: 900 },
  }),
  createManifest({
    id: 'open-meteo-live',
    provider: 'Open-Meteo',
    type: 'weather-current',
    geographicCoverage: 'global',
    spatialResolution: '~1-11 km grid',
    temporalResolution: '15 min',
    license: 'CC-BY-4.0',
    commercialUse: true,
    redistribution: 'allowed',
    privacyClass: PRIVACY_CLASS.PUBLIC_AGGREGATE,
    sourceURL: 'https://api.open-meteo.com/v1/forecast',
    termsURL: 'https://open-meteo.com/en/license',
    adapterVersion: '0.1.0',
    confidencePrior: 0.55,
    dataClass: 'live',
    freshnessPolicy: { liveWithinSeconds: 1800, cachedWithinSeconds: 7200 },
  }),
];

export function liveManifestsById() {
  return Object.fromEntries(LIVE_MANIFESTS.map((m) => [m.id, m]));
}

export function inBbox({ lat, lon }, bbox = ARNHEM_BBOX) {
  return lat >= bbox.minLat && lat <= bbox.maxLat && lon >= bbox.minLon && lon <= bbox.maxLon;
}

/** Count transit vehicles inside the bbox and scale to a 0..100 activity index. */
export function transitActivity(vehicles, { bbox = ARNHEM_BBOX, reference = TRANSIT_REFERENCE_COUNT } = {}) {
  const count = vehicles.filter((v) => inBbox(v, bbox)).length;
  return { count, value: Math.min(100, Math.round((count / reference) * 100)) };
}

/**
 * Collect live observations. `mode: 'fixture'` reads recorded, sanitized
 * payloads and is the only mode exercised by CI. `mode: 'live'` performs real
 * network fetches and is run manually or by a separate smoke workflow.
 */
export async function collectLive({
  mode = 'fixture',
  nowMs,
  fetchImpl,
  cache,
  fixtureDir = FIXTURE_DIR,
  bbox = ARNHEM_BBOX,
  reference = TRANSIT_REFERENCE_COUNT,
  timeoutMs = 8000,
} = {}) {
  const observations = [];
  const results = [];

  // --- OVapi GTFS-RT vehicle positions ---
  {
    const manifest = LIVE_MANIFESTS.find((m) => m.id === 'ovapi-transit-live');
    let body = null;
    let error = null;
    if (mode === 'fixture') {
      try { body = readFileSync(join(fixtureDir, 'gtfs-vehiclePositions.arnhem.pb')); }
      catch (e) { error = `fixture-missing:${e.message}`; }
    } else {
      const res = await httpFetch(manifest.sourceURL, { timeoutMs, fetchImpl });
      if (res.ok) body = res.body; else error = res.error;
    }
    if (body) {
      const { feedTimestamp, vehicles } = parseVehiclePositions(body);
      const { count, value } = transitActivity(vehicles, { bbox, reference });
      const observedAtMs = feedTimestamp ? feedTimestamp * 1000 : nowMs;
      observations.push(createObservation({
        sourceId: manifest.id,
        value,
        observedAtMs,
        meta: { vehiclesInBbox: count, mode, recorded: mode === 'fixture' },
      }));
      if (cache) cache.set(manifest.id, { sourceId: manifest.id, observedAtMs, receivedAtMs: nowMs, adapterVersion: manifest.adapterVersion, dataClass: 'live', value });
      results.push({ sourceId: manifest.id, ok: true, vehiclesInBbox: count, value });
    } else {
      const entry = cache ? cache.get(manifest.id) : null;
      if (entry) {
        observations.push(createObservation({ sourceId: manifest.id, value: entry.value, observedAtMs: entry.observedAtMs, meta: { cached: true } }));
        results.push({ sourceId: manifest.id, ok: false, error: error ?? 'unavailable', cached: true });
      } else {
        results.push({ sourceId: manifest.id, ok: false, error: error ?? 'unavailable', cached: false });
      }
    }
  }

  // --- Open-Meteo current weather ---
  {
    const manifest = LIVE_MANIFESTS.find((m) => m.id === 'open-meteo-live');
    let json = null;
    let observedAtMs = nowMs;
    let error = null;
    if (mode === 'fixture') {
      try {
        const wrapped = parseJson(readFileSync(join(fixtureDir, 'open-meteo-arnhem.json')));
        json = wrapped.response;
        observedAtMs = wrapped.recordedAtMs;
      } catch (e) { error = `fixture-missing:${e.message}`; }
    } else {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${bbox.minLat + 0.05}&longitude=${bbox.minLon + 0.1}&current=temperature_2m,wind_speed_10m,precipitation,weather_code`;
      const res = await httpFetch(url, { timeoutMs, fetchImpl, accept: 'application/json' });
      if (res.ok) json = parseJson(res.body); else error = res.error;
    }
    if (json) {
      const current = parseOpenMeteoCurrent(json);
      const value = weatherCalmContext(current);
      observations.push(createObservation({
        sourceId: manifest.id,
        value,
        observedAtMs,
        meta: { current, mode, recorded: mode === 'fixture' },
      }));
      if (cache) cache.set(manifest.id, { sourceId: manifest.id, observedAtMs, receivedAtMs: nowMs, adapterVersion: manifest.adapterVersion, dataClass: 'live', value });
      results.push({ sourceId: manifest.id, ok: true, value, current });
    } else {
      const entry = cache ? cache.get(manifest.id) : null;
      if (entry) {
        observations.push(createObservation({ sourceId: manifest.id, value: entry.value, observedAtMs: entry.observedAtMs, meta: { cached: true } }));
        results.push({ sourceId: manifest.id, ok: false, error: error ?? 'unavailable', cached: true });
      } else {
        results.push({ sourceId: manifest.id, ok: false, error: error ?? 'unavailable', cached: false });
      }
    }
  }

  return { observations, results };
}
