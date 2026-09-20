/**
 * Validation CLI. Reads field ground truth (JSONL) and, optionally, model
 * predictions, then reports observer reliability and model metrics. It never
 * invents predictions or ground truth.
 *
 *   node bin/validate.mjs --truth out/field/truth.jsonl
 *   node bin/validate.mjs --truth out/field/truth.jsonl --predictions out/field/predictions.jsonl
 *
 * Ground-truth record:
 *   {"placeId","name","lat","lon","windowStart","durationSec","band","countLow","countHigh","observer","notes"}
 * Prediction record:
 *   {"placeId","windowStart","band","score","rangeLow","rangeHigh","confidence","confidenceState"}
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseJsonl } from '../src/argus/calibration/jsonl.js';
import { validateRun } from '../src/argus/calibration/validate.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'out', 'validation');

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const truthPath = arg('--truth');
if (!truthPath) {
  process.stderr.write('usage: node bin/validate.mjs --truth <truth.jsonl> [--predictions <pred.jsonl>] [--tolerance-min 5]\n');
  process.exit(2);
}

const toleranceMinutes = Number(arg('--tolerance-min', '5'));
const truth = parseJsonl(readFileSync(truthPath, 'utf8'));
if (truth.length === 0) {
  process.stderr.write('validate: no ground-truth records; nothing to report.\n');
  process.exit(1);
}

const predictionsPath = arg('--predictions');
const predictions = predictionsPath ? parseJsonl(readFileSync(predictionsPath, 'utf8')) : [];

const report = validateRun({ truth, predictions, toleranceMinutes });
report.generatedAt = new Date().toISOString();
report.toleranceMinutes = toleranceMinutes;

mkdirSync(OUT, { recursive: true });
const file = join(OUT, `validation-${Date.now()}.json`);
writeFileSync(file, JSON.stringify(report, null, 2) + '\n');

const lines = [];
lines.push('EYE OF ARGUS — validation report');
lines.push(`status: ${report.status}`);
lines.push(`ground truth: ${report.truth.records} records, ${report.truth.windows} windows, ${report.truth.observers.length} observer(s)`);
const fleiss = report.agreement.fleiss;
if (fleiss) lines.push(`observer agreement: ${(report.agreement.percentAgreement * 100).toFixed(1)}% unanimous; Fleiss kappa=${fleiss.kappa} (${fleiss.label})`);
else lines.push('observer agreement: not enough overlapping observations yet (need >=2 observers per window)');
if (report.model) {
  const m = report.model;
  lines.push(`model: N=${m.n} accuracy=${m.accuracy} (95% CI ${m.accuracyInterval.low}-${m.accuracyInterval.high})`);
  lines.push(`false-high=${m.falseHigh.count}/${m.falseHigh.ofTruthLow}  false-low=${m.falseLow.count}/${m.falseLow.ofTruthHigh}  MAE=${m.mae} (N=${m.maeN})  Brier=${m.brier}  ECE=${m.ece}`);
} else {
  lines.push('model: no predictions supplied — reliability only (calibration status NOT_YET_CALIBRATED).');
}
lines.push(`wrote ${file}`);

process.stdout.write(lines.join('\n') + '\n');
