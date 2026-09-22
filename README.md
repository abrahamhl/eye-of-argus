# Eye of Argus

[![CI](https://github.com/abrahamhl/eye-of-argus/actions/workflows/ci.yml/badge.svg)](https://github.com/abrahamhl/eye-of-argus/actions/workflows/ci.yml)

A privacy-preserving, **offline-first** geospatial intelligence and human-context
engine. It fuses heterogeneous public sources through a disciplined adapter
architecture to estimate human activity — and it shows its evidence.

**Live simulator:** https://abrahamhl.github.io/eye-of-argus/ — a static,
dependency-free HUD that renders the real core's output for Arnhem (per-metric
views, forecast, evidence drill-down, licence engine, privacy suppression, and
an investor XYZ view).

**Field validation kit:** https://abrahamhl.github.io/eye-of-argus/field/ — an
offline PWA to collect ground-truth crowd observations (no account, no personal
data) and turn them into calibration metrics. See
[`docs/VALIDATION_GUIDE.md`](docs/VALIDATION_GUIDE.md).

> Eye of Argus is an **original derivative integrating concepts from** the
> MIT-licensed [`bilawalsidhu/gods-eye-view`](https://github.com/bilawalsidhu/gods-eye-view).
> It is **not technically a GitHub fork**, and we do not claim fork status.
> Upstream is credited and pinned by commit SHA in
> [`docs/UPSTREAM_PROVENANCE.md`](docs/UPSTREAM_PROVENANCE.md). The intelligence
> core in this repository is original work; upstream's visual globe is not
> claimed as ours.

## Motto: OFFLINE FIRST FOR SURE

- No mandatory account, no mandatory cloud.
- Local persistence by default; last-known data stays useful offline.
- Deterministic fixtures; no live feed is required to run the demo.
- Live sources enhance the system; they do not own it.
- Freshness is always explicit: `LIVE · CACHED · STALE · STATIC · INFERRED · UNAVAILABLE`.

## What it produces

Four separate measures — never collapsed into one unexplained score:

| Measure | Question |
|---|---|
| **Crowd Index** (0–100) | How much human activity/density is estimated here? |
| **Calm Index** (0–100) | How calm is this environment? (Not the inverse of crowd.) |
| **Social Opportunity** (0–100) | How likely is meaningful *public* social activity right now? |
| **Evidence Confidence** (0–1) | How good is the evidence behind the estimate? Evidence *quality* — **not** a calibrated probability. |

Every estimate carries a range, a band (`LOW/MODERATE/HIGH/VERY HIGH`), an
evidence-quality confidence and an evidence chain back to source manifests. No
person counts are fabricated. Every estimate is also classed as
`live | synthetic | mixed | unknown`; the Arnhem demo is **SYNTHETIC DEMO** and
says so in the CLI, the brief and the simulator.

## Live sources (opt-in)

Three real, keyless sources are implemented behind an adapter contract:

- **NDW DATEX II traffic telemetry** (road speed/intensity, CC0-1.0) — parsed
  with a bounded forward-only streaming parser.
- **OVapi GTFS-RT vehicle positions** (mobility, CC-BY-4.0) — parsed with a
  dependency-free protobuf reader.
- **Open-Meteo current weather** (contextual calm, CC-BY-4.0).

Deterministic CI runs **only** on recorded, sanitized fixtures and never touches
the network. Live fetching runs separately in `.github/workflows/live-smoke.yml`.
When a live fetch fails, the adapter falls back to the last cached observation,
which keeps its original timestamp and is therefore shown as `CACHED`/`STALE`,
never `LIVE`. See [`docs/SOURCE_CANDIDATES.md`](docs/SOURCE_CANDIDATES.md).

**Calibration status: NOT YET CALIBRATED.** No accuracy claim is made; the
protocol is in [`docs/REAL_WORLD_CALIBRATION_PROTOCOL.md`](docs/REAL_WORLD_CALIBRATION_PROTOCOL.md).

## Investor MVP gate

The current milestone is **evidence, not feature count**. The product is frozen
around one testable outcome: estimate the crowd band of a public place, explain
why, then compare the estimate with independent field observations. No investor
accuracy or business-value claim is valid until the pilot gates in
[`docs/PRODUCT_VALIDATION_SPEC.md`](docs/PRODUCT_VALIDATION_SPEC.md) are completed.

Cesium, voice, additional tactical layers and other presentation work are
secondary until the real-world validation and buyer-task experiments are run.

## Run it (offline)

```bash
node bin/arnhem-demo.mjs      # first vertical slice: Arnhem, synthetic
node --test test/*.test.mjs   # deterministic suite, no network
node bin/build-site.mjs       # generate the Pages simulator data from the core
node bin/verify-site.mjs      # gate the simulator artifact
node bin/live-smoke.mjs       # opt-in live check (network; never gates CI)
```

The demo prints Crowd/Calm/Social for two nearby destinations, forecasts
NOW/+15/+30/+60, ranks them under CALM and SOCIAL modes, and writes traceable
place briefs (JSON + HTML) to `out/`.

## Architecture (original core)

```
src/argus/
  time/        freshness states + deterministic clock
  sources/     SourceManifest, licence-aware registry, Observation
  evidence/    EvidenceRecord + traceable Estimate (ids + hashes)
  confidence/  evidence-quality confidence + banding
  fusion/      generic robust fusion (normalise, weight, MAD outlier, range)
  crowd/       Crowd Index
  calm/        Calm Index (crowd pressure + environmental evidence)
  social/      Social Opportunity Index
  forecast/    NOW/+15/+30/+60 with growing uncertainty
  privacy/     k-threshold suppression, grid aggregation, privacy budget
  reports/     traceable place brief (JSON + HTML)
  regional/arnhem/  deterministic first-region fixtures
```

Scoring never lives in UI components. This repository currently ships the
headless intelligence core; UI integration with the upstream Cesium globe is a
later, separately-tested step.

## Principles

- AI may never promote `INFERRED` to `VERIFIED`.
- No device identifiers, no MAC addresses, no fingerprinting, no through-wall
  monitoring, no identity correlation. See [`docs/PRIVACY_MODEL.md`](docs/PRIVACY_MODEL.md).
- Licence profiles (`PERSONAL · OPEN_SOURCE · RESEARCH · COMMERCIAL_SAFE`) are
  machine-readable; `COMMERCIAL_SAFE` excludes non-commercial sources automatically.
- Reports always state timestamp, method version, sources, licences and limits.

## Licence

MIT for original code. Upstream (`gods-eye-view`) is MIT © 2026 Bilawal Sidhu.
Bundled datasets, if and when imported, keep their own licences — see
[`docs/LICENSING_MATRIX.md`](docs/LICENSING_MATRIX.md).
