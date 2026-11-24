# Singapore open datasets and APIs for a static caregiver care-plan and cost tool (as of 24 Nov 2026)

Method note: on 24 Nov 2026 I pulled the full data.gov.sg v2 catalogue (5,608 datasets, 561 pages from `https://api-production.data.gov.sg/v2/public/api/datasets?page=N`). The `query=` parameter on that endpoint is ignored, so the catalogue was filtered locally by name. Key GeoJSONs were then downloaded through the official download API and their fields, record counts and per-record `FMEL_UPD_D` stamps (the real feature edit dates) were inspected. "Verified" means I opened the page/API or the data itself. "Search summary" means it comes only from a web search result.

Shared URL patterns for every data.gov.sg dataset below (verified):
- Dataset page: `https://data.gov.sg/datasets/{id}/view`
- Metadata: `https://api-production.data.gov.sg/v2/public/api/datasets/{id}/metadata`
- File download (GeoJSON/CSV): `GET https://api-open.data.gov.sg/v1/public/api/datasets/{id}/initiate-download`, then `GET .../poll-download`, which returns a signed S3 `url`
- CSV row API: `https://data.gov.sg/api/action/datastore_search?resource_id={id}&limit=N`

Caveat on dates: data.gov.sg `lastUpdatedAt` of 2024-06-06 appears on many legacy datasets. It reflects the platform migration and does not mean the data was refreshed then. The `FMEL_UPD_D` field inside the features is the honest freshness signal. Neither metadata nor pages state an update frequency (`frequency` was null for every dataset I checked).

## Q1. Facility and service location datasets (data.gov.sg)

### Takeaway
The only open eldercare point layer, "Eldercare Services", is stale. Its features were last edited in July 2016, and it uses pre-2022 names ("Senior Activity Centre", "Cluster Support"). It has no Active Ageing Centre (AAC) branding, no AIC Link branches and no current nursing-home or day-care list. The fresher, usable layers are Family Service Centres, Community Clubs, Dementia Go-To-Points (which happen to include about 80 AACs), retail pharmacies, bus stops and MRT exits. No open point datasets exist for hospitals, community hospitals, nursing homes (current), day care or polyclinics (apart from an 8-point COVID-vaccination list). CHAS Clinics is a 2021 snapshot.

### Cited Findings (catalogue table)

