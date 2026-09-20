import { createHash } from 'node:crypto';

function canonical(payload) {
  return JSON.stringify(payload, Object.keys(payload).sort());
}

export function hashOf(payload) {
  return createHash('sha256').update(canonical(payload)).digest('hex');
}

/**
 * A normalized observation produced by an adapter. `kind` is one of
 * observed | inferred | static and drives the freshness state.
 */
export function createObservation({
  sourceId,
  kind = 'observed',
  observedAtMs,
  value,
  unit = 'index',
  confidence = null,
  meta = {},
}) {
  if (!sourceId) throw new Error('observation: sourceId is required');
  if (!['observed', 'inferred', 'static'].includes(kind)) {
    throw new Error(`observation: invalid kind "${kind}"`);
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`observation(${sourceId}): value must be a finite number`);
  }
  const record = {
    sourceId,
    kind,
    observedAtMs: kind === 'static' ? null : observedAtMs,
    value,
    unit,
    confidence,
    meta,
  };
  return Object.freeze({ ...record, id: `obs_${hashOf(record).slice(0, 16)}` });
}
