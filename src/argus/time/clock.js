/**
 * Deterministic clock. Every scoring path takes an explicit `nowMs` so tests
 * and reports never depend on wall-clock time.
 */

export function createClock(fixedIso) {
  // Require an explicit timezone (Z or +hh:mm/-hh:mm) so the pinned instant is
  // identical on every machine; a bare local timestamp is machine-dependent.
  if (fixedIso && !/(Z|[+-]\d{2}:\d{2})$/.test(fixedIso)) {
    throw new Error(`createClock: "${fixedIso}" must include a timezone (Z or ±hh:mm)`);
  }
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
