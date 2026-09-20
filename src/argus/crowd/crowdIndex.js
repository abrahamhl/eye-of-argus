import { fuse } from '../fusion/fuse.js';

/**
 * Crowd Index: estimated human activity/density, 0..100.
 * Thin, well-named wrapper over the generic fusion engine so callers cannot
 * hide crowd-specific math in the UI.
 */
export function crowdIndex({ observations, manifestsById, nowMs, domains = {}, invert = {}, ...rest }) {
  return fuse({
    signal: 'crowd',
    observations,
    manifestsById,
    nowMs,
    domains,
    invert,
    ...rest,
  });
}
