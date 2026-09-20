import { createHash } from 'node:crypto';

/** Deduplicate ground-truth records by (placeId, windowStart, observer). */
export function dedupeRecords(records) {
  const seen = new Map();
  for (const record of records) {
    const key = createHash('sha256')
      .update(`${record.placeId}|${record.windowStart}|${record.observer ?? ''}`)
      .digest('hex');
    if (!seen.has(key)) seen.set(key, record);
  }
  return [...seen.values()];
}

export function mergeRecords(recordGroups) {
  const all = recordGroups.flat();
  const merged = dedupeRecords(all);
  merged.sort((a, b) => Date.parse(a.windowStart) - Date.parse(b.windowStart));
  return { merged, total: all.length, duplicates: all.length - merged.length };
}
