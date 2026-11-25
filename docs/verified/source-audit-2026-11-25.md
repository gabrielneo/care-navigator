# Source audit of rules and wording (25 Nov 2026)

Stage 7 replaces the practitioner review (Gate 2) with a desk check. We checked every matching rule, first contact, ask-list question, application step, timing note, document and grant condition against the official page named. Pages were read on 25 Nov 2026.

**What this is not:** a care professional's review. It shows that each statement has a published source, or is marked as our judgement. It does not show the advice is right for a given family. The prototype banner stays.

Verdicts: **Supported**, the page says it. **Partly**, the page says something close, and the wording was changed to match. **Not found**, no source says it, so it was removed, softened or marked as judgement.

## Services and matching rules

| Claim | Verdict | Source | Action |
|---|---|---|---|
| Day care: supervision during the day while family works | Supported | AIC Day Care | None |
| Day care transport costs extra | Supported | AIC Day Care | None |
| Dementia day care is a separate service | Partly: offered by selected day care centres | AIC Day Care | Description says "at selected centres" |
| Home personal care helps with washing, dressing, feeding, toileting | Supported (AIC calls it HPC+) | AIC Home Personal Care | Description lists the tasks |
| Home nursing: wounds, feeding tubes, injections, medicines | Supported; for homebound people | AIC Home Nursing | None |
| Home therapy helps her regain abilities at home | Supported: physio, occupational and speech therapy; from $125 a visit | AIC Home Therapy | Description and source updated; low price now official |
| Centre-based rehabilitation as a named service | **Not found**: no AIC page; MOH lists "Active Rehabilitation" and "Maintenance Exercise" without describing them | MOH non-residential framework | Removed: service, price and rule R06. R05 (home therapy) now also covers "changed at home" |
| Medical escort to appointments | Supported: transport plus an escort; from $40 a round trip | AIC Medical Escort and Transport | Source updated; low price now official |
| Meals on wheels for those who can't prepare meals | Supported: 7 days a week; from $4 a meal | AIC Meals on Wheels | **Low price corrected from $4.90 to $4** |
| Respite: short full-time stay at a nursing home | Supported: at least 7 days, up to 30 days a year, from $131 a day, referral by a hospital, polyclinic or GP doctor, apply 4 weeks ahead | AIC Nursing Home Respite Care; AIC Take a Break | **Low price corrected from $100 (aggregator) to $131 (official)**; steps, description and ask list updated |
| Respite is subsidised under the residential framework | Supported ("Nursing Home Respite Care") | MOH residential framework | None |
| Active Ageing Centres: activities, exercise, befriending; drop in to sign up | Supported; for people aged 60+ | AIC Active Ageing Centres | None |
| Interim Caregiver Service only via the ward | Supported: only a hospital medical social worker can refer, while she is still in hospital | THK Interim Caregiver Service | Wording says "medical social worker", not "ward team" |
| Nursing home: when care at home isn't enough | Supported | AIC Nursing Home | None |

## Branches, first contacts and ask lists

| Claim | Verdict | Source | Action |
|---|---|---|---|
| In hospital, call the ward's medical social worker first | Supported: medical social workers plan post-discharge care during the stay | SGH Hospital-to-Home; THK | None |
| "Short-term help after discharge usually lasts about 2 weeks to 2 months" | **Partly**: the Interim Caregiver Service lasts up to 2 weeks; SGH's Hospital-to-Home lasts up to 2 months (SGH area only) | THK; SGH | Split into two accurate sentences |
| Hospital-to-Home as a single scheme | Partly: SGH's is for its own area | SGH | Ask list says "a Hospital-to-Home programme" |
| "Can you start the single assessment and care plan before she leaves?" | Partly: one standardised assessment since Apr 2026, and a single care plan rolling out from Oct 2026; no page says who starts it | Age Well SG | Reworded to "Will she get the single care assessment, and who arranges it?" |
| Link "AIC's discharge tips" | Partly: the tips appear in the Recommender's results after its questions (Gate 1 walkthrough), not on the page the link opens | AIC Care Services Recommender | Relabelled "AIC's Care Services Recommender" so the label matches the page it opens |
| Changed at home: "Her GP, a polyclinic doctor or an AIC Link" | Partly: AIC names hospital or polyclinic doctors and AIC Links for home and day care, not GPs | AIC service pages | Now "A polyclinic doctor or an AIC Link" |
| Struggling: AIC Link or hotline first | Partly: the hotline is confirmed; AIC Links help with applications; respite needs a doctor's referral | AIC; Take a Break | First contact kept (they help apply); respite ask and steps now name the referral and 4 weeks' notice |
| Nursing home wait: about 1 month general, 2–4 months psychiatric | Partly: the source says "psychiatric care needs", not "subsidised" or "dementia" | MOH parliamentary reply, 6 Aug 2024 | Wording matches the source |
| Dementia note: "Dementia day care … usually have longer waits" | **Not found** for day care | MOH | Day care claim removed. The note now gives only the psychiatric nursing home wait. Showing it for memory problems is our judgement |

## Applying, documents and grants

| Claim | Verdict | Source | Action |
|---|---|---|---|
| A hospital or polyclinic doctor applies online, or an AIC Link helps | Supported | AIC service pages | None |
| "The provider assesses her and confirms the fee after the means test" | Partly: subsidies are means-tested; assessment is named only for HPC+ and nursing homes | AIC service pages | Now "Subsidies are means-tested on household income per person" |
| Nursing home referral by "the hospital or AIC" | Partly: a hospital, polyclinic or medical social worker refers; AIC helps apply | AIC Nursing Home | Corrected |
| Income "details come from government records; payslips only if asked" | **Not found** | AIC HCG; AIC financial assistance | Removed. Now: the income of everyone at her NRIC address, which the means test uses (AIC) |
| Bring her NRIC, your NRIC, discharge summary, medicines list | **Not found**: no official list | — | Kept as our judgement and labelled so in `how_to_apply.yaml` |
| Home Caregiving Grant: 3+ daily activities, a Functional Assessment Report, apply on eFASS | Supported. Tiers $600 / $400 / $200 and the $4,800 income limit match our data | AIC HCG | Source moved from NTUC's how-to to AIC's own page |
| Caregivers Training Grant: $400, then $200 a year | Partly: capped at $400 per care recipient; for an SC or PR aged 65+ or with a disability | Together for Better | Amount text and conditions updated |
| Levy concession: SC aged 67+, or needs help with 1+ daily activity | Supported; the activity route needs a doctor's certification and AIC's recommendation letter | MOM | Conditions updated |
| Levy concession document: "the helper's work permit details" | **Not found** | MOM | Replaced with the certification and AIC letter |

## Still open

- **Centre-based rehabilitation** was removed. If AIC publishes a page for it, add it back with that page as the source.
- **Aggregator prices** still set the upper end of the range for dementia day care, home personal care, medical escort, meals and respite (pipeline warnings).
- **Documents to bring** are our judgement.
- Older official pages disagree on the Home Caregiving Grant: MOM's page still says up to $400, and NTUC's page is internally inconsistent. We follow AIC's page.
