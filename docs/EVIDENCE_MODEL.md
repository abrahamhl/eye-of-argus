# Evidence model

The philosophy is adapted from `abrahamhl/argus`
(`Signal → Evidence → Finding → …`) to geospatial intelligence:

```
Signal → Observation → Evidence → Estimate → Context → Decision → Verification
```

## Records

| Record | Owner | Carries |
|---|---|---|
| `SourceManifest` | `src/argus/sources/manifest.js` | provider, type, coverage, resolution, licence, commercialUse, redistribution, privacyClass, URLs, adapterVersion, confidencePrior, freshnessPolicy |
| `Observation` | `src/argus/sources/observation.js` | normalised value from one adapter, `kind` (observed/inferred/static), `observedAtMs`, immutable `id = sha256(...)` |
| `EvidenceRecord` | `src/argus/evidence/evidence.js` | links an observation to an estimate: normalised value, weight, freshness, `included`, `reason` |
| `Estimate` | `src/argus/evidence/evidence.js` | signal, score, band, range, confidence, evidence ids, derivedFrom, runId, methodologyVersion, configurationHash |

## Traceability rule

Every displayed conclusion points backwards:
`Estimate → EvidenceRecord[] → Observation → SourceManifest`.
`traceSources(estimate, evidence)` resolves the unique source ids; unknown ids
fail the test in `test/verticalSlice.test.mjs`.

## Confidence rule

Confidence is a function of **evidence quality only** (source prior × freshness,
provider coverage, agreement). It is never a function of the crowd score.
States: `VERIFIED · SUPPORTED · INFERRED · UNKNOWN · CONTRADICTED`.

- All-inferred evidence is capped below `VERIFIED` (`computeConfidence`).
- High dispersion between sources yields `CONTRADICTED`.
- AI/adapter output may not set `confidence` to promote an inferred observation.

## Reproducibility metadata

Every estimate and brief carries: `runId`, `computedAt`/`generatedAt`,
`methodologyVersion`, `configurationHash`, and the adapter versions of the
sources that contributed.

## Fusion

`fuse()` normalises each observation to 0–100, weights by
`confidencePrior × freshnessWeight`, demotes outliers with a median/MAD filter
(demoted points remain in the audit trail with `included: false`), and returns a
weighted mean plus a range that widens with disagreement and low confidence.
