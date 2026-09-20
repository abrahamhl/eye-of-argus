import { createManifest } from './manifest.js';

export const PROFILE = Object.freeze({
  PERSONAL: 'PERSONAL',
  OPEN_SOURCE: 'OPEN_SOURCE',
  RESEARCH: 'RESEARCH',
  COMMERCIAL_SAFE: 'COMMERCIAL_SAFE',
});

/** Licences treated as OSI/permissive enough for the open-source profile. */
const OPEN_LICENSES = new Set([
  'MIT',
  'Apache-2.0',
  'BSD-3-Clause',
  'CC0-1.0',
  'CC-BY-4.0',
  'PDDL-1.0',
  'ODbL-1.0',
  'OGL-2.0',
]);

export function isAllowed(manifest, profile) {
  switch (profile) {
    case PROFILE.PERSONAL:
      return true;
    case PROFILE.RESEARCH:
      return manifest.redistribution !== 'prohibited';
    case PROFILE.OPEN_SOURCE:
      return OPEN_LICENSES.has(manifest.license) || manifest.license === 'custom-permissive';
    case PROFILE.COMMERCIAL_SAFE:
      return manifest.commercialUse === true && manifest.redistribution !== 'prohibited';
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
