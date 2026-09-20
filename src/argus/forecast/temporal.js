import { bandFor } from '../confidence/confidence.js';

export const DEFAULT_HORIZONS = Object.freeze([0, 15, 30, 60]);

function interpolatePrior(priorsByHour, hourFloat) {
  if (!Array.isArray(priorsByHour) || priorsByHour.length !== 24) return 50;
  const h0 = ((Math.floor(hourFloat) % 24) + 24) % 24;
  const h1 = (h0 + 1) % 24;
  const t = hourFloat - Math.floor(hourFloat);
  const a = typeof priorsByHour[h0] === 'number' ? priorsByHour[h0] : 50;
  const b = typeof priorsByHour[h1] === 'number' ? priorsByHour[h1] : 50;
  return a * (1 - t) + b * t;
}

/**
 * Temporal engine. Estimates NOW / +15 / +30 / +60 from a current fused score,
 * an hourly historical prior and a growing uncertainty. Model error is never
 * hidden: uncertainty widens with the horizon and confidence decays with it.
 */
export function forecast({
  currentScore,
  currentConfidence = 0,
  priorsByHour,
  nowMs,
  horizons = DEFAULT_HORIZONS,
  priorWeightMinutes = 45,
  uncertaintyPerMinute = 0.22,
}) {
  const hourFloatNow = (nowMs / 3_600_000) % 24;
  return horizons.map((horizonMinutes) => {
    const prior = interpolatePrior(priorsByHour, hourFloatNow + horizonMinutes / 60);
    const decay = Math.exp(-horizonMinutes / priorWeightMinutes);
    const score = currentScore === null
      ? prior
      : decay * currentScore + (1 - decay) * prior;
    const confidence = Number((currentConfidence * Math.exp(-horizonMinutes / 90)).toFixed(3));
    const halfWidth = Math.round(4 + (1 - confidence) * 22 + horizonMinutes * uncertaintyPerMinute);
    return {
      horizonMinutes,
      label: horizonMinutes === 0 ? 'NOW' : `+${horizonMinutes}m`,
      score: Number(score.toFixed(2)),
      band: bandFor(score),
      confidence,
      range: {
        low: Math.max(0, Math.round(score - halfWidth)),
        high: Math.min(100, Math.round(score + halfWidth)),
      },
    };
  });
}
