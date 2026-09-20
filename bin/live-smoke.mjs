/**
 * Live smoke check. This is the ONLY script that performs live network fetches
 * for adapters. It is intentionally NOT part of the deterministic CI suite; it
 * runs via .github/workflows/live-smoke.yml (manual or scheduled).
 *
 *   node bin/live-smoke.mjs
 */
import { collectLive, LIVE_MANIFESTS } from '../src/argus/sources/adapters/index.js';

const nowMs = Date.now();
const { observations, results } = await collectLive({ mode: 'live', nowMs, timeoutMs: 15000 });

const report = {
  mode: 'live',
  checkedAt: new Date(nowMs).toISOString(),
  sources: LIVE_MANIFESTS.map((m) => m.id),
  results,
  observations: observations.map((o) => ({ sourceId: o.sourceId, value: o.value, observedAtMs: o.observedAtMs, meta: o.meta })),
};

process.stdout.write(JSON.stringify(report, null, 2) + '\n');

const ok = results.filter((r) => r.ok).length;
process.stdout.write(`\nlive smoke: ${ok}/${LIVE_MANIFESTS.length} sources responded\n`);
if (observations.length === 0) {
  process.stderr.write('live smoke FAILED: no source returned an observation\n');
  process.exit(1);
}