| # | Exact name / id | Publisher | Format | Licence | data.gov.sg lastUpdated | Real data date (FMEL_UPD_D) | Records | Key fields | Tool use | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Eldercare Services, `d_f0fd1b3643ed8bd34bd403dedd7c1533` | MOH | GeoJSON (176 KB) | SG Open Data Licence v1.0 | 2024-06-06 (created 2023-07-31) | 2016-07-28 for all features | 133 | Name/Description HTML holding ADDRESSPOSTALCODE, ADDRESSSTREETNAME, NAME, HYPERLINK (mostly blank) | Do not use as a directory. 46 "Senior Activity Centre" names, 28 "Home" (homes for aged / senior group homes), 9 "Cluster Support", 9 befriending. No AAC or AIC Link names. Use only as a historical cross-check | Verified — [data.gov.sg](https://data.gov.sg/datasets/d_f0fd1b3643ed8bd34bd403dedd7c1533/view) |
| 2 | CHAS Clinics, `d_548c33ea2d99e29ec63a7cc9edcccedc` | MOH | GeoJSON (1.6 MB) | SG ODL v1.0 | 2024-06-06 | 2021-09-26 | 1,193 | HCI_CODE, HCI_NAME, LICENCE_TYPE (MC 1,053 / MD 140), HCI_TEL, POSTAL_CD, BLK_HSE_NO, FLOOR_NO, UNIT_NO, STREET_NAME, BUILDING_NAME, CLINIC_PROGRAMME_CODE (CHAS; CDMP,CHAS; CDMP,CHAS,ISP), X/Y_COORDINATE (SVY21) | "Nearest CHAS GP/dental" pointer. Must be labelled as a 2021 snapshot with a link to the live CHAS clinic finder | Verified — [data.gov.sg](https://data.gov.sg/datasets/d_548c33ea2d99e29ec63a7cc9edcccedc/view) |
| 3 | Family Services (GEOJSON), `d_add23c06f7267e799185c79ccaa2099b` | MSF | GeoJSON (45 KB) | SG ODL v1.0 | 2026-10-15 | 2026-09-22 to 2026-10-13 | 55 (all DESCRIPTION = "Family Service Centres") | NAME, ADDRESS* fields, TELEPHONE, EMAIL, HYPERLINK, Point geometry | Nearest-FSC referral for caregiver stress or financial help (FSCs administer some social assistance). Current | Verified — [data.gov.sg](https://data.gov.sg/datasets/d_add23c06f7267e799185c79ccaa2099b/view) |
| 4 | Dementia Friendly Go-To-Points (GTPs), `d_e2d10e591bc8560b8946a0da24790fa5` | MOH | GeoJSON (452 KB) | SG ODL v1.0 | 2026-08-20 (created 2025-11-03) | 2024-09-27 to 2026-08-18 | 831 | NAME, ADDRESS, POSTAL_CODE, DESCRIPTION (opening hours + phone, `<BR>`-separated), X_ADDR/Y_ADDR | Dementia-safe return points near home. Name matching finds 82 with "Active Ageing" (70 with "AAC"), 168 MRT, 157 FairPrice, 15 CCs, 4 FSCs. A partial AAC proxy, but not a complete AAC list | Verified — [data.gov.sg](https://data.gov.sg/datasets/d_e2d10e591bc8560b8946a0da24790fa5/view) |
| 5 | Community Club / PAssion WaVe Outlet, `d_9de02d3fb33d96da1855f4fbef549a0f` | People's Association | GeoJSON (94 KB) | SG ODL v1.0 | 2026-10-02 | 2024-04-17 to 2026-09-30 | 128 | NAME, DESCRIPTION ("CC" / outlet), ADDRESS*, HYPERLINK, LANDX/Y | Nearest CC for senior programmes and help desks. Supersedes the older "Community Clubs" `d_f706de1427279e61fe41e89e24d440fa` (2024-06-06 legacy) | Verified — [data.gov.sg](https://data.gov.sg/datasets/d_9de02d3fb33d96da1855f4fbef549a0f/view) |
| 6 | Retail pharmacy locations (GEOJSON), `d_bb92615f43de22933e4479558b1f6c36` | HSA | GeoJSON (130 KB) | SG ODL v1.0 | 2025-11-08 | 2025-09-25 | 249 | PHARMACY_NAME, POSTAL_CODE, HOUSE_BLK_NO, ROAD_NAME, LEVEL_NO, UNIT_NO, BUILDING_NAME | Nearest pharmacy for medication pickup | Verified — [data.gov.sg](https://data.gov.sg/datasets/d_bb92615f43de22933e4479558b1f6c36/view) |
| 7 | Disability Services, `d_9bde6cb42dce64ebaf2dc7ccc2db6201` | MSF | GeoJSON | SG ODL v1.0 | 2024-06-06 | 2012-11 to 2012-12 | 154 | NAME, ADDRESS*, HYPERLINK | Too stale to use | Verified — [data.gov.sg](https://data.gov.sg/datasets/d_9bde6cb42dce64ebaf2dc7ccc2db6201/view) |
| 8 | Silver Infocomm, `d_3eed898889bf933cdd33d6548e220a06` | IMDA | GeoJSON | SG ODL v1.0 | 2024-06-06 | 2014-09 | 101 | NAME ("Silver Infocomm Hotspot"), DESCRIPTION ("Free internet for seniors aged 50 and above"), address | Too stale to use | Verified — [data.gov.sg](https://data.gov.sg/datasets/d_3eed898889bf933cdd33d6548e220a06/view) |
| 9 | Vaccination_Polyclinics, `d_b22489c7dc4065b6e7e45f177fdb33be` | MOH | GeoJSON | SG ODL v1.0 | 2025-11-13 | 2024-01-23 | 8 | NAME, ADDRESS, POSTALCODE, CONTACTNUMBER, VACCINETYPESANDOPERATINGHOURS | COVID-vaccination subset only, not a polyclinic directory. Hard-code the polyclinic list from the cluster sites instead | Verified — [data.gov.sg](https://data.gov.sg/datasets/d_b22489c7dc4065b6e7e45f177fdb33be/view) |
| 10 | Hawker Centres (GEOJSON), `d_4a086da0a5553be1d89383cd90d07ecd` | NEA | GeoJSON | SG ODL v1.0 | 2026-11-24 | not inspected | not inspected | standard NEA fields | Optional: meals near home | Verified (metadata only) |
| 11 | LTA Silver Zone, `d_dc343c021aa470fc71da90d31e552a9a` | LTA | GeoJSON | SG ODL v1.0 | 2024-06-06 | not inspected | not inspected | polygons | Optional context: senior-friendly road zones | Verified (metadata only) |
| 12 | Healthcare Schemes and Subsidies, `d_586ee0cbc5c79ff8167a46132a405239` | MOH | CSV (1.5 KB) | SG ODL v1.0 | 2024-06-26 | n/a | 26 rows | `schemes_and_subsidies`, `type` (Hospitalisation / Long Term Care / Outpatient / Caregiver Support / Aged Care / General) | Scheme name list only (e.g. Home Caregiving Grant, Caregivers Training Grant, SMF, MDW Levy Concession, IDAPE, ElderFund, CareShield Life). No rules, amounts or thresholds | Verified (downloaded) |

Datasets searched for and **not found** anywhere in the 5,608-dataset catalogue (verified by full-catalogue name scan):
- No dataset named "Active Ageing Centres", "Senior Activity Centres" (standalone), "AIC Link", "Nursing Homes", "Community Hospitals", "Day Care", "Hospitals" (point layer) or "Polyclinics" (full list).
- No "Eldercare Services (SHP)" or KML variant. The v2 catalogue contains only the single GeoJSON (format counts: CSV 4,984, GEOJSON 570, XLSX 30, API 22, PDF 2).
- AIC publishes AACs through an interactive map/E-Care locator rather than an open bulk file — [AIC AAC page](https://aic.sg/care-services/active-ageing-centres), [AIC senior activity centre page](https://www.aic.sg/care-services/senior-activity-centre) (search summary). I found no bulk download.

### Inferences
- For AACs, day care, nursing homes and AIC Links, the tool will need a hand-curated JSON built from AIC/MOH web pages, with a "last checked" date. The open data cannot carry it.
- For "near me" features, the safe open layers are FSC, CC, pharmacy, Dementia GTP, bus stop and MRT exit. CHAS works only with a staleness warning.
- These GeoJSONs total under 4 MB without bus stops, so they can be pre-downloaded at build time and shipped as static files. Downloads are rate-limited (below), so client-side fetching is a poor fit.

### Gaps
- I did not open the AIC E-Care locator to check for a hidden JSON endpoint. If one exists, it is not an open-licensed dataset.
- Whether OneMap Themes carry fresher eldercare/CHAS/hospital layers is unverified (token required; see Q3).

## Q2. Population, living-alone, income and housing statistics (SingStat via data.gov.sg / Table Builder)

### Takeaway
The General Household Survey 2025 tables landed on data.gov.sg on 24 Nov 2026. They give planning-area 5-year age bands (for 65+ and 80+ counts), planning-area dwelling type, and a national distribution of household income per member by dwelling type that can sanity-check PCHI-tier shares. Seniors living alone are published nationally (65+ by living arrangement) but not by planning area.

### Cited Findings

| Exact name / id | Publisher | Format | Updated | Coverage | Rows | Key fields | Tool use | Status |
|---|---|---|---|---|---|---|---|---|
| Resident Population by Planning Area/Subzone of Residence, Age Group and Sex (General Household Survey 2025), `d_c5001956eb3cba0d6805f7c28f53d4db` | SingStat | CSV | 2026-11-24 | GHS 2025 | 388 | Number (area/subzone), Total_Total, Total_0_4 … 5-yr bands to 90+, by sex | Sum 65+ and 80+ per planning area for "seniors in your area" context | Verified (metadata + row count via datastore API) |
| Same, Census 2020 version, `d_d95ae740c0f8961a0b10435836660ce0` | SingStat | CSV | 2026-11-19 | Census 2020 | not checked | same | Trend baseline | Verified (catalogue) |
| Resident Households by Planning Area of Residence and Type of Dwelling (GHS 2025), `d_99563a5fc4623bc0cb8b52951ae7e777` | SingStat | CSV | 2026-11-24 | GHS 2025 | 31 | Number, Total1, HDBDwellings_Total, HDB 1-2/3/4/5-room & Exec, Condo, Landed | Annual Value proxy and flat-type mix by area | Verified |
| Resident Households by Monthly Household Market Income Per Household Member and Type of Dwelling (GHS 2025), `d_a582d4df2d13405f4abdaecfe1306c50` | SingStat | CSV | 2026-11-24 | GHS 2025 | 19 bands | Bands from "Below 1,000" to "12,000 & Over", by Total / HDB / flat types / condo / landed | PCHI-tier share check. Total 1,487,100 households: Below $1,000 = 149,500 (10.1%); $1,000-1,499 = 80,600 (cumulative <$1,500 ≈ 15.5%); $1,500-1,999 = 89,800 (<$2,000 ≈ 21.5%); $2,000-2,499 = 102,000 (<$2,500 ≈ 28.4%); $2,500-2,999 = 105,300 (<$3,000 ≈ 35.5%); $3,000-3,499 = 97,700 (<$3,500 ≈ 42.0%) | Verified (rows read via datastore API; percentages computed by me) |
| Resident Households by Monthly Household Employment Income Per Household Member and Type of Dwelling (GHS 2025), `d_b72b2c4a2c04c13cae825e103001dfcd` | SingStat | CSV | 2026-11-24 | GHS 2025 | not checked | income bands × dwelling | Alternative (employment income only) | Verified (catalogue) |
| Resident Households by Monthly Household Market Income Per Household Member and Age Group of Household Reference Person & Household Living Arrangement (GHS 2025), `d_1cac63c4af1b09818e2e8524e4994c02` | SingStat | CSV | 2026-11-24 | GHS 2025 | not checked | income bands × (age of ref person × living arrangement) | PCHI shares for senior-headed and living-alone households | Verified (catalogue) |
| Resident Households by Age Group of Household Reference Person & Household Living Arrangement and Household Size (GHS 2025), `d_a387d963b5ea2dac9fc20d8b92c4212c` | SingStat | CSV | 2026-11-24 | GHS 2025 | not checked | living arrangement × size | National count of one-person 65+ households (living alone) | Verified (catalogue) |
| Resident Population Aged 65 Years and Over in Resident Households by Level of Difficulty in Performing Basic Activity in Specific Domain, Living Arrangement and Sex (GHS 2025), `d_eba7f881c84690ed2c6fc155060cca7c` | SingStat | CSV | 2026-11-24 | GHS 2025 | not checked | functional difficulty × living arrangement | Prevalence of ADL-type difficulty among seniors living alone | Verified (catalogue) |
| Resident Population Aged 5 Years and Over by Planning Area of Residence, Level of Difficulty in Performing Basic Activities and Age Group (GHS 2025), `d_d95fea7e3d5683bead8f8bff0bf44a7a` | SingStat | CSV | 2026-11-24 | GHS 2025 | not checked | planning area × difficulty × age | Area-level disability context | Verified (catalogue) |
| Resident Households by Planning Area of Residence and Presence of At Least One Member with Difficulty in Performing Basic Activities (GHS 2025), `d_7e4513fd9b52e9bc0405624c2624f4a7` | SingStat | CSV | 2026-11-24 | GHS 2025 | not checked | area × presence | Area caregiving-need context | Verified (catalogue) |
| Key Indicators On The Elderly, Annual, `d_dd380a87c84d7bf73e1ca050b176370f` (Table Builder M810611) | SingStat | CSV | 2026-11-19 | columns 2014-2026 (recent years partly "na") | 55 | DataSeries × year | Headline senior stats | Verified |
| Table Builder 9001 / 8991 / 8442: "Resident Population Aged 65 Years and Over in Resident Households by Living Arrangements, Age Group and Sex" | SingStat | Table Builder API (JSON) | not checked | various | n/a | living arrangement × age × sex | Living-alone share by age band (national) | Verified (Table Builder search API `https://tablebuilder.singstat.gov.sg/api/table/resourceid?keyword=elderly&searchOption=all` returned 36 tables) |
| HDB Elderly and Future Elderly Resident Population by Geographical Distribution / Flat Type / Ambulant Status (e.g. `d_4180067b350bc9839a4cea487841d5d1`, `d_6c678a9e6cf49086c1fea012c40ceafe`, `d_995d47e4632e72e4f0a589ed5e51bd36`) | HDB | CSV | 2024-06-06 / 2026-10-21 | coverage end 2018 (Sample Household Survey 2018) | not checked | town / flat type / ambulant status | Dated. Context only | Verified (catalogue) |

### Inferences
- The income-per-member table is **market income** (there are also "including regular government contributions" variants). MOH's means test uses gross household monthly income per capita with other rules, so these shares are only a rough check on tier proportions, not a reproduction of eligibility.
- Planning-area living-alone counts are not directly available. The tool could show national rates, or approximate area counts by applying national rates to area 65+ counts, labelled as an estimate.

### Gaps
- I did not download every GHS 2025 table to confirm row labels (e.g. exact living-arrangement categories).
- I did not check SingStat Table Builder's own terms of use.

## Q3. OneMap (SLA) APIs

### Takeaway
OneMap search (geocode by postal code) is currently usable without a token, but the response now carries an "Authentication token missing" warning. Themes, routing, reverse geocode, nearby bus/MRT and the population query API all need a bearer token that expires every 3 days and is obtained with account email and password. A purely static site therefore cannot safely use token-gated APIs without exposing credentials. The token-free search is fine for postal-code lookup.

### Cited Findings
- Verified by live call on 24 Nov 2026: `GET https://www.onemap.gov.sg/api/common/elastic/search?searchVal=520201&returnGeom=Y&getAddrDetails=Y&pageNum=1` returned results (BLK_NO, ROAD_NAME, BUILDING, ADDRESS, POSTAL, X, Y, LATITUDE, LONGITUDE) plus `"error": "Authentication token missing. Please create an account and generate or renew your API Token."`.
- Verified: `getAllThemesInfo` and `popapi/getPlanningareaNames` return HTTP 401 "Unauthorized" without a token.
- OneMap docs (text inside the official docs bundle at onemap.gov.sg/apidocs) say each token "is valid for 3 days" and "does not auto renew". It is obtained by POSTing email and password to `/api/auth/post/getToken`, and "the token is not required for the map services". The docs warn against repeated getToken calls ("rate-limiting bans") and against exposing credentials client-side — [OneMap API docs](https://www.onemap.gov.sg/apidocs/) (verified via the site's JS bundle).
- Endpoints listed in the docs (verified): search `/api/common/elastic/search`; coordinate convert `/api/common/convert/{3414to4326,…}`; reverse geocode `/api/public/revgeocode` and `/api/public/revgeocodexy`; routing `/api/public/routingsvc/route` (routeType drive/pt/walk/cycle); nearby `/api/public/nearbysvc/getNearestBusStops` and `getNearestMrtStops`; themes `/api/public/themesvc/{getAllThemesInfo,getThemeInfo,checkThemeStatus,retrieveTheme}`; population query `/api/public/popapi/{getPlanningareaNames,getAllPlanningarea,getPlanningarea,getPopulationAgeGroup,getTypeOfDwellingHousehold,getHouseholdMonthlyIncomeWork,getHouseholdSize,getHouseholdStructure,getTenancy,…}` (22 endpoints).
- The OneMap MCP gateway (new section in the docs) enforces 5 requests/second per token with a 10-request burst. It uses a 24-hour access token from a 30-day refresh token. This applies to the MCP gateway; the docs did not state a REST rate limit — [OneMap API docs](https://www.onemap.gov.sg/apidocs/) (verified).
- OneMap API Terms of Service: dataset use is governed by the Singapore Open Data Licence. Commercial and non-commercial use is allowed. You must use the credentials issued to you and keep them confidential. Access can be suspended "for any reason whatsoever". APIs are "as is" — [OneMap API ToS](https://www.onemap.gov.sg/legal/apitermsofservice.html) (verified).
- Theme names (whether eldercare / CHAS / AAC / hospitals themes exist) could not be listed without a token. The docs' sample theme is "kindergartens", and the MCP description mentions "schools, parks, hawker centres, carparks, hospitals" — [OneMap API docs](https://www.onemap.gov.sg/apidocs/) (verified text; actual theme list unverified).

### Inferences
- Best static pattern: a build-time script (with a token held in CI secrets) pulls any theme or population data into static JSON. At runtime the browser only calls the token-free search for postal-code to lat/lng, then computes straight-line distances locally to the pre-built layers.
- The population query API overlaps the GHS/Census CSVs on data.gov.sg, so the CSVs are simpler (no token).

### Gaps
- Actual OneMap theme list (eldercare, CHAS, AAC, hospitals) is unconfirmed. It needs a registered account to call `getAllThemesInfo?moreInfo=Y`.
- I found no published REST rate limit, and no statement on how long token-free search will keep working.
- OneMap basemap tile attribution wording was not captured (the docs footer shows "©2025 OneMap. All rights reserved" and links to SLA).

## Q4. MOH statistics (beds, places, admissions)

### Takeaway
MOH's facility and bed counts are machine-readable on data.gov.sg (CSV, year × facility type, to 2025). Non-residential long-term care places (day and home care) appear on the MOH web page, but I did not find them as a data.gov.sg CSV.

### Cited Findings
- Health Facilities and Beds in Inpatient Facilities, `d_74ee2734189f4124fefbf01c3fe48bec` (MOH, CSV, updated 2026-10-27, coverage 2009-2025, 85 rows; fields year, institution_type, facility_type_a, no_of_facilities, no_beds). 2025 rows: Acute 20 facilities / 12,767 beds; Psychiatric 1 / 1,950; Community Hospitals 10 / 2,579; Nursing Homes 91 / 21,056; Inpatient Hospice 10 / 331 — [data.gov.sg](https://data.gov.sg/datasets/d_74ee2734189f4124fefbf01c3fe48bec/view) (verified via datastore API).
- The MOH web page reportedly gives 2025 nursing-home beds as 21,002 (vs 21,056 in the CSV), 9,400 non-residential day places and 15,400 home-care places — [MOH beds and places page](https://www.moh.gov.sg/others/resources-and-statistics/beds-in-inpatient-facilities-and-places-in-non-residential-long-term-care-facilities/) (search summary; the nursing-home figure conflicts with the CSV and needs checking).
- Variants (verified in catalogue): Health Facilities and Beds in Inpatient Facilities (Public Not-for-Profit Private) `d_852ebeb1165d0ec4cdc89fa7742959d1`; Health Facilities (Primary Care, Dental Clinics and Pharmacies) `d_e4663ad3f088a46dabd3972dc166402d`; Beds In Inpatient Facilities, Annual `d_0f8f02e6e821fc88aa96442656b69241` (SingStat, to 2025); Hospital Beds By Facility Type And Planning Region, Annual `d_0ed27481bde3ad8abac12be380a441bb` (26 series, 2020-2025, regional split).
- Admissions (verified in catalogue): Hospital Admission Rate by Age and Sex `d_dd32a9abff167b63efc11fb2f25cb341` (MOH, updated 2026-10-27, to 2025); Hospital Admission Rate By Sex And Age, Annual `d_e2acb8eaf4eaf1e0a1608af9a9cd2634` (SingStat, to 2024); Admissions To Public Sector Hospitals, Monthly `d_1338b55f6d4ea6b2df9884ec4bce4464` (to Sep 2026).
- CareShield/ElderShield (CPF Board, CSV, updated 2026-03-26, to 2025, verified in catalogue): Number of active claimants under CareShield Life `d_2d354cff56f6a04bb55490fc92fa771e`; Amount of claims made under CareShield Life `d_33d8eac577784fbd8c01b8164ded809b`; ElderShield equivalents `d_ac37f9e1e46841a52f7c5324602d8bbd`, `d_2b23ddde24b76b373d35dfc4093698d3`.

### Inferences
- Useful for an "about the system" panel (e.g. 91 nursing homes, about 21k beds) and supply-demand context. These tables say nothing about cost per user.

### Gaps
- The MOH page URL tried first returned 404 (it has moved). I did not open the working MOH URL to resolve the 21,002 vs 21,056 difference or to confirm whether MOH offers its own CSV/XLSX.

## Q5. Transport (LTA), HDB, IMDA digital use

### Takeaway
LTA bus stop and MRT exit point layers are current on data.gov.sg and need no key. The DataMall APIs need an AccountKey and are not suited to a static browser app. IMDA's senior digital-use data is old, though SingStat carries internet-use by age to 2024.

### Cited Findings
- LTA Bus Stop, `d_3f172c6feb3f4f92a2f47d93eed2908a` (GeoJSON, 1.9 MB, updated 2026-10-06, features edited Aug-Sep 2026, 5,205 points; fields BUS_STOP_NUM, BUS_ROOF_NUM, UNIQUE_ID). No stop names in this layer — [data.gov.sg](https://data.gov.sg/datasets/d_3f172c6feb3f4f92a2f47d93eed2908a/view) (verified).
- LTA MRT Station Exit (GEOJSON), `d_b39d3a0871985372d7e1637193335da5` (213 KB, updated 2026-10-18, 613 exits; STATION_NA, EXIT_CODE) — [data.gov.sg](https://data.gov.sg/datasets/d_b39d3a0871985372d7e1637193335da5/view) (verified). Use: "nearest MRT to the day-care centre".
- LTA DataMall terms: data governed by the Singapore Open Data Licence; credentials must be kept confidential; up to 10 million calls/day — [LTA API ToS](https://datamall.lta.gov.sg/content/datamall/en/api-terms-of-service.html) (verified). Keeping a key confidential is incompatible with shipping it in static client code (my inference).
- HDB: HDB Branches (GEOJSON) `d_3535361f967e8005dc44b4ce4d2c5276` (2026-10-15). The HDB elderly-population tables only run to 2018 (see Q2) (verified in catalogue).
- Digital use: Individuals Internet Usage By Age Group, Annual `d_3f4bfee2d42f8fb3bea3218c01aa9902` (SingStat, to 2024); Internet Usage By Singapore Residents Aged 16 And Over, By Sex `d_5094690873a62a69619ab076138f238c` (to 2025); Proportion Of Singapore Residents Using The Internet By Planning Region `d_033c6903744b84ffc4aede1cf742cc34` (to 2025); IMDA Individual Internet Usage by Age `d_5bdc3fbb49cfdf6d4ea7d826cc88bc84` (to 2018) (verified in catalogue). Use: justifying a large-text, low-tech design and printable plans.

### Inferences
- Bus stops are 1.9 MB, so pre-filtering to stops within ~400 m of each care facility at build time keeps the payload small.

### Gaps
- I did not open the data for the internet-usage tables to quote 65+ rates.

## Q6. Machine-readable subsidy and grant rules

### Takeaway
Confirmed: no open dataset or API encodes subsidy rules (PCHI tiers, subsidy percentages, grant amounts or caps). The closest is MOH's 26-row "Healthcare Schemes and Subsidies" CSV, which lists scheme names and categories only.

### Cited Findings
- The "Healthcare Schemes and Subsidies" CSV (`d_586ee0cbc5c79ff8167a46132a405239`, MOH, updated 2024-06-26) has 2 columns, `schemes_and_subsidies` and `type`, with 26 rows. Examples are "Subsidies for Residential Long-Term Care Services", "Home Caregiving Grant (HCG)", "Caregivers Training Grant (CTG)" and "Seniors' Mobility And Enabling Fund". None of the rows carry thresholds or amounts (verified by download).
- A full catalogue scan (5,608 names) found no dataset on means-testing, PCHI tier tables, LTC subsidy rates, HCG amounts or MediFund/ElderFund criteria. The CareShield Life and ElderShield items are aggregate claims and claimant statistics only (verified).
- The 22 API-format datasets on data.gov.sg are weather, environment, LTA traffic/taxi, HDB carpark and NLB services. None are health or eldercare (verified).

### Inferences
- Subsidy logic must be hand-encoded from MOH/AIC web pages into a versioned rules JSON, with source URLs and "rules as at" dates, and re-checked on each policy change (e.g. Budget announcements).

### Gaps
- I did not check whether SupportGoWhere or LifeSG expose an eligibility API (they are not on data.gov.sg; any such API is likely not public).

## Q7. Licence and attribution

### Takeaway
All data.gov.sg datasets and OneMap API data fall under the Singapore Open Data Licence v1.0. It allows free commercial and non-commercial use and modification, and requires a visible attribution notice linking to the licence. It forbids implying government endorsement.

### Cited Findings
- The licence grants a worldwide, royalty-free, perpetual, non-exclusive right to use, adapt and build applications, commercially or not. You must include the notice: "Contains information from {name of dataset} accessed on {date} from {source} which is made available under the terms of the Singapore Open Data Licence version 1.0 {link}". You must not suggest official status or endorsement. Personal data and third-party rights are excluded. Data comes with no warranty of accuracy or timeliness, and the user indemnifies the agency — [Singapore Open Data Licence](https://data.gov.sg/open-data-licence) (verified).
- data.gov.sg rate limits (per 10-second window): Dataset Downloads 2 calls without a key, 4 with a Dev key, 10 with a Prod key. Datastore Search 4/8/20. Realtime 6/12/30. Exceeding a limit returns HTTP 429 — [data.gov.sg API rate limits](https://guide.data.gov.sg/developer-guide/api-overview/api-rate-limits) (verified). I hit these limits in practice: several downloads needed retries.
- OneMap API ToS sits on top of the same Open Data Licence — [OneMap API ToS](https://www.onemap.gov.sg/legal/apitermsofservice.html) (verified).

### Inferences
- The tool needs a "Data sources" footer or page with one attribution line per dataset (name, access date, source, licence link), plus a disclaimer that facility lists may be out of date.
- Given the rate limits, the static site should bundle snapshots made at build time rather than call data.gov.sg from each visitor's browser.

### Gaps
- SingStat Table Builder and AIC website terms were not reviewed.
