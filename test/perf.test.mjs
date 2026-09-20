import test from 'node:test';
import assert from 'node:assert/strict';
import { fuse } from '../src/argus/fusion/fuse.js';
import { mkManifest, mkObs, manifestsById, NOW } from './helpers.mjs';

test('fusion of 1000 observations stays within a generous time budget and is deterministic', () => {
  const manifests = [];
  const observations = [];
  for (let i = 0; i < 1000; i += 1) {
    const id = `src-${i}`;
    manifests.push(mkManifest({ id, provider: `Provider ${i % 20}`, confidencePrior: 0.5 + (i % 5) / 10 }));
    observations.push(mkObs({ sourceId: id, value: 30 + (i % 60), minutesAgo: i % 5 }));
  }
  const input = { signal: 'crowd', observations, manifestsById: manifestsById(...manifests), nowMs: NOW };

  const started = performance.now();
  const first = fuse(input);
  const elapsed = performance.now() - started;
  const second = fuse(input);

  assert.ok(Number.isFinite(first.estimate.score));
  assert.equal(JSON.stringify(first), JSON.stringify(second), 'fusion must be deterministic');
  assert.ok(elapsed < 2000, `fusion took ${elapsed.toFixed(0)}ms, budget is 2000ms`);
});
