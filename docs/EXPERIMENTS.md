# Experiments (dated, public)

Historical results. A single successful run is an observation, not a standing
guarantee. Current, generated facts live in the Truth Snapshot.

---

## EXP-001 — NDW DATEX II streaming parse

- **DATE:** 2026-09-20
- **QUESTION:** Can we consume Dutch road-traffic speed/intensity without loading
  the full ~217 MB DATEX II document into memory or a DOM, with zero runtime
  dependencies?
- **METHOD:** `bin/fetch-live-fixtures.mjs` streams the official
  `snelheden_en_intensiteiten_meetgegevens_en_configuratie_meetlocaties.xml.gz`
  through a forward-only parser (`src/argus/sources/adapters/datex.js`) and joins
  site coordinates to measured values.
- **X:** Road-traffic telemetry can be ingested by streaming, not by DOM.
- **Y (historical, this run):** **20,532** measurement sites parsed across the
  NL file. This is a run-specific number, not a product guarantee. The recorded
  Arnhem fixture and `test/ndw-datex.test.mjs` (including byte-by-byte
  split-chunk robustness) are the durable verification.
- **Z:** Streaming DATEX II v3 parser + `ndw-traffic-live` adapter.
- **RESULT:** Parser works; Arnhem slice recorded as a small fixture.
- **LIMITATION:** Memory bound is not yet benchmarked; joins assume exact site
  id matches.
- **NEXT:** Add a memory/latency benchmark and a large-file regression fixture.

---

## EXP-002 — Live smoke across three sources

- **DATE:** 2026-09-20
- **QUESTION:** Do the implemented adapters respond against the real upstreams?
- **METHOD:** `bin/live-smoke.mjs` (network, not part of deterministic CI).
- **X:** At least one live end-to-end fetch per adapter contract.
- **Y (historical):** First run 3/3 responded (NDW, OVapi GTFS-RT, Open-Meteo).
  A later recorded run was 2/3 — OVapi returned HTTP 429 (rate limited). The
  dated artifact is `docs/live-verification.json`.
- **Z:** Adapter `collectLive({ mode: 'live' })` + bounded `httpFetch`.
- **RESULT:** Live path works; upstream availability varies.
- **LIMITATION:** Single runs only; no reliability history yet.
- **NEXT:** Persist live-smoke outcomes over time (S43).

---

## EXP-003 — Cross-unit confidence in normalized space

- **DATE:** 2026-09-20
- **QUESTION:** Does confidence correctly read agreement when sources use
  different units (vehicles/hour, percent, arrivals)?
- **METHOD:** `test/confidence-crossunit.test.mjs` normalizes distinct-unit
  readings and checks agreement vs contradiction.
- **X:** Cross-unit agreement is interpreted correctly; raw-value dispersion is
  no longer used.
- **Y:** Deterministic tests pass with the values stated in the tests.
- **Z:** `computeEvidenceConfidence` consuming normalized contributions.
- **RESULT:** Fixed a real modelling defect (see `.autonomy/ERRORS.md` E006).
- **LIMITATION:** Correlation damping is a fixed factor, not a Bayesian model.
- **NEXT:** Estimate correlations empirically once more sources exist.
