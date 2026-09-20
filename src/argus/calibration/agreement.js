/**
 * Inter-observer agreement for categorical bands. This validates the *rubric*
 * and the observers themselves — the foundation before any model claim.
 */

export const BANDS = Object.freeze(['LOW', 'MODERATE', 'HIGH', 'VERY HIGH']);

/** Percent of items where every rater agreed on the band. */
export function percentAgreement(items) {
  const usable = items.filter((ratings) => ratings.length >= 2);
  if (usable.length === 0) return null;
  const unanimous = usable.filter((ratings) => new Set(ratings).size === 1).length;
  return Number((unanimous / usable.length).toFixed(4));
}

/**
 * Fleiss' kappa for items with a variable number of ratings.
 * Returns { kappa, pBar, pExpected, items } or null when undefined.
 */
export function fleissKappa(items) {
  const usable = items.filter((ratings) => ratings.length >= 2);
  if (usable.length === 0) return null;

  const categories = [...new Set(usable.flat())];
  const totals = new Map(categories.map((c) => [c, 0]));
  let totalRatings = 0;
  let pBarSum = 0;

  for (const ratings of usable) {
    const n = ratings.length;
    const counts = new Map();
    for (const rating of ratings) {
      counts.set(rating, (counts.get(rating) ?? 0) + 1);
      totals.set(rating, (totals.get(rating) ?? 0) + 1);
    }
    totalRatings += n;
    let sumSquares = 0;
    for (const value of counts.values()) sumSquares += value * value;
    pBarSum += (sumSquares - n) / (n * (n - 1));
  }

  const pBar = pBarSum / usable.length;
  let pExpected = 0;
  for (const value of totals.values()) {
    const p = value / totalRatings;
    pExpected += p * p;
  }
  if (pExpected >= 1) return { kappa: null, pBar: Number(pBar.toFixed(4)), pExpected: Number(pExpected.toFixed(4)), items: usable.length };
  return {
    kappa: Number(((pBar - pExpected) / (1 - pExpected)).toFixed(4)),
    pBar: Number(pBar.toFixed(4)),
    pExpected: Number(pExpected.toFixed(4)),
    items: usable.length,
  };
}

/** Majority (modal) band for one item; ties resolved deterministically by BANDS order. */
export function modalBand(ratings) {
  const counts = new Map();
  for (const rating of ratings) counts.set(rating, (counts.get(rating) ?? 0) + 1);
  let best = null;
  let bestCount = 0;
  for (const band of BANDS) {
    const count = counts.get(band) ?? 0;
    if (count > bestCount) { best = band; bestCount = count; }
  }
  return best;
}

/** Convenience: kappa quality label (Landis & Koch). */
export function kappaLabel(kappa) {
  if (kappa === null || kappa === undefined) return 'UNDEFINED';
  if (kappa < 0) return 'POOR';
  if (kappa < 0.2) return 'SLIGHT';
  if (kappa < 0.4) return 'FAIR';
  if (kappa < 0.6) return 'MODERATE';
  if (kappa < 0.8) return 'SUBSTANTIAL';
  return 'ALMOST PERFECT';
}
