import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Canonical XYZ registry — the single authoritative source of product claims.
 * Nothing user-facing may hardcode a claim or a measured number: the site and
 * docs render from here, and CI fails when a VERIFIED claim lacks evidence.
 *
 * X = outcome, Y = measurement (templated from the Truth Snapshot), Z =
 * engineering. `evidence` is internal and may be hidden from the public UI.
 */

export const XYZ_STATUS = Object.freeze({
  VERIFIED: 'VERIFIED',
  SUPPORTED: 'SUPPORTED',
  EXPERIMENTAL: 'EXPERIMENTAL',
  BLOCKED: 'BLOCKED',
  RETIRED: 'RETIRED',
});

export const XYZ_ENTRIES = Object.freeze([
  {
    id: 'xyz-truth-layer',
    category: 'methodology',
    audience: ['investor', 'developer', 'recruiter'],
    x: 'Product claims are generated from one evidence-backed truth layer instead of duplicated marketing strings.',
    y: 'CI intentionally fails when public claims drift from executable project state ({{tests.total}} tests; verify-site + guard).',
    z: 'Truth Snapshot + XYZ Registry + deployment verification gates.',
    evidence: {
      tests: ['test/truth-layer.test.mjs'],
      source: ['src/argus/product/truthSnapshot.js', 'src/argus/product/xyz.js', 'bin/verify-site.mjs'],
      ci: ['.github/workflows/ci.yml'],
      commit: 'HEAD',
    },
    status: XYZ_STATUS.VERIFIED,
    visibility: 'public',
    updatedAt: '2026-09-20',
  },
  {
    id: 'xyz-offline-first',
    category: 'architecture',
    audience: ['developer', 'investor', 'recruiter'],
    x: 'The intelligence core runs offline with no runtime dependencies.',
    y: '{{runtimeDependencies}} runtime dependencies; {{tests.total}} deterministic tests with no network access.',
    z: 'Zero-dependency core + recorded fixtures; CI asserts the dependency count.',
    evidence: {
      tests: ['test/adapters.test.mjs'],
      source: ['package.json'],
      ci: ['.github/workflows/ci.yml'],
      commit: null,
    },
    status: XYZ_STATUS.VERIFIED,
    visibility: 'public',
    updatedAt: '2026-09-20',
  },
  {
    id: 'xyz-normalized-confidence',
    category: 'modelling',
    audience: ['developer', 'investor'],
    x: 'Cross-unit sources are compared in one normalized space, so agreement means something.',
    y: 'Regression tests where vehicles/hour, percent and arrivals normalize to compatible values and read as agreement, and mis-normalized values read as contradiction.',
    z: 'computeEvidenceConfidence consuming normalized fusion contributions.',
    evidence: {
      tests: ['test/confidence-crossunit.test.mjs', 'test/confidence.test.mjs'],
      source: ['src/argus/confidence/confidence.js', 'src/argus/fusion/fuse.js'],
      commit: '7cafb90',
    },
    status: XYZ_STATUS.VERIFIED,
    visibility: 'public',
    updatedAt: '2026-09-20',
  },
  {
    id: 'xyz-evidence-quality',
    category: 'modelling',
    audience: ['developer', 'investor'],
    x: 'The confidence number is presented as evidence quality, not as a probability.',
    y: 'A semantics field is asserted by tests and surfaced in the API, the brief and the UI.',
    z: 'confidenceSemantics: "evidence-quality" carried on every estimate.',
    evidence: {
      tests: ['test/confidence.test.mjs'],
      source: ['src/argus/confidence/confidence.js', 'docs/EVIDENCE_MODEL.md'],
      commit: '7cafb90',
    },
    status: XYZ_STATUS.VERIFIED,
    visibility: 'public',
    updatedAt: '2026-09-20',
  },
  {
    id: 'xyz-synthetic-honesty',
    category: 'trust',
    audience: ['developer', 'investor', 'recruiter'],
    x: 'Synthetic output cannot masquerade as live telemetry.',
    y: 'Tests assert the SYNTHETIC DEMO marker in the CLI, the HTML brief and the site data; unknown is never reported as live.',
    z: 'dataClass propagation (live|synthetic|mixed|unknown) + banners.',
    evidence: {
      tests: ['test/synthetic-markers.test.mjs'],
      source: ['src/argus/sources/manifest.js', 'src/argus/fusion/fuse.js', 'src/argus/reports/placeBrief.js'],
      commit: '7cafb90',
    },
    status: XYZ_STATUS.VERIFIED,
    visibility: 'public',
    updatedAt: '2026-09-20',
  },
  {
    id: 'xyz-ndw-datex-stream',
    category: 'data',
    audience: ['developer', 'investor'],
    x: 'Eye of Argus can ingest Dutch road-traffic speed and intensity telemetry without loading the expanded DATEX document into a DOM.',
    y: 'Parser tests (including byte-by-byte split-chunk robustness) plus a recorded live run documented in docs/EXPERIMENTS.md.',
    z: 'Forward-only streaming DATEX II v3 parser + NDW adapter.',
    evidence: {
      tests: ['test/ndw-datex.test.mjs'],
      source: ['src/argus/sources/adapters/datex.js', 'src/argus/sources/adapters/index.js'],
      experiments: ['docs/EXPERIMENTS.md#exp-001'],
      commit: '593abf8',
    },
    status: XYZ_STATUS.VERIFIED,
    visibility: 'public',
    updatedAt: '2026-09-20',
  },
  {
    id: 'xyz-ovapi-gtfs',
    category: 'data',
    audience: ['developer', 'investor'],
    x: 'Eye of Argus can ingest GTFS-Realtime public-transport vehicle positions.',
    y: 'A dependency-free protobuf parser is covered by tests against a recorded fixture.',
    z: 'Minimal protobuf reader + GTFS-RT adapter.',
    evidence: {
      tests: ['test/adapters.test.mjs'],
      source: ['src/argus/sources/adapters/gtfsRealtime.js'],
      commit: 'eb8770c',
    },
    status: XYZ_STATUS.VERIFIED,
    visibility: 'public',
    updatedAt: '2026-09-20',
  },
  {
    id: 'xyz-open-meteo',
    category: 'data',
    audience: ['developer', 'investor'],
    x: 'Eye of Argus can ingest current weather as an outdoor-calm context signal.',
    y: 'Parser and normalization tests against a recorded fixture.',
    z: 'Open-Meteo adapter + weather-to-calm-context mapping.',
    evidence: {
      tests: ['test/adapters.test.mjs'],
      source: ['src/argus/sources/adapters/openMeteo.js'],
      commit: 'eb8770c',
    },
    status: XYZ_STATUS.VERIFIED,
    visibility: 'public',
    updatedAt: '2026-09-20',
  },
  {
    id: 'xyz-offline-workspace',
    category: 'offline',
    audience: ['developer', 'user', 'investor'],
    x: 'Saved places and last-known observations remain available after network loss.',
    y: 'Workspace persistence tests, including a corrupt-file degrade and a freshness check that stored data is never upgraded to live.',
    z: 'Local, user-owned workspace store.',
    evidence: {
      tests: ['test/workspace.test.mjs'],
      source: ['src/argus/workspace/store.js'],
      commit: '593abf8',
    },
    status: XYZ_STATUS.VERIFIED,
    visibility: 'public',
    updatedAt: '2026-09-20',
  },
  {
    id: 'xyz-commercial-safe',
    category: 'licensing',
    audience: ['developer', 'investor', 'recruiter'],
    x: 'A commercial build cannot silently load non-commercial data.',
    y: 'Registry tests prove NC/ND licences are excluded and the exclusion is reported.',
    z: 'Machine-readable licence profiles + NC/ND denylist in the source registry.',
    evidence: {
      tests: ['test/registry.test.mjs', 'test/verticalSlice.test.mjs'],
      source: ['src/argus/sources/registry.js'],
      commit: '7cafb90',
    },
    status: XYZ_STATUS.VERIFIED,
    visibility: 'public',
    updatedAt: '2026-09-20',
  },
  {
    id: 'xyz-privacy-k',
    category: 'privacy',
    audience: ['developer', 'investor'],
    x: 'Aggregate telemetry cells below k contributors are suppressed.',
    y: 'Suppression tests plus a site demo; released cells expose a band, never a count.',
    z: 'k-threshold suppression, grid aggregation and a local privacy budget.',
    evidence: {
      tests: ['test/privacy.test.mjs'],
      source: ['src/argus/privacy/suppression.js'],
      note: 'k=5 is an engineering placeholder, not a compliance claim.',
      commit: null,
    },
    status: XYZ_STATUS.VERIFIED,
    visibility: 'public',
    updatedAt: '2026-09-20',
  },
  {
    id: 'xyz-correlation-damping',
    category: 'modelling',
    audience: ['developer', 'investor'],
    x: 'Related mobility sources are not double-counted as independent evidence.',
    y: 'A test asserts exactly one member of a correlation group keeps full weight.',
    z: 'Correlation groups + weight damping in the fusion engine.',
    evidence: {
      tests: ['test/confidence-crossunit.test.mjs'],
      source: ['src/argus/config/methodology.js', 'src/argus/fusion/fuse.js'],
      commit: 'eb8770c',
    },
    status: XYZ_STATUS.VERIFIED,
    visibility: 'public',
    updatedAt: '2026-09-20',
  },
  {
    id: 'xyz-evidence-inspector',
    category: 'explainability',
    audience: ['developer', 'user', 'investor'],
    x: 'Every displayed number explains why it has that value.',
    y: 'Inspector tests assert raw → normalized → base weight × correlation → effective weight and the derived explanation string.',
    z: 'explainEstimate() surfaced in briefs and the simulator.',
    evidence: {
      tests: ['test/evidence-explain.test.mjs'],
      source: ['src/argus/evidence/explain.js'],
      commit: 'eb8770c',
    },
    status: XYZ_STATUS.VERIFIED,
    visibility: 'public',
    updatedAt: '2026-09-20',
  },
  {
    id: 'xyz-calibration-pipeline',
    category: 'calibration',
    audience: ['developer', 'investor'],
    x: 'A calibration pipeline exists that is ready to measure predictions against ground truth.',
    y: 'Calibration metric tests and a CLI that refuses to report on a synthetic fixture without an explicit opt-in. No accuracy is claimed.',
    z: 'Calibration metrics module + CLI + protocol.',
    evidence: {
      tests: ['test/calibration.test.mjs'],
      source: ['src/argus/calibration/metrics.js', 'bin/calibrate.mjs', 'docs/REAL_WORLD_CALIBRATION_PROTOCOL.md'],
      note: 'STATUS: NOT YET CALIBRATED. This entry must not be read as an accuracy claim.',
      commit: 'acae204',
    },
    status: XYZ_STATUS.SUPPORTED,
    visibility: 'public',
    updatedAt: '2026-09-20',
  },
  {
    id: 'xyz-cesium-globe',
    category: 'presentation',
    audience: ['developer', 'investor'],
    x: 'A full geospatial globe presentation layer integrated with the core.',
    y: 'Not yet integrated; the current presentation is a static simulator page.',
    z: 'Planned separate presentation boundary consuming the core estimates.',
    evidence: {
      tests: [],
      source: [],
      note: 'BLOCKED/PENDING. Must not be presented as achieved.',
      commit: null,
    },
    status: XYZ_STATUS.BLOCKED,
    visibility: 'public',
    updatedAt: '2026-09-20',
  },
]);

