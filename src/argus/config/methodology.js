import { createHash } from 'node:crypto';

/**
 * Versioned scoring configuration. Every coefficient that affects a score lives
 * here. Changing any value is a methodology change: bump METHODOLOGY_VERSION.
 *
 * Current status: m0.2 — HEURISTIC. Not scientifically validated. No calibrated
 * probability claims are permitted from these coefficients.
 */
export const METHODOLOGY_VERSION = 'm0.2';

export const CONFIG = Object.freeze({
  version: METHODOLOGY_VERSION,

  fusion: {
    outlierMadMultiplier: 3,
    outlierFloor: 15,
    minObservationsForOutlier: 3,
    // Sources in the same correlation group measure related pressure and must
    // not be treated as fully independent. All but the strongest included
    // member of a group have their weight multiplied by correlationDamping.
    // This is a simple, honest first implementation — not a Bayesian model.
    correlationGroups: {
      'mobility-pressure': ['ndw-traffic', 'parking-arnhem', 'ovapi-transit', 'ndw-mobility-live'],
    },
    correlationDamping: 0.5,
  },

  confidence: {
    scale: 100,
    contradictionDispersion: 0.6,
    verifiedMin: 0.8,
    supportedMin: 0.5,
    inferredCap: 0.5,
    weights: { prior: 0.55, coverage: 0.15, agreement: 0.3 },
  },

  calm: {
    crowdWeight: 0.55,
    environmentWeight: 0.45,
    noEnvironmentConfidenceCap: 0.6,
  },

  forecast: {
    priorWeightMinutes: 45,
    uncertaintyPerMinute: 0.22,
    confidenceHalfLifeMinutes: 90,
    baseHalfWidth: 4,
    confidenceHalfWidth: 22,
  },

  privacy: {
    defaultK: 5,
  },
});

export function configurationHash(config = CONFIG) {
  return createHash('sha256').update(JSON.stringify(config)).digest('hex').slice(0, 16);
}
