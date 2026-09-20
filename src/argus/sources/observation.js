import { createHash } from 'node:crypto';

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
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
