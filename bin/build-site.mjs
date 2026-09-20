/**
 * Builds the GitHub Pages simulator data from the real core plus the Truth
 * Snapshot and XYZ registry. Nothing here is hand-written fiction, and no
 * measured number is typed by hand: counts come from the snapshot.
 *
 *   node bin/build-site.mjs
 */
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createArnhemFixture } from '../src/argus/regional/arnhem/fixtures.js';
import { filterByProfile, PROFILE } from '../src/argus/sources/registry.js';
import { crowdIndex } from '../src/argus/crowd/crowdIndex.js';
import { calmIndex } from '../src/argus/calm/calmIndex.js';
import { socialOpportunity } from '../src/argus/social/socialOpportunity.js';
import { forecast } from '../src/argus/forecast/temporal.js';
import { traceSources } from '../src/argus/evidence/evidence.js';
import { aggregateSpatialGrid, suppressCell } from '../src/argus/privacy/suppression.js';
import { METHODOLOGY_VERSION } from '../src/argus/config/methodology.js';
import { explainEstimate } from '../src/argus/evidence/explain.js';
import { LIVE_MANIFESTS } from '../src/argus/sources/adapters/index.js';
import { buildTruthSnapshot } from '../src/argus/product/truthSnapshot.js';
import { publicEntries, renderEntry } from '../src/argus/product/xyz.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, '..', 'site');
const FIXED_NOW = Date.parse('2026-09-20T18:00:00Z');
const METHODOLOGY = METHODOLOGY_VERSION;
const snapshot = buildTruthSnapshot();

function round(value, digits = 2) {
  return value === null || value === undefined ? null : Number(value.toFixed(digits));
}

function computeSignals(place, fixture, profile) {
  const { registry, manifestsById, nowMs, calmInvert } = fixture;
  const crowdFilter = filterByProfile(place.crowd, registry, profile);
  const calmFilter = filterByProfile(place.calm, registry, profile);
  const socialFilter = filterByProfile(place.social, registry, profile);
  const excluded = [...new Set([...crowdFilter.excluded, ...calmFilter.excluded, ...socialFilter.excluded])];

  const crowd = crowdIndex({ observations: crowdFilter.kept, manifestsById, nowMs });
  const calm = calmIndex({ crowdEstimate: crowd.estimate, calmObservations: calmFilter.kept, manifestsById, nowMs, invert: calmInvert });
  const social = socialOpportunity({ observations: socialFilter.kept, manifestsById, nowMs });
  return { crowd, calm, social, excluded };
}

function signalFor(signal, fixture) {
  const series = forecast({
    currentScore: signal.estimate.score,
    currentConfidence: signal.estimate.confidence,
    priorsByHour: fixture.priorsByHour,
    nowMs: fixture.nowMs,
  });
  return {
    score: round(signal.estimate.score),
    band: signal.estimate.band,
    range: signal.estimate.range,
    confidence: signal.estimate.confidence,
    confidenceState: signal.estimate.confidenceState ?? null,
    confidenceSemantics: signal.estimate.confidenceSemantics ?? 'evidence-quality',
    dataClass: signal.estimate.dataClass ?? 'unknown',
    derivedFrom: signal.estimate.derivedFromEstimateIds ?? [],
    evidenceIds: signal.estimate.evidenceIds,
    forecast: series,
    contributions: signal.contributions.map((c) => ({
      sourceId: c.sourceId,
      provider: c.provider,
      rawValue: c.rawValue,
      normalized: c.normalized,
      weight: c.weight,
      baseWeight: c.baseWeight,
      correlationFactor: c.correlationFactor,
      correlationGroup: c.correlationGroup ?? null,
      freshness: c.freshness,
      kind: c.kind,
      included: c.included,
      reason: c.reason,
      license: c.license,
    })),
    tracedSources: traceSources(signal.estimate, signal.evidence ?? []),
    explain: explainEstimate({ estimate: signal.estimate, contributions: signal.contributions }),
  };
}

