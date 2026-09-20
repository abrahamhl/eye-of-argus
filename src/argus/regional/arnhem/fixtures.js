import { createManifest, PRIVACY_CLASS } from '../../sources/manifest.js';
import { createObservation } from '../../sources/observation.js';
import { createRegistry } from '../../sources/registry.js';

/**
 * Deterministic Arnhem fixture. Every value is synthetic and fixed relative to
 * a caller-supplied `nowMs`, so the vertical slice never depends on a live feed
 * or the wall clock. Real adapters will replace these, one at a time, behind
 * the same manifest/observation contract.
 */

const RAW_MANIFESTS = [
  createManifest({
    id: 'ndw-traffic',
    provider: 'NDW (Nationale Databank Wegverkeersgegevens)',
    type: 'road-traffic',
    geographicCoverage: 'NL',
    spatialResolution: 'road-segment',
    temporalResolution: '1 min',
    license: 'CC0-1.0',
    commercialUse: true,
    redistribution: 'allowed',
    privacyClass: PRIVACY_CLASS.PUBLIC_AGGREGATE,
    sourceURL: 'https://opendata.ndw.nu/',
    termsURL: 'https://opendata.ndw.nu/',
    adapterVersion: '0.1.0',
    confidencePrior: 0.8,
    freshnessPolicy: { liveWithinSeconds: 180, cachedWithinSeconds: 900 },
  }),
  createManifest({
    id: 'parking-arnhem',
    provider: 'Gemeente Arnhem open data (parking)',
    type: 'parking-occupancy',
    geographicCoverage: 'Arnhem',
    spatialResolution: 'garage',
    temporalResolution: '5 min',
    license: 'custom-permissive',
    commercialUse: true,
    redistribution: 'allowed',
    privacyClass: PRIVACY_CLASS.PUBLIC_AGGREGATE,
    sourceURL: 'https://www.arnhem.nl/',
    termsURL: 'https://www.arnhem.nl/',
    adapterVersion: '0.1.0',
    confidencePrior: 0.7,
  }),
  createManifest({
    id: 'ovapi-transit',
    provider: 'OVapi / Stichting OpenGeo',
    type: 'transit-arrivals',
    geographicCoverage: 'NL',
    spatialResolution: 'stop',
    temporalResolution: '30 s',
    license: 'CC-BY-4.0',
    commercialUse: true,
    redistribution: 'allowed',
    privacyClass: PRIVACY_CLASS.PUBLIC_AGGREGATE,
    sourceURL: 'https://gtfs.ovapi.nl/',
    termsURL: 'https://gtfs.ovapi.nl/',
    adapterVersion: '0.1.0',
    confidencePrior: 0.65,
  }),
  createManifest({
    id: 'osm-poi',
    provider: 'OpenStreetMap contributors',
    type: 'venue-density',
    geographicCoverage: 'global',
    spatialResolution: 'POI',
    temporalResolution: 'static snapshot + weekly diff',
    license: 'ODbL-1.0',
    commercialUse: true,
    redistribution: 'share-alike',
    privacyClass: PRIVACY_CLASS.PUBLIC_AGGREGATE,
    sourceURL: 'https://www.openstreetmap.org/',
    termsURL: 'https://www.openstreetmap.org/copyright',
    adapterVersion: '0.1.0',
    confidencePrior: 0.6,
  }),
  createManifest({
    id: 'arnhem-events',
    provider: 'Gemeente Arnhem events calendar',
    type: 'public-events',
    geographicCoverage: 'Arnhem',
    spatialResolution: 'venue',
    temporalResolution: 'event',
    license: 'CC-BY-NC-4.0',
    commercialUse: false,
    redistribution: 'allowed',
    privacyClass: PRIVACY_CLASS.PUBLIC_AGGREGATE,
    sourceURL: 'https://www.arnhem.nl/',
    termsURL: 'https://www.arnhem.nl/',
    adapterVersion: '0.1.0',
    confidencePrior: 0.55,
  }),
  createManifest({
    id: 'historical-prior',
    provider: 'Eye of Argus temporal baseline',
    type: 'historical-prior',
    geographicCoverage: 'Arnhem',
    spatialResolution: 'area',
    temporalResolution: 'hourly baseline',
    license: 'MIT',
    commercialUse: true,
    redistribution: 'allowed',
    privacyClass: PRIVACY_CLASS.SYNTHETIC,
    sourceURL: 'local://eye-of-argus/baseline',
    termsURL: 'local://eye-of-argus/baseline',
    adapterVersion: '0.1.0',
    confidencePrior: 0.5,
  }),
  createManifest({
    id: 'optin-crowd',
    provider: 'Eye of Argus opt-in aggregate telemetry',
    type: 'opt-in-aggregate',
    geographicCoverage: 'opted-in devices only',
    spatialResolution: 'grid cell (>=k contributors)',
    temporalResolution: '2 min',
    license: 'MIT',
    commercialUse: true,
    redistribution: 'allowed',
    privacyClass: PRIVACY_CLASS.OPT_IN_AGGREGATE,
    sourceURL: 'local://eye-of-argus/telemetry',
    termsURL: 'local://eye-of-argus/telemetry',
    adapterVersion: '0.1.0',
    confidencePrior: 0.7,
  }),
  createManifest({
    id: 'greenery-nl',
    provider: 'PDOK / BGT green coverage (derived)',
    type: 'green-coverage',
    geographicCoverage: 'NL',
    spatialResolution: 'area',
    temporalResolution: 'seasonal',
    license: 'CC-BY-4.0',
    commercialUse: true,
    redistribution: 'allowed',
    privacyClass: PRIVACY_CLASS.PUBLIC_AGGREGATE,
    sourceURL: 'https://www.pdok.nl/',
    termsURL: 'https://www.pdok.nl/',
    adapterVersion: '0.1.0',
    confidencePrior: 0.55,
  }),
  createManifest({
    id: 'noise-nl',
    provider: 'RIVM noise contours (derived)',
    type: 'noise',
    geographicCoverage: 'NL',
    spatialResolution: 'area',
    temporalResolution: 'annual',
    license: 'CC-BY-4.0',
    commercialUse: true,
    redistribution: 'allowed',
    privacyClass: PRIVACY_CLASS.PUBLIC_AGGREGATE,
    sourceURL: 'https://www.rivm.nl/',
    termsURL: 'https://www.rivm.nl/',
    adapterVersion: '0.1.0',
    confidencePrior: 0.5,
  }),
];

