/** Small statistical helpers for calibration. No dependencies. */

export function mean(values) {
  if (!values || values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Wilson score interval for a binomial proportion (default 95%). */
export function wilsonInterval(successes, total, z = 1.96) {
  if (!Number.isFinite(total) || total <= 0) return { low: null, high: null, p: null };
  const p = successes / total;
  const denom = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / denom;
  return {
    p: Number(p.toFixed(4)),
    low: Number(Math.max(0, center - half).toFixed(4)),
    high: Number(Math.min(1, center + half).toFixed(4)),
  };
}

export function midpoint(low, high) {
  if (Number.isFinite(low) && Number.isFinite(high)) return (low + high) / 2;
  if (Number.isFinite(low)) return low;
  if (Number.isFinite(high)) return high;
  return null;
}

/** Expected calibration error over `bins` confidence bins. */
export function expectedCalibrationError(pairs, bins = 5) {
  const valid = pairs.filter((p) => Number.isFinite(p.confidence) && (p.outcome === 0 || p.outcome === 1));
  if (valid.length === 0) return null;
  const buckets = Array.from({ length: bins }, () => ({ count: 0, conf: 0, out: 0 }));
  for (const pair of valid) {
    const index = Math.min(bins - 1, Math.max(0, Math.floor(pair.confidence * bins)));
    buckets[index].count += 1;
    buckets[index].conf += pair.confidence;
    buckets[index].out += pair.outcome;
  }
  let ece = 0;
  for (const bucket of buckets) {
    if (bucket.count === 0) continue;
    ece += (bucket.count / valid.length) * Math.abs(bucket.conf / bucket.count - bucket.out / bucket.count);
  }
  return Number(ece.toFixed(4));
}
