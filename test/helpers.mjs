import { createManifest, PRIVACY_CLASS } from '../src/argus/sources/manifest.js';
import { createObservation } from '../src/argus/sources/observation.js';

export const NOW = Date.parse('2026-09-20T18:00:00Z');

export function mkManifest(overrides = {}) {
  return createManifest({
    id: 'src-a',
    provider: 'Provider A',
    type: 'test',
    geographicCoverage: 'test',
    temporalResolution: '1 min',
    license: 'MIT',
    commercialUse: true,
    redistribution: 'allowed',
    privacyClass: PRIVACY_CLASS.PUBLIC_AGGREGATE,
    sourceURL: 'https://example.test/a',
    termsURL: 'https://example.test/a',
    adapterVersion: '0.0.1',
    confidencePrior: 0.8,
    ...overrides,
  });
}

export function mkObs({ sourceId = 'src-a', value = 50, kind = 'observed', minutesAgo = 0, ...rest } = {}) {
  return createObservation({
    sourceId,
    kind,
    observedAtMs: kind === 'static' ? null : NOW - minutesAgo * 60_000,
    value,
    ...rest,
  });
}

export function manifestsById(...manifests) {
  return Object.fromEntries(manifests.map((m) => [m.id, m]));
}
