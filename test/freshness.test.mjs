import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyFreshness, freshnessWeight, FRESHNESS } from '../src/argus/time/freshness.js';

const now = Date.parse('2026-09-20T18:00:00Z');

test('a reading inside the live window is LIVE', () => {
  assert.equal(classifyFreshness({ kind: 'observed', observedAtMs: now - 60_000, nowMs: now }), FRESHNESS.LIVE);
});

test('a reading between live and cached windows is CACHED', () => {
  assert.equal(classifyFreshness({ kind: 'observed', observedAtMs: now - 300_000, nowMs: now }), FRESHNESS.CACHED);
});

test('a reading past the cached window is STALE', () => {
  assert.equal(classifyFreshness({ kind: 'observed', observedAtMs: now - 1_000_000, nowMs: now }), FRESHNESS.STALE);
});

test('inferred data is never promoted to LIVE', () => {
  assert.equal(classifyFreshness({ kind: 'inferred', observedAtMs: now, nowMs: now }), FRESHNESS.INFERRED);
});

test('static data keeps its own state', () => {
  assert.equal(classifyFreshness({ kind: 'static', observedAtMs: null, nowMs: now }), FRESHNESS.STATIC);
});

test('a future timestamp is untrusted and treated as UNAVAILABLE', () => {
  assert.equal(classifyFreshness({ kind: 'observed', observedAtMs: now + 60_000, nowMs: now }), FRESHNESS.UNAVAILABLE);
});

test('a missing timestamp is UNAVAILABLE', () => {
  assert.equal(classifyFreshness({ kind: 'observed', observedAtMs: undefined, nowMs: now }), FRESHNESS.UNAVAILABLE);
});

test('freshness weights are ordered live > static > cached > inferred > stale', () => {
  const w = (state) => freshnessWeight(state);
  assert.ok(w(FRESHNESS.LIVE) > w(FRESHNESS.STATIC));
  assert.ok(w(FRESHNESS.STATIC) > w(FRESHNESS.CACHED));
  assert.ok(w(FRESHNESS.CACHED) > w(FRESHNESS.INFERRED));
  assert.ok(w(FRESHNESS.INFERRED) > w(FRESHNESS.STALE));
  assert.equal(w(FRESHNESS.UNAVAILABLE), 0);
});
