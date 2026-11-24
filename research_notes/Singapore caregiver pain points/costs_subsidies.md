# Eldercare costs, subsidies and grants for families in Singapore (as of 24 Nov 2026)

## 1. What changed in 2026: subsidy framework and grants

### Takeaway
Most of the 2026 changes were announced at Budget and the MOH Committee of Supply (COS) in March 2025.
- **Home and community long-term care (LTC) subsidies:** raised from 1 Jul 2026, to up to 95% for Singapore Citizens (SCs) born in 1969 or earlier, 80% for other SCs and 55% for PRs.
- **Full subsidy band widened:** the top rate now covers per capita household income (PCHI) up to $1,500 a month. Before, it stopped at $900.
- **Income ceiling raised:** from $3,600 to $4,800 PCHI.
- **Home Caregiving Grant (HCG):** up to $600 a month from Apr 2026 (was $400).
- **Unchanged:** ElderFund payouts have not moved since launch, and MediSave Care is still capped at $200 a month.

### Cited Findings

**Non-residential (home and community) LTC subsidy table, effective 1 Jul 2026**

Covers: Active Rehabilitation, Centre-Based Nursing, Dementia Day Care, Home Medical, Home Nursing, Home Therapy, Home Personal Care, Maintenance Day Care, Maintenance Exercise, Meals on Wheels, Medical Escort and Transport, and Psychiatric Day Rehabilitation. Providers must be government-funded. — [MOH](https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/subsidy-framework-for-non-residential-long-term-care-services/)

| Monthly PCHI | SC born 1969 or earlier | SC born after 1969 | PR |
|---|---|---|---|
| No income, home Annual Value (AV) ≤ $21,000 | 95% | 80% | 55% |
| No income, AV > $21,000 | 0% | 0% | 0% |
| $900 and below | 95% | 80% | 55% |
| **$901–$1,500** | **95%** | **80%** | **55%** |
| $1,501–$2,300 | 85% | 70% | 45% |
| $2,301–$2,600 | 75% | 60% | 35% |
| $2,601–$3,600 | 55% | 40% | 20% |
| $3,601–$4,800 | 35% | 20% | 10% |
| $4,801 and above | 0% | 0% | 0% |

