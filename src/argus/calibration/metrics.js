/**
 * Calibration metrics. These are pure functions so they can be unit-tested and
 * reused by the CLI. They never fetch anything and never invent a result: an
 * empty input returns null, not a made-up number.
 */

export function bandAccuracy(pairs) {
  if (!Array.isArray(pairs) || pairs.length === 0) return null;
  const correct = pairs.filter((p) => p.predictedBand === p.truthBand).length;
  return Number((correct / pairs.length).toFixed(4));
}

export function meanAbsoluteError(pairs) {
  const valid = (pairs ?? []).filter((p) => Number.isFinite(p.predicted) && Number.isFinite(p.truth));
  if (valid.length === 0) return null;
  const total = valid.reduce((acc, p) => acc + Math.abs(p.predicted - p.truth), 0);
  return Number((total / valid.length).toFixed(4));
}

export function brierScore(pairs) {
  const valid = (pairs ?? []).filter((p) => Number.isFinite(p.probability) && (p.outcome === 0 || p.outcome === 1));
  if (valid.length === 0) return null;
  const total = valid.reduce((acc, p) => acc + (p.probability - p.outcome) ** 2, 0);
  return Number((total / valid.length).toFixed(4));
}

/**
 * Calibration curve: bin predictions by confidence and compare the mean
 * predicted confidence with the observed frequency of the positive outcome.
 * A well-calibrated model has observedFrequency close to meanConfidence.
 */
export function calibrationCurve(pairs, binCount = 5) {
  const valid = (pairs ?? []).filter((p) => Number.isFinite(p.confidence) && (p.outcome === 0 || p.outcome === 1));
  if (valid.length === 0) return [];
  const bins = Array.from({ length: binCount }, (_, i) => ({
    binLow: Number((i / binCount).toFixed(2)),
    binHigh: Number(((i + 1) / binCount).toFixed(2)),
    count: 0,
    confidenceSum: 0,
    outcomeSum: 0,
  }));
  for (const pair of valid) {
    const index = Math.min(binCount - 1, Math.max(0, Math.floor(pair.confidence * binCount)));
    const bin = bins[index];
    bin.count += 1;
    bin.confidenceSum += pair.confidence;
    bin.outcomeSum += pair.outcome;
  }
  return bins
    .filter((bin) => bin.count > 0)
    .map((bin) => ({
      binLow: bin.binLow,
      binHigh: bin.binHigh,
      count: bin.count,
      meanConfidence: Number((bin.confidenceSum / bin.count).toFixed(4)),
      observedFrequency: Number((bin.outcomeSum / bin.count).toFixed(4)),
    }));
}

export function evaluate(fixture) {
  return {
    observations: fixture?.length ?? 0,
    bandAccuracy: bandAccuracy(fixture),
    meanAbsoluteError: meanAbsoluteError(
      (fixture ?? []).map((p) => ({ predicted: p.predictedScore, truth: p.truthValue })),
    ),
    brierScore: brierScore(fixture),
    calibrationCurve: calibrationCurve(fixture),
  };
}
