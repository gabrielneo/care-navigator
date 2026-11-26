# Assumption register (to-do 8.15, 26 Nov 2026)

What Care Navigator assumes about families and the system, and how well each assumption is supported. There are no interviews or usability sessions (owner's decision, 25 Nov 2026), so the evidence is published. Most of it is from `reports/Singapore caregiver pain points.md`; the report's own limits apply:
- Several headline figures are only reported (from search summaries, not read on the source page).
- The Lien Foundation evidence dates from 2017 to 2018.
- First-person evidence is thin.

**Status:**
- **Sourced:** published evidence read on the source page supports it.
- **Partly sourced:** reported figures, old evidence, or a close but indirect source.
- **Untested:** our judgement; no source found.

| ID | Assumption | Status | Evidence | If it's wrong | Design that depends on it |
|---|---|---|---|---|---|
| A1 | Not knowing the cost stops families from acting | Partly sourced | Lien Foundation (2018): a quoted fee stalled referrals; about half of referred people never used services. HardwareZone thread: users guess post-subsidy costs and cite wrong rates. | Cost would be a nice-to-have, and the timeline and contacts would matter more | Cost screen, the example plan on Start |
| A2 | Families don't know what exists | Partly sourced | AIC 2024 survey, about 41% aware of support services (reported, from a conference abstract). SMU ROSA (Nov 2024, read on the source page): 50.09% of older caregivers know about respite. | Matching would add less than cost and next steps | Matches screen |
| A3 | Knowing isn't enough: friction around cost, eligibility and booking stops use | Sourced | SMU ROSA: 82.83% of those who know about respite have never used it | — | Next steps (8.2), grant criteria (8.5), respite referral timing |
| A4 | The hospital stay is where access is won or lost | Sourced | MOH: about 220 medically fit patients a day stay over 21 days (Jan 2023). THK: the Interim Caregiver Service is referred only by the ward's medical social worker. | The hospital branch would be over-emphasised | In-hospital branch first; first call to the ward |
| A5 | Families trust people (the MSW) more than portals | Partly sourced | HardwareZone and an editorial guide: placement happened through the MSW; "many families do not know what an MSW can arrange" | A handover summary would be little used | Handover summary (8.4), first-call ask lists |
| A6 | The person planning is often a working adult with little time | Sourced | SMU: 45% of older caregivers work full-time; MOM: about 12,300 residents outside the labour force to care for parents (2025) | A longer, more thorough tool might be acceptable | About 5 minutes, one sitting, nothing to sign up for |
| A7 | Families will pick an income range when nothing is stored | Untested | No usability test (Stage 7 replaced it) | Subsidy estimates would go unseen; fall back to showing full price, as now | Income range, not exact income |
| A8 | Siblings share and split the cost | Partly sourced | One personal-finance story and an old blog (the report calls it weakly sourced) | The split and WhatsApp sharing would be little used; cheap to keep | Cost split, WhatsApp link, ticks in the link (8.6) |
| A9 | A printed one-page plan is useful at the ward or AIC Link | Untested | Design judgement; no MSW feedback (Gate 2 deferred) | Printing would matter less than the phone view | One-A4 print rule, handover print |
| A10 | Ranges are honest; exact quotes aren't possible from public data | Sourced | Only NTUC Health publishes a broad fee schedule; no net-fee tables from MOH or AIC (report; source audit) | — | Ranges with sources; aggregator upper ends flagged |
| A11 | Families want both prices: with subsidy and at full price | Untested | Owner's decision (25 Nov 2026) | One figure might be clearer | Two columns on the cost screen |
| A12 | Families don't know which payouts need severe disability | Partly sourced | Scheme wording differs ("some assistance" vs "full assistance" or "unable"); our own data got it wrong until 8.1 | — | The "can't do at all" follow-up (8.1) |
| A13 | Following steps in order reduces dead ends (e.g. the report before the grant) | Partly sourced | Official process pages state the order (source audit, next steps); no evidence on how often families get the order wrong | The timeline would still be correct, just less valuable | Ordered timeline (8.2) |
| A14 | Families will use Care Navigator before talking to the system | Untested | Purpose statement; the government is moving to human navigation (Age Well SG single care plan from Oct 2026) | It may be most useful after the first call, to understand the plan | Product positioning; the handover summary bridges both |

## How to use this register

- **Before a new feature:** name the assumption it relies on. If that's untested, keep the feature small.
- **When new evidence appears** (a published survey, an MOH reply, AIC feedback on the handover summary): update the status and the date.
- **Highest value to test first:** A7 (income range) and A9 (the printed plan), if testing with people ever becomes possible.
