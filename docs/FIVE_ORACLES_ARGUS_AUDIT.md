# Five Oracles — Eye of Argus public audit

Date: 2026-09-22
Branch reviewed: `chat/investor-mvp-v1`

This document contains the public, non-sensitive part of the council review.
Pricing, fundraising/customer strategy and other private commercial material
must remain outside the public repository per `docs/DOCUMENT_BOUNDARY.md`.

## Finalist verdict: SPLIT

There are currently two distinct product theses using the Argus name:

1. **Eye of Argus** — evidence-aware geospatial context: crowd/calm estimation,
   freshness, provenance, privacy and field validation.
2. **Argus Audit** (working name, not implemented here) — business/website
   discovery and authorized compliance/hygiene auditing that turns public or
   permissioned evidence into technical and client-readable reports.

Trying to put both into the same MVP would destroy comprehensibility and
validation. They may later share an evidence/provenance model, report contracts
and design language, but should not share a single primary user journey today.

## Oracle findings

### Capital & Market

**Asset:** Eye of Argus has unusually strong proof discipline for a young
project: source manifests, confidence semantics, truth-state labels, licensing
profiles and a field-validation path.

**Fatal risk:** the project can become an impressive evidence engine without a
recurring buyer job.

**Public gate:** no commercial claim until a real operator completes the same
task with and without Argus and the result is recorded.

### Principal Systems / FinOps / Security

**Asset:** zero-runtime-dependency core and fixture-backed CI make the reasoning
engine cheap and reproducible.

**Fatal risk:** production and commercial deployment requirements are not the
same as the current static demo.

**Direction:** keep the headless core independent. Add commercial infrastructure
only behind explicit adapters. Never move secrets into browser-visible config.

### First-Time User / Mother Test

The current simulator exposes many expert concepts at once. A normal first-time
user should not have to understand profiles, confidence semantics, provenance
or methodology before getting value.

**Golden path:**

`Choose place → What is it like now? → result + freshness → Why? → evidence`

The field-validation PWA also asks for observer initials while public copy says
“no personal data”. Initials plus time/location can become identifying context.
Either use an opaque local observer code or weaken the claim; do not overstate
privacy.

### Product / UX

Keep the tactical/evidence visual language, but reduce the default surface.

Recommended hierarchy:

1. NOW card — Crowd / Calm + freshness.
2. Map/context.
3. “Why this result?” evidence drawer.
4. Compare locations.
5. Analyst mode.
6. Methodology / licence / investor evidence as secondary surfaces.

The “wow” interaction should explain evidence changing the estimate, not a
decorative animation.

### Distribution / Funding

Eye of Argus is currently best treated as **open-source proof + pilot product**,
not a commercial SaaS hosted on the existing GitHub Pages surface.

The public launch asset should be a reproducible case study with real field
validation, not a feature list.

## Public MVP boundary

### Keep
- Crowd estimate;
- Calm as secondary context;
- freshness states;
- evidence inspector;
- COMMERCIAL_SAFE source filtering;
- field validation;
- local/offline workspace;
- dated source reliability.

### Defer
- Cesium unless it materially improves the user test;
- voice control;
- broad tactical layer collection;
- generalized “social opportunity” claims;
- additional source count for its own sake.

### Exclude
- identity/person tracking;
- covert/private surveillance;
- unauthorized intrusive website scanning;
- fear-based compliance marketing.

## Product split proposal

### A. Eye of Argus
Question answered:
> “What is happening around this place, how reliable is the evidence, and why?”

### B. Argus Audit — sibling product candidate
Question answered:
> “What publicly observable or authorized digital risks/compliance gaps does
> this business have, what evidence supports them, and what should be fixed?”

Argus Audit should begin as a separate MVP/repository if approved. Its first
version should use passive public checks and explicitly authorized deeper
audits. It should output three report layers:

1. owner/simple summary;
2. technical engineer evidence report;
3. client remediation report.

Do not merge it into Eye of Argus before each product has a validated golden
path.

## Next public engineering gates

1. Fix the field-app privacy claim / observer identifier.
2. Create a single beginner “NOW” path in the simulator.
3. Persist live-source reliability history.
4. Run real ground-truth collection and publish aggregate validation.
5. Only then decide whether Cesium improves measured user value.

## Security note for Argus Audit

Prospecting and public discovery may use ordinary public-surface evidence.
Intrusive vulnerability scanning, authentication testing, exploitation or
access to non-public data requires explicit authorization and scope.
