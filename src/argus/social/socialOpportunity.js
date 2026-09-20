import { fuse } from '../fusion/fuse.js';

/**
 * Social Opportunity Index: likelihood that an area currently contains
 * meaningful *public* social activity, 0..100.
 *
 * Evidence classes are aggregate/public only: public events, venue density,
 * mobility arrivals and opt-in aggregate signals. This measure never identifies
 * individuals and never reconstructs social graphs.
 */
export function socialOpportunity({ observations, manifestsById, nowMs, domains = {}, invert = {}, ...rest }) {
  return fuse({
    signal: 'social',
    observations,
    manifestsById,
    nowMs,
    domains,
    invert,
    ...rest,
  });
}
