# Licensing matrix and policy

Eye of Argus separates **code**, **data**, and **runtime fetching**. A flag in
`src/argus/sources/registry.js` enforces the data part automatically.

## Profiles

| Profile | Allows |
|---|---|
| `PERSONAL` | Everything, including non-commercial data |
| `OPEN_SOURCE` | OSI/permissive licences only (MIT, Apache-2.0, BSD-3-Clause, CC0, CC-BY, PDDL, ODbL, OGL) |
| `RESEARCH` | Any licence that permits redistribution |
| `COMMERCIAL_SAFE` | `commercialUse === true` **and** `redistribution !== 'prohibited'` |

`COMMERCIAL_SAFE` is the default in `bin/arnhem-demo.mjs`. A non-commercial
source (e.g. the Arnhem events calendar fixture, `CC-BY-NC-4.0`) is excluded
before fusion, and the exclusion is reported — never silent. This is covered by
tests in `test/registry.test.mjs` and `test/verticalSlice.test.mjs`.

## Decision table (source classes)

| Source / dataset | Licence | Commercial | Commercial-safe? | Notes |
|---|---|---|---|---|
| NDW road traffic | CC0-1.0 | Yes | ✅ | Public domain, NL |
| Gemeente Arnhem parking | custom-permissive | Yes | ✅ | Verify municipal terms per dataset |
| OVapi / Stichting OpenGeo transit | CC-BY-4.0 | Yes | ✅ | Attribution; User-Agent required |
| OpenStreetMap (POI/geometry) | ODbL-1.0 | Yes | ✅ | Share-alike applies to derived **data** |
| PDOK / BGT green coverage | CC-BY-4.0 | Yes | ✅ | Attribution |
| RIVM noise contours | CC-BY-4.0 | Yes | ✅ | Attribution |
| Arnhem events calendar | CC-BY-NC-4.0 | No | ❌ | Excluded under COMMERCIAL_SAFE |
| Upstream TeleGeography cables | CC BY-NC-SA 3.0 | No | ❌ | Never import for commercial builds |
| Upstream Bhote Koshi event pack | CC BY-NC 4.0 | No | ❌ | Non-commercial; excluded |
| Google Maps / Cesium ion | provider ToS | Varies | ⚠️ | Live-only, never cached/rehosted; BYOK |

## Rules

1. Every source declares `license`, `commercialUse`, `redistribution`,
   `sourceURL`, `termsURL` in its `SourceManifest`.
2. No dataset with `commercialUse: false` may be loaded under `COMMERCIAL_SAFE`.
3. Google-derived content is never cached, stored, rehosted or committed.
4. Upstream non-MIT datasets stay separate from the MIT code and are excluded
   from commercial profiles.
5. A report records the active profile and the excluded sources.

## Open item

Legal review of the exact municipal terms for each Arnhem/Gelderland dataset is
required before any B2B deployment. The matrix above is engineering metadata,
not legal advice.
