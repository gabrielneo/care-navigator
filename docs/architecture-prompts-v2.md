# Caregiver Navigator: Modular Build Prompts (v2)

24 Nov 2026 · supersedes the v1 .docx · pairs with `docs/product-design-v2.md`

A six-stage prompt suite for an AI coding assistant. Run the stages in order; each locks one layer.

**What changed from v1:** no serverless function and no outside service at run time (postal sector matched on the phone); no data.gov.sg eldercare provider layer (it dates from 2016) — a curated `contacts.yaml` plus open FSC/CC layers instead; merged subsidy tiers T0–T5 for two schemes (non-residential and residential); grants gated on 3+ daily activities; cost shown as low–high ranges; a "Where is Mum right now?" entry question; nursing homes as a "from" figure beside real bills; 7 ADRs instead of 5.

| Stage | Layer | Outputs | Gate |
|---|---|---|---|
| 1 | Repo, ADRs, curated YAML | Repo layout, 7 ADRs, 9 YAML tables with seed data | Gate 2 (rules reviewed) |
| 2 | Python pipeline | Pydantic validation, open-layer pull, SHA-256 manifest | Gate 3 (data) |
| 3 | TypeScript domain engine | Branch + matching rules, range cost maths, URL codec, golden tests | Gate 3 (tests) |
| 4 | Location | On-device postal-sector lookup with region fallback, distance sort over contacts and places | Gate 3 (offline-safe) |
| 5 | 7-screen UI | WCAG 2.2 AA static Next.js app, A4 print layout | Gate 3 (a11y) |
| 6 | E2E QA and compliance | Playwright + axe suite, licence and privacy audit | Launch ready |

---

## Stage 1: Repository, ADRs and curated YAML

Act as a Principal Solutions Architect. Set up the repository for Care Navigator (working name Caregiver Navigator; repo `care-navigator`), a zero-database, static-first Singapore care-plan and cost estimator for family caregivers of seniors.

**1. Directory structure**
- `docs/adr/` — Architecture Decision Records
- `data/raw/` — gitignored; snapshots of open layers pulled at build time
- `data/curated/` — hand-curated YAML: `source_registry.yaml`, `service_types.yaml`, `need_rules.yaml`, `branch_rules.yaml`, `price_references.yaml`, `subsidy_tiers.yaml`, `grant_rules.yaml`, `how_to_apply.yaml`, `contacts.yaml`
- `pipeline/` — Python 3.12 + PyYAML + Pydantic: ingestion, validation and JSON output
- `web/public/data/` — build output, committed to the repo: `rules.json`, `contacts.json`, `places.json`, `sectors.json`, `manifest.json`
- `web/` — Next.js (`output: 'export'`) + TypeScript + one global stylesheet (Tailwind was dropped at Stage 5; see the confirmed decisions). No API routes.

**2. ADRs (`docs/adr/`)** — one short file each:
- `ADR-001-no-backend.md`: no database and no server code at launch. Matching and cost run in the browser; shared plans live in the URL with no personal data.
- `ADR-002-curated-rules-over-scraping.md`: rules, prices and contacts are hand-curated with `source_id` and `checked_on`. Only open-licence data.gov.sg layers are pulled automatically. MOH tables are copied from raw HTML, never page text (text scrapers drop merged cells).
- `ADR-003-income-band-not-income.md`: users pick a household-income-per-person (PCHI) band, with a 3-question helper; exact income never enters the system.
- `ADR-004-grants-shown-never-subtracted.md`: grants and payouts (Home Caregiving Grant, MediSave Care, CareShield Life, ElderFund, levy concession) are listed as "may qualify" beside the total and never subtracted.
- `ADR-005-no-provider-directory.md`: data.gov.sg "Eldercare Services" was last edited 2016 and there is no open dataset for AACs, AIC Links, day care or nursing homes. Curate a short "who to call" list (AIC Links, community and acute hospitals, polyclinics); use the open FSC and CC layers for "nearest"; link out to AIC's E-Care locator for centres and nursing homes. Never rank providers.
- `ADR-006-on-device-postal-sector.md`: OneMap's search API requires a token (checked 25 Nov 2026), so the site calls no outside service at run time. The browser takes the first 2 digits of the postal code (the postal sector) are matched on the phone to a built-in table of area centres (`sectors.json`, built from the postal codes and coordinates of the open FSC and CC layers and the curated contacts). An unknown sector falls back to a region picker. The full postal code never leaves the phone and is never stored or shared; the shared link holds only the 2-digit sector. Accurate to the neighbourhood, which is enough to pick the nearest of 9 AIC Links. A serverless OneMap proxy with a token is the documented upgrade if street-level distance is ever needed.
- `ADR-007-nursing-homes-range-only.md`: nursing homes appear as a labelled "from" figure ($4,900 × (1 − residential subsidy)) beside real published bills, never as one exact figure and never ranked against home care.

