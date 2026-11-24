# Postal sector coverage from open data (checked 25 Nov 2026)

These five data.gov.sg GeoJSON layers were downloaded through the v2 API and checked on 25 Nov 2026. Only each place's postal code and position are used. A place's position doesn't go stale, so an older layer works as well as a new one.

| Layer | Dataset id | Features | Postal field | Valid 6-digit codes |
|---|---|---|---|---|
| Family Service Centres | `d_add23c06f7267e799185c79ccaa2099b` | 55 | `ADDRESSPOSTALCODE` | 53 |
| Community Clubs / PAssion WaVe | `d_9de02d3fb33d96da1855f4fbef549a0f` | 128 | `ADDRESSPOSTALCODE` | 124 |
| CHAS clinics (2021 snapshot) | `d_548c33ea2d99e29ec63a7cc9edcccedc` | 1,193 | `POSTAL_CD` | 1,193 |
| Retail pharmacies | `d_bb92615f43de22933e4479558b1f6c36` | 249 | `POSTAL_CODE` | 249 |
| Dementia Go-To-Points | `d_e2d10e591bc8560b8946a0da24790fa5` | 831 | `POSTAL_CODE` | 831 |

The 9 AIC Links (`aic-links-2026-11-25.md`) were added on top.

## Results

- **Coverage:** **76 of 81** postal sectors (01–82, no 74) get a centre. With FSC and CC alone it was only 51.
- **Sectors with no centre:** 02, 70, 71, 72, 77. These are mostly the CBD edge and industrial areas. They fall back to the region picker.
- **Thin sectors (fewer than 3 points):** 06, 08, 28, 50, 66, 69. They work, but their centres rest on few points.
- **Accuracy:** in the widest sector (53), 90% of places are within 2.0 km of the centre. Every other sector is tighter.
- **Bad coordinates:** 1 point out of about 2,450 falls outside Singapore's bounding box. The pipeline drops it.
- **Format:** all geometry is longitude/latitude (WGS84).

The check script is not part of the repo. Stage 2 rebuilds this logic in `pipeline/` with tests.