export function resolveTokens(text, snapshot) {
  return String(text).replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
    const value = path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), snapshot);
    return value === undefined || value === null ? match : String(value);
  });
}

export function publicEntries(entries = XYZ_ENTRIES) {
  return entries.filter((entry) => entry.visibility === 'public' && entry.status !== XYZ_STATUS.RETIRED);
}

export function verifiedEntries(entries = XYZ_ENTRIES) {
  return entries.filter((entry) => entry.status === XYZ_STATUS.VERIFIED);
}

export function renderEntry(entry, snapshot) {
  return {
    id: entry.id,
    category: entry.category,
    audience: entry.audience,
    status: entry.status,
    x: resolveTokens(entry.x, snapshot),
    y: resolveTokens(entry.y, snapshot),
    z: resolveTokens(entry.z, snapshot),
    updatedAt: entry.updatedAt,
  };
}

/**
 * Registry invariants. Returns a list of problems; empty means valid.
 * A VERIFIED claim must point at real evidence files that exist.
 */
export function validateXyzRegistry({ rootDir, snapshot, entries = XYZ_ENTRIES } = {}) {
  const problems = [];
  const ids = new Set();
  const statuses = new Set(Object.values(XYZ_STATUS));

  for (const entry of entries) {
    if (!entry.id) { problems.push('entry without id'); continue; }
    if (ids.has(entry.id)) problems.push(`duplicate id ${entry.id}`);
    ids.add(entry.id);
    if (!statuses.has(entry.status)) problems.push(`${entry.id}: invalid status ${entry.status}`);
    for (const field of ['x', 'y', 'z']) {
      if (!entry[field] || !String(entry[field]).trim()) problems.push(`${entry.id}: missing ${field}`);
    }

    const evidence = entry.evidence ?? {};
    const pointers = [...(evidence.tests ?? []), ...(evidence.source ?? [])];
    if (entry.status === XYZ_STATUS.VERIFIED && pointers.length === 0) {
      problems.push(`${entry.id}: VERIFIED but has no evidence pointers`);
    }
    for (const pointer of pointers) {
      if (rootDir && !existsSync(join(rootDir, pointer))) problems.push(`${entry.id}: evidence path does not exist: ${pointer}`);
    }
    if (entry.status === XYZ_STATUS.VERIFIED && snapshot) {
      const renderedY = resolveTokens(entry.y, snapshot);
      if (renderedY.includes('{{')) problems.push(`${entry.id}: unresolved token in Y`);
    }
    if (entry.status === XYZ_STATUS.BLOCKED && pointers.length > 0 && !evidence.note) {
      problems.push(`${entry.id}: BLOCKED with evidence pointers should explain why in a note`);
    }
  }

  return problems;
}
