/**
 * Merge ground-truth JSONL files from several observers into one dataset.
 * Deduplicates by (placeId, windowStart, observer) and sorts by window start.
 * This is how multiple people validate the same zones offline, then combine.
 *
 *   node bin/merge-observations.mjs observer-a.jsonl observer-b.jsonl --out merged.jsonl
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { parseJsonl, toJsonl } from '../src/argus/calibration/jsonl.js';
import { mergeRecords } from '../src/argus/calibration/merge.js';

const args = process.argv.slice(2);
const files = [];
let outPath = 'merged.jsonl';
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--out') { outPath = args[i + 1]; i += 1; continue; }
  if (args[i].startsWith('--')) continue;
  files.push(args[i]);
}

if (files.length === 0) {
  process.stderr.write('usage: node bin/merge-observations.mjs <file.jsonl ...> --out merged.jsonl\n');
  process.exit(2);
}

const groups = files.map((file) => parseJsonl(readFileSync(file, 'utf8')));
const { merged, total, duplicates } = mergeRecords(groups);
writeFileSync(outPath, toJsonl(merged));
process.stdout.write(`merge: ${total} records in, ${merged.length} unique, ${duplicates} duplicates dropped\n`);
process.stdout.write(`wrote ${outPath}\n`);
