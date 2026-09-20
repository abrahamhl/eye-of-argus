import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { createArnhemFixture } from '../src/argus/regional/arnhem/fixtures.js';
import { filterByProfile, PROFILE } from '../src/argus/sources/registry.js';
import { crowdIndex } from '../src/argus/crowd/crowdIndex.js';
import { buildPlaceBrief } from '../src/argus/reports/placeBrief.js';
import { forecast } from '../src/argus/forecast/temporal.js';
import { mkManifest, mkObs, manifestsById, NOW } from './helpers.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('synthetic fixtures propagate dataClass = synthetic to estimates', () => {
  const fixture = createArnhemFixture(NOW);
  const place = fixture.places[0];
  const crowd = crowdIndex({
    observations: filterByProfile(place.crowd, fixture.registry, PROFILE.COMMERCIAL_SAFE).kept,
    manifestsById: fixture.manifestsById,
    nowMs: NOW,
  });
  assert.equal(crowd.estimate.dataClass, 'synthetic');
});

test('the place brief is marked synthetic in JSON and HTML', () => {
  const fixture = createArnhemFixture(NOW);
  const place = fixture.places[0];
  const crowd = crowdIndex({
    observations: filterByProfile(place.crowd, fixture.registry, PROFILE.COMMERCIAL_SAFE).kept,
    manifestsById: fixture.manifestsById,
    nowMs: NOW,
  });
  const asSignal = (r) => ({
    estimate: r.estimate,
    contributions: r.contributions,
    forecast: forecast({ currentScore: r.estimate.score, currentConfidence: r.estimate.confidence, priorsByHour: fixture.priorsByHour, nowMs: NOW }),
  });
  const brief = buildPlaceBrief({
    place,
    signals: { crowd: asSignal(crowd) },
    sources: fixture.registry.all(),
    generatedAtMs: NOW,
    methodologyVersion: 'test',
    commercialProfile: PROFILE.COMMERCIAL_SAFE,
    mode: 'CALM',
  });
  assert.equal(brief.json.synthetic, true);
  assert.equal(brief.json.dataClass, 'synthetic');
  assert.match(brief.html, /SYNTHETIC DEMO/);
});

test('a live-classed source yields a non-synthetic estimate', () => {
  const manifest = mkManifest({ id: 'live-1', provider: 'Live provider', dataClass: 'live' });
  const result = crowdIndex({
    observations: [mkObs({ sourceId: 'live-1', value: 60 })],
    manifestsById: manifestsById(manifest),
    nowMs: NOW,
  });
  assert.equal(result.estimate.dataClass, 'live');
});

test('unknown-classed sources are never presented as live', () => {
  const manifest = mkManifest({ id: 'mystery', provider: 'Unclassified' });
  const result = crowdIndex({
    observations: [mkObs({ sourceId: 'mystery', value: 60 })],
    manifestsById: manifestsById(manifest),
    nowMs: NOW,
  });
  assert.equal(result.estimate.dataClass, 'unknown');
  assert.notEqual(result.estimate.dataClass, 'live');
});

test('the Arnhem CLI prints a SYNTHETIC DEMO banner', () => {
  const output = execFileSync(process.execPath, [join(ROOT, 'bin', 'arnhem-demo.mjs')], { cwd: ROOT, encoding: 'utf8' });
  assert.match(output, /SYNTHETIC DEMO/);
});
