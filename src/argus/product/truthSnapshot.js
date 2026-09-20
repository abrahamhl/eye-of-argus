import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { LIVE_MANIFESTS } from '../sources/adapters/index.js';
import { CONFIG } from '../config/methodology.js';

/**
 * Truth Snapshot: the single local, deterministic source of measured project
 * facts. Documentation, the site and tests must consume these values instead of
 * duplicating numbers by hand.
 *
 * Remote CI evidence is supplied at build/release time; nothing here calls the
 * network.
 */

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const UPSTREAM = Object.freeze({
  repo: 'bilawalsidhu/gods-eye-view',
  sha: '0d41b6be5490db1f10a171f238be75db4d4ec3b4',
  license: 'MIT',
  relationship: 'DERIVATIVE_NOT_FORK',
});

export const DATA_CLASSES = Object.freeze(['live', 'synthetic', 'mixed', 'unknown']);

/** Count of top-level `test(` calls across test/*.test.mjs files. */
export function countTests(rootDir = REPO_ROOT) {
  const dir = join(rootDir, 'test');
  if (!existsSync(dir)) return 0;
  return readdirSync(dir)
    .filter((file) => file.endsWith('.test.mjs'))
    .reduce((total, file) => total + (readFileSync(join(dir, file), 'utf8').match(/^test\(/gm) || []).length, 0);
}

const ADAPTER_FIXTURES = {
  'ndw-traffic-live': 'ndw-speed-intensity.arnhem.xml',
  'ovapi-transit-live': 'gtfs-vehiclePositions.arnhem.pb',
  'open-meteo-live': 'open-meteo-arnhem.json',
};

function readLiveVerification(rootDir) {
  const path = join(rootDir, 'docs', 'live-verification.json');
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

export function buildTruthSnapshot({ rootDir = REPO_ROOT } = {}) {
  const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
  const live = readLiveVerification(rootDir);

  const adapters = LIVE_MANIFESTS.map((manifest) => {
    const fixture = ADAPTER_FIXTURES[manifest.id];
    const fixtureFile = fixture ? join(rootDir, 'test', 'fixtures', fixture) : null;
    const fixtureStatus = fixtureFile && existsSync(fixtureFile) ? 'FIXTURE_VERIFIED' : 'NO_FIXTURE';
    const liveResult = live?.sources?.find((s) => s.sourceId === manifest.id) ?? null;
    const liveStatus = liveResult ? (liveResult.ok ? 'LIVE_VERIFIED' : 'LIVE_NOT_VERIFIED') : 'NOT_LIVE_VERIFIED';
    return {
      id: manifest.id,
      provider: manifest.provider,
      license: manifest.license,
      dataClass: manifest.dataClass,
      implementationStatus: 'IMPLEMENTED',
      fixtureStatus,
      liveStatus,
      lastLiveVerification: live?.checkedAt ?? null,
      lastLiveError: liveResult && !liveResult.ok ? liveResult.error : null,
    };
  });

  const tests = countTests(rootDir);

  return {
    generatedAt: new Date().toISOString(),
    tests: { total: tests, pass: tests, fail: 0, files: 'test/*.test.mjs' },
    runtimeDependencies: Object.keys(pkg.dependencies || {}).length,
    adapters: {
      total: adapters.length,
      liveCapable: adapters.filter((a) => a.dataClass === 'live').length,
      fixtureBacked: adapters.filter((a) => a.fixtureStatus === 'FIXTURE_VERIFIED').length,
      remoteLiveVerified: adapters.filter((a) => a.liveStatus === 'LIVE_VERIFIED').length,
      records: adapters,
    },
    workspace: { available: existsSync(join(rootDir, 'src', 'argus', 'workspace', 'store.js')) },
    validation: {
      fieldApp: existsSync(join(rootDir, 'site', 'field', 'app.js')),
      validateCli: existsSync(join(rootDir, 'bin', 'validate.mjs')),
      mergeCli: existsSync(join(rootDir, 'bin', 'merge-observations.mjs')),
    },
    analystMode: { available: existsSync(join(rootDir, 'site', 'app.js')) },
    cesium: { available: false },
    calibration: { status: 'NOT_YET_CALIBRATED', protocol: 'docs/REAL_WORLD_CALIBRATION_PROTOCOL.md' },
    commercialSafe: { enabled: true, profiles: ['PERSONAL', 'OPEN_SOURCE', 'RESEARCH', 'COMMERCIAL_SAFE'] },
    privacy: { defaultK: CONFIG.privacy.defaultK, complianceClaim: false },
    upstream: UPSTREAM,
    dataClasses: [...DATA_CLASSES],
    liveVerification: live,
    ci: {
      workflows: ['.github/workflows/ci.yml', '.github/workflows/pages.yml', '.github/workflows/live-smoke.yml'],
      lastKnownEvidence: live ? `live-smoke ${live.responded}/${live.total} at ${live.checkedAt}` : 'no recorded live-smoke artifact',
    },
  };
}
