/**
 * Records sanitized live fixtures for the deterministic CI suite.
 *
 * This is the ONLY place that touches the network for adapters. It is run
 * manually, not in CI. Fixtures are sanitized: the GTFS fixture keeps only
 * coordinates and the feed timestamp (no vehicle ids, no trip data), and the
 * weather fixture keeps only the current-conditions block.
 *
 *   node bin/fetch-live-fixtures.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { httpFetch, parseJson } from '../src/argus/sources/adapters/httpFetch.js';
import { parseVehiclePositions, encodeVehiclePositions } from '../src/argus/sources/adapters/gtfsRealtime.js';
import { ARNHEM_BBOX } from '../src/argus/sources/adapters/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = join(ROOT, 'test', 'fixtures');

const WIDE = { minLat: 51.7, maxLat: 52.3, minLon: 5.4, maxLon: 6.5 };

function inBbox(v, b) { return v.lat >= b.minLat && v.lat <= b.maxLat && v.lon >= b.minLon && v.lon <= b.maxLon; }

mkdirSync(FIXTURES, { recursive: true });

// --- GTFS-RT vehicle positions ---
const gtfs = await httpFetch('https://gtfs.ovapi.nl/nl/vehiclePositions.pb', { timeoutMs: 20000 });
if (!gtfs.ok) {
  process.stderr.write(`gtfs fetch failed: ${gtfs.error}\n`);
  process.exit(1);
}
const parsed = parseVehiclePositions(gtfs.body);
let kept = parsed.vehicles.filter((v) => inBbox(v, ARNHEM_BBOX));
let bboxUsed = ARNHEM_BBOX;
if (kept.length < 5) { kept = parsed.vehicles.filter((v) => inBbox(v, WIDE)); bboxUsed = WIDE; }
kept = kept.slice(0, 40).map((v) => ({ lat: Number(v.lat.toFixed(5)), lon: Number(v.lon.toFixed(5)) }));
const fixture = encodeVehiclePositions({ timestamp: parsed.feedTimestamp ?? Math.floor(Date.now() / 1000), vehicles: kept });
writeFileSync(join(FIXTURES, 'gtfs-vehiclePositions.arnhem.pb'), fixture);
process.stdout.write(`gtfs: total=${parsed.vehicles.length} kept=${kept.length} bboxUsed=${JSON.stringify(bboxUsed)} bytes=${fixture.length} ts=${parsed.feedTimestamp}\n`);

// --- Open-Meteo current weather ---
const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${ARNHEM_BBOX.minLat + 0.05}&longitude=${ARNHEM_BBOX.minLon + 0.1}&current=temperature_2m,wind_speed_10m,precipitation,weather_code`;
const weather = await httpFetch(weatherUrl, { timeoutMs: 20000, accept: 'application/json' });
if (!weather.ok) {
  process.stderr.write(`open-meteo fetch failed: ${weather.error}\n`);
  process.exit(1);
}
const response = parseJson(weather.body);
const wrapped = {
  recordedAtMs: Date.now(),
  source: 'https://api.open-meteo.com/v1/forecast',
  license: 'CC-BY-4.0',
  response: { current: response.current },
};
writeFileSync(join(FIXTURES, 'open-meteo-arnhem.json'), JSON.stringify(wrapped, null, 2));
process.stdout.write(`open-meteo: current=${JSON.stringify(response.current)}\n`);
