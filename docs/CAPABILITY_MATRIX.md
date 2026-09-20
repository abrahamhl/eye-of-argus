# Capability matrix — upstream vs Eye of Argus

Legend: **Reuse** (take as-is), **Adapt** (derive with changes), **Original**
(built here), **Defer** (not this milestone).

| Capability | Upstream `gods-eye-view` | Eye of Argus | Decision |
|---|---|---|---|
| Cesium photoreal globe / camera / scenes | Yes | Not yet | **Reuse** later, credited |
| Layer framework + source factories | Yes (`src/layers`, `src/sources`) | Adapter core in `src/argus/sources` | **Adapt** conventions; **Original** contracts |
| Server key-broker proxies | Yes (`server/providers`) | Not yet | **Reuse** when live adapters land |
| Import-direction / package-boundary gates | Yes | Not yet | **Reuse** pattern; add our own gate later |
| Unit-test harness | Yes (`scripts/run-unit-tests.mjs`, 4135 pass) | `node --test` (43 pass) | **Original** suite; do not fork upstream tests |
| Crowd Index | No | **Yes** (`src/argus/crowd`) | **Original** |
| Calm Index (not inverse of crowd) | No | **Yes** (`src/argus/calm`) | **Original** |
| Social Opportunity Index | No | **Yes** (`src/argus/social`) | **Original** |
| Evidence-quality Confidence + states | Partial (source status honesty) | **Yes** (`src/argus/confidence`) | **Original**, informed by upstream honesty states |
| Traceable Evidence graph (ids + hashes) | No | **Yes** (`src/argus/evidence`) | **Original** |
| Robust fusion (weights, MAD outlier, range) | No | **Yes** (`src/argus/fusion`) | **Original** |
| Freshness states + policy | Partial (stale/limited notices) | **Yes** (`src/argus/time`) | **Adapt** idea; **Original** model |
| Licence profiles / COMMERCIAL_SAFE | Manual carve-outs in docs | **Yes, machine-readable** (`src/argus/sources/registry`) | **Original** addition |
| Spatial privacy (k-threshold, budget) | No | **Yes** (`src/argus/privacy`) | **Original** |
| Temporal forecast NOW/+15/+30/+60 | No | **Yes** (`src/argus/forecast`) | **Original** |
| Place brief (JSON + HTML) | No | **Yes** (`src/argus/reports`) | **Original** |
| Arnhem / Netherlands first region | No (US/Estonia/etc. focus) | **Yes** (`src/argus/regional/arnhem`) | **Original** |
| Alignment/calibration harness | No | Schema only (`docs/CALIBRATION.md`) | **Original**, next |
| Voice control | Yes | No | **Defer**; not aligned with offline-first core |
| ALPR / person-adjacent features | Upstream maps ALPR camera *locations* | No | **Exclude** from our product scope |

## What upstream must not regress

The derivative must not break upstream's build, unit suite, or boundary gates if
we import upstream modules. Our additions live under `src/argus/` and `test/`
and are independent of upstream's toolchain for now.
