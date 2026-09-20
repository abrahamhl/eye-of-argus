/**
 * Records a dated live-verification artifact for the Truth Snapshot.
 * Run manually (network). This is evidence for "liveStatus", not a CI gate.
 *
 *   node bin/record-live-verification.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectLive, LIVE_MANIFESTS } from '../src/argus/sources/adapters/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const nowMs = Date.now();
const { results } = await collectLive({ mode: 'live', nowMs, timeoutMs: 15000 });

const artifact = {
  checkedAt: new Date(nowMs).toISOString(),
  method: 'node bin/record-live-verification.mjs',
  sources: LIVE_MANIFESTS.map((manifest) => {
    const result = results.find((r) => r.sourceId === manifest.id) ?? { ok: false, error: 'no-result' };
    return { sourceId: manifest.id, ok: Boolean(result.ok), error: result.error ?? null };
  }),
  responded: results.filter((r) => r.ok).length,
  total: LIVE_MANIFESTS.length,
  note: 'Single live run. A historical observation, not a standing guarantee of upstream availability.',
};

mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'live-verification.json'), JSON.stringify(artifact, null, 2) + '\n');
process.stdout.write(JSON.stringify(artifact, null, 2) + '\n');
