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

The confidence number is **Evidence Quality Confidence**, i.e. how good the
evidence behind an estimate is. It is **not** a calibrated probability and must
never be read as "X% chance the estimate is correct". Calibrated probability
requires ground-truth calibration (`docs/CALIBRATION.md`) and does not exist yet.

Confidence is a function of evidence quality only (source prior × freshness,
provider coverage, agreement). It is never a function of the score's magnitude.

- **Agreement is measured on NORMALIZED values (0..100), never on raw values.**
  Raw readings with different units (vehicles/hour, %, arrivals, dB) are not
  comparable; dispersion over raw values would be meaningless. The fusion engine
  passes the same normalized contributions it used for the score, so confidence
  always describes agreement within one estimated signal.
- Dispersion is the normalized value range relative to the 0..100 scale. A spread
  above 60 points yields `CONTRADICTED`.
- All-inferred evidence is capped below `VERIFIED` (`computeEvidenceConfidence`).
- AI/adapter output may not set `confidence` to promote an inferred observation.
- A `CONTRADICTED` estimate keeps its band but is visually downgraded and the
  brief states the sources disagree.
- Every estimate also carries `confidenceSemantics: 'evidence-quality'` and a
  `dataClass` (`live` | `synthetic` | `mixed` | `unknown`), so synthetic output
  can never masquerade as live.

States: `VERIFIED · SUPPORTED · INFERRED · UNKNOWN · CONTRADICTED`.

Coefficients live in `src/argus/config/methodology.js` (currently `m0.2`,
HEURISTIC).

## Calm traceability

`calmIndex()` records the crowd component as an explicit
`derived:crowd-pressure` EvidenceRecord and exposes `evidence` on its result, so
the Calm number is recomputable from its own evidence list rather than only
through a pointer to the crowd estimate.

## Reproducibility metadata

Every estimate and brief carries: `runId`, `computedAt`/`generatedAt`,
`methodologyVersion`, `configurationHash`, and the adapter versions of the
sources that contributed.

## Fusion

`fuse()` normalises each observation to 0–100, weights by
`confidencePrior × freshnessWeight`, demotes outliers with a median/MAD filter
(demoted points remain in the audit trail with `included: false`), and returns a
weighted mean plus a range that widens with disagreement and low confidence.
