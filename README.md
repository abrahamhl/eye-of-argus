# Eye of Argus

[![CI](https://github.com/abrahamhl/eye-of-argus/actions/workflows/ci.yml/badge.svg)](https://github.com/abrahamhl/eye-of-argus/actions/workflows/ci.yml)

A privacy-preserving, **offline-first** geospatial intelligence and human-context
engine. It fuses heterogeneous public sources through a disciplined adapter
architecture to estimate human activity — and it shows its evidence.

> Eye of Argus is an original derivative of the MIT-licensed
> [`bilawalsidhu/gods-eye-view`](https://github.com/bilawalsidhu/gods-eye-view).
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
| **Confidence** (0–1) | How good is the evidence behind the estimate? |

Every estimate carries a range, a band (`LOW/MODERATE/HIGH/VERY HIGH`), a
confidence and an evidence chain back to source manifests. No person counts are
fabricated.

## Run it (offline)

```bash
node bin/arnhem-demo.mjs      # first vertical slice: Arnhem, synthetic
node --test test/*.test.mjs   # 65 deterministic tests, no network
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
