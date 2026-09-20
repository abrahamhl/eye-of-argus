/**
 * Verifies the GitHub Pages artifact against the Truth Snapshot and XYZ
 * registry before it is uploaded. Deployment fails on truth drift.
 *
 *   node bin/verify-site.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTruthSnapshot, REPO_ROOT } from '../src/argus/product/truthSnapshot.js';
import { publicEntries, validateXyzRegistry } from '../src/argus/product/xyz.js';

const SITE = join(REPO_ROOT, 'site');
const snapshot = buildTruthSnapshot();

const failures = [];
function check(condition, message) { if (!condition) failures.push(message); }

for (const file of ['index.html', 'styles.css', 'app.js', 'data.json']) {
  check(existsSync(join(SITE, file)), `missing site/${file}`);
}

if (existsSync(join(SITE, 'index.html'))) {
  const html = readFileSync(join(SITE, 'index.html'), 'utf8');
  check(html.includes('styles.css'), 'index.html does not reference styles.css');
  check(html.includes('app.js'), 'index.html does not reference app.js');
  check(html.includes('id="radar"'), 'index.html has no #radar canvas');
  check(html.includes('SYNTHETIC DEMO'), 'index.html must carry a SYNTHETIC DEMO marker');
}

if (existsSync(join(SITE, 'app.js'))) {
  const app = readFileSync(join(SITE, 'app.js'), 'utf8');
  check(app.includes("fetch('data.json'"), 'app.js does not load data.json');
  check(app.includes('synthetic-banner'), 'app.js must reveal the synthetic banner');
}

// Field validation PWA must ship with the artifact.
for (const file of ['index.html', 'app.js', 'styles.css', 'manifest.webmanifest', 'sw.js']) {
  check(existsSync(join(SITE, 'field', file)), `missing site/field/${file}`);
}
if (existsSync(join(SITE, 'field', 'index.html'))) {
  const field = readFileSync(join(SITE, 'field', 'index.html'), 'utf8');
  check(field.includes('app.js'), 'field/index.html does not reference app.js');
  check(field.includes('GROUND-TRUTH'), 'field app must state it is ground-truth collection');
}

let data = null;
if (existsSync(join(SITE, 'data.json'))) {
  try { data = JSON.parse(readFileSync(join(SITE, 'data.json'), 'utf8')); }
  catch (error) { failures.push(`data.json is not valid JSON: ${error.message}`); }
}

if (data) {
  check(data.product === 'Eye of Argus', 'data.product mismatch');
  check(data.methodologyVersion, 'missing methodologyVersion');
  check(data.synthetic === true, 'demo data must be marked synthetic');
  check(data.dataClass === 'synthetic', 'data.dataClass must be synthetic for the demo');
  check(data.evidence?.runtimeDependencies === snapshot.runtimeDependencies, 'runtime dependency count drifted');
  check(data.evidence?.tests === snapshot.tests.total, `published test count ${data.evidence?.tests} != snapshot ${snapshot.tests.total}`);

  // Truth Snapshot is surfaced for the technical investor view.
  const inv = data.investorSnapshot ?? {};
  check(typeof inv.tests === 'string', 'investorSnapshot.tests missing');
  check(inv.runtimeDependencies === snapshot.runtimeDependencies, 'investorSnapshot runtime deps drifted');
  check(inv.adaptersLiveCapable === snapshot.adapters.liveCapable, 'investorSnapshot live-capable adapters drifted');
  check(inv.calibration === 'NOT_YET_CALIBRATED', 'investorSnapshot calibration must be NOT_YET_CALIBRATED');
  check(inv.commercialSafe === 'ACTIVE', 'investorSnapshot commercial-safe must be ACTIVE');
  check(inv.fieldValidation === 'AVAILABLE', 'investorSnapshot field validation must be AVAILABLE');

  // Calibration truth must never be overstated.
  check(data.calibration?.status === 'NOT_YET_CALIBRATED', 'calibration status must be NOT_YET_CALIBRATED');

  // Adapters: implementation, fixture and live status must stay distinct.
  check(Array.isArray(data.adapters) && data.adapters.length === snapshot.adapters.total, 'adapter registry drifted');
  for (const adapter of data.adapters ?? []) {
    check(adapter.implementationStatus === 'IMPLEMENTED', `${adapter.id}: implementationStatus`);
    check(['FIXTURE_VERIFIED', 'NO_FIXTURE'].includes(adapter.fixtureStatus), `${adapter.id}: fixtureStatus`);
    check(['LIVE_VERIFIED', 'LIVE_NOT_VERIFIED', 'NOT_LIVE_VERIFIED'].includes(adapter.liveStatus), `${adapter.id}: liveStatus`);
  }

  // XYZ: rendered entries must match the registry and carry no unresolved tokens.
  const expected = publicEntries();
  check(Array.isArray(data.xyz) && data.xyz.length === expected.length, `rendered XYZ count ${data.xyz?.length} != registry ${expected.length}`);
  for (const entry of data.xyz ?? []) {
    check(entry.x && entry.y && entry.z, `${entry.id}: missing X/Y/Z`);
    check(!String(entry.x + entry.y + entry.z).includes('{{'), `${entry.id}: unresolved token`);
    check(typeof entry.status === 'string', `${entry.id}: missing status`);
  }

  for (const profile of ['COMMERCIAL_SAFE', 'PERSONAL']) {
    const p = data.profiles?.[profile];
    check(p, `profile ${profile} missing`);
    if (!p) continue;
    check(Array.isArray(p.places) && p.places.length >= 2, `profile ${profile} needs >=2 places`);
    for (const place of p.places) {
      for (const signal of ['crowd', 'calm', 'social']) {
        const s = place.signals?.[signal];
        check(s, `${profile}/${place.id}/${signal} missing`);
        if (!s) continue;
        check(s.forecast?.length === 4, `${profile}/${place.id}/${signal} needs 4 horizons`);
        check(Array.isArray(s.contributions) && s.contributions.length > 0, `${profile}/${place.id}/${signal} has no contributions`);
        check(typeof s.confidence === 'number', `${profile}/${place.id}/${signal} has no confidence`);
        check(typeof s.dataClass === 'string', `${profile}/${place.id}/${signal} missing dataClass`);
      }
    }
  }

  const safeExcluded = data.profiles?.COMMERCIAL_SAFE?.excluded ?? [];
  check(safeExcluded.length >= 1, 'COMMERCIAL_SAFE must exclude the non-commercial source');

  const examples = data.privacy?.examples ?? [];
  check(examples.some((e) => e.suppressed === true), 'privacy example with suppression missing');
  check(examples.some((e) => e.suppressed === false), 'privacy example with release missing');
  check(examples.every((e) => e.suppressed || !('value' in e)), 'released privacy cell must not expose a count');
}

// Registry invariants: every VERIFIED claim must point at real evidence files.
const registryProblems = validateXyzRegistry({ rootDir: REPO_ROOT, snapshot });
for (const problem of registryProblems) failures.push(`xyz: ${problem}`);

if (failures.length) {
  process.stderr.write('site verification FAILED:\n');
  for (const f of failures) process.stderr.write(`  - ${f}\n`);
  process.exit(1);
}
process.stdout.write(`site verification OK: ${data.xyz.length} XYZ entries, ${data.evidence.tests} tests, calibration ${data.calibration.status}.\n`);
