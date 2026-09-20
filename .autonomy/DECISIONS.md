# DECISIONS

## D001 — Derivative, not a rebrand
Upstream `gods-eye-view` is MIT and credited. We build an **original intelligence
core** (`src/argus/`) rather than forking and lightly editing the globe. Rationale:
original contributions must be obvious; upstream architecture stays intact.

## D002 — Headless core before UI
The differentiated work is evidence-based estimation, not the globe. Build and
test it headlessly first (deterministic, offline). Integrate the Cesium globe
later, credited.

## D003 — Freshness is explicit and dominant
`LIVE/CACHED/STALE/STATIC/INFERRED/UNAVAILABLE` drive the weight of every
observation. A cached or inferred value is never rendered as live.

## D004 — Calm is not inverse-crowd
Calm blends inverted crowd pressure with environmental evidence (green, noise),
so a busy park can be calm. Covered by `test/verticalSlice.test.mjs`.

## D005 — Confidence is evidence quality, not the score
Confidence is computed from source priors × freshness, provider coverage and
agreement. All-inferred evidence is capped below VERIFIED.

## D006 — Licence profiles are machine-readable
`COMMERCIAL_SAFE` excludes `commercialUse:false` and `redistribution:prohibited`
sources before fusion, and reports the exclusions. Non-commercial upstream
datasets (TeleGeography, Bhote Koshi) must never load in commercial builds.

## D007 — k-threshold suppression by default
Opt-in telemetry exposes only bands; cells below `k=5` contributors are withheld.

## D008 — Node `--test` glob
`node --test test/` does not work on Node 22; use `node --test test/*.test.mjs`.

## D009 — Remote repository created on explicit owner request
Initially the repository was local-only. On explicit owner instruction it was
published as a **public** GitHub repository at `abrahamhl/eye-of-argus`
(default branch `main`). Content is synthetic, carries no secrets, and is MIT
licensed with upstream attribution in `NOTICE.md`. Visibility can be changed by
the owner at any time.

## D010 — Confidence is measured in normalized space
`computeEvidenceConfidence` receives the normalized contributions produced by
fusion, never raw values. Raw units (vehicles/hour, %, arrivals, dB) are not
comparable; dispersion over raw values is meaningless. Regression tests cover
cross-unit agreement and contradiction.

## D011 — The number is Evidence Quality, not a probability
User-facing confidence is renamed **Evidence Confidence / Evidence Quality** and
carries `confidenceSemantics: 'evidence-quality'`. It must not be read as
P(correct) until real calibration exists.

## D012 — dataClass guards against masquerade
Every estimate carries `dataClass` (`live | synthetic | mixed | unknown`),
aggregated from source manifests. Synthetic and unknown output is visibly
marked; unknown is never presented as live.

## D013 — Live adapters are fixture-first
Adapters implement fetch/parse/normalize, but CI runs only on recorded,
sanitized fixtures. Live fetching is isolated in `live-smoke.yml`. A failed
fetch falls back to the cache, which keeps the original timestamp and is
therefore never classified LIVE.

## D014 — Accurate upstream relationship
This repository is an **original derivative integrating concepts**, not a
GitHub fork. We do not claim fork status or rewrite history to fake ancestry.

## D015 — Scoring coefficients live in versioned config
`src/argus/config/methodology.js` holds every scoring coefficient. Changing one
bumps `METHODOLOGY_VERSION` (currently `m0.2`, explicitly heuristic).
