# NEXT — atomic, unblocked stories

Execute top-down. Each story: implement → test → commit → update STATE.

## S33 — NDW DATEX II adapter (blocked)
- Need a bounded, streaming, zero-dependency DATEX II reader.
- Deliverable: `ndw-traffic-live` adapter + recorded fixture + tests.
- Documented blocker in `docs/SOURCE_CANDIDATES.md`.

## S34 — Calibration pilot
- Run `docs/REAL_WORLD_CALIBRATION_PROTOCOL.md` on 10–20 Arnhem sites.
- Publish N, confusion matrix, Brier, ECE — or keep NOT YET CALIBRATED.
- No ground truth → do not start.

## S35 — Persisted offline workspace
- Save places/areas + last-known observations locally; reuse `offlineCache`.
- UI must show CACHED/STALE.

## S36 — Cesium globe integration
- Separate presentation boundary; reuse upstream visual architecture with
  attribution. Do not import upstream wholesale.

## S37 — Analyst mode
- Source provenance, temporal history, cross-source corroboration view.

## S38 — Live smoke on schedule
- Already added (`.github/workflows/live-smoke.yml`); observe a few runs and
  record provider reliability in SOURCE_CANDIDATES.

## Continuation protocol
1. Read STATE.md; `git status`; read PRD.json.
2. Pick the highest-priority unblocked story above.
3. Implement, test with `node --test test/*.test.mjs`, commit atomically.
4. Update STATE.md + PRD.json + NEXT.md. Continue.