**3. Curated YAML (`data/curated/`)** — strict relational keys (`source_id`, `service_id`, `apply_id`, `tier_id`, `grant_id`, `branch_id`, `contact_id`). Seed with:

- `subsidy_tiers.yaml` — two schemes, effective 2026-07-01, verified from MOH raw HTML. Columns: SC born 1969 or earlier / SC born after 1969 / PR.

  | tier_id | PCHI | non_residential | residential |
  |---|---|---|---|
  | T0 | 0–1,500 (or no income, AV ≤ 21,000) | 95 / 80 / 55 | 80 / 75 / 50 |
  | T1 | 1,501–2,300 | 85 / 70 / 45 | 65 / 60 / 40 |
  | T2 | 2,301–2,600 | 75 / 60 / 35 | 55 / 50 / 30 |
  | T3 | 2,601–3,600 | 55 / 40 / 20 | 35 / 30 / 15 |
  | T4 | 3,601–4,800 | 35 / 20 / 10 | 15 / 10 / 5 |
  | T5 | 4,801+ (or no income, AV > 21,000) | 0 / 0 / 0 | 0 / 0 / 0 |

  Store `av_rule` on T0 and T5. Note that 2026 subsidies use 2025 Annual Values.
- `grant_rules.yaml` — each with `kind`, `amount_by_band`, `min_adl`, `other_conditions`, `official_url`, `effective_from`:
  - Home Caregiving Grant: $600 (T0) / $400 (T1–T3) / $200 (T4, or multiple-property owners); `min_adl: 3`; not in a residential facility; FAR then eFASS.
  - MediSave Care: up to $200/month by MediSave balance.
  - CareShield Life: $689/month for 2026 claims (CPF, verified 25 Nov 2026), `min_adl: 3`.
  - ElderFund: up to $250/month (HealthHub/CPF, verified 25 Nov 2026; individual amounts can be lower).
  - Levy concession: $60/month; senior 67+ or `min_adl: 1`.
  - Caregivers Training Grant: $400 + $200/year.
