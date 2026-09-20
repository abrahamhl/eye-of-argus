/**
 * Deterministic clock. Every scoring path takes an explicit `nowMs` so tests
 * and reports never depend on wall-clock time.
 */

export function createClock(fixedIso) {
  const fixedMs = fixedIso ? Date.parse(fixedIso) : null;
  if (fixedIso && Number.isNaN(fixedMs)) {
    throw new Error(`createClock: invalid ISO timestamp ${fixedIso}`);
  }
  return {
    fixed: fixedMs !== null,
    nowMs: () => (fixedMs !== null ? fixedMs : Date.now()),
  };
}

export function minutesToMs(minutes) {
  return Math.round(minutes * 60_000);
}

export function isoFromMs(ms) {
  return new Date(ms).toISOString();
}
