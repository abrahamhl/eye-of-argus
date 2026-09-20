# Source candidates (Arnhem / Gelderland first)

Source count is **not** a KPI. Each candidate must state the independent
information it adds, its legality, reliability, cost, coverage, and what
happens when it disappears. A candidate with low novelty relative to an
existing source is marked LOW priority even if it is easy to add.

Scoring: VALUE 1–5, NOVEL_INFORMATION 1–5, PRIORITY = round((VALUE×2 + NOVEL + reliability)/4).

| Source | Class | Licence | Coverage | VALUE | NOVEL | REL | COST | PRIORITY | Notes |
|---|---|---|---|---|---|---|---|---|---|
| NDW open data | road traffic + flow | CC0-1.0 | NL | 5 | 4 | 5 | low | **P0** | https://opendata.ndw.nu/ ; DATEX II |
| OVapi / OpenGeo GTFS-RT | transit arrivals/vehicles | CC-BY-4.0 | NL | 5 | 5 | 4 | low | **P0** | https://gtfs.ovapi.nl/ ; User-Agent required |
| Gemeente Arnhem open data | parking, municipal sensors | varies | Arnhem | 4 | 4 | 3 | low | **P0** | Per-dataset terms must be checked |
| OpenStreetMap / Overpass | venue density, POI, green | ODbL-1.0 | global | 4 | 3 | 4 | low | **P1** | Share-alike on derived DB |
| PDOK / BGT | green coverage, buildings | CC-BY-4.0 | NL | 4 | 4 | 5 | low | **P1** | https://www.pdok.nl/ |
| RIVM noise contours | environmental noise | CC-BY-4.0 | NL | 3 | 4 | 4 | low | **P1** | Annual; static-ish |
| KNMI / Open-Meteo | weather | CC-BY-4.0 | NL/global | 3 | 3 | 5 | low | **P1** | Weather modulates outdoor activity |
| NS / ProRail | rail disruptions | varies | NL | 3 | 3 | 4 | med | P2 | Terms review needed |
| Nationale Bicycle counters | bicycle counts | varies | NL | 4 | 4 | 3 | med | P2 | High novelty for calm routing |
| Event calendars (municipal) | public events | often CC-BY-NC | Arnhem | 4 | 5 | 3 | low | P2 | Non-commercial → excluded for COMMERCIAL_SAFE |
| Municipal crowd cameras (metadata only) | occupancy proxies | varies | NL | 2 | 2 | 2 | med | P3 | Privacy/legal review; do not add frames |
| Social platform public event APIs | aggregate events only | provider ToS | varies | 3 | 4 | 2 | high | **UNAVAILABLE/UNSUITABLE** | No official aggregate interface → do not implement |

## Explicit rejections

- **Instagram / Snapchat / similar**: no compliant aggregate/public interface →
  `UNAVAILABLE / UNSUITABLE`. No private-profile scraping, no identity correlation.
- **Wi-Fi / Bluetooth / MAC scanning**: rejected outright. See `PRIVACY_MODEL.md`.
- **Through-wall monitoring of third-party premises**: rejected.

## Correlated-signal warnings

- Parking occupancy and road traffic near a venue are correlated; do not double
  count them as independent crowd evidence without a correlation adjustment.
- Transit arrivals and opt-in telemetry overlap for commuter areas; cap combined
  weight.