- `service_types.yaml` — Day Care, Dementia Day Care, Home Personal Care, Home Nursing, Home Therapy, Centre-based Rehab, Medical Escort & Transport, Meals On Wheels, Respite, Active Ageing Centre, Interim Caregiver Service (ward referral only), Nursing Home (residential). Each with `setting`, `moh_subsidised`, `unit`, `default_units_per_week`, plain description.
- `price_references.yaml` — `price_low_sgd` / `price_high_sgd` with separate sources and a `confidence` of official / provider / aggregator. Seed: day care $55–74/session; day care transport $250–440/month; dementia day care $63–73/session; home personal care $25–32/hour; home nursing $62–141/visit; home therapy $125–160/visit; centre-based rehab $52–102/session; meals $4.90–7; escort $40–150/round trip; nursing home respite $100–150/day; nursing home $4,900/month as a "from" price only (`price_high_sgd` equals the low).
- Default frequencies: day care 5/week; home personal care 3 blocks of 4 hours/week; home nursing 1/week; home therapy 1/week.
- `need_rules.yaml` — the matching table in the product design, with `reason_text`.
- `branch_rules.yaml` — answer labels use AIC's Care Services Recommender wording (see `docs/verified/gate1-recommender-walkthrough-2026-11-25.md`), and `in_hospital` links to AIC's discharge tips rather than copying them; `in_hospital`, `changed_at_home`, `struggling`, `in_nursing_home`; each with flags, an `ask_list` (e.g. in hospital: "Ask about the Interim Caregiver Service and Hospital-to-Home before discharge"; "Ask for the single assessment and care plan"), and `timeline_notes` (bridges last ~2 weeks to 2 months; psychiatric nursing home beds 2–4 months median, Aug 2024).
- `how_to_apply.yaml` — first contact per service: ward MSW, GP/polyclinic, AIC Link or provider; steps; documents.
- `contacts.yaml` — the 9 AIC Links in `docs/verified/aic-links-2026-11-25.md` (addresses, hours, coordinates from AIC's own map data), plus community hospitals, acute hospitals and polyclinics; each with address, postal code, lat/lng, hours, phone, `checked_on`. The pipeline rejects any lat/lng outside Singapore.

## Stage 2: Python 3.12 pipeline and validation

Act as a Senior Data Engineer. Build the pipeline in `pipeline/`.

**1. Pydantic models (`pipeline/schemas.py`)** for all nine curated tables, the `Place` open-layer record, and `ReleaseManifest` (version, build time, source check dates, SHA-256 of every JSON artifact, warnings).

**2. Ingestion and transform (`pipeline/build_release.py`)**
- Download five data.gov.sg GeoJSON layers: Family Services (`d_add23c06f7267e799185c79ccaa2099b`) and Community Club / PAssion WaVe (`d_9de02d3fb33d96da1855f4fbef549a0f`) feed `places.json` and the sector table. CHAS clinics (`d_548c33ea2d99e29ec63a7cc9edcccedc`, field `POSTAL_CD`), retail pharmacies (`d_bb92615f43de22933e4479558b1f6c36`) and Dementia Go-To-Points (`d_e2d10e591bc8560b8946a0da24790fa5`) feed the sector table only. See `docs/verified/postal-sectors-2026-11-25.md`. Respect the unauthenticated limit of 2 downloads per 10 seconds; retry on HTTP 429 with backoff.
- Save raw snapshots with SHA-256 and fetch time. Normalise to `Place` records, keeping each feature's `FMEL_UPD_D` as `feature_updated_on` (data.gov.sg's dataset-level "last updated" is a migration date, not freshness).
- Build `sectors.json`: group every point from the five layers plus the contacts by the first 2 digits of its postal code, drop points outside Singapore's bounding box, and take the mean lat/lng per sector. Expected: 76 of 81 sectors, with 02, 70, 71, 72 and 77 missing.
- Load `data/curated/*.yaml` with PyYAML straight into the Pydantic models. The data is about ten small files; no database or query engine.

**3. Checks (`pipeline/validate.py`)**
- Blocking:
  - Every row references a valid `source_id`.
  - Each subsidy scheme covers PCHI $0 to infinity with no gaps, no overlaps and no empty percentages.
  - All percentages 0 ≤ pct ≤ 100.
  - Every `service_id` in need_rules, price_references and how_to_apply exists in service_types.
  - `price_low_sgd ≤ price_high_sgd`.
  - Every contact and place has a lat/lng inside Singapore's bounding box (lat 1.15–1.48, lng 103.6–104.1).
