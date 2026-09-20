import test from 'node:test';
import assert from 'node:assert/strict';

import { createArnhemFixture } from '../src/argus/regional/arnhem/fixtures.js';
import { filterByProfile, PROFILE } from '../src/argus/sources/registry.js';
import { crowdIndex } from '../src/argus/crowd/crowdIndex.js';
import { calmIndex } from '../src/argus/calm/calmIndex.js';
import { socialOpportunity } from '../src/argus/social/socialOpportunity.js';
import { forecast } from '../src/argus/forecast/temporal.js';
import { traceSources } from '../src/argus/evidence/evidence.js';
import { buildPlaceBrief } from '../src/argus/reports/placeBrief.js';
import { METHODOLOGY_VERSION } from '../src/argus/config/methodology.js';

const NOW = Date.parse('2026-09-20T18:00:00Z');

function computeFor(place, fixture) {
  const { registry, manifestsById, nowMs, calmInvert } = fixture;
  const crowd = crowdIndex({
    observations: filterByProfile(place.crowd, registry, PROFILE.COMMERCIAL_SAFE).kept,
    manifestsById,
    nowMs,
  });
  const calm = calmIndex({
    crowdEstimate: crowd.estimate,
    calmObservations: filterByProfile(place.calm, registry, PROFILE.COMMERCIAL_SAFE).kept,
    manifestsById,
    nowMs,
    invert: calmInvert,
  });
  const social = socialOpportunity({
    observations: filterByProfile(place.social, registry, PROFILE.COMMERCIAL_SAFE).kept,
    manifestsById,
    nowMs,
  });
  return { crowd, calm, social };
}

test('the Arnhem slice is deterministic across repeated runs', () => {
  const fixture = createArnhemFixture(NOW);
  const first = fixture.places.map((p) => computeFor(p, fixture));
  const second = fixture.places.map((p) => computeFor(p, fixture));
  assert.equal(JSON.stringify(first), JSON.stringify(second));
});

test('COMMERCIAL_SAFE excludes the non-commercial events source', () => {
  const fixture = createArnhemFixture(NOW);
  const place = fixture.places[0];
  const { excluded } = filterByProfile(place.social, fixture.registry, PROFILE.COMMERCIAL_SAFE);
  assert.ok(excluded.includes('arnhem-events'));
});

test('every estimate resolves back to declared sources', () => {
  const fixture = createArnhemFixture(NOW);
  for (const place of fixture.places) {
    const { crowd } = computeFor(place, fixture);
    const sources = traceSources(crowd.estimate, crowd.evidence);
    assert.ok(sources.length > 0);
    for (const id of sources) assert.ok(fixture.registry.get(id), `unknown source ${id}`);
  }
});

test('calm exposes its own evidence, including the derived crowd component', () => {
  const fixture = createArnhemFixture(NOW);
  const [burger] = fixture.places.map((p) => computeFor(p, fixture));
  assert.ok(Array.isArray(burger.calm.evidence) && burger.calm.evidence.length > 0);
  const sources = traceSources(burger.calm.estimate, burger.calm.evidence);
  assert.ok(sources.includes('derived:crowd-pressure'));
  for (const id of sources) {
    if (id === 'derived:crowd-pressure') continue;
    assert.ok(fixture.registry.get(id), `unknown source ${id}`);
  }
});

test('calm is not a simple inverse of crowd', () => {
  const fixture = createArnhemFixture(NOW);
  const [burger, park] = fixture.places.map((p) => computeFor(p, fixture));
  assert.ok(park.crowd.estimate.score < burger.crowd.estimate.score, 'park is less crowded');
  assert.ok(park.calm.estimate.score > burger.calm.estimate.score, 'park is calmer');
  // Park calm (60) is not 100 - crowd (62); the environmental term matters.
  assert.notEqual(Math.round(park.calm.estimate.score), Math.round(100 - park.crowd.estimate.score));
});

test('forecast uses the same estimate and widens with horizon', () => {
  const fixture = createArnhemFixture(NOW);
  const [burger] = fixture.places.map((p) => computeFor(p, fixture));
  const series = forecast({
    currentScore: burger.crowd.estimate.score,
    currentConfidence: burger.crowd.estimate.confidence,
    priorsByHour: fixture.priorsByHour,
    nowMs: NOW,
  });
  assert.equal(series[0].horizonMinutes, 0);
  assert.equal(series[0].score, burger.crowd.estimate.score);
  assert.ok(series[3].range.high - series[3].range.low > series[0].range.high - series[0].range.low);
});

test('the place brief is traceable and states its limits and method', () => {
  const fixture = createArnhemFixture(NOW);
  const place = fixture.places[0];
  const result = computeFor(place, fixture);
  const asSignal = (r) => ({
    estimate: r.estimate,
    contributions: r.contributions,
    forecast: forecast({ currentScore: r.estimate.score, currentConfidence: r.estimate.confidence, priorsByHour: fixture.priorsByHour, nowMs: NOW }),
  });
  const brief = buildPlaceBrief({
    place,
    signals: { crowd: asSignal(result.crowd), calm: asSignal(result.calm), social: asSignal(result.social) },
    sources: fixture.registry.all(),
    excludedSources: [{ id: 'arnhem-events', reason: 'excluded by COMMERCIAL_SAFE licence profile' }],
    generatedAtMs: NOW,
    methodologyVersion: METHODOLOGY_VERSION,
    commercialProfile: PROFILE.COMMERCIAL_SAFE,
    mode: 'CALM',
    limitations: ['synthetic fixture only'],
  });
  assert.equal(brief.json.kind, 'place-brief');
  assert.equal(brief.json.methodologyVersion, METHODOLOGY_VERSION);
  assert.equal(brief.json.sources.length, fixture.registry.size());
  assert.ok(brief.json.limitations.length > 0);
  assert.equal(brief.json.excludedSources[0].id, 'arnhem-events');
  assert.match(brief.html, /Excluded by licence profile/);
  assert.match(brief.html, /arnhem-events/);
  assert.match(brief.html, /Eye of Argus/);
  assert.match(brief.html, new RegExp(METHODOLOGY_VERSION.replace('.', '\\.')));
  assert.match(brief.html, /SYNTHETIC DEMO/);
  assert.match(brief.html, /synthetic fixture only/);
  assert.doesNotMatch(brief.html, /\b\d+ (people|persons)\b/i);
});
