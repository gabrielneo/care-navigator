# Gate 1: Care Services Recommender walkthrough (25 Nov 2026)

**Tool:** [aic.sg/care-services-recommender](https://www.aic.sg/care-services-recommender). SupportGoWhere's old recommender page now points here. SupportGoWhere also shows a "Try our AI search" button.

**Scenario (Mei's mother, fictional):**
- About to be discharged from hospital.
- Walks with or without help.
- Needs help bathing and dressing; independent in feeding, toileting, moving and transferring.
- Physically weaker after a fall.
- The family wants community services (showering, eldersitting).
- No future plans made yet.
- Singapore Citizen, not Pioneer Generation, has CareShield Life and MediSave.
- Household of 2 with an income of $2,400 a month ($1,200 PCHI).

## What it asks, in order

1. **Current situation:** soon to be discharged / discharged within 2 weeks / living at home / in a nursing home. This is close to our "Where is Mum right now?" question.
2. **Physical condition:** moving around / wheelchair-bound / bedbound.
3. **Daily activities:** 6 activities × 3 levels of help.
4. **Medical condition:** fall, stroke, hip fracture, dementia, mental health, end of life, nursing needs.
5. **Caregiving needs:** training, support groups, community services. If community services is picked, a follow-up asks which home services are needed.
6. **Future planning:** will, LPA, ACP, CPF nomination.
7. **Optional financial section:** citizenship, Pioneer Generation, CareShield or ElderShield, MediSave balance. Then **exact household size and exact monthly household income**.

## What the results show

- A list of schemes and services:
  - "Most relevant": Caregivers Training Grant, Community Rehabilitation, EASE, SMF.
  - "Other": Day Care, Home Personal Care, CHAS, MDW levy concession, CPF nomination, Deputyship, My Legacy.
- **Discharge Tips:** before discharge, care management, home safety.
- A generic "Want to speak to someone?" link, and a note that "you will need to apply for them separately".

## What it does not show

- **No cost:** no monthly price, no subsidy %, no out-of-pocket estimate. This held even after it asked for exact income.
- **No locations:** no nearest AIC Link, provider or distance.
- **No ordered plan:** no list of who to call first, what to ask, or which documents to bring.
- **No sharing:** no shareable or printable plan or cost split. The answers are in the results URL (`?input=…`), but nothing is designed for sharing.
- Home Caregiving Grant correctly did not appear (2 daily activities, below the 3-activity threshold).

## Verdict

**Gate 1 passes.** The gap is still cost, who to call and a shareable plan. Two things change our design:

1. **Our first question overlaps AIC's.** Keep it, and use AIC's answer wording so a family moving between the two tools sees the same terms ("soon to be discharged", "recently discharged").
2. **AIC already gives discharge tips.** Our hospital branch should link to AIC's discharge tips, not rewrite them. Ours should add only what AIC lacks: ward-only services (Interim Caregiver Service), questions for the medical social worker, and the cost.

A differentiator: AIC asks for **exact household income**. We ask for an income **band** and store nothing.
