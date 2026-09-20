/**
 * Calibration CLI. Reads a labelled fixture and prints metrics. It refuses to
 * emit an accuracy claim from an empty or synthetic-only fixture: the caller
 * must pass `--allow-synthetic` and the output is marked accordingly.
 *
 *   node bin/calibrate.mjs --fixture path/to/labelled.json [--allow-synthetic]
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate } from '../src/argus/calibration/metrics.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'out', 'calibration');

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const fixturePath = arg('--fixture');
if (!fixturePath) {
  process.stderr.write('usage: node bin/calibrate.mjs --fixture <labelled.json> [--allow-synthetic]\n');
  process.exit(2);
}

const allowSynthetic = process.argv.includes('--allow-synthetic');
const rawText = readFileSync(fixturePath, 'utf8').replace(/^\uFEFF/, '');
const fixture = JSON.parse(rawText);
const records = Array.isArray(fixture) ? fixture : fixture.observations;

if (!Array.isArray(records) || records.length === 0) {
  process.stderr.write('calibration: no observations; refusing to report metrics.\n');
  process.exit(1);
}

const syntheticOnly = fixture?.synthetic === true;
if (syntheticOnly && !allowSynthetic) {
  process.stderr.write('calibration: fixture is marked synthetic; pass --allow-synthetic to compute metrics for development only.\n');
  process.exit(1);
}

const metrics = evaluate(records);
const report = {
  generatedAt: new Date().toISOString(),
  fixture: fixturePath,
  synthetic: Boolean(syntheticOnly),
  methodologyVersion: fixture?.methodologyVersion ?? 'unversioned',
  metrics,
  warning: syntheticOnly ? 'SYNTHETIC FIXTURE — not ground truth; not for publication.' : null,
};

mkdirSync(OUT, { recursive: true });
const outPath = join(OUT, `calibration-${Date.now()}.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2));
process.stdout.write(JSON.stringify(report, null, 2) + `\n\nWrote ${outPath}\n`);
