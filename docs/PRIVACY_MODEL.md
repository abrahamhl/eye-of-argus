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
  mode instead of overspending.

## Tradeoffs (documented, not hidden)

- Larger `k` → stronger privacy, coarser maps. `k = 5` is the default starting
  point and should be raised for sensitive venues.
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