Source: [MOH](https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/subsidy-framework-for-non-residential-long-term-care-services/). I checked the page's raw HTML on 24 Nov 2026.
- In the HTML, the 95/80/55 cells for "$900 and below" have `rowSpan="2"`, so they also cover the $901–$1,500 row.
- Text scrapers drop the merged cells and make the $901–$1,500 row look empty. Watch for this if the table is re-scraped.
- The [MOH COS 2025 booklet](https://file.go.gov.sg/mohcos2025booklet.pdf) confirms it: "More to benefit from maximum subsidy – up to $1,500 in monthly PCHI instead of up to $900 today."

**Pre-July 2026 home and community rates (SC / PR)** — [Together for Better](https://www.togetherforbetter.gov.sg/lifestage/caregivers/)

| Monthly PCHI | SC | PR |
|---|---|---|
| No income, AV ≤ $21k | 85% | 55% |
| ≤ $900 | 80% | 55% |
| $901–$1,500 | 75% | 50% |
| $1,501–$2,300 | 60% | 40% |
| $2,301–$2,600 | 50% | 30% |
| $2,601–$3,600 | 30% | 15% |
| > $3,600 | 0% | 0% |

So, at $901–$1,500 PCHI, an SC born in 1969 or earlier went from 75% to 95% subsidy.

**Means-test rules** — [MOH](https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/subsidy-framework-for-non-residential-long-term-care-services/)
- PCHI is gross household monthly income divided by the number of family members living together. It includes overtime, allowances, cash awards, commissions and bonuses.
- Households with zero income are assessed on the AV IRAS sets for their home.
- "Subsidy levels in 2026 will be determined using 2025 Annual Values."

**Residential LTC (nursing home, chronic sick) table, effective 1 Jul 2026** — [MOH](https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/subsidies-for-residential-long-term-care-services/)

| Monthly PCHI | SC born 1969 or earlier | SC born after 1969 | PR |
|---|---|---|---|
| No income, AV ≤ $21k | 80% | 75% | 50% |
| ≤ $900 | 80% | 75% | 50% |
| $901–$1,500 | 80% | 75% | 50% |
| $1,501–$2,300 | 65% | 60% | 40% |
| $2,301–$2,600 | 55% | 50% | 30% |
| $2,601–$3,600 | 35% | 30% | 15% |
| $3,601–$4,800 | 15% | 10% | 5% |
| ≥ $4,801 | 0% | 0% | 0% |

- The $901–$1,500 values are inferred from the same merged-cell layout and the booklet's "up to $1,500" statement. I checked the raw HTML only on the non-residential page.
- Previous residential rates: 75% (SC) / 50% (PR) at ≤ $900, and 60% / 40% at $901–$1,500. — [Together for Better](https://www.togetherforbetter.gov.sg/lifestage/caregivers/)

**COS 2025 package**, enhancements effective Jul 2026 — [MOH COS 2025 booklet](https://file.go.gov.sg/mohcos2025booklet.pdf)
- LTC service subsidies rise by up to 15 percentage points, to a maximum of 80%.
- The PCHI ceiling rises from $3,600 to $4,800.
- Seniors born in 1969 or earlier get extra cohort subsidies: +5 points for residential care and +15 points for home and community care.
- Interim rebates applied from Jul 2025 to Jun 2026.

**COS 2026** — [MOH, Tan Kiat How speech, 5 Mar 2026](https://www.moh.gov.sg/newsroom/speech-by-mr-tan-kiat-how--senior-minister-of-state--ministry-of-digital-development-and-information---ministry-of-health--at-the-ministry-of-health-committee-of-supply-debate-2026--on-5-march-2026/)
- The $4,800 ceiling covers "about 7 in 10 households."
- Subsidy levels do not depend on how many activities of daily living (ADLs) the senior needs help with.

**Home Caregiving Grant (HCG)**
- From Apr 2026, payouts by monthly PCHI — [Together for Better](https://www.togetherforbetter.gov.sg/lifestage/caregivers/):
  - $0–$1,500, or no income with AV ≤ $21,000: $600 (previously $400)
  - $1,501–$3,600: $400
  - $3,601–$4,800: $200
  - Owners of multiple properties: $200
- Eligibility: the care recipient is an SC (or a PR with an SC parent, child or spouse), permanently needs help with at least 3 of 6 ADLs, and does not live in a residential LTC institution. — [Together for Better](https://www.togetherforbetter.gov.sg/lifestage/caregivers/); [NTUC Health](https://ntuchealth.sg/elderly-care/resources/home-care/how-to-apply-for-the-home-caregiving-grant-for-care-at-home)
- Applying takes two steps: get a Functional Assessment Report (FAR), then apply on AIC's eFASS portal with Singpass. — [NTUC Health](https://ntuchealth.sg/elderly-care/resources/home-care/how-to-apply-for-the-home-caregiving-grant-for-care-at-home)
- History: at launch the grant was $200 a month, with a PCHI cap of $2,800 and an AV cap of $13,000 (MOH reply, 5 Apr 2021). — [MOH](https://www.moh.gov.sg/newsroom/home-caregiving-grant-beneficiaries/)

**CareShield Life**
- The monthly payout is $689 in 2026. It now rises 4% a year (was 2%), and reaches $806 by 2030. — [MOH, CareShield Life Council recommendations](https://www.moh.gov.sg/newsroom/government-accepts-careshield-life-council-s-recommendations-to-enhance-careshield-life--provides-additional--570-million-to-subsidise-premiums/)
- The 2025 payout was $662.
- Claims require inability to perform 3 of 6 ADLs. Cover is automatic for people born in 1980 or later, and optional for those born in 1979 or earlier. — [Together for Better](https://www.togetherforbetter.gov.sg/lifestage/caregivers/)

**MediSave Care**
- Monthly cash withdrawal for SCs and PRs aged 30+ who cannot perform 3 of 6 ADLs, by MediSave balance:
  - ≥ $20,000: $200
  - ≥ $15,000: $150
  - ≥ $10,000: $100
  - ≥ $5,000: $50
  - < $5,000: nil
- Source: [Together for Better](https://www.togetherforbetter.gov.sg/lifestage/caregivers/)
- Withdrawals can come from the person's own or a spouse's account (launched Oct 2020). — [Straits Times via ANN, 5 Oct 2026](https://asianews.network/?p=305528)

**ElderFund** — [ST via ANN, 5 Oct 2026](https://asianews.network/?p=305528)
- For SCs aged 30+ who need full help with at least 3 of 6 ADLs, have PCHI ≤ $2,600 and a MediSave balance under $10,000.
- Pays $250 a month at PCHI ≤ $1,500, or $150 a month above that.
- Payouts have not been revised since launch.

**Seniors' Mobility and Enabling Fund (SMF)** — [Together for Better](https://www.togetherforbetter.gov.sg/lifestage/caregivers/)
- Up to 90% subsidy on assistive devices and up to 80% on home healthcare consumables (diapers, milk feeds).
- From Jan 2026: PRs qualify, the PCHI ceiling rises to $4,800, and enhanced device subsidies start.
- From Apr 2026: enhanced subsidies on consumables.
- In Aug 2026, MOH described SMF as "up to 90%" on devices and home healthcare items. — [Parliament, 5 Aug 2026](https://www.sgparliament.com/debate/33340)

**Caregivers Training Grant (CTG)** — [Together for Better](https://www.togetherforbetter.gov.sg/lifestage/caregivers/)
- $400 at first, then a $200 top-up each year. The unused balance carries forward, capped at $400 per care recipient.
- Usable by family caregivers and migrant domestic workers (MDWs).

**MDW levy concession**
- $60 a month instead of $300 for the first MDW ($450 for subsequent MDWs).
- Applies when the household includes an SC aged 67+, a child under 16, or a certified person needing help with at least 1 ADL.
- Sources: [Together for Better](https://www.togetherforbetter.gov.sg/lifestage/caregivers/); [MOM](https://mom.gov.sg/passes-and-permits/work-permit-for-foreign-domestic-worker/foreign-domestic-worker-levy/levy-concession)
- Each household can get concessions for up to two MDWs. — [HealthHub](https://healthhub.sg/a-z/costs-and-financing/foreign-domestic-worker-fdw-levy-concession-for-persons-with-disabilities)
- The FDW Levy tax relief lapsed from Year of Assessment 2025. — [IRAS](https://www.iras.gov.sg/taxes/individual-income-tax/employees/deductions-for-individuals/personal-reliefs-and-tax-rebates/foreign-domestic-worker-levy-(fdwl)-relief)
- A 2026 MOM written reply addressed lowering the age-67 threshold. — [MOM PQ 0505, 2026](https://www.mom.gov.sg/newsroom/parliament-questions-and-replies/2026/0505-written-answer-to-pq-on-on-levy-concessions-for-elderly)

**Other 2026 changes** — [MOH COS 2026 speech](https://www.moh.gov.sg/newsroom/speech-by-mr-tan-kiat-how--senior-minister-of-state--ministry-of-digital-development-and-information---ministry-of-health--at-the-ministry-of-health-committee-of-supply-debate-2026--on-5-march-2026/)
- Enhanced Home Personal Care (HPC+), from 1 Apr 2026 for over 5,600 seniors. It adds home respite, medication reminders and 24/7 fall detection.
- Integrated Community Care Providers (ICCPs) across 84 sub-regions. One assessment and one shared care plan replace separate per-service assessments, rolling out progressively from Oct 2026.

### Inferences
- **Biggest relative gain:** households with PCHI of $901–$1,500, with the senior born in 1969 or earlier. Their home-care subsidy rose from 75% to 95%, which cuts out-of-pocket costs by 80% (from 25% of the fee to 5%).
- **Two age cut-offs to remember:**
  - Born in 1969 or earlier: decides the extra cohort subsidy.
  - Age 67 and above: decides the MDW levy concession.
- **Different tests for different schemes:**
  - LTC subsidies, HCG and SMF: PCHI ceiling of $4,800.
  - ElderFund: PCHI ≤ $2,600 plus a MediSave balance test.
  - MediSave Care: MediSave balance only.
  - HCG, CareShield Life, MediSave Care and ElderFund: 3 or more ADLs.
  - MDW levy concession: 1 or more ADLs, or age.
  - Families face at least four different eligibility tests.

### Gaps
- Pre-April 2026 HCG amounts for the $1,501–$3,600 band were not confirmed from a primary source.
- I checked the residential $901–$1,500 row only by analogy, not in its own HTML.
- I did not get the text of the 2026 MOM levy concession reply.

## 2. What care actually costs per month, before and after subsidy

### Takeaway
- **Published list prices:**
  - Senior day care: about $1,100–$1,600 a month, plus $250–$440 for transport.
  - Nursing homes: $756–$5,400 a month.
  - Home personal care: up to $26 an hour.
  - Home nursing: up to $141 a visit.
- **Government benchmark:** a low-income person with severe disability, using a typical set of home and community services and covered by CareShield Life, pays about $110 a month out of pocket.
- **Missing:** official net-fee tables, and fees that families have actually reported.

### Cited Findings
- **NTUC Health published fees**, undated page with © 2026 — [NTUC Health FAQ](https://ntuchealth.sg/elderly-care/elderly-care-faq):
  - Senior Day Care: $1,100–$1,606 a month, excluding clinical services, escort, rehab and transport.
  - Day care transport: about $250–$440, before subsidy.
  - Home Personal Care: $2.70–$26 an hour.
  - Home Nursing: $4.20–$141 a visit.
  - Home Therapy: $17.60–$160 a visit.
  - Home Medical: $38.80–$298 a visit.
  - Interim Caregiver Service: $189–$1,095 per single-day shift.
  - Disability assessment: $250.
  - Nursing home: $756–$5,400 a month, plus an admission charge, medication and consumables. Subsidy up to 80%.
  - Flexible Care: $1,452–$1,738 before subsidy, or $73–$1,564 after (up to 95%).
  - Note: the low ends of these ranges are probably post-subsidy rates.
- **Private market:** Homage lists home elderly care from $23 an hour, with no subsidy. — [Homage](https://www.homage.sg/services/elderly-care/)
- **MOH benchmark:** about $110 a month out of pocket for a low-income person with severe disability, using typical home and community services and covered by CareShield Life. They can also withdraw up to $200 a month through MediSave Care. — [MOH reply to Victor Lye, 7 Jul 2026](https://www.moh.gov.sg/newsroom/long-term-care-financing-support-enhanced-to-improve-care-affordability/)
- **Real case:** a 71-year-old with dementia in a nursing home. His niece uses $200 a month of his MediSave to bring her own monthly payment down to $100. — [ST via ANN, 5 Oct 2026](https://asianews.network/?p=305528)
- **Aggregator estimates (lower reliability):**
  - Day care: $400–$1,500 a month before subsidy, or $300–$800 after, at voluntary welfare organisation (VWO) centres.
  - Dementia day care: over $2,000 before subsidy.
  - Home nursing: about $62 a visit.
  - Sources: [Income](https://www.income.com.sg/blog/elderly-care-in-singapore-guide), [careacross.sg](https://careacross.sg/blog/cost-eldercare-singapore-2026), [nursinghomeguide.sg](https://nursinghomeguide.sg/cost/)
- **MDW:** concessionary levy of $60 a month, instead of $300. — [MOM](https://mom.gov.sg/passes-and-permits/work-permit-for-foreign-domestic-worker/foreign-domestic-worker-levy/levy-concession)

### Inferences
- Illustrative calculation, not a published figure: day care at about $1,350 a month (NTUC midpoint).
  - At 95% subsidy, the family pays about $68 a month.
  - At 35% subsidy, the family pays about $880 a month.
  - Transport is extra in both cases.
  - This ignores GST and assumes the subsidy applies to the whole fee.
- An MDW costs roughly the levy plus salary, food, insurance and agency fees. I could not verify salary figures, so I give no estimate.

### Gaps
- MOH or AIC do not publish official net-fee tables by subsidy tier.
- I found no survey of the fees families actually pay after the Jul 2026 changes.
- I could not verify current MDW salary or agency-fee data from a reliable 2026 source.
- I found no published per-centre fee lists other than NTUC Health's.

## 3. Evidence that means testing, applications and multiple schemes confuse or block families

### Takeaway
The clearest evidence comes from Parliament and policy reports, not surveys:
- MPs have challenged the PCHI means test as unfair to sandwiched families and retired seniors (2026).
- MOH defends PCHI as imperfect but the best available basis, and says it will study changes with MOF.
- The 3-ADL eligibility line for the HCG was contested in Aug 2026.
- A 2024 Lien Foundation report found that even service providers find the eldercare system "perplexing".

### Cited Findings
- **Victor Lye, COS 2026:**
  - He raised unintended consequences of using PCHI to judge caregiving need.
  - MOH said it will study his suggestions with MOF, and that families in difficult circumstances can approach medical social workers.
  - Source: [MOH COS 2026 speech, 5 Mar 2026](https://www.moh.gov.sg/newsroom/speech-by-mr-tan-kiat-how--senior-minister-of-state--ministry-of-digital-development-and-information---ministry-of-health--at-the-ministry-of-health-committee-of-supply-debate-2026--on-5-march-2026/); summary at [sgai.md](https://sgai.md/debates/cos-moh-2026/)
- **Sandwiched families, Budget 2026 debate:**
  - Argument made: two households with the same PCHI can carry very different burdens.
  - The proposal asked for subsidy tiers that account for multiple dependents.
  - Source: an AI-generated debate summary, [sgai.md](https://sgai.md/debates/budget-2916/), so lower reliability.
- **Retired seniors, Parliament 26 Feb 2026:**
  - One speaker argued that retired seniors are disproportionately affected by PCHI and property-value tests.
  - Another defended both indicators as practical.
  - Source: [ParliamentPal](http://parliamentpal.sg/en/sittings/2026-02-26?speech_kind=speech&speech_kind=motion&speech_kind=ministerial_answer&speech_kind=supplementary_question&speech_kind=bill_debate)
- **MOH's defence of PCHI:**
  - Individual income ignores differences among retirees, and total household income penalises large families.
  - Source: [MOH letter, undated](https://www.moh.gov.sg/newsroom/per-capita-household-income-still-best-basis-for-means-testing/)
- **HCG 3-ADL threshold, 5 Aug 2026:**
  - Henry Kwek (Kebun Baru) asked whether the HCG could extend to people needing help with 2 ADLs.
  - MOH (Tan Kiat How) kept the 3-ADL threshold and pointed families to other schemes: SMF, the levy concession, HPC+, Interim Caregiver Support and Nursing Home Respite.
  - Asked about appeals, MOH referred residents to the AIC website. It did not say how likely appeals are to succeed.
  - Source: [SG Parliament](https://www.sgparliament.com/debate/33340)
- **HCG property-value cap, 2021:**
  - He Ting Ru asked about a lower HCG for homes with AV of $13,000–$21,000, which were then excluded.
  - MOH said only that it "continually reviews" its schemes.
  - Source: [MOH, 5 Apr 2021](https://www.moh.gov.sg/newsroom/home-caregiving-grant-beneficiaries/)
- **Lien Foundation, "Care Where You Are" (Oct 2024):**
  - Service providers sometimes find the eldercare system perplexing.
  - It is difficult to help care recipients understand the numerous schemes.
  - Source: [Lien Foundation](https://lienfoundation.org/wp-content/uploads/2024/10/Care-Where-You-Are-FINAL-Report-pdf-2.pdf). These points come from a search snippet. I did not read the full report.
- **Academic critique:**
  - Seniors who are asset-poor but appear household-income-rich "fall through the means-testing grid."
  - Source: [Ramesh, Social Policy & Administration](https://onlinelibrary.wiley.com/doi/10.1111/spol.70080?af=R)
- **Straits Times opinion piece, 10 Aug 2026:** families of people with dementia cared for by MDWs "piece the information together on their own." — [PressReader](https://www.pressreader.com/singapore/the-straits-times/20260810/282024744079274). The page returned 403, so this comes from a search snippet only.
- **Application friction:**
  - The HCG needs a separate FAR assessment before applying on eFASS. — [NTUC Health](https://ntuchealth.sg/elderly-care/resources/home-care/how-to-apply-for-the-home-caregiving-grant-for-care-at-home)
  - MOH acknowledged fragmentation by moving to one assessment and one care plan through ICCPs, rolling out from Oct 2026. — [MOH COS 2026](https://www.moh.gov.sg/newsroom/speech-by-mr-tan-kiat-how--senior-minister-of-state--ministry-of-digital-development-and-information---ministry-of-health--at-the-ministry-of-health-committee-of-supply-debate-2026--on-5-march-2026/)
- **Inconsistent official information:**
  - Together for Better shows "Last updated 19 December 2025" in one place and "20 October 2026" in another.
  - Its HCG table still cites 2024 AV, while MOH says 2026 subsidy levels use 2025 AV.
  - Sources: [Together for Better](https://www.togetherforbetter.gov.sg/lifestage/caregivers/); [MOH](https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/subsidy-framework-for-non-residential-long-term-care-services/)

### Inferences
- The ICCP single-assessment reform is an implicit official admission that a separate assessment for each service was a burden.
- Official subsidy tables use merged cells that text scrapers and some third-party sites mis-render. At least one AI search summary treated the $901–$1,500 row as "missing". This is itself a small source of confusion.

### Gaps
- I found no quantitative survey (for example from Duke-NUS or IPS) measuring how confused or aware caregivers are of specific schemes in 2025–2026.
- I could not obtain the full text of the 2026 Straits Times opinion piece or the Lien Foundation report.
- No data was found on HCG rejection or appeal rates.

## 4. Take-up and awareness of these schemes

### Takeaway
Use is growing but small next to the eligible population:
- HCG: over 94,000 applicants since 2019 (Jan 2026).
- Subsidised respite: about 14,000 seniors' caregivers in 2025.
- MediSave Care: about 5,900 people withdrawing in 2025.
- ElderFund: 7,973 claimants since 2020.

### Cited Findings
- **HCG applicants:** over 94,000 since 2019, 74% of them aged 70+. This is from a MOH written reply to PQ 792 for the 13 Jan 2026 sitting, seen in a search result only. — [MOH](https://www.moh.gov.sg/newsroom/home-caregiving-grant/)
- **HCG beneficiaries, earlier figure:** over 31,000, with more than $75m paid by end-Feb 2021. — [MOH](https://www.moh.gov.sg/newsroom/home-caregiving-grant-beneficiaries/)
- **Respite and HPC+:** caregivers of over 14,000 seniors received subsidised home or centre respite in 2025. Over 5,600 seniors are eligible for HPC+ from 1 Apr 2026. — [MOH COS 2026](https://www.moh.gov.sg/newsroom/speech-by-mr-tan-kiat-how--senior-minister-of-state--ministry-of-digital-development-and-information---ministry-of-health--at-the-ministry-of-health-committee-of-supply-debate-2026--on-5-march-2026/)
- **Other reach figures:** [MOH COS 2026](https://www.moh.gov.sg/newsroom/speech-by-mr-tan-kiat-how--senior-minister-of-state--ministry-of-digital-development-and-information---ministry-of-health--at-the-ministry-of-health-committee-of-supply-debate-2026--on-5-march-2026/)
  - Silver Generation Office: engaged over 600,000 seniors since 2022.
  - LifeSG personalised recommendations: over 3,000 seniors since Dec 2025.
  - Active Ageing Centres: over 230, serving about 100,000 seniors.
  - Senior Care Centres: over 150.
- **MediSave Care withdrawals:** about 600 people (2021), 4,300 (2024) and 5,900 (2025), averaging about $1,800 per person per year. — [ST via ANN, 5 Oct 2026](https://asianews.network/?p=305528)
- **ElderFund:** [same article](https://asianews.network/?p=305528)
  - 7,973 claimants received over $48.9m by 30 Jun 2026. MOH released these figures for the first time.
  - Claimants: 777 (2020) and 5,083 (2025).
  - Payouts: $11.9m (2025).

### Inferences
- MediSave Care's 5,900 users in 2025 are far fewer than the 94,000-plus HCG applicants, although both schemes target people needing help with 3 or more ADLs. This suggests low awareness of MediSave Care, or that its $5,000 minimum balance is binding. Both are untested hypotheses.

### Gaps
- I found no current HCG recipient count at a single point in time, and no 2026 data after the $600 increase.
- I found no take-up data for the CTG, the MDW levy concession, the SMF or CareShield Life claims.
- I found no official awareness survey.