// Every source in this demo fixture is synthetic development data. dataClass is
// propagated to estimates and must surface as "SYNTHETIC DEMO" everywhere.
const MANIFESTS = RAW_MANIFESTS.map((m) => Object.freeze({ ...m, dataClass: 'synthetic' }));

const SOURCE_URLS = Object.fromEntries(
  MANIFESTS.map((m) => [m.id, { sourceURL: m.sourceURL, termsURL: m.termsURL }]),
);

function obs(nowMs, sourceId, value, { minutesAgo = 2, kind = 'observed' } = {}) {
  return createObservation({
    sourceId,
    kind,
    observedAtMs: nowMs - minutesAgo * 60_000,
    value,
  });
}

const PRIORS_BY_HOUR = Object.freeze([
  12, 10, 8, 8, 10, 18, 30, 52, 64, 58, 56, 62,
  74, 70, 64, 66, 78, 88, 84, 72, 58, 44, 28, 18,
]);

export function createArnhemFixture(nowMs) {
  const places = [
    {
      id: 'burger-king-centrum',
      name: 'Burger King Centrum Arnhem (synthetic)',
      lat: 51.9851,
      lon: 5.8987,
      crowd: [
        obs(nowMs, 'ndw-traffic', 78, { minutesAgo: 1 }),
        obs(nowMs, 'parking-arnhem', 82, { minutesAgo: 3 }),
        obs(nowMs, 'ovapi-transit', 65, { minutesAgo: 0 }),
        obs(nowMs, 'osm-poi', 70, { minutesAgo: 60 * 24, kind: 'static' }),
        obs(nowMs, 'historical-prior', 68, { kind: 'static' }),
        obs(nowMs, 'optin-crowd', 74, { minutesAgo: 2 }),
      ],
      calm: [
        obs(nowMs, 'greenery-nl', 12, { minutesAgo: 60 * 24 * 90, kind: 'static' }),
        obs(nowMs, 'noise-nl', 80, { kind: 'static' }),
      ],
      social: [
        obs(nowMs, 'arnhem-events', 40, { minutesAgo: 30 }),
        obs(nowMs, 'osm-poi', 70, { kind: 'static' }),
        obs(nowMs, 'ovapi-transit', 65, { minutesAgo: 0 }),
        obs(nowMs, 'optin-crowd', 74, { minutesAgo: 2 }),
      ],
    },
    {
      id: 'park-sonsbeek',
      name: 'Park Sonsbeek Arnhem (synthetic)',
      lat: 51.993,
      lon: 5.874,
      crowd: [
        obs(nowMs, 'ndw-traffic', 20, { minutesAgo: 1 }),
        obs(nowMs, 'parking-arnhem', 45, { minutesAgo: 3 }),
        obs(nowMs, 'ovapi-transit', 35, { minutesAgo: 0 }),
        obs(nowMs, 'osm-poi', 30, { kind: 'static' }),
        obs(nowMs, 'historical-prior', 55, { kind: 'static' }),
        obs(nowMs, 'optin-crowd', 52, { minutesAgo: 2 }),
      ],
      calm: [
        obs(nowMs, 'greenery-nl', 88, { kind: 'static' }),
        obs(nowMs, 'noise-nl', 25, { kind: 'static' }),
      ],
      social: [
        obs(nowMs, 'arnhem-events', 70, { minutesAgo: 30 }),
        obs(nowMs, 'osm-poi', 30, { kind: 'static' }),
        obs(nowMs, 'ovapi-transit', 35, { minutesAgo: 0 }),
        obs(nowMs, 'optin-crowd', 52, { minutesAgo: 2 }),
      ],
    },
  ];

  const registry = createRegistry(MANIFESTS);
  const manifestsById = Object.fromEntries(MANIFESTS.map((m) => [m.id, m]));
  // noise is inverted: a high noise reading lowers calm
  const calmInvert = { 'noise-nl': true };

  return { nowMs, registry, manifestsById, places, priorsByHour: PRIORS_BY_HOUR, calmInvert, sourceUrls: SOURCE_URLS };
}

export const ARNHEM_MANIFEST_IDS = Object.freeze(MANIFESTS.map((m) => m.id));
