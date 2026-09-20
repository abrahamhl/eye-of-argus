import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { classifyFreshness } from '../time/freshness.js';

/**
 * Local, user-owned workspace. Offline-first: saved places and last-known
 * observations live on disk without any account or cloud. Nothing here upgrades
 * freshness — a stored observation keeps its original observedAt.
 */
export function createWorkspace(path) {
  const read = () => {
    if (!existsSync(path)) return { version: 1, places: {}, observations: {} };
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf8'));
      return { version: 1, places: parsed.places ?? {}, observations: parsed.observations ?? {} };
    } catch {
      return { version: 1, places: {}, observations: {} };
    }
  };
  const write = (data) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(data, null, 2));
  };

  return {
    savePlace(place) {
      if (!place || !place.id || !Number.isFinite(place.lat) || !Number.isFinite(place.lon)) {
        throw new Error('savePlace: id, lat and lon are required');
      }
      const data = read();
      data.places[place.id] = { ...place, savedAt: place.savedAt ?? new Date().toISOString() };
      write(data);
      return data.places[place.id];
    },
    listPlaces() {
      return Object.values(read().places);
    },
    saveObservation(sourceId, observation) {
      if (!sourceId || !observation) throw new Error('saveObservation: sourceId and observation are required');
      const data = read();
      data.observations[sourceId] = { ...observation, sourceId };
      write(data);
      return data.observations[sourceId];
    },
    getObservation(sourceId) {
      return read().observations[sourceId] ?? null;
    },
    listObservations() {
      return Object.values(read().observations);
    },
    export() {
      return read();
    },
    contentHash() {
      return createHash('sha256').update(JSON.stringify(read())).digest('hex').slice(0, 16);
    },
  };
}

/**
 * Offline usability of a stored observation. Returns the freshness state and
 * whether it may be shown. STALE/UNAVAILABLE data is not usable; CACHED is
 * usable but must be labelled. Nothing is ever reported as LIVE from the store.
 */
export function offlineStatus({ observation, nowMs, freshnessPolicy }) {
  if (!observation) return { state: 'UNAVAILABLE', usable: false, label: 'NO OFFLINE DATA' };
  const state = classifyFreshness({
    kind: observation.kind ?? 'observed',
    observedAtMs: observation.observedAtMs,
    nowMs,
    policy: freshnessPolicy,
  });
  const usable = state === 'LIVE' || state === 'CACHED' || state === 'STATIC';
  const label = state === 'LIVE' ? 'CACHED OFFLINE SNAPSHOT' : state;
  return { state, usable, label };
}
