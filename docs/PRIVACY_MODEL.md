# Privacy model

Eye of Argus estimates aggregate human context. It does not identify people.

## Hard prohibitions

- No remote scanning of third-party phones.
- No collection of MAC addresses or any device identifier.
- No device fingerprinting.
- No through-wall monitoring of third-party premises.
- No private-profile scraping, no API-circumvention, no cross-service identity
  correlation, no shadow profiles, no named-person tracking.
- No reconstruction of social graphs or friendships.

## Opt-in aggregate telemetry (`src/argus/privacy/suppression.js`)

If opt-in telemetry is ever enabled, only aggregates leave a device:

- spatial grid cells, short time windows, coarse motion classes;
- identifiers discarded locally before any value is produced;
- `suppressCell({count, k})` with default `k = 5`: cells below k contributors are
  withheld entirely (state `SUPPRESSED`, no value field);
- released cells expose a **band** (`LOW/MODERATE/HIGH/VERY HIGH`), not a count;
- `aggregateSpatialGrid` merges raw cells into a coarse grid, then suppresses;
- `createPrivacyBudget` bounds live lookups per window and degrades to offline
  mode instead of overspending. It rejects non-monotonic (rewound) time so a
  caller cannot reset the window by moving the clock backwards. It is
  **per-process and in-memory**: restarting the process resets it, and it is a
  guard, not a billing cap. Persisted budgets are a future story.

## Tradeoffs (documented, not hidden)

- **`k = 5` is an engineering placeholder, not a compliance claim.** It is a
  reasonable default for a prototype and nothing more; it does not make the
  system compliant with any privacy standard (GDPR/AVG, k-anonymity proofs,
  differential privacy). A real regional/product privacy policy must set k per
  product and jurisdiction, and be reviewed. `CONFIG.privacy.defaultK` is the
  single place to change it.
- Larger `k` → stronger privacy, coarser maps.
- k-anonymity is necessary but not sufficient; differential privacy and local
  aggregation are candidate future upgrades, and privacy budgets must be
  re-evaluated before any public telemetry release.
- Suppression reduces the number of non-empty cells, which biases naive
  coverage statistics; calibration must account for suppressed cells.

## Venue sensors (future, optional)

Supported only when the venue owns/authorises the sensor, processing is local,
identifiers are discarded, and the only output is:

`occupancyBand · estimatedRange · flowIn · flowOut · confidence · timestamp`.

Never device IDs, never MAC addresses, never individual trajectories.
