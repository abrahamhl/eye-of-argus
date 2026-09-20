import { createManifest } from './manifest.js';

export const PROFILE = Object.freeze({
  PERSONAL: 'PERSONAL',
  OPEN_SOURCE: 'OPEN_SOURCE',
  RESEARCH: 'RESEARCH',
  COMMERCIAL_SAFE: 'COMMERCIAL_SAFE',
});

/** Licences treated as OSI/permissive enough for the open-source profile. */
const OPEN_LICENSES = new Set([
  'mit',
  'apache-2.0',
  'bsd-3-clause',
  'cc0-1.0',
  'cc-by-4.0',
  'pddl-1.0',
  'odbl-1.0',
  'ogl-2.0',
]);

/**
 * A licence string that signals non-commercial or no-derivatives terms must
 * block COMMERCIAL_SAFE even if the manifest's commercialUse flag is wrong.
 * Never trust a single hand-typed boolean.
 */
const NON_COMMERCIAL_PATTERNS = [
  /non-?commercial/i,
  /(^|[^a-z])nc([^a-z]|$)/i,
  /(^|[^a-z])nd([^a-z]|$)/i,
];

export function isNonCommercialLicense(license) {
  return NON_COMMERCIAL_PATTERNS.some((pattern) => pattern.test(String(license)));
}

export function isAllowed(manifest, profile) {
  const license = String(manifest.license).toLowerCase();
  switch (profile) {
    case PROFILE.PERSONAL:
      return true;
    case PROFILE.RESEARCH:
      return manifest.redistribution !== 'prohibited';
    case PROFILE.OPEN_SOURCE:
      return OPEN_LICENSES.has(license) || license === 'custom-permissive';
    case PROFILE.COMMERCIAL_SAFE:
      return (
        manifest.commercialUse === true &&
        manifest.redistribution !== 'prohibited' &&
        !isNonCommercialLicense(license)
      );
    default:
      throw new Error(`unknown licence profile "${profile}"`);
  }
}

export function createRegistry(manifests = []) {
  const byId = new Map();
  for (const raw of manifests) {
    const manifest = raw.id ? raw : createManifest(raw);
    if (byId.has(manifest.id)) {
      throw new Error(`duplicate source id "${manifest.id}"`);
    }
    byId.set(manifest.id, manifest);
  }

  return Object.freeze({
    get: (id) => byId.get(id) ?? null,
    all: () => [...byId.values()],
    size: () => byId.size,
    forProfile: (profile) => [...byId.values()].filter((m) => isAllowed(m, profile)),
    ids: () => [...byId.keys()],
  });
}

/**
 * Given a set of observations, drop any whose source is not allowed under the
 * active profile. Returns the kept observations and the excluded source ids so
 * the exclusion is visible in reports, never silent.
 */
export function filterByProfile(observations, registry, profile) {
  const kept = [];
  const excluded = [];
  for (const observation of observations) {
    const manifest = registry.get(observation.sourceId);
    if (!manifest) {
      excluded.push(observation.sourceId);
      continue;
    }
    if (isAllowed(manifest, profile)) kept.push(observation);
    else excluded.push(observation.sourceId);
  }
  return { kept, excluded: [...new Set(excluded)] };
}