function buildProfile(fixture, profile) {
  const places = fixture.places.map((place) => {
    const signals = computeSignals(place, fixture, profile);
    return {
      id: place.id,
      name: place.name,
      lat: place.lat,
      lon: place.lon,
      excluded: signals.excluded,
      signals: {
        crowd: signalFor(signals.crowd, fixture),
        calm: signalFor(signals.calm, fixture),
        social: signalFor(signals.social, fixture),
      },
    };
  });
  const excludedIds = [...new Set(places.flatMap((p) => p.excluded))];
  const excluded = excludedIds.map((id) => {
    const manifest = fixture.registry.get(id);
    return { id, provider: manifest?.provider ?? id, license: manifest?.license ?? '?', reason: `excluded by ${profile}` };
  });
  const contributing = fixture.registry.all().filter((m) => places.some((p) =>
    ['crowd', 'calm', 'social'].some((s) => p.signals[s].contributions.some((c) => c.sourceId === m.id))));
  return {
    places,
    excluded,
    sources: contributing.map((m) => ({
      id: m.id, provider: m.provider, type: m.type, license: m.license,
      commercialUse: m.commercialUse, redistribution: m.redistribution,
      privacyClass: m.privacyClass, sourceURL: m.sourceURL, termsURL: m.termsURL,
      confidencePrior: m.confidencePrior, adapterVersion: m.adapterVersion,
    })),
    ranking: {
      CALM: [...places].sort((a, b) => (b.signals.calm.score ?? -1) - (a.signals.calm.score ?? -1)).map((p) => p.id),
      SOCIAL: [...places].sort((a, b) => (b.signals.social.score ?? -1) - (a.signals.social.score ?? -1)).map((p) => p.id),
    },
  };
}

function privacyDemo() {
  const cells = [
    { lat: 51.9848, lon: 5.8985, count: 3 },
    { lat: 51.9851, lon: 5.8987, count: 4 },
    { lat: 51.9930, lon: 5.8740, count: 22 },
    { lat: 51.9932, lon: 5.8742, count: 18 },
    { lat: 51.9790, lon: 5.9100, count: 1 },
    { lat: 52.1000, lon: 6.1000, count: 9 },
  ];
  const aggregated = aggregateSpatialGrid({ cells, cellSizeM: 1200, k: snapshot.privacy.defaultK });
  return {
    k: snapshot.privacy.defaultK,
    rawCells: cells,
    released: aggregated.released,
    suppressed: aggregated.suppressed,
    examples: [
      { label: 'cell with 3 contributors', ...suppressCell({ count: 3, k: snapshot.privacy.defaultK }) },
      { label: 'cell with 4 contributors', ...suppressCell({ count: 4, k: snapshot.privacy.defaultK }) },
      { label: 'cell with 22 contributors', ...suppressCell({ count: 22, k: snapshot.privacy.defaultK }) },
    ],
  };
}

const fixture = createArnhemFixture(FIXED_NOW);

const limitations = [
  'All source values in the Arnhem demo are synthetic fixtures — not live feeds.',
  snapshot.calibration.status === 'NOT_YET_CALIBRATED'
    ? 'No calibration against ground truth; evidence confidence is quality, not probability.'
    : null,
  `Adapters implemented: ${snapshot.adapters.total}; fixture-backed: ${snapshot.adapters.fixtureBacked}; live-verified this run: ${snapshot.adapters.remoteLiveVerified}.`,
  snapshot.cesium.available ? null : 'The visual product is a static simulator; the Cesium globe is not integrated.',
  'Correlation handling is simple damping, not a Bayesian model.',
  `Privacy k=${snapshot.privacy.defaultK} is an engineering placeholder, not a compliance claim.`,
].filter(Boolean);

