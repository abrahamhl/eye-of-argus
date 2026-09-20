/**
 * Privacy primitives for opt-in aggregate telemetry.
 *
 * Nothing here accepts a device identifier. The only accepted input is a
 * count that already exists as an aggregate. Cells below the k threshold are
 * suppressed rather than displayed with false precision.
 */

export const CELL_STATE = Object.freeze({
  RELEASED: 'RELEASED',
  SUPPRESSED: 'SUPPRESSED',
  UNAVAILABLE: 'UNAVAILABLE',
});

export const DEFAULT_K = 5;

export function occupancyBand(value) {
  if (value === null || value === undefined) return 'UNAVAILABLE';
  if (value < 10) return 'LOW';
  if (value < 40) return 'MODERATE';
  if (value < 80) return 'HIGH';
  return 'VERY HIGH';
}

/**
 * Suppress a single grid cell. `count` must be an aggregate, never an identity
 * list. Below k contributors the cell is withheld entirely. Released cells
 * expose a coarse band only — never the exact count.
 */
export function suppressCell({ count, k = DEFAULT_K } = {}) {
  if (count === null || count === undefined || !Number.isFinite(count)) {
    return Object.freeze({ state: CELL_STATE.UNAVAILABLE, suppressed: true });
  }
  if (count < k) {
    return Object.freeze({ state: CELL_STATE.SUPPRESSED, suppressed: true });
  }
  return Object.freeze({
    state: CELL_STATE.RELEASED,
    suppressed: false,
    band: occupancyBand(count),
  });
}

/**
 * Aggregate raw per-cell counts into a coarse spatial grid and suppress every
 * cell below k. Returns only released cells plus a count of suppressed cells.
 */
export function aggregateSpatialGrid({ cells, cellSizeM = 250, k = DEFAULT_K } = {}) {
  if (!Array.isArray(cells)) throw new Error('aggregateSpatialGrid: cells must be an array');
  const buckets = new Map();
  for (const cell of cells) {
    if (!Number.isFinite(cell.lat) || !Number.isFinite(cell.lon) || !Number.isFinite(cell.count)) {
      throw new Error('aggregateSpatialGrid: each cell needs finite lat, lon and count');
    }
    const key = `${Math.round(cell.lat / gridStep(cellSizeM))}:${Math.round(cell.lon / gridStep(cellSizeM))}`;
    buckets.set(key, (buckets.get(key) ?? 0) + cell.count);
  }
  const released = [];
  let suppressed = 0;
  for (const [key, count] of buckets) {
    const result = suppressCell({ count, k });
    if (result.suppressed) suppressed += 1;
    else released.push({ key, ...result });
  }
  return { released, suppressed, cellSizeM, k };
}

function gridStep(cellSizeM) {
  // ~111,320 m per degree latitude; approximate square cells.
  return cellSizeM / 111_320;
}

/**
 * A simple local privacy budget: at most `maxQueries` live lookups per window.
 * Exceeding it degrades to offline mode rather than quietly spending more.
 */
export function createPrivacyBudget({ windowMs = 300_000, maxQueries = 30 } = {}) {
  let windowStart = null;
  let used = 0;
  let lastNow = null;
  return {
    consume(nowMs) {
      if (!Number.isFinite(nowMs)) return { allowed: false, reason: 'invalid-clock', used, remaining: 0 };
      // Reject non-monotonic time: a caller cannot rewind or jump the window.
      if (lastNow !== null && nowMs < lastNow) {
        return { allowed: false, reason: 'non-monotonic-clock', used, remaining: Math.max(0, maxQueries - used) };
      }
      lastNow = nowMs;
      if (windowStart === null || nowMs - windowStart >= windowMs) {
        windowStart = nowMs;
        used = 0;
      }
      if (used >= maxQueries) return { allowed: false, reason: 'budget-exhausted', used, remaining: 0 };
      used += 1;
      return { allowed: true, used, remaining: maxQueries - used };
    },
  };
}
