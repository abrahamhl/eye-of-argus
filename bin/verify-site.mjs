/**
 * Verifies the GitHub Pages artifact before it is uploaded. This is a real
 * gate: the deploy workflow will not publish a broken or empty simulator.
 *
 *   node bin/verify-site.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');

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

let data = null;
if (existsSync(join(SITE, 'data.json'))) {
  try {
    data = JSON.parse(readFileSync(join(SITE, 'data.json'), 'utf8'));
  } catch (error) {
    failures.push(`data.json is not valid JSON: ${error.message}`);
  }
}

if (data) {
  check(data.product === 'Eye of Argus', 'data.product mismatch');
  check(data.methodologyVersion, 'missing methodologyVersion');
  check(data.synthetic === true, 'demo data must be marked synthetic');
  check(data.dataClass === 'synthetic', 'data.dataClass must be synthetic for the demo');
  check(Number.isInteger(data.evidence?.tests) && data.evidence.tests > 0, 'evidence.tests missing');
  check(data.evidence?.runtimeDependencies === 0, 'runtime dependencies must be zero');
  check(Array.isArray(data.xyz) && data.xyz.length >= 3, 'xyz statements missing');
  check(data.upstream?.sha?.length === 40, 'upstream sha is not a full 40-char commit');

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

if (failures.length) {
  process.stderr.write('site verification FAILED:\n');
  for (const f of failures) process.stderr.write(`  - ${f}\n`);
  process.exit(1);
}
process.stdout.write('site verification OK: simulator artifact is complete and consistent.\n');
