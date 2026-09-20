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

## D009 — Local repo first, no remote yet
Git initialised locally. Creating a remote repository / choosing visibility is
an owner decision and is not performed autonomously.
