/**
 * Builds the GitHub Pages simulator data from the real intelligence core.
 * Nothing here is hand-written fiction: every number comes from running the
 * same modules the CLI uses, at a fixed clock, offline.
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

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, '..', 'site');
const FIXED_NOW = Date.parse('2026-09-20T18:00:00Z');
const METHODOLOGY = METHODOLOGY_VERSION;

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
      freshness: c.freshness,
      kind: c.kind,
      included: c.included,
      reason: c.reason,
      license: c.license,
    })),
    tracedSources: traceSources(signal.estimate, signal.evidence ?? signal.contributionsToEvidence ?? []),
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
  const aggregated = aggregateSpatialGrid({ cells, cellSizeM: 1200, k: 5 });
  return {
    k: 5,
    rawCells: cells,
    released: aggregated.released,
    suppressed: aggregated.suppressed,
    examples: [
      { label: 'cell with 3 contributors', ...suppressCell({ count: 3, k: 5 }) },
      { label: 'cell with 4 contributors', ...suppressCell({ count: 4, k: 5 }) },
      { label: 'cell with 22 contributors', ...suppressCell({ count: 22, k: 5 }) },
    ],
  };
}

const fixture = createArnhemFixture(FIXED_NOW);

const data = {
  product: 'Eye of Argus',
  motto: 'OFFLINE FIRST FOR SURE',
  dataClass: 'synthetic',
  synthetic: true,
  generatedAt: new Date(FIXED_NOW).toISOString(),
  methodologyVersion: METHODOLOGY,
  upstream: {
    repo: 'bilawalsidhu/gods-eye-view',
    sha: '0d41b6be5490db1f10a171f238be75db4d4ec3b4',
    license: 'MIT',
    url: 'https://github.com/bilawalsidhu/gods-eye-view',
  },
  evidence: {
    tests: 65,
    runtimeDependencies: 0,
    ci: 'GitHub Actions — Node 20.x + 22.x, offline, deterministic',
    repo: 'https://github.com/abrahamhl/eye-of-argus',
  },
  freshnessStates: ['LIVE', 'CACHED', 'STALE', 'STATIC', 'INFERRED', 'UNAVAILABLE'],
  confidenceStates: ['VERIFIED', 'SUPPORTED', 'INFERRED', 'UNKNOWN', 'CONTRADICTED'],
  modes: ['CALM', 'SOCIAL'],
  profiles: {
    COMMERCIAL_SAFE: buildProfile(fixture, PROFILE.COMMERCIAL_SAFE),
    PERSONAL: buildProfile(fixture, PROFILE.PERSONAL),
  },
  privacy: privacyDemo(),
  calibration: { status: 'NOT_YET_CALIBRATED', protocol: 'docs/REAL_WORLD_CALIBRATION_PROTOCOL.md' },
  adapters: LIVE_MANIFESTS.map((m) => ({
    id: m.id, provider: m.provider, type: m.type, license: m.license,
    commercialUse: m.commercialUse, redistribution: m.redistribution, privacyClass: m.privacyClass,
    adapterVersion: m.adapterVersion, sourceURL: m.sourceURL, termsURL: m.termsURL,
    dataClass: m.dataClass, correlationGroup: m.correlationGroup ?? null,
    confidencePrior: m.confidencePrior, freshnessPolicy: m.freshnessPolicy ?? null,
  })),
  xyz: [
    {
      x: 'An offline-first evidence engine that keeps four measures separate and shows its proof',
      y: '65/65 deterministic tests, 0 runtime dependencies, CI green on Node 20.x and 22.x',
      z: 'Observation → Evidence → Estimate with source manifests, freshness weighting and confidence states',
    },
    {
      x: 'Crowd, Calm and Social Opportunity computed from independent sources at NOW / +15 / +30 / +60',
      y: 'Burger King Centrum Crowd HIGH 73.0 (63–83) / Calm LOW 22.0; Park Sonsbeek Crowd MODERATE 38.1 / Calm HIGH 70.9',
      z: 'Median/MAD outlier-demoting fusion with an absolute cutoff floor, over a fixed clock and synthetic fixtures',
    },
    {
      x: 'Licence-safe by default: non-commercial data cannot reach a commercial build',
      y: 'COMMERCIAL_SAFE excludes the CC-BY-NC-4.0 events source before fusion; verified by tests',
      z: 'Machine-readable licence profiles with an NC/ND licence denylist in the source registry',
    },
    {
      x: 'Privacy-preserving aggregate telemetry',
      y: 'k=5 suppression demo: cells below 5 contributors are withheld; released cells expose a band, not a count',
      z: 'Grid aggregation, suppression thresholds and a local privacy budget that rejects rewound time',
    },
    {
      x: 'Traceable, auditable conclusions',
      y: 'Every estimate resolves to source manifests through hashed EvidenceRecords; Calm traces its derived crowd term',
      z: 'Immutable observation/evidence/estimate ids and run metadata (runId, methodologyVersion, configurationHash)',
    },
  ],
  limitations: [
    'All source values are synthetic fixtures — not live feeds.',
    'No calibration against ground truth has been performed; no accuracy claim is made.',
    'Confidence and bands are estimates, not person counts.',
    'UI/globe integration is not built; this page is a static presentation of the headless core.',
    'Routing, saved workspaces and live adapters (NDW/OVapi) are future stories.',
  ],
};

mkdirSync(SITE, { recursive: true });
writeFileSync(join(SITE, 'data.json'), JSON.stringify(data, null, 2));
copyFileSync(join(HERE, '..', 'LICENSE'), join(SITE, 'LICENSE'));
process.stdout.write(`Wrote ${join(SITE, 'data.json')}\n`);
