# Caregiver Navigator: Product & Solution Design (v2)

24 Nov 2026 · @yk · v2 supersedes the v1 .docx of the same date

**What changed from v1:** the audience is older and usually not living with the parent; the flow starts with "Where is Mum right now?"; the 1 Jul 2026 subsidy tables are verified (T0 and T1 merge); the data.gov.sg eldercare dataset turned out to be from 2016, so provider listings are replaced by a hand-curated "who to call" list; the serverless postal function is dropped and postal codes are matched to an area on the phone; nursing homes are in, as a "from" cost beside real bills only. Every change traces to the two research reports in `reports/`.

## Summary

**Purpose.** Help a family get from "something has happened to Mum" to "we know roughly what care will cost us and exactly who to call" in one sitting, before they talk to the system.

The site is a briefing tool for the conversation with the medical social worker (MSW), AIC Link or care coordinator. It does not replace that conversation, and it is not a provider directory.

**The product in one line:** a caregiver says where their parent is right now, answers a few plain questions, builds a weekly care plan, sees an estimated monthly cost range after the 1 Jul 2026 subsidies (with grants they may qualify for listed beside it), and leaves with a one-page plan of who to call and what to ask, to print or send on WhatsApp.

| Item | Decision |
|---|---|
| Working name | Caregiver Navigator |
| Primary user | The adult child (45–70, typically a working 55–65 year old) who manages the parent's money and often lives elsewhere |
| Channel | Hospital MSWs and Active Ageing Centre (AAC) staff who send families the link |
| Secondary users | Spouse caregivers in their 60s and 70s (mainly through the printout); siblings sharing costs |
| Core jobs | Know which services fit; estimate the monthly cost; know who to call first and what to ask |
| What it never does | Decide eligibility, store personal data, recommend a specific provider, or imply it is an AIC or MOH product |
| Stack | Hand-curated YAML rules → Python pipeline → static JSON → Next.js static site. No server code at launch |
| Timebox | 6 weeks for one person, plus a week 0 usability test of sg-care-capacity |
| Running cost | About $0 a month |

What it proves to employers: stakeholder interviews and journey mapping (BA), as-is and to-be process design (BA), a product spec with scope and success metrics (PM), curated reference data with lineage and freshness checks (data), funnel analytics and a before/after usability test (product analytics), and a shipped tool real families use.

## Problem

Three failures repeat in the evidence (full sources in `reports/Singapore caregiver pain points.md`):

