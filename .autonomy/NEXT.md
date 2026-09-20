# NEXT — atomic, unblocked stories

Execute top-down. Each story: implement → test → commit → update STATE.

## Done recently
- S33/S35/S36/S37/S38/S40/S41: normalized confidence, synthetic honesty, live
  adapters (OVapi GTFS-RT, Open-Meteo, NDW DATEX II), offline cache, versioned
  config, Evidence Inspector, offline workspace, Analyst mode.
- S45/S46: XYZ truth layer (registry + Truth Snapshot + drift gates) and the
  private/public boundary guard.

## S42 — Cesium globe integration (next, large)
- Separate presentation boundary; reuse upstream visual architecture with
  attribution. Do not import upstream wholesale.
- Deliverable: GLOBAL → CITY → AREA → PLACE → intelligence card, consuming the
  core's estimates. Presentation may carry its own deps; the core stays
  zero-dependency.

## S39 — Calibration pilot (blocked)
- Run `docs/REAL_WORLD_CALIBRATION_PROTOCOL.md` on 10–20 Arnhem sites.
- Publish N, confusion matrix, Brier, ECE — or keep NOT YET CALIBRATED.
- No ground truth → do not start.

## S43 — Live-smoke reliability history
- Persist live-smoke outcomes over time and record provider reliability in
  `docs/SOURCE_CANDIDATES.md`.

## S44 — Offline replay mode
- Full offline replay from the workspace store; UI must label CACHED/STALE.

## Continuation protocol
1. Read STATE.md; `git status`; read PRD.json.
2. Pick the highest-priority unblocked story above.
3. Implement, test with `node --test test/*.test.mjs`, commit atomically.
4. Update STATE.md + PRD.json + NEXT.md. Continue.
