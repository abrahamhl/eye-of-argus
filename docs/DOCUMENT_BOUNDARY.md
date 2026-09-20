# Document boundary — public vs private

Eye of Argus separates public evidence from private strategy. This document
explains the boundary without revealing any private content.

## PUBLIC (safe to commit and publish)

Audience: recruiters, developers, users, open-source reviewers, technical
investors.

- Architecture and module boundaries (`docs/`, `src/argus/`).
- Methodology and limitations (`docs/XYZ_METHOD.md`, `docs/EVIDENCE_MODEL.md`).
- Tests and CI (`.github/workflows/`, `test/`).
- Licensing and source attribution (`NOTICE.md`, `docs/LICENSING_MATRIX.md`).
- Verified case study and dated experiments (`docs/CASE_STUDY.md`,
  `docs/EXPERIMENTS.md`).
- The XYZ registry and Truth Snapshot.

## PRIVATE (never committed)

Audience: the owner.

- Pricing and willingness-to-pay.
- Fundraising and investor relations.
- Commercial hypotheses and customer research.
- Competitor strategy.
- Defence positioning.
- Personal business decisions.

Private material lives in `.private/`, which is **gitignored**. Templates exist
there; do not populate them with invented facts. Private claims use the schema
`KNOWN · SUPPORTED · HYPOTHESIS · EXPERIMENT · DECISION · REJECTED`.

## Automated guard

`bin/guard-private-boundary.mjs` (wired into CI) fails if filenames such as
`PRICING_*`, `INVESTOR_*`, `FUNDING_*`, `COMPETITOR_*`, `CUSTOMERS_PRIVATE`,
`DUAL_USE_*`, `COMMERCIAL_*`, `*_PRIVATE`, `STRATEGY*` or `INVESTMENT_MASTER*`
appear **outside** `.private/`. `test/truth-layer.test.mjs` runs the same scan.

Filenames are a coarse signal. The durable control is process: anything with
commercial or personal value is authored in `.private/` first, and public docs
carry only verified, non-sensitive material.