1. **Families don't know what exists.** About 41% of caregivers are aware of support services (AIC 2024 survey, abstract only). Half of older caregivers know about respite care, and 83% of those have never used it (SMU ROSA, Nov 2024, n = 7,692).
2. **They can't see the price until a provider quotes it, and the quote is where referrals stall.** MSWs describe patients hearing a fee at the counter and saying "I'll just stay at home". Only about half of referred people used services, and up to 20% declined transitional care over cost (Lien Foundation, 2018). The government's Care Services Recommender says "fees apply" and gives no personal figure.
3. **The decision happens in the hospital ward, under time pressure.** About 220 medically fit patients a day stay more than 21 days, typically waiting for a helper or a placement (MOH, Jan 2023). Some bridge services (e.g. THK's Interim Caregiver Service) can only be requested from the ward, and bridges end after 2 weeks to 2 months.

**Why now:** from 1 Jul 2026, home and community care subsidy for citizens born 1969 or earlier reaches 95% for household income per person (PCHI) up to $1,500 (previously $900). A citizen at $1,200 PCHI went from 75% to 95% subsidy. The Home Caregiving Grant rose to up to $600 a month in April 2026. Families who checked costs before are working from wrong numbers, and third-party sites still show old ones.

### How a family finds care today (as-is)

- **Trigger.** A hospital admission, a fall, a dementia diagnosis, or a caregiver who can no longer cope.
- **Search.** The family searches online or asks a doctor. Information is split across aic.sg, SupportGoWhere, Silver Pages, HealthHub, LifeSG and hospital apps.
- **Get suggestions.** Some families find the Care Services Recommender on SupportGoWhere. It lists service types and schemes, with no cost, availability or next steps.
- **Check money separately.** Subsidies, grants and payouts sit on separate pages with at least four different eligibility tests.
- **Get referred.** Through the ward MSW, a GP or polyclinic doctor, or an AIC Link. From Oct 2026, seniors progressively get one standardised assessment and a single community care plan through an Integrated Community Care Provider (ICCP).
- **Means test and assessment.** PCHI sets the subsidy; the provider or assessor decides suitability.
- **Service starts, often after a wait.** Nursing homes: median about 1 month (general), 2–4 months (psychiatric).

### Where it breaks

| Step | Pain point | Effect |
|---|---|---|
| Trigger | The family hears second-hand; only 39% of caregivers live with the person | They start late and in a hurry |
| Search | Information is split by service, not by situation | They don't know where to start |
| Suggestions | No cost, location or next step alongside | Can't tell if it's affordable |
| Money | Subsidy %, grant tiers and PCHI rules changed in 2026 and sit on separate pages | They assume it's unaffordable, or hear the price for the first time at the counter |
| Referral | Some options only reachable from the ward; route differs by service | Missed bridges; wasted calls |
| Throughout | Siblings work from different information | Arguments about cost and who does what |

These are supported by desk research; first-person forum evidence is thin. Week 1 interviews must confirm or kill each one.

## Users

**Who.** The adult child who manages the parent's money. ROSA (Nov 2024): 59% of older caregivers manage the recipient's finances, 44% arrange external services, 45% work full-time, the average caregiver is 62, 34% have two or more chronic conditions of their own, and 54% of recipients are 80+. Only 39% live with the person they care for.

**Design implication:** design for a working 55–65 year old coordinating from a distance, in one evening, often by phone. Size type and contrast for the older end.

| Persona | Situation | Job to be done | Would stop using it if |
|---|---|---|---|
| Mei, 58, working daughter | Mother, 86, admitted after a fall; lives alone in a 4-room flat; discharge expected Friday | "Tell me what Mum needs, what it costs, and what to ask the social worker before Friday" | Vague answers, no cost, too many pages |
| Mr Tan, 71, spouse caregiver | Wife has early dementia; limited smartphone use; prefers Mandarin | "Who can watch her in the day so I can rest?" | Small text, English-only, forms. Reached mainly through his daughter or AAC staff and the printout |
| Raj, 52, sibling abroad | Shares costs with two siblings in Singapore | "How much should each of us chip in?" | No shareable summary |
| MSW / AAC staff (channel) | ~940 MSWs, roughly 245 elderly admissions each a year; 230+ AACs serving ~100,000 seniors | "Something I can send the family before we meet" | Needs a login or personal data |

### Entry moments

| Rank | Moment | Size per year | Role in the flow |
|---|---|---|---|
| 1 | Hospital admission of a 65+ parent | ~249,000 acute admission episodes (2023), plus ~21,000 community hospital admissions | "In hospital" branch: ward-only services, questions for the MSW, discharge timeline |
| 2 | Dementia diagnosis or decline | ~74,000 living with dementia (2023) | "Something has changed at home" branch with a dementia flag and longer expected waits |
| 3 | Caregiver burnout | Not measured; caregivers of 14,000+ seniors used subsidised respite in 2025 | "We're struggling" branch: respite and day care first |
| — | Falls, strokes | Mostly arrive through hospital | Reasons inside branch 1 or 2, not separate entries |

### Who it is not for

The senior as the main reader; families wanting live vacancies, booking or an eligibility ruling; foreigners without SC/PR status (no subsidy); palliative or end-of-life planning; under-65 disability care; families already inside an ICCP single care plan (they have a human navigator). Households above $4,800 PCHI get no subsidy, but the who-to-call part still serves them.

### Research plan (week 1)

- **Interviews:** 6–8 caregivers who arranged care in the past two years, 30 minutes each. Recruit through family and friends, an AAC, caregiver Facebook groups, and SMU social work or healthcare faculty. Ask about the last time they arranged care: trigger, where they looked, who helped, what it cost, what went wrong. Verbal consent; record nothing identifying.
- **Test two claims:** "Seeing a net monthly figure early would have changed what we did" and "I'd have asked different questions in the ward".
- **Competitor walkthrough:** complete the Care Services Recommender and SupportGoWhere for three scenarios. Record every question, output and what's missing.
- **One expert conversation:** an MSW, AIC Link officer or AAC staff member.
- **Synthesis:** affinity map, journey map, top 5 problems ranked by frequency and severity.

### Assumptions and kill criteria

| Assumption | Test | Kill or pivot if |
|---|---|---|
| Cost uncertainty stops families acting | Interviews | Fewer than 3 of 8 mention cost |
| The Recommender still shows no personal cost or next steps | Walkthrough | It does: lead with the hospital branch (discharge checklist) instead of cost |
| Families will pick an income band if nothing is stored | Prototype test | More than half refuse: default to "show me all bands" |
| A printable plan is useful to families and MSWs | Prototype test, MSW conversation | Fewer than half would share or print it |

## Improved process (to-be)

The family does the thinking in one sitting, then makes one well-prepared contact with the official system.

1. **Say where Mum is now** (one tap): in hospital; at home and something just changed; at home and we're struggling; already in a nursing home.
2. **Answer a few plain questions** (about 2 minutes): daily activities she needs help with, whether she's alone in the day, memory problems, whether there's a live-in helper, the caregiver's own limits, postal code.
3. **See matched service types**, each with one sentence on why it fits.
4. **Build a weekly plan:** pick services and how often, from visible defaults.
5. **See the estimated monthly cost range** after the published subsidy, with grants and payouts the family may qualify for listed beside it, and every assumption shown.
6. **See who to call:** the ward MSW if in hospital, the nearest AIC Link and hospitals, nearby Family Service Centre and Community Club, and a link to AIC's locator for centres and nursing homes.
7. **Get the action plan:** who to contact first, what to ask for (including "the single assessment and care plan"), documents to bring, and links to the official tools to confirm. Share by print, PDF or WhatsApp link.

| Pain point | Improvement | How we'll know it worked |
|---|---|---|
| Information split by service | One flow that starts from the situation | Time to a correct service list, vs official sites |
| No cost before the counter | Monthly range after subsidy, assumptions shown | % of testers who can state a monthly cost range |
| Ward-only options missed | Hospital branch with "ask before discharge" list | % of testers who name the right first contact |
| Rules changed in 2026 | Dated reference tables with source links | No figure older than its review date |
| Family misaligned | One shareable plan with a cost split | Share or print rate |

## Data

Full catalogue: `reports/Caregiver Navigator datasets and decisions.md`.

**The finding that shapes everything:** the rules and prices families act on exist only as web pages, and the provider data is weaker than v1 assumed. data.gov.sg's "Eldercare Services" layer was last edited on 28 Jul 2016 (its 2024-06-06 stamp is a platform migration), uses pre-2022 names, and has no SHP twin. There is no open dataset for AACs, AIC Links, nursing homes or day care, and no machine-readable subsidy rule anywhere. So the product depends on a small set of hand-kept, dated files and a re-check routine after each Budget (Feb) and Committee of Supply (Mar).

| Data | Source | Freshness | Use | Verdict |
|---|---|---|---|---|
| Non-residential subsidy table | MOH web page | Effective 1 Jul 2026 | Cost engine | Curate by hand from raw HTML |
| Residential subsidy table | MOH web page | Effective 1 Jul 2026 | Nursing home range | Curate by hand from raw HTML |
| Grants and payouts | Together for Better, AIC, CPF, MOM | Apr–Jul 2026 | "May qualify" list | Curate by hand |
| Service descriptions, "from" prices | AIC service pages | © 2026, undated | Service cards, price lows | Curate by hand |
| Price highs | NTUC Health fee page; aggregators (flagged) | 2026 | Price ranges | Curate by hand |
| Referral routes | MOH, AIC | Varies | How-to-apply cards | Curate; review quarterly |
| AIC Links, community and acute hospitals, polyclinics | AIC, MOH pages | 9 AIC Links verified 25 Nov 2026 (`docs/verified/aic-links-2026-11-25.md`) | Who to call | Curate by hand; check monthly |
| Family Service Centres | MSF via data.gov.sg (55 pts) | Edited Sep–Oct 2026 | Nearest FSC | Use (weekly pull) |
| Community Clubs | PA via data.gov.sg (128 pts) | To Sep 2026 | Nearest CC | Use (weekly pull) |
| Dementia Go-To-Points | MOH via data.gov.sg (831 pts) | To Aug 2026 | Dementia branch only | Use with warning (not an AAC list) |
| AACs, day care, nursing homes | AIC E-Care locator | Live, not open | Link-out destination | Link out, do not scrape |
| Postal sector → area centre | Built at build time from the postal codes of five open layers (FSC, CC, CHAS clinics, pharmacies, Dementia Go-To-Points) plus AIC Links; 76 of 81 sectors, centres within about 2 km (`docs/verified/postal-sectors-2026-11-25.md`) | Weekly | Distance to contacts | Use. OneMap now requires a token (25 Nov 2026), so no outside service is called at run time |
| Eldercare Services | MOH via data.gov.sg | 2016 | — | Skip |
| CHAS clinics | MOH via data.gov.sg | 2021 | Postal sector centres only (positions don't go stale) | Use for `sectors.json`; not shown to users |
| GHS 2025, beds and places, admissions | SingStat, MOH | 2025–2026 | Case study only | Use |

**Data we won't have, and how the product handles it:**
- Actual provider fees: use AIC's "from" price as the low end, a published range as the high end, and let the user type a quoted fee.
- Vacancies and waiting times: none current for day or home care (latest 2016–2018). Say so plainly; tell the user to ask when they call. Nursing home medians (Aug 2024) can be shown with their date.
- Eligibility: never computed. "You may qualify; confirm here" with the official link.
- How payouts stack on a nursing home bill: unverified, so payouts are listed, never subtracted.

## Feasibility checks

| Pass | Question | Verdict | What changed |
|---|---|---|---|
| 1 Desirability | Is the problem real? | Pass | Focus on first-time arrangers, especially at hospital admission |
| 2 Differentiation | Does something already solve it? | Pass after pivot | Not another recommender: the layer after it (cost, plan, who to call) |
| 3 Data | Reliable, legal data? | Pass with limits | Rules and contacts curated by hand; no provider directory; link out to AIC |
| 4 Technical and cost | Can one person build and run it free? | Pass | No database, no server code at launch |
| 5 Safety, privacy, legal | Could it mislead or harm? | Pass with controls | Ranges not points; payouts never subtracted; tier not income; nothing stored |
| 6 Viability | Six weeks, real users? | Pass | Map, chatbot, accounts and other languages cut at launch |

The realistic threat is the Care Services Recommender adding cost estimates, or a Budget 2027 announcement (Feb 2027). Moderately likely over two years, not imminent. Government's 2026–27 moves (single care plan, Caregiver Support Touchpoints from 2027) are human navigation after a family enters the system; the self-serve "evening before" stays open.

## Requirements

**Launch scope:** the entry question, the needs check, matched services, the weekly plan with a cost range, who to call, and the shareable action plan. Nursing homes appear as a cost range only.

| In scope (launch) | Out of scope (and why) |
|---|---|
| Home and community services for seniors | Provider directory or rankings (no current open data) |
| Nursing homes as a labelled cost range | Nursing home planner, vacancies, choosing a home |
| Singapore Citizens and PRs | Foreigners (not subsidised) |
| English | Chinese (week 6 if time, with native-speaker review); Malay and Tamil (phase 2) |
| Cost range from published rules | Eligibility decisions, applications, payments |
| Plan stored in the link only | Accounts, saved profiles, reminders |
| List of who to call | Map (phase 2) |

### User stories and acceptance criteria

- **As a caregiver, I want to start from where my parent is now, so I see what matters first.**
  - Given I pick "in hospital", then the plan leads with what to ask the ward MSW before discharge, including services only available from the ward.
  - Given I pick "already in a nursing home", then I go straight to the nursing home cost range and payouts.
- **As a caregiver, I want to describe the situation without technical terms, so I find the right services.**
  - Given I answer the needs questions, then I see 1 to 5 matched service types, each with a one-line reason tied to my answers.
  - Given I choose "not sure" on any question, then matching still works and suggests talking to a doctor, MSW or AIC Link.
- **As a caregiver, I want to build a weekly plan, so I can see what care would look like.**
  - Given matched services, when I add one, then it starts at a visible default ("our assumption, change it") and I can set frequency from 1 to 7 per week.
- **As a caregiver, I want an estimated monthly cost after subsidies, so I know if it's affordable.**
  - Given a plan, an income band, residency and birth year, then I see a low–high monthly range per service and in total, before and after subsidy.
  - Given I tap "How is this worked out", then I see each price, the subsidy %, its source link and its last-checked date.
  - Given I have a quoted fee, when I type it, then it replaces the default range for that service.
- **As a caregiver, I want to know about grants and payouts I may get, so I don't miss money.**
  - Given my band is within a grant's income limit and the needs check shows help with 3 or more daily activities, then the grant shows as "you may qualify" with its amount, conditions and the official link. It is never subtracted from the total.
- **As a caregiver, I want to know exactly who to call.**
  - Given a valid postal code, then I see the nearest AIC Link, nearest hospitals, nearest Family Service Centre and Community Club, with distance and a "last checked" date, plus a link to AIC's locator for centres and nursing homes.
  - Given a postal code whose area we can't place, then I can pick my region instead and the rest of the tool still works.
- **As a caregiver, I want a clear first step.**
  - Given a plan, then the action plan lists who to contact first, what to ask for, and documents to bring.
- **As a caregiver, I want to share the plan with my siblings.**
  - Given a plan, when I tap share, then I get a link that reopens the same plan, a printable page, and an optional cost split by number of people.
  - Given the link is opened, then it contains no personal data beyond answers and plan choices.
- **As an older user, I want large text and simple steps.**
  - Given any screen, then body text is at least 18px, tap targets at least 48px, and one question per screen on mobile.

### Business rules

**Service matching** (curated, reviewed with an MSW or AAC staff member before launch):

| If the answers say | Suggest | Reason shown |
|---|---|---|
| Alone in the day and needs supervision | Day Care (Dementia Day Care if memory problems) | "Someone is with Mum while you work" |
| Needs help with washing, dressing or toileting at home | Home Personal Care | "Trained staff help with daily care at home" |
| Has wounds, tubes or complex medicines | Home Nursing | "A nurse handles medical care at home" |
| In hospital or recently discharged, needs to regain strength | Home Therapy or Centre-based Rehab | "Therapy to regain movement" |
| Can't get to appointments alone | Medical Escort and Transport | "Help getting to clinic visits" |
| Can't prepare meals | Meals On Wheels | "Meals delivered at home" |
| Caregiver is exhausted | Respite, Caregivers Training Grant, support groups | "Support for you, too" |
| Mostly independent but isolated | Active Ageing Centre | "Activities and befriending nearby" |
| In hospital now | Interim Caregiver Service (ward referral only), Hospital-to-Home | "Ask the ward social worker before discharge" |

**Branch rules:**
- *Wording:* the answers to "Where is Mum right now?" reuse AIC's Care Services Recommender terms ("Soon to be discharged from hospital", "Recently discharged from hospital (within 2 weeks)", "Living at home", "In nursing home"), with "Living at home" split into "something just changed" and "we're struggling". A family moving between the two tools then sees the same words.
- *Discharge tips:* the hospital branch links to AIC's own discharge tips instead of rewriting them. It adds only what AIC lacks: ward-only services, questions for the MSW, and the cost.
- *In hospital:* show ward-only services and the "questions for the MSW" list first; show that bridge services end after about 2 weeks to 2 months.
- *Dementia flag:* show that dementia day care and psychiatric nursing home beds have longer waits (nursing home: 2–4 months median, Aug 2024).
- *Live-in helper:* show the $60 levy concession (needs help with 1 daily activity, or age 67+).

**Cost estimate** (per service, per month, low and high):

```
units_per_month = units_per_week × 52/12
OOP_low  = units_per_month × price_low  × (1 − r)
OOP_high = units_per_month × price_high × (1 − r)
r = subsidy rate(scheme, PCHI band, residency, birth year)   # only if the service is MOH-subsidised
```

- `price_low` is AIC's "from" price; `price_high` is the published high end. A user-typed quote replaces both.
- Home personal care is priced per hour in 4-hour blocks.
- Day care transport is a separate line ($250–$440 a month). AIC lists it only as an "additional cost" and no source says whether it is subsidised, so it is shown at full price in both columns.
- Subsidy depends on income band, residency and birth year. It does not depend on how many daily activities the senior needs help with; that count gates grants only.
- Grants and payouts (Home Caregiving Grant, MediSave Care, CareShield Life, ElderFund, levy concession) are listed beside the total as "may qualify". Never subtracted.
- All amounts are rounded to the nearest $5 and labelled "estimate".
- Every service line and the total show two prices: **with subsidy** (at a government-funded provider) and **full price** (at a private provider). Owner's decision, 25 Nov 2026. The full-price column carries the note "may add 9% GST"; the with-subsidy column adds none, because MOH absorbs GST for subsidised patients.

**Default frequencies** (shown as "our assumption, change it"): day care 5 days a week (matches MOH's own estimate basis); home personal care one 4-hour block 3 times a week; home nursing once a week; home therapy once a week (hospital branch).

**Nursing home cost:**
- Shown as "from" $4,900 a month (AIC's gross floor) × (1 − residential subsidy rate). No high end is computed: no subsidised top price is published.
- Labelled "subsidised beds at government-funded homes, after assessment, rates from 1 Jul 2026".
- Anchor shown beside it: "Real subsidised bills at one home: $620–$3,069 a month (Ren Ci, Jul 2026)".
- Private homes shown separately as a market range. Never ranked against home care.

### Non-functional requirements

- **Accessibility:** WCAG 2.2 AA; tested with keyboard, screen reader and 200% zoom.
- **Performance:** first screen interactive in under 2 seconds on a mid-range phone over 4G.
- **Privacy:** no cookies, no personal data stored, no third-party trackers; analytics counts events only. The postal code is matched to its area on the phone and never leaves it; the shared link holds only the 2-digit sector.
- **Accuracy:** every figure traceable to a source URL and check date; reference data reviewed at least monthly and after each Budget and Committee of Supply.
- **Availability:** static hosting; no outside service is called at run time.

## Architecture

A static site that does all the arithmetic in the browser, fed by a verified data release. There is no database, no server code and no outside service at run time. The browser matches a postal code's first 2 digits to an area centre from a built-in table; if the area is unknown, the user picks a region.

```
BUILD TIME (GitHub Action: weekly + on every curated-data edit)
  data/curated/*.yaml (rules, prices, contacts) ─┐
  data.gov.sg FSC + CC GeoJSON (2 pulls)  ───────┼─► Python 3.12 + Pydantic
                                                  │     blocking checks / warnings
                                                  └─► rules.json, contacts.json, places.json,
                                                      manifest.json (SHA-256) → committed to
                                                      web/public/data → Vercel rebuilds on push

RUN TIME (browser)
  Next.js static export ─► matching + cost in pure TypeScript, on the device
                         ─► plan encoded in the URL (compressed, allowlisted fields)
                         ─► postal sector (2 digits) ─► built-in sectors.json ─► area centre
                                                 (unknown sector → region picker)
```

| Layer | Choice | Why |
|---|---|---|
| Reference data | Hand-curated YAML: services, matching rules, subsidy tables, grants, prices, how-to-apply, contacts, branch rules; each row has a source and checked-on date | Small, changes a few times a year, needs judgement; Git history is the audit trail |
| Open layers | Weekly pull of FSC and CC GeoJSON from data.gov.sg | Open licence, current; 2 downloads stays under the 2-per-10-seconds limit |
| Pipeline | Python 3.12, PyYAML, Pydantic, data checks | Ten small files need no database |
| Release | JSON plus a manifest with version and hashes, committed to the repo | Site always ships a known, verified version; Git history is the release log |
| Frontend | Next.js static export, TypeScript, one global stylesheet on the warm palette in `docs/brand/tokens.css` (Tailwind dropped at Stage 5) | Fast on phones, free to host, shares the Care-pacity name with its own warm look |
| Calculation | Pure TypeScript module (matching + cost), unit-tested | Same inputs, same outputs; no data leaves the device |
| Postal lookup | On the phone: first 2 digits → `sectors.json` area centre; region picker if unknown | OneMap requires a token; this needs no server and keeps the postal code on the device. A token-holding serverless proxy is the upgrade if street-level distance is ever needed |
| Plan sharing | Plan encoded in the URL (compressed; band only, no names or income figures) | Shareable on WhatsApp without storing anything |
| Analytics | Umami Cloud free tier: cookie-free, hosted, custom events. Public launch only; the prototype has none, so the metrics below can't be measured until then | Measure the funnel without tracking people or running a server |
| Feedback | Footer link to a free hosted form (e.g. Tally), no personal fields | Learn why people drop off without a form backend |
| Testing and CI | Vitest (matching, cost), Playwright + axe (flows, accessibility); Lighthouse run once by hand before launch | Same quality bar as sg-care-capacity |

### Key decisions (ADRs)

1. **No backend database, no server code at launch.** Nothing is stored server-side.
2. **Curated rules over scraping.** Rules and contacts are reviewed tables with sources; automate only open-licence datasets.
3. **Income as a band, not a number.** Users pick a PCHI band (with a helper); exact income never enters the system.
4. **Grants and payouts shown, never subtracted.** Avoids overstating savings; how they stack is unverified.
5. **No provider directory.** Curate a short "who to call" list; link out to AIC's locator for centres and nursing homes.
6. **On-device postal sector lookup.** No OneMap at run time; region picker if the sector is unknown.
7. **Nursing homes as a "from" figure beside real bills.** Never one exact figure, never ranked against home care.

## Data model and pipeline

Nine small curated tables plus two open layers; every row traceable to a source and a check date. The pipeline publishes only when all blocking checks pass.

| Table | Key columns | Source | Refresh |
|---|---|---|---|
| source_registry | source_id, url, owner, licence, checked_on, next_review | You | On every edit |
| service_types | service_id, name, plain_description, setting (home / centre / residential), moh_subsidised, unit, how_to_apply_id, source_id | AIC, MOH | Quarterly |
| need_rules | rule_id, condition, service_id, reason_text, priority | Curated, practitioner-reviewed | When rules change |
| price_references | service_id, unit, price_low_sgd, price_high_sgd, low_source_id, high_source_id, gst_note, confidence (official / provider / aggregator), checked_on | AIC, NTUC Health, aggregators | Monthly |
| subsidy_tiers | scheme (non_residential / residential), tier_id, pchi_min, pchi_max, av_rule, sc_1969_or_earlier_pct, sc_after_1969_pct, pr_pct, effective_from, source_id | MOH | On policy change |
| grant_rules | grant_id, name, kind (grant / payout / concession), pchi_max, amount_by_band, min_adl, other_conditions, official_url, effective_from, source_id | AIC, CPF, MOM, Together for Better | On policy change |
| how_to_apply | apply_id, first_contact (ward MSW / GP or polyclinic / AIC Link / provider), steps, documents, source_id | MOH, AIC | Quarterly |
| contacts | contact_id, kind (aic_link / community_hospital / acute_hospital / polyclinic), name, address, postal_code, lat, lng, hours, phone, checked_on, source_id | AIC, MOH | Monthly |
| branch_rules | branch_id (in_hospital / changed_at_home / struggling / in_nursing_home), flags, ask_list, timeline_notes, source_id | Curated | When rules change |
| places (open layer) | place_id, kind (fsc / cc), name, address, postal_code, lat, lng, feature_updated_on | data.gov.sg | Weekly pull |

**Subsidy tables as stored** (effective 1 Jul 2026, verified from MOH raw HTML; the "$900 and below" cells span the $901–$1,500 row):

| Tier | PCHI | Non-residential SC ≤1969 / SC >1969 / PR | Residential SC ≤1969 / SC >1969 / PR |
|---|---|---|---|
| T0 | $0–$1,500, or no income with home AV ≤ $21,000 | 95 / 80 / 55 | 80 / 75 / 50 |
| T1 | $1,501–$2,300 | 85 / 70 / 45 | 65 / 60 / 40 |
| T2 | $2,301–$2,600 | 75 / 60 / 35 | 55 / 50 / 30 |
| T3 | $2,601–$3,600 | 55 / 40 / 20 | 35 / 30 / 15 |
| T4 | $3,601–$4,800 | 35 / 20 / 10 | 15 / 10 / 5 |
| T5 | $4,801+, or no income with home AV > $21,000 | 0 / 0 / 0 | 0 / 0 / 0 |

2026 subsidies use 2025 Annual Values. Re-scrape from raw HTML, never page text: text scrapers drop the merged cells.

**Grants and payouts** (encode with dates; [S] items need a manual check before launch):

| Item | Amount | Conditions |
|---|---|---|
| Home Caregiving Grant | $600 / $400 / $200 a month | PCHI ≤$1,500 / $1,501–$3,600 / $3,601–$4,800 ($200 also for multiple-property owners); help with 3+ of 6 daily activities; not in a residential facility; FAR then eFASS application |
| MediSave Care | Up to $200 a month | Set by MediSave balance, not income |
| CareShield Life | $689 a month (2026 claims), +4% a year [S] | Severe disability (3+ daily activities) |
| ElderFund | Up to $250 a month [S] | Means- and MediSave-balance-tested |
| Levy concession | $60 a month instead of the standard levy | Senior aged 67+, or needs help with 1+ daily activity |
| Caregivers Training Grant | $400, plus $200 a year | Per caregiver |

**Seed prices** (before subsidy; aggregator figures flagged for a provider-page check):

| Service | Unit | Low | High |
|---|---|---|---|
| Day care | session | $55 (AIC) | ~$74 (NTUC $1,606/month ÷ 21.7) |
| Day care transport | month | $250 (NTUC) | $440 (NTUC); full price, subsidy unknown |
| Dementia day care | session | $63 (AIC) | ~$73 (aggregator $1,575/month ÷ 21.7) |
| Home personal care | hour | $25 (AIC) | $32 (Homage, aggregator) |
| Home nursing | visit | $62 (AIC) | $141 (NTUC) |
| Home therapy | visit | $125 (aggregator) | $160 (NTUC) |
| Centre-based rehab | session | $52 (aggregator) | $102 (aggregator) |
| Meals on wheels | meal | $4.90 (aggregator) | $7 (aggregator) |
| Medical escort and transport | round trip | $40 (aggregator) | $150 (aggregator) |
| Nursing home respite | day | $100 (aggregator) | $150 (aggregator) |
| Nursing home | month | $4,900 (AIC) | — ("from" only; Ren Ci's real subsidised bills $620–$3,069 shown as an anchor) |

### Pipeline, start to finish

- **Ingest.** Download the FSC and CC GeoJSON files; save raw with SHA-256 and fetch time.
- **Load curated tables** from `data/curated/*.yaml`.
- **Validate (blocking).** Schema checks; every row has a valid source_id; each subsidy scheme covers $0 to infinity with no gaps, overlaps or empty percentages; percentages between 0 and 100; every service_id referenced exists; price_low ≤ price_high; every contact and place lat/lng inside Singapore's bounding box (lat 1.15–1.48, lng 103.6–104.1).
- **Validate (warning).** Any source past next_review; any contact with checked_on older than 90 days; aggregator-confidence prices; open-layer features whose per-record `FMEL_UPD_D` is older than 24 months; any official URL that doesn't return HTTP 200 after retries (government sites often refuse automated requests, so this never blocks).
- **Publish.** Write rules.json, contacts.json, places.json and manifest.json into `web/public/data/` and commit them if they changed; Vercel rebuilds on the push.
- **Review loop.** A monthly issue lists sources due for review; a February and March issue reminds you to re-check every table after the Budget and Committee of Supply.

**Tests to write first:** cost golden cases for every tier × residency × birth-year cell in both schemes; tier boundaries ($1,500/$1,501, $2,300/$2,301, $2,600/$2,601, $3,600/$3,601, $4,800/$4,801); the AV rule; "grants never subtracted"; the 3-ADL grant gate; one test per matching rule and branch rule; and URL round-trip of a shared plan. MOH's ~$110 a month benchmark is a sanity check, not a unit test: MOH doesn't publish its service mix.

## UX and UI design

Seven screens, one decision per screen, readable by a 70-year-old on a phone. Uses its own the warm palette in `docs/brand/tokens.css` (cream paper, espresso text, terracotta actions, sage for reassurance; owner's choice, 25 Nov 2026).

| Screen | Purpose | Key content | Design notes |
|---|---|---|---|
| 1 Start | Set expectations | "Plan care for someone you look after, in about 5 minutes. Nothing you enter is saved." Independent-project label | One button: "Start". No sign-up |
| 2 Where and what | Understand the situation | First: "Where is Mum right now?" (4 answers). Then one per screen: daily activities she needs help with (6 picture cards: washing, dressing, feeding, toileting, moving about, getting in and out of bed), alone in the day, memory problems, live-in helper, caregiver's own limits, postal code | Large picture buttons; "Not sure" always available; progress "2 of 7" |
| 3 Your matches | Explain what fits | 1–5 service cards: name, one-line description, "Why this fits", price range | Plain words first, official term in brackets |
| 4 Build your week | Turn suggestions into a plan | Weekly grid with defaults pre-filled and labelled as assumptions | Tap to add, steppers for frequency; no drag and drop |
| 5 Cost | Make it real | Income band picker (with a 3-question helper), residency, birth year; per-service and total monthly range, with subsidy and at full price; "may qualify" grants and payouts beside it | Big range; "How is this worked out" expander with sources; edit a fee if quoted |
| 6 Who to call | Show where to start | Hospital branch: the ward MSW first. Everyone: nearest AIC Link, hospitals, FSC, CC with distance and checked-on date; link to AIC's locator for centres and nursing homes | List only at launch |
| 7 Your action plan | What to do next | Numbered steps: who to contact, what to ask ("the single assessment and care plan"), documents to bring; hospital branch adds "before discharge" questions; links to official tools; cost split by siblings | Print, PDF, WhatsApp; fits one A4 page |

### Interaction rules

From the VectorLab UX audit of this spec (25 Nov 2026).

- **Page patterns:**
  - Screens 1–5 are one **Form (wizard)**: a step indicator, one decision per step, Back and Next pinned to the bottom on mobile.
  - Screen 6 is a **List**: each row has a name, distance and a "last checked" date, and the list sits in a bordered container.
  - Screen 7 is a **Detail / record** page: it reads as a document and prints as one.
- **Labels:**
  - Every question has a visible label.
  - Picture cards carry a text label under the image. They work as checkboxes (daily activities) or radio buttons (single answers).
  - The postal code field is labelled "Postal code", with the helper text "6 digits, e.g. 560123". The example is helper text, not a placeholder.
- **Validation:**
  - The postal code and quoted-fee fields check on blur, never while typing. An error clears on the next keystroke.
  - Next is always clickable; if an answer is missing, clicking it shows the error inline.
- **Button labels (verb first):**
  - "Start planning", "Add day care", "Print plan", "Save as PDF", "Share on WhatsApp", "Change answers".
  - Back and Next are allowed in the wizard.
  - +/- steppers have the accessible names "Add a day" and "Remove a day".
- **Errors (no blame, always a way forward):**
  - Postal code not recognised: "We couldn't place that postal code. Check the 6 digits, or pick your area instead."
- **Empty states:**
  - If every answer is "Not sure" and nothing matches: "We need a bit more to suggest services", with the buttons "Call the AIC hotline" and "Change answers".
  - If no contacts are found: show the AIC hotline and the AIC locator link. The screen is never blank.
- **Loading:** none needed; the postal lookup is instant and on the device.
- **Narrow screens (375px):**
  - The weekly grid stacks into a vertical list of days.
  - The cost table becomes one card per service.
  - Nothing scrolls sideways.
- **Inline, not modal:**
  - The household-income helper and "How is this worked out" open inline.
  - No pop-up dialogs anywhere in the flow.
- **Motion:**
  - Fades only, 150 ms or less, no bouncing or sliding.
  - With `prefers-reduced-motion`, nothing animates.
- **Keyboard:**
  - Every card, stepper and expander can be reached and used with Tab, Space and Enter.
  - Focus is always visible.

### Content rules

- Reading age about 12; sentences under 20 words; no unexplained acronyms (PCHI becomes "household income per person").
- Every number has a unit, a date and a source link.
- Use "may qualify" and "estimate" consistently; never "eligible" or "you will get".
- The AIC hotline (1800-650-6060) is in the footer of every screen as the human fallback.
- 995 appears in the footer of every screen (owner's decision, 25 Nov 2026).

### Accessibility for older users

- Body text 18px minimum, 1.6 line height; tap targets 48px; high contrast (every pairing in `docs/brand/tokens.css` checked to WCAG AA).
- No time limits, no carousels, no hover-only content.
- Works at 200% font size and with a screen reader; tested with at least two people over 65.

## Quality, privacy and risk

The biggest risk is a wrong number a family relies on.

| Risk | Likelihood | Impact | Control |
|---|---|---|---|
| Subsidy or grant figure out of date | Medium (changed twice in 2026) | High | Source registry with review dates; Budget/COS re-check issues; "last checked" beside every figure |
| User reads an estimate as a promise | High | High | Ranges, not points; "estimate" on every amount; payouts never subtracted; link to official confirmation |
| Nursing home range read as an entitlement | Medium | High | Labelled "after assessment, government-funded homes"; real-bill anchor; never ranked against home care |
| Wrong service suggested | Medium | Medium | Practitioner review of rules; "Not sure? Talk to a doctor, MSW or AIC Link" always shown; a test per matching rule |
| Stale contact (AIC Link closed or moved) | Medium | Medium | Monthly check; checked-on date shown; report-a-problem link |
| A postal sector has no area centre | Low | Low | Region picker; build warns if fewer than 70 sectors are covered |
| Third-party figures go stale | High | Medium | Link out to official sources only |
| Sensitive data exposure | Low | High | Band instead of income; nothing stored; no cookies; shared link holds only answers and plan |
| Mistaken for a government service | Medium | High | Independent-project label on every page; no government logos, colours or domain |
| Scraping breaches a site's terms | Low | Medium | Curate by hand; automate only open-licence datasets |
| Medical emergencies | Low | High | 995 in every footer; states it is not medical advice |

### Quality gates before launch

- All blocking data checks pass; zero sources past review.
- 100% of cost golden tests and matching-rule tests pass; every tier boundary covered in both schemes.
- axe: zero serious violations. One manual Lighthouse run before launch: accessibility 100, performance 90+ on mobile.
- A practitioner (MSW, AIC Link officer or AAC staff) has read the matching rules, branch rules and how-to-apply steps; comments logged.
- Five usability tests completed; every critical finding fixed.

### Legal and ethical notes

- data.gov.sg data used under the Singapore Open Data Licence v1.0, with one visible notice per dataset ("Contains information from {dataset} accessed on {date} from {source}…") and no implied endorsement.
- MOH, AIC and provider pages are cited with links, not republished wholesale.
- Interviews: verbal consent, no names or identifying health details, recordings deleted after synthesis.

## Metrics and launch

The main measure is action plans created and shared: the moment a family has what it needs to act.

| Metric | Definition | Target (first 4 weeks) |
|---|---|---|
| Sessions | Visits that answer the entry question | 200 |
| Needs check completion | Finished all questions ÷ started | 60% |
| Plan built | Added at least one service ÷ finished needs check | 70% |
| Cost viewed | Opened the cost screen ÷ plan built | 80% |
| Action plan shared or printed | Share, print or PDF ÷ plan built | 30% |
| Who-to-call or official link clicked | Clicked a contact, AIC, SupportGoWhere or MOH link ÷ action plans | 40% |
| Helpfulness | "Did this help?" yes ÷ answered | 75% |

**Usability test (the before/after story):** five caregivers do the same task twice, in random order: once with official websites only, once with the tool. Task: "Your mother is in hospital after a fall, needs help washing, and is alone on weekdays. Find suitable services, an estimated monthly cost and your first step." Measure task success, time and confidence (1–5).

**Launch plan:**
- **Soft launch (week 5):** interviewees, friends' families, one or two AACs, and any MSW willing to try it with families.
- **Public launch (week 6):** caregiver Facebook groups (with admin permission), r/singapore, LinkedIn post with the before/after results, SMU channels.
- **Iterate weekly:** look at funnel drop-off and feedback, fix the worst step.

## Delivery plan

Six weeks from 30 Nov 2026, with three gates.

| Week | Work | Gate |
|---|---|---|
| 0 | Usability test of sg-care-capacity | — |
| 1 | Interviews, Recommender walkthrough, MSW/AAC conversation; encode subsidy tables with tests | **Gate 1:** pain confirmed and Recommender still shows no cost, else lead with the hospital branch |
| 2 | Spec, journey maps, all curated YAML seeded | **Gate 2:** practitioner has reviewed rules and contacts |
| 3 | Pipeline, validation, release; TypeScript engine and tests | — |
| 4 | Seven screens, print layout, accessibility pass | **Gate 3:** all quality gates pass |
| 5 | Usability tests, fixes, soft launch | — |
| 6 | Public launch, funnel dashboard, case study (Chinese if time) | — |

| Portfolio output | Proves | Ready by |
|---|---|---|
| Interview synthesis and journey map | User research, BA | Week 1 |
| As-is and to-be process maps | BA | Week 2 |
| Product spec with user stories | BA, PM | Week 2 |
| Data model, source registry and data checks | Data | Week 3 |
| Live tool with tests and accessibility report | Delivery | Week 4 |
| Before/after usability results | Product, research | Week 5 |
| Funnel dashboard, case study, LinkedIn post | Analytics, communication | Week 6 |

**Case-study charts** (from open data, not product features): hospital admissions of 65+ and the MSW ratio; nursing home beds vs flat day places (2020–2025, marking the 2026 home-care series break); seniors by planning area ranked by count (GHS 2025).

## Pre-build checklist

From the pre-development review on 25 Nov 2026. Items are ranked by risk to launch. "Blocks" is the build stage that can't start until the item is done. Tick an item off by linking the doc or decision that closes it.

### Decisions only you can make

- [x] **1. Wireframes — drafted (25 Nov 2026).** Lo-fi, mobile-first, at 375px: [wireframes/index.html](wireframes/index.html). Twelve frames: all 7 screens, the cost screen and action plan in full detail, the income helper, the nursing-home cost and the empty plan. Made with the impeccable plugin (product record in `PRODUCT.md`, its craft rules and screenshot tool). Checked against VectorLab's hard gate: no overflow at 375px, every tap target at least 48px, text at least 14px, two font weights, verb-first actions, no pop-ups. Still open: (a) the cost screen is about 5½ phone screens tall in full detail, so test in usability whether the per-service lines should start collapsed; (b) the +/− steppers use text glyphs, and the build should use drawn icons with visible tooltips; (c) the pictures on the daily-activity cards are placeholders. *Blocked Stage 5; now unblocked.*
- [x] **2. Sign-offs — deferred (owner, 25 Nov 2026).** This is an unpublicised prototype for testing, not a public launch. Gate 2 (practitioner review) and the post-launch data owner are deferred until a public launch is planned. Until then:
  - Every page shows a prototype banner: "Prototype for testing. Figures and wording have not yet been checked by a care professional."
  - Every **[Gate 2]** item in spec 08 counts as unreviewed.
  - The site carries `noindex` (spec 11), so search engines don't list it.
- [x] **3. Shared links after a rules change — option A (25 Nov 2026).** Old links recalculate with the current rules and show the banner "Figures updated on {date}. They may differ from when this plan was made." Every link carries `v` from day one (spec 10). No rules archive.
- [x] **4. Privacy promise — no analytics or feedback tools in the prototype (25 Nov 2026).**
  - The prototype ships with no Umami, no Tally and no third-party scripts, so "no third-party trackers" stays true.
  - Funnel numbers come from the usability sessions instead (who completed each step, timed and observed).
  - Feedback is gathered in those sessions.
  - Before a public launch, add Umami Cloud (cookie-free) and reword the privacy notice using option A in spec 07.
  - The host (Vercel) still sees standard request logs, as any web host does. The privacy notice says so.
- [x] **5. URLs, domain and name (25 Nov 2026).**
  - **Name:** "Caregiver Navigator" is too close to SG Assist and C3A's **Caregiving Navigator** training programme ([registration page](https://form.jotform.com/241847851634464)). The public name becomes **Care-pacity Planner**, a sibling of the Care-pacity site so the two read as one portfolio. "Caregiver Navigator" stays as the internal working name; the repo stays `care-navigator`.
  - **Domain:** the free Vercel subdomain `care-pacity-planner.vercel.app` (Hobby plan, $0). Fallback if it's taken: `care-pacity-plan.vercel.app`. No bought domain.
  - **Icons and preview:** a favicon, an Apple touch icon and a 1200×630 preview image are in `docs/brand/` (Stage 5 copies them into `web/public/`).

### Specs to write (Claude can draft; you approve)

- [x] **6. Sitemap and navigation.**
  - **Approved 25 Nov 2026:** [specs/06-sitemap-navigation.md](specs/06-sitemap-navigation.md)
  - Routes: `/`, `/plan` (wizard, step in the URL hash), `/privacy`, `/data-sources`, `/about`, and a 404 page.
  - Back goes to the previous step.
  - Refresh keeps your place; the state is already in the hash.
  - Opening a link at a step later than the answers support jumps to the first unanswered step.

  *Blocks: Stage 5.*
- [x] **7. Legal and privacy text.**
  - **Approved 25 Nov 2026:** [specs/07-legal-privacy-text.md](specs/07-legal-privacy-text.md)
  - A privacy notice that names PDPA, says nothing personal is collected, explains that the postal code stays on the phone, and covers analytics and the feedback form.
  - The disclaimer: "an estimate, not financial, medical or eligibility advice".
  - The data-sources page with one Open Data Licence notice per dataset.
  - The "independent project, not MOH or AIC" wording.

  *Blocks: Stage 5.*
- [x] **8. On-screen wording.**
  - **Approved 25 Nov 2026:** [specs/08-onscreen-wording.md](specs/08-onscreen-wording.md)
  - Plain descriptions for all 12 services.
  - "Why this fits" lines.
  - "What to ask" lists per branch.
  - "Documents to bring" per service.
  - The 3 questions in the income helper. These ask about household size and rough earnings bands, never an exact figure.

  *Blocks: Gate 2 review.*
- [x] **9. Edge cases.** Write down what each screen says and does for:
  - **Approved 25 Nov 2026:** [specs/09-edge-cases.md](specs/09-edge-cases.md)
  - not a citizen or PR: show full prices only, with a note that subsidies need SC/PR
  - income per person above $4,800: 0% subsidy, and say so plainly
  - a plan with no services
  - two parents needing care: one plan per person; say so on the Start screen
  - a quoted fee outside $1–$10,000
  - a sibling split outside 1–10
  - a postal code in one of the 5 sectors with no centre: show the region picker, worded as "We can't place that area; pick yours"

  *Blocks: Stage 3 tests and Stage 5.*
- [x] **10. The data contract between the pipeline and the web app.** Export a JSON Schema from the Pydantic models into `web/src/lib/data/schema.json`. Generate the TypeScript types from it, or add a contract test that fails when the two drift apart. *Blocks: Stage 3.*
  - **Approved 25 Nov 2026:** [specs/10-data-contract.md](specs/10-data-contract.md)
- [x] **11. Sharing and search basics.**
  - **Approved 25 Nov 2026:** [specs/11-sharing-seo.md](specs/11-sharing-seo.md)
  - A page title, description and `og:` tags with a preview image, so a WhatsApp link shows a card.
  - `robots.txt` and `sitemap.xml`.
  - Test that a link opens in WhatsApp's built-in browser on iOS and Android.
  - Test printing on iPhone Safari.

  *Blocks: Stage 6.*

### Engineering setup

- [ ] **12. Environments.** *Partly done (25 Nov 2026); the rest waits on the owner's Vercel setup.*
  - Vercel preview builds act as staging; `main` is production. *Open: connect the repo on Vercel with Root Directory `web`.*
  - Turn on branch protection for `main`. *Changed: block force pushes and deletions only. The data workflow pushes straight to `main`, so requiring pull requests or status checks would make it fail. Before a public launch, switch the bot to opening a pull request, then require them.*
  - Give the data workflow `contents: write` permission, and nothing more. *Done (`.github/workflows/data.yml`).*
  - Rollback: use Vercel's instant rollback for the site, or `git revert` the JSON commit for data.
- [x] **13. Versions and browsers.** *Done (25 Nov 2026), except testing on real browsers.*
  - Pin Node (LTS), Next.js and Python 3.12. *Node 26 (`.nvmrc`), Python 3.12 (`.python-version`, CI), exact versions in `web/package.json` (Next.js 16.4.6, React 19.3.1).*
  - Browser support: the last 2 versions of Chrome, Safari, Firefox and Edge; iOS Safari 16+; Android WebView from the last 3 years. *The automated tests run in Chromium only; Safari, Firefox and WhatsApp's in-app browser are checked by hand on real phones.*
- [x] **14. Budgets and headers.** *Done (25 Nov 2026), with one accepted change to the budget.*
  - Performance budget: JavaScript under 150 KB gzipped on first load; all data files under 100 KB gzipped. *Data: enforced by the pipeline. JavaScript: 208 KB, of which about 173 KB is the Next.js and React framework; the owner accepted a budget of the framework plus 50 KB (architecture decisions, Stage 5).*
  - Headers: a Content-Security-Policy allowing only self plus the Umami origin, `Referrer-Policy: no-referrer`, and `X-Content-Type-Options: nosniff`. *In `web/vercel.json` and tested. The Umami origin is added only when analytics are. Scripts and styles need `'unsafe-inline'` (architecture decisions).*
- [ ] **15. Error visibility.** The site has no server logs, so send a cookie-free Umami event `client_error` with no personal data when the app catches an error.

## Verification status (25 Nov 2026)

Evidence for each item is in `docs/verified/` and the links below.

**Resolved**
- **Gate 1:** the official Care Services Recommender still shows no cost, no locations and no ordered plan. Walkthrough: `docs/verified/gate1-recommender-walkthrough-2026-11-25.md`.
- **AIC Links:** 9 locations with addresses, hours and coordinates, from AIC's own map data (`docs/verified/aic-links-2026-11-25.md`). The AIC hotline is also open on Saturdays, 8.30am–4pm.
- **CareShield Life:** $689 a month for 2026 claims ([CPF](https://www.cpf.gov.sg/service/article/what-is-the-monthly-payout-amount-for-careshield-life)).
- **ElderFund:** up to $250 a month, unchanged since launch ([HealthHub](https://www.healthhub.sg/a-z/costs-and-financing/elderfund)).
- **Helper levy:** $300 for the first helper, $450 for each after, $60 with the concession ([MOM](https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-domestic-worker/foreign-domestic-worker-levy/paying-levy)).
- **Prices:** AIC's own pages give the low ends: day care from $55, dementia day care from $63, home nursing from $62 (the aggregator's $80 is dropped). These are "before any government subsidies".
- **Day care transport:** AIC gives no figure and no subsidy rule, so the engine shows it at full price.
- **Nursing home payouts:** CareShield Life, MediSave Care and ElderShield payouts can be paid straight to the home ([CPF](https://www.cpf.gov.sg/service/article/i-am-staying-in-a-nursing-home-can-i-use-medisave-care-careshield-life-eldershield-payouts-to-pay-for-the-monthly-bills)). The order they are applied in doesn't matter to us: payouts are listed, never subtracted (ADR-004).
- **OneMap:** the search API now requires a token ([docs](https://www.onemap.gov.sg/apidocs/search)). Replaced by the on-device postal sector lookup (ADR-006), so OneMap's terms no longer apply at run time.
- **Analytics:** Vercel Web Analytics' custom events are Pro and Enterprise only ([Vercel](https://vercel.com/docs/analytics/limits-and-pricing)). Umami Cloud's Hobby plan is free with about 100K events a month, according to Umami's FAQ plus third-party listings. Confirm on umami.is/pricing when signing up.
- **GST:** MOH absorbs GST on healthcare services for subsidised patients at MOH-funded intermediate and long-term care providers, including day care, home nursing, home medical and home help ([MOH, 2012 policy](https://www.moh.gov.sg/news-highlights/details/more-affordable-intermediate-and-long-term-care-services-to-help-singaporeans-age-in-place); restated by [MOH](https://www.moh.gov.sg/newsroom/gst-incurred-for-subsidised-patients-who-obtain-medications-at-public-healthcare-institutions/) and Ren Ci's fee page). So the "with subsidy" column adds no GST. The "full price" column shows "may add 9% GST", because providers quote it differently: Ren Ci quotes excluding GST, Kwong Wai Shiu including it, and AIC doesn't say.
- **Falls:** "1 in 3 seniors fall each year" has no traceable Singapore source, so it is dropped. Use instead: about **8,000 seniors a year admitted to hospital because of a fall**, and about 2,000 for hip fractures (MOH, 2016 speech citing 2013–2015 data, [MOH](https://moh.gov.sg/newsroom/speech-by-dr-amy-khor-senior-minister-of-state-for-health-at-health-promotion-board-launch-of-falls-prevention-awareness-campaign-9-july-2016)); and **over 20% of older adults fall each year** (NUS Institute for Public Understanding of Risk, Oct 2025, [IPUR](https://ipur.nus.edu.sg/impact-storie/bone-health-and-fall-risks-a-mind-set-change); reported, primary study not read). Always show the year beside the figure.
- **Case-study figures:**
  - Dementia prevalence 8.8% of people aged 60+, about 73,900 people (WiSE 2023, [PubMed](https://pubmed.ncbi.nlm.nih.gov/39868432/)).
  - Over 94,000 Home Caregiving Grant applicants since 2019 ([MOH PQ, 13 Jan 2026](https://www.moh.gov.sg/newsroom/home-caregiving-grant/)).
  - 789,600 residents aged 65+ in 2025 ([SingStat](https://www.singstat.gov.sg/find-data/explore-data-themes/population/elderly-youth-and-sex-profile/latest-news-data)).
  - 9,702 strokes in 2022, from the national registry as reported in the news ([ANN](https://asianews.network/?p=234538)). Cite it as "reported".

**Still open (none block the build)**
- **Google Trends:** Google blocked automated access (HTTP 429). Pull it by hand at trends.google.com (Singapore, past 5 years: "nursing home", "day care elderly", "home caregiving grant").
- **Terms of use:** AIC's terms weren't found online. Cite and link AIC facts rather than republishing pages. SingStat data is used under the Open Data Licence.
- **Week 1 interviews and the practitioner review (Gates 1 and 2):** these need people. Nothing can stand in for them.

## Sources

Full source lists with links and [V]/[S] status: `reports/Singapore caregiver pain points.md` and `reports/Caregiver Navigator datasets and decisions.md`. Key primary sources: MOH subsidy framework pages (non-residential and residential, effective 1 Jul 2026); MOH parliamentary replies on discharge delays (Jan 2023), nursing home waits (Aug 2024), MSWs and AACs; MOH Committee of Supply 2026; AIC service pages and nursing home page; Together for Better caregiver page; SMU ROSA caregiver brief (Mar 2025); Lien Foundation "Care Where You Are" (2018); data.gov.sg datasets listed above; OneMap API docs and terms.

## Diagrams

- [As-is vs to-be journey](diagrams/journey.html)
- [System architecture](diagrams/architecture.html)