- Warnings (written into `manifest.json` and shown on the site's data page):
  - Any source past `next_review`.
  - Any contact with `checked_on` older than 90 days.
  - Any price with `confidence: aggregator`.
  - Fewer than 70 postal sectors with a centre in `sectors.json` (unknown sectors fall back to the region picker, so this is a warning).
  - Any place whose `feature_updated_on` is older than 24 months.
  - Any `official_url` in grant_rules or source_registry that does not return HTTP 200 after retries. This is a warning, never a block: MOH, AIC and ask.gov.sg often refuse automated requests.

**4. Output and GitHub Actions**
- Write `rules.json`, `contacts.json`, `places.json`, `sectors.json`, `manifest.json` to `web/public/data/`. The manifest's version and hashes identify what the site ships.
- `.github/workflows/data.yml`: on push to `data/curated/**`, weekly cron and `workflow_dispatch`: run pytest, run the pipeline, and commit the JSON if it changed. Vercel's Git integration rebuilds the site on that push; no GitHub Releases and no deploy hook.
- `.github/workflows/review.yml`: monthly, open an issue listing sources and contacts due for review; on 1 Mar and 1 Apr, open an issue to re-check every subsidy, grant and price table after the Budget and Committee of Supply.

## Stage 3: TypeScript engine — branches, matching, cost ranges, URL codec

Act as a Staff TypeScript Engineer. Build `web/src/lib/engine/`. Allowed dependency: `zod` (URL allowlist). Nothing else.

**1. Branch and matching (`matching.ts`)**
- Input:
  - `where`: `in_hospital | changed_at_home | struggling | in_nursing_home`
  - `adlHelp`: a set of the 6 daily activities — washing, dressing, feeding, toileting, moving about, transferring (getting in and out of bed)
  - `aloneInDay`, `memoryProblems`, `hasLiveInHelper`, `caregiverExhausted`, `mostlyIndependentIsolated`
  - each answer also allows `not_sure`
- Return:
  - branch flags and the branch `ask_list`
  - 1–5 matched services with `reason_text`
  - `adlCount`
  - a `confirmWithProfessional` flag if any answer is `not_sure`
- `in_nursing_home` skips matching and goes to the nursing home range.

**2. Cost (`cost.ts`)**
- Per service:
  ```
  unitsPerMonth = unitsPerWeek × 52 / 12
  low  = unitsPerMonth × priceLow  × (1 − r)
  high = unitsPerMonth × priceHigh × (1 − r)
  ```
- `r` comes from `subsidy_tiers[scheme][tier]` by residency and birth year (≤1969 vs >1969). Apply only when `service.moh_subsidised`.
- Use scheme `non_residential` for home and community services, `residential` for nursing home and NH respite.
- Home personal care: `unitsPerWeek` = blocks × 4 hours.
- A user-entered quote replaces both `priceLow` and `priceHigh`.
- Return two figures per line and in the total: `withSubsidy` (applies `r` when `moh_subsidised`; no GST, because MOH absorbs it for subsidised patients) and `fullPrice` (r = 0, flagged `mayAddGst: true` for a 9% note; never added to the number). Round all displayed amounts to the nearest $5. Return `isEstimate: true` and provenance per line: prices, sources, subsidy %, `sourceUrl`, `checkedOn`.
- Subsidy does not depend on `adlCount`.
- `potentialGrants`: evaluate grant_rules by tier, `adlCount ≥ min_adl`, age and helper flags. Return as "may qualify". Never subtract from any total.
- `splitBetween(n)`: total low/high ÷ n, rounded to $5.
- Nursing home: return "from" = $4,900 × (1 − r) on the residential scheme. Do not compute a high end: no published subsidised top price exists. Return it with the real-bill anchor (Ren Ci, Jul 2026: $620–$3,069 a month for subsidised residents) and the label "subsidised beds at government-funded homes, after assessment".

**3. URL codec (`urlCodec.ts`)**
- Serialise the session as JSON, base64url-encoded with the built-in `btoa`/`atob`, into the URL hash (about 300 characters; no compression library): `where`, answers, weekly plan, tier, residency, birth-year group, quotes, split count, and either the 2-digit postal sector or the chosen region (never the full postal code).
- Decode through a Zod allowlist that rejects any unknown field. No names, NRIC or income figures can be encoded or rendered. Malformed input falls back to a fresh session.

**4. Golden tests (`__tests__/`, Vitest)**
- Every tier × residency × birth-year cell, in both schemes.
- Boundaries: $1,500/$1,501, $2,300/$2,301, $2,600/$2,601, $3,600/$3,601, $4,800/$4,801.
- The AV rule (no income, AV 21,000 vs 21,001).
- Home Caregiving Grant appears only with `adlCount ≥ 3` and the right band.
- No grant or payout is ever subtracted from a total.
- `price_low ≤ price_high` survives rounding.
- URL round-trip fidelity, unknown-field rejection, malformed-URL fallback.
- One test per `need_rules` row and per branch rule: with the answers the rule expects, its service or flag appears; with the opposite answers, it does not.
- Sanity check, not a unit test: a low-income, severe-disability package lands in the same order of magnitude as MOH's ~$110/month benchmark after CareShield.

## Stage 4: Location — browser postal lookup and distance sort

Act as a Frontend Engineer with a privacy brief. Build `web/src/lib/geo/`. There is no server code.

**1. Postal sector lookup (`postal.ts`)**
- Validate the input strictly against `/^\d{6}$/`.
- Take the first 2 digits (the postal sector) and look it up in `sectors.json`, which ships with the site. No network request of any kind.
- Return the sector's `{ lat, lng }` centre.
- An unknown sector returns `unavailable`. Never throw into the UI.
- On `unavailable`, the UI offers a region picker (Central, North, North-East, East, West). Regions map to fixed centroids in `regions.ts`.
- Log nothing. The full postal code is never stored, never sent anywhere, never put in analytics, and never put in the shared link (only the 2-digit sector is).

**2. Distance sort (`nearby.ts`)**
- Haversine distance in km from the resolved point to:
  - each `contacts.json` entry: the nearest AIC Link and the nearest polyclinic (no hospitals: 8 of the 9 AIC Links sit inside hospitals, and the in-hospital branch points to the ward social worker). Polyclinic coordinates are sector centres (`location_precision: sector`).
  - each `places.json` entry: nearest FSC and nearest CC.
- Carry `checked_on` or `feature_updated_on` with every result.
- Always append a link to AIC's E-Care locator for Active Ageing Centres, day care and nursing homes.
- In the `in_hospital` branch, the first contact is always "the medical social worker on the ward", above any distance result.

## Stage 5: Frontend — warm palette, 7-screen flow, print plan

Act as a Senior Frontend and Accessibility Engineer. Build the 7-screen Next.js static export using the warm palette in `docs/brand/tokens.css` (cream paper, espresso text, terracotta actions, sage for reassurance; owner's choice, 25 Nov 2026). Copy it into `web/src/app/tokens.css`, and match the layouts in `docs/wireframes/index.html`. Type: system UI sans for body text and Charter serif for headings.

**1. Accessibility and design (WCAG 2.2 AA)**
- Body text 18px minimum (1.125rem), 1.6 line height, 48 × 48px tap targets, clean at 200% zoom.
- Reading age about 12, sentences under 20 words, plain words first with official terms in brackets ("household income per person (PCHI)"). Use "estimate" and "may qualify"; never "eligible" or "you will get".
- On every page:
  - footer notice: "Independent student project. Not affiliated with MOH, AIC or the Government of Singapore."
  - footer: AIC Hotline 1800-650-6060 and 995 for emergencies
  - data-sources link
- 995 appears in the footer only (owner's decision, 25 Nov 2026). Not on the Start screen, no banner.
- Prototype (decisions 2 and 4): no analytics, no feedback form and no third-party scripts. Show the prototype banner from spec 06 and `noindex` from spec 11. Before a public launch, add Umami Cloud (cookie-free) with the custom events below.
- Events to add at public launch, with zero personal data: `session_started`, `where_answered`, `needs_completed`, `plan_built`, `cost_viewed`, `contacts_viewed`, `plan_shared`, `official_link_clicked`.

- Follow the "Interaction rules" in `docs/product-design-v2.md` exactly. They cover page patterns, labels, blur validation, button wording, error and empty-state copy, the inline postal-lookup loader, stacking at 375px, no modals, motion limits and keyboard access.

**2. The 7 screens (one decision per screen)**
1. **Start** — "Plan care for someone you look after, in about 5 minutes. Nothing you enter is saved." One "Start" button.
2. **Where and what** — "Where is Mum right now?" (in hospital / something just changed at home / we're struggling at home / already in a nursing home). Then one question per screen, with progress "2 of 7":
   - the 6 daily-activity picture cards
   - alone in the day
   - memory problems
   - live-in helper
   - the caregiver's own limits
   - postal code (optional, with "skip and pick a region")

   "Not sure" is always available.
3. **Your matches** — 1–5 service cards: plain name, one line, "Why this fits", price range badge.
4. **Build your week** — 7-day grid pre-filled with defaults labelled "our assumption, change it"; tap to add; +/- steppers; no drag and drop.
5. **Monthly cost** — PCHI band picker with a 3-question helper, residency toggle, birth-year toggle (default "1969 or earlier"). Shows:
   - a big monthly range, with subsidy and at full price
   - per-service lines, with day care transport as its own line
   - a field to enter a quoted fee
   - a "How is this worked out" table with sources and checked-on dates
   - a separate "You may qualify for" card
   - two columns per service and in the total: "At a government-funded provider (with subsidy)" and "Full price (private provider)" (owner's decision, 25 Nov 2026)

   The nursing home range appears here for the `in_nursing_home` branch or on request, never ranked against home care.
6. **Who to call** — list only:
   - the ward MSW first in the hospital branch
   - then the nearest AIC Link, hospitals, polyclinic, FSC and CC, each with distance and checked-on date
   - then the link to AIC's locator
7. **Your action plan** — numbered "Monday morning" checklist:
   - who to contact first and what to ask ("the single assessment and care plan"; in hospital, the branch ask list before discharge)
   - documents to bring
   - links to the Care Services Recommender and SupportGoWhere to confirm
   - sibling cost split, a WhatsApp share button that copies the URL, and `@media print` fitting one A4 page

## Stage 6: End-to-end QA, accessibility and compliance

Act as a QA Automation Lead and Singapore data-compliance reviewer.

**1. Playwright + axe (`web/tests/e2e/`)**
- **Persona Mei:**
  - Mother in hospital after a fall, alone on weekdays, needs help washing and dressing.
  - Band T1, SC born 1969 or earlier.
  - Plan: day care 5/week plus home personal care 2 blocks/week; valid postal code; split by 3.
  - Assert the in-hospital ask list appears, the ward MSW is the first contact, and the WhatsApp URL reload restores the same plan.
- **Persona Mr Tan:**
  - Wife with memory problems, at home, struggling; skips postal code and picks a region.
  - Assert the dementia flag, respite and day care matches, and the region-based contacts.
- **Nursing home branch:** assert the "from" label (never a bare single figure), the real-bill anchor, and no payout subtracted.
- **Unknown sector:** enter a postal code whose sector is not in `sectors.json`. Assert the region picker appears and screens 1–7 complete. Assert the app makes no network request containing the postal code.
- **axe:** run on all 7 screens at 375×812 and 1280×800. Zero serious or critical violations.
- **Print:** screen 7 renders onto one A4 page.

**2. Legal, attribution and security audit**
- One Singapore Open Data Licence v1.0 notice per dataset on the data-sources page: exact dataset names and access dates, with no implied endorsement.
- No API keys or tokens anywhere in `web/out/`.
- Every rate, subsidy %, price and grant figure in the UI traces to a `source_id` and shows its `checked_on`.
- No cookies, no personal data in localStorage, no third-party trackers in the production bundle.
- The postal code appears in no network request, no analytics payload and no shared link.

## Stage 7: Desk validation (replaces interviews, usability tests and Gate 2)

Owner's decision (25 Nov 2026): no interviews, site visits or practitioner review. Validate with published sources and structured reviews instead, and say plainly what that can't show.

1. **Source audit:** check every matching rule, first contact, ask-list question, application step, timing note, document and grant condition against the official page. Fix or soften anything that isn't supported, and mark the rest as our judgement. Output: `docs/verified/source-audit-2026-11-25.md`.
2. **Readability:** an automatic test that on-screen sentences stay under 20 words, with a reading-grade ceiling (spec 08: reading age about 12). One Lighthouse run on mobile (quality gates: accessibility 100, performance 90+).
3. **Cognitive walkthrough** (Wharton et al.'s four questions) of every screen for three scenarios: Mei, Mr Tan and the nursing home. **Heuristic review** against Nielsen's 10 heuristics. **Before/after comparison:** the Gate 1 task on the official sites against the tool, counted in steps and pages, with time estimated by the Keystroke-Level Model.
4. Fix what this finds, and write the evaluation report in `docs/verified/`.

Not covered: real users' understanding and trust, and a professional's judgement of the advice. The prototype banner says so.

---

## Execution sequence and gates

Before Stage 1, work through the "Pre-build checklist" in `docs/product-design-v2.md`. Each item names the stage it blocks; don't start that stage until the item is ticked.

1. **Data foundation (Stages 1–2).** Copy the 1 Jul 2026 tables from MOH raw HTML; re-verify against the live pages on build day. Gate 2: an MSW, AIC Link officer or AAC staff member reviews the matching, branch and how-to-apply tables.
2. **Logic and location (Stages 3–4).** All golden tests pass across both schemes and every boundary. Unknown postal sectors fall back to the region picker.
3. **Frontend and launch gates (Stages 5–6).** Seven screens, Playwright + axe green, then five usability tests before the week 5 soft launch.

## Confirmed decisions (owner, 25 Nov 2026)

- 995 in the footer only; not on the Start screen, no banner.
- `zod` is the engine's only dependency; the shared-plan link uses built-in base64url, not `lz-string`.
- Show both prices for every service: with subsidy (government-funded provider) and full price (private provider).
- Repo name `care-navigator`.
- Postal code handled on the device by 2-digit sector; no OneMap at run time.
- Repo location: `/Users/neoyikai/wamp64/www/care-navigator` (inside www by the owner's choice, 25 Nov 2026; www's own git repo ignores it via `/care-navigator` in www/.gitignore). The owner runs `git init`, commits and pushes; the assistant never does.
- GitHub repo: https://github.com/gabrielneo/care-navigator (created by the owner, 25 Nov 2026; holds only an initial README so far).
- Accounts: a free GitHub repo (it runs the weekly data Action) and a free Vercel account (Hobby) connected to it, both created by the owner before Stage 2 and the first deploy.
- Pace: one stage at a time. After each stage, run its tests, show the result, and wait for the owner's go-ahead.
- Stage 5 (25 Nov 2026): no Tailwind. The wireframes' stylesheet on `docs/brand/tokens.css` is ported as one global CSS file (`web/src/app/globals.css`), which is less code and keeps the site identical to the wireframes. Add Tailwind later only if wanted.
- Stage 5 JS size (25 Nov 2026, owner chose "trim"): the link codec uses `zod/mini`, and contacts, places and area centres load on demand from the postal step. First-load JS on `/plan` went from about 232 to 208 KB gzipped; the planner's own chunk (code, rules and `zod`) from 59 to 35 KB; the location data is now about 9 KB loaded later. About 173 KB is the Next.js 16 and React 19 framework baseline, so 150 KB isn't reachable without leaving Next.js. The working budget is the framework plus 50 KB of app code and data.
- Item 14 headers (25 Nov 2026): `web/vercel.json` sends a Content-Security-Policy that allows only this site (no outside origin anywhere), `Referrer-Policy: no-referrer` (the plan link never leaks to the official pages people click through to) and `X-Content-Type-Options: nosniff`. Scripts and styles need `'unsafe-inline'`: a static export inlines Next.js's start-up scripts and can't use per-request nonces; React escapes all text, and no user text is ever rendered as HTML. The Umami origin is left out until analytics exist. The e2e server applies the same file, and every test fails if the policy blocks anything.
- Stage 6 (25 Nov 2026): Playwright + axe in `web/tests/e2e/` (`npm run e2e`, also in CI) against the static build, at 375×812 and 1280×800. The suite covers the four journeys, axe on every screen and on error and edge states, one-page A4 print, sources and checked dates on every figure, the licence notices, a secrets scan, storage and cookies, and the headers. After every test it checks that each request stayed on this site, that no request carried a postal code and that the policy blocked nothing. It runs in Chromium only, so the owner checks WhatsApp's in-app browser, iPhone Safari printing and a screen reader on real phones.
- Item 15 (error events) waits until analytics exist at public launch. The prototype logs client errors to the console only.