const data = {
  product: 'Eye of Argus',
  motto: 'OFFLINE FIRST FOR SURE',
  dataClass: 'synthetic',
  synthetic: true,
  generatedAt: new Date(FIXED_NOW).toISOString(),
  methodologyVersion: METHODOLOGY,
  upstream: {
    repo: snapshot.upstream.repo,
    sha: snapshot.upstream.sha,
    license: snapshot.upstream.license,
    relationship: snapshot.upstream.relationship,
    url: `https://github.com/${snapshot.upstream.repo}`,
  },
  evidence: {
    tests: snapshot.tests.total,
    runtimeDependencies: snapshot.runtimeDependencies,
    ci: 'GitHub Actions — Node 20.x + 22.x, offline, deterministic',
    repo: 'https://github.com/abrahamhl/eye-of-argus',
  },
  investorSnapshot: {
    tests: `${snapshot.tests.pass}/${snapshot.tests.total}`,
    runtimeDependencies: snapshot.runtimeDependencies,
    adaptersLiveCapable: snapshot.adapters.liveCapable,
    adaptersRemoteLiveVerified: snapshot.adapters.remoteLiveVerified,
    calibration: snapshot.calibration.status,
    offlineWorkspace: snapshot.workspace.available ? 'VERIFIED' : 'NOT AVAILABLE',
    fieldValidation: snapshot.validation.fieldApp && snapshot.validation.validateCli ? 'AVAILABLE' : 'NOT AVAILABLE',
    analystMode: snapshot.analystMode.available ? 'AVAILABLE' : 'NOT AVAILABLE',
    commercialSafe: snapshot.commercialSafe.enabled ? 'ACTIVE' : 'DISABLED',
    cesium: snapshot.cesium.available ? 'INTEGRATED' : 'NOT YET INTEGRATED',
    liveVerification: snapshot.ci.lastKnownEvidence,
  },
  freshnessStates: ['LIVE', 'CACHED', 'STALE', 'STATIC', 'INFERRED', 'UNAVAILABLE'],
  confidenceStates: ['VERIFIED', 'SUPPORTED', 'INFERRED', 'UNKNOWN', 'CONTRADICTED'],
  modes: ['CALM', 'SOCIAL'],
  profiles: {
    COMMERCIAL_SAFE: buildProfile(fixture, PROFILE.COMMERCIAL_SAFE),
    PERSONAL: buildProfile(fixture, PROFILE.PERSONAL),
  },
  privacy: privacyDemo(),
  calibration: snapshot.calibration,
  adapters: LIVE_MANIFESTS.map((m) => {
    const record = snapshot.adapters.records.find((r) => r.id === m.id) ?? {};
    return {
      id: m.id, provider: m.provider, type: m.type, license: m.license,
      commercialUse: m.commercialUse, redistribution: m.redistribution, privacyClass: m.privacyClass,
      adapterVersion: m.adapterVersion, sourceURL: m.sourceURL, termsURL: m.termsURL,
      dataClass: m.dataClass, correlationGroup: m.correlationGroup ?? null,
      confidencePrior: m.confidencePrior, freshnessPolicy: m.freshnessPolicy ?? null,
      implementationStatus: record.implementationStatus ?? 'IMPLEMENTED',
      fixtureStatus: record.fixtureStatus ?? 'NO_FIXTURE',
      liveStatus: record.liveStatus ?? 'NOT_LIVE_VERIFIED',
      lastLiveVerification: record.lastLiveVerification ?? null,
      lastLiveError: record.lastLiveError ?? null,
    };
  }),
  xyz: publicEntries().map((entry) => ({
    ...renderEntry(entry, snapshot),
    evidence: { tests: entry.evidence?.tests ?? [], source: entry.evidence?.source ?? [] },
  })),
  limitations,
};

mkdirSync(SITE, { recursive: true });
writeFileSync(join(SITE, 'data.json'), JSON.stringify(data, null, 2));
copyFileSync(join(HERE, '..', 'LICENSE'), join(SITE, 'LICENSE'));
process.stdout.write(`Wrote ${join(SITE, 'data.json')} (${data.xyz.length} XYZ entries)\n`);
