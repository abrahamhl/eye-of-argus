import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createDatexSpeedIntensityParser, joinBbox, trafficPressure, buildDatexFixture } from '../src/argus/sources/adapters/datex.js';
import { FIXTURE_DIR, ARNHEM_BBOX } from '../src/argus/sources/adapters/index.js';

const ROWS = [
  { id: 'site_a', lat: 51.98, lon: 5.90, flow: 1500, speed: 60 },
  { id: 'site_b', lat: 51.99, lon: 5.88, flow: 3000, speed: 20 },
];

function parseInChunks(xml, size) {
  const parser = createDatexSpeedIntensityParser();
  for (let i = 0; i < xml.length; i += size) parser.push(xml.slice(i, i + size));
  return parser.end();
}

test('the DATEX parser reads sites and measurements from a built fixture', () => {
  const xml = buildDatexFixture({ publicationTime: '2026-09-20T21:40:00Z', rows: ROWS });
  const parsed = parseInChunks(xml, xml.length);
  assert.equal(parsed.sites.size, 2);
  assert.equal(parsed.values.size, 2);
  assert.equal(parsed.values.get('site_a').flow, 1500);
  assert.equal(parsed.values.get('site_a').speed, 60);
  assert.equal(parsed.publicationTime, '2026-09-20T21:40:00Z');
});

test('the parser is robust to tags and text split across chunks', () => {
  const xml = buildDatexFixture({ publicationTime: '2026-09-20T21:40:00Z', rows: ROWS });
  const whole = parseInChunks(xml, xml.length);
  const byteByByte = parseInChunks(xml, 1);
  assert.equal(byteByByte.sites.size, whole.sites.size);
  assert.equal(byteByByte.values.get('site_b').flow, whole.values.get('site_b').flow);
  assert.equal(byteByByte.values.get('site_b').speed, whole.values.get('site_b').speed);
});

test('traffic pressure combines normalized flow and congestion', () => {
  const pressure = trafficPressure(ROWS, { flowReference: 3000 });
  // flowScore = 2250/3000*100 = 75; congestion = (80-40)/80 = 0.5 -> 0.7*75 + 0.3*50 = 67.5
  assert.equal(pressure.value, 68);
  assert.equal(pressure.avgFlow, 2250);
  assert.equal(pressure.avgSpeed, 40);
  assert.equal(pressure.sites, 2);
});

test('negative or unknown speeds are ignored, not treated as congestion', () => {
  const pressure = trafficPressure([{ id: 'x', flow: 1000, speed: -1 }], { flowReference: 3000 });
  assert.equal(pressure.avgSpeed, null);
  assert.equal(pressure.congestion, 0);
  assert.ok(pressure.value >= 0 && pressure.value <= 100);
});

test('the recorded NDW Arnhem fixture parses into in-bbox rows only', () => {
  const xml = readFileSync(join(FIXTURE_DIR, 'ndw-speed-intensity.arnhem.xml'), 'utf8');
  const parsed = parseInChunks(xml, 4096);
  const rows = joinBbox(parsed, ARNHEM_BBOX);
  assert.ok(rows.length > 0, 'expected Arnhem measurement sites');
  for (const row of rows) {
    assert.ok(row.lat >= ARNHEM_BBOX.minLat && row.lat <= ARNHEM_BBOX.maxLat);
    assert.ok(row.lon >= ARNHEM_BBOX.minLon && row.lon <= ARNHEM_BBOX.maxLon);
  }
  const pressure = trafficPressure(rows);
  assert.ok(pressure.value >= 0 && pressure.value <= 100);
});
