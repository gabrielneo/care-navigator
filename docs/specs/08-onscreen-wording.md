# 08 · On-screen wording

Status: **approved by owner, 25 Nov 2026** · Checklist item 8 · Blocks Gate 2 review

Rules: reading age about 12; sentences under 20 words; plain words first with the official term in brackets; use "estimate" and "may qualify", never "eligible" or "you will get". Items marked **[Gate 2]** must be checked by the practitioner reviewer before launch.

---

## Screen 2: the questions

**2a · Where is Mum right now?** (we use "Mum" in examples; the label reads "the person you care for")

| Answer label (AIC's wording kept where it exists) | Branch |
|---|---|
| Soon to be discharged from hospital | `in_hospital` |
| Recently discharged from hospital (within 2 weeks) | `in_hospital` |
| Living at home, and something has just changed | `changed_at_home` |
| Living at home, and we're struggling to cope | `struggling` |
| In a nursing home | `in_nursing_home` |
| Not sure | `changed_at_home` + "not sure" flag |

The two hospital answers share one branch. The "recently discharged" answer drops the ward-only services, because those can only be requested from the ward.

**2b · Which of these does she need help with?** Helper text: "Pick all that apply. 'Help' means someone has to assist or watch."

Cards (activities of daily living, ADLs): Washing / bathing · Dressing · Eating · Using the toilet · Walking or moving around · Getting in and out of bed or a chair

Extra card, full width, below the six (added 25 Nov 2026, owner's decision): **Medical care at home** — helper: "Wounds, tubes, injections or many medicines." It suggests home nursing. It is not an activity of daily living, so it never counts toward grants.

Then: None of these · Not sure

**2c · Is she alone for most of the day?** Yes, on weekdays · Yes, most days · No, someone is usually with her · Not sure

**2d · Does she have memory problems?** Helper text: "For example, getting lost, forgetting to eat, or repeating questions." Answers: Yes, diagnosed with dementia · Yes, but not diagnosed · No · Not sure

**2e · Is there a live-in helper?** Helper text: "A migrant domestic worker who lives with her." Answers: Yes · No, but we're thinking about one · No · Not sure

**2f · How are you coping?** Helper text: "Your own limits matter too." Answers: I'm managing · I'm tired and need a break · I can't keep going like this · Not sure

**2g · Postal code** Label: "Postal code". Helper: "6 digits, e.g. 560123. Only the first 2 digits are used, and they stay on your phone." Secondary button: "Skip and pick a region".

---

## Income helper (on screen 5, inline, never a pop-up)

Trigger link: "Not sure which range? Work it out in 3 questions."

1. **Does anyone living at her address earn an income?** Helper: "Count everyone on the NRIC address, including her. Income includes salary, bonuses, allowances and self-employed earnings." Answers: Yes · No
2. **How many people live at her address, including her?** Stepper from 1 to 10.
3. *(If Q1 = Yes)* **Roughly how much do they earn in total each month, before CPF?** The options are worked out from Q2 so that each matches one subsidy range. For 2 people:

   | Option shown | Range it sets |
   |---|---|
   | Up to $3,000 | Up to $1,500 per person |
   | $3,001 – $4,600 | $1,501 – $2,300 |
   | $4,601 – $5,200 | $2,301 – $2,600 |
   | $5,201 – $7,200 | $2,601 – $3,600 |
   | $7,201 – $9,600 | $3,601 – $4,800 |
   | Above $9,600 | Above $4,800 |

   Formula: each boundary is the per-person boundary × household size.

   *(If Q1 = No)* **What type of home is it?** Answers: HDB flat · Condominium or landed property · Not sure. HDB sets the lowest range, marked "likely". Anything else shows: "Without income, subsidy depends on the home's Annual Value. Check it on IRAS, then pick a range." **[Gate 2: confirm HDB flats fall at or below the $21,000 Annual Value line.]**

Result line: "This puts her in range {Tn}: {range} per person. You can change it any time."

---

## Service cards (screen 3) **[Gate 2]**

| Service (official term) | One-line description | Price badge |
|---|---|---|
| Day care centre (Day Care) | A centre where she spends the day with meals, activities and care, while you work. | From $55 a session (a day) before subsidy |
| Day care for dementia (Dementia Day Care) | Day care with staff and activities for people living with dementia. | From $63 a session (a day) before subsidy |
| Help with washing and dressing at home (Home Personal Care) | A trained care worker comes home to help with daily care. | From $25 an hour before subsidy |
| Nurse visits at home (Home Nursing) | A nurse visits to handle wounds, tubes, injections or medicines. | From $62 a visit before subsidy |
| Therapy at home (Home Therapy) | A therapist helps her regain movement and do daily tasks safely at home. | About $125–$160 a visit before subsidy |
| Therapy at a centre (Centre-based Rehabilitation) | Exercise and therapy sessions at a nearby centre to rebuild strength. | About $52–$102 a session before subsidy |
| Escort to appointments (Medical Escort and Transport) | Someone takes her to and from medical appointments. | About $40–$150 a trip before subsidy |
| Meals delivered (Meals on Wheels) | Hot meals brought to her home. | About $5–$7 a meal before subsidy |
| A break for you (Respite care) | Short-term care at a centre or nursing home so you can rest. | About $100–$150 a day before subsidy |
| Activities and company nearby (Active Ageing Centre) | A neighbourhood centre for activities, exercise and befriending. | Usually free or low cost |
| Short-term carer after discharge (Interim Caregiver Service) | A carer at home for the first weeks after discharge. Only the ward team can request it. | Ask the ward's medical social worker |
| Nursing home | Full-time care in a home, for when care at home isn't enough. | From $4,900 a month before subsidy |

The badges always add "before subsidy". "About" marks ranges built from non-AIC sources.

---

## "Why this fits" lines **[Gate 2]**

| Rule (from `need_rules`) | Line shown |
|---|---|
| Alone in the day + needs supervision | "Someone is with her while you're at work." |
| …and memory problems | "Staff trained in dementia care look after her during the day." |
| Help washing, dressing or using the toilet | "A trained carer helps with daily care at home." |
| Wounds, tubes or complex medicines | "A nurse handles the medical care at home." |
| In or recently out of hospital + weaker | "Therapy helps her get back her strength and movement." |
| Can't get to appointments alone | "Someone gets her safely to clinic visits." |
| Can't prepare meals | "Regular meals arrive at her door." |
| Caregiver tired or can't keep going | "You need a break too. This gives you one." |
| Mostly independent but isolated | "Company and activities close to home." |
| In hospital now | "Ask the ward team before she leaves. Some help can only be requested from there." |

---

## "What to ask" lists per branch **[Gate 2]**

**In hospital (ask the ward's medical social worker):**
1. "When is she likely to be discharged?"
2. "Can you refer her for short-term help at home, like the Interim Caregiver Service or Hospital-to-Home?"
3. "Can you start the single assessment and care plan before she leaves?"
4. "Which services can you refer her to from here?" (Name the ones from your plan.)
5. "Can she be assessed for the Home Caregiving Grant?" (Only if she needs help with 3 or more daily activities.)
6. "Who do I call if things go wrong in the first week at home?"

Link: "AIC's discharge tips" → aic.sg Care Services Recommender discharge tips.

**Something just changed at home (ask her GP, a polyclinic doctor or an AIC Link):**
1. "Can you assess what care she needs now?"
2. "Can you refer her for the services in this plan?"
3. "Which subsidy range is she in, and how do we confirm it?"
4. "Is there a waiting list, and what can we use until then?"

**We're struggling (ask an AIC Link or call the AIC hotline):**
1. "What respite care can we get soon?"
2. "Can she go to day care while I work or rest?"
3. "What caregiver support or training is there near us?"
4. "Am I likely to qualify for the Home Caregiving Grant or the Caregivers Training Grant?"

**Already in a nursing home (ask the home's office):**
1. "What will we pay each month after subsidy?"
2. "Can CareShield Life, MediSave Care or ElderFund payouts go straight to you?"
3. "What isn't included in the monthly fee?"

---

## Documents to bring **[Gate 2 — confirm each]**

**Always:**
- Her NRIC
- Your NRIC (as the person arranging care)
- The hospital discharge summary or doctor's memo, if any
- A list of her current medicines

**For the subsidy (means test):**
- A rough idea of household income. Details come from government records, so you usually don't bring payslips unless asked.

**Extra by service:**
- **Day care, home care, rehab:** the doctor's referral or the application made by the hospital or polyclinic.
- **Home Caregiving Grant:** the Functional Assessment Report from an approved assessor, then apply online on AIC's eFASS.
- **Nursing home:** the referral from the hospital or AIC, and any recent medical reports.
- **Helper levy concession:** details of the helper's work permit.

---

## Who to call (screen 6): distances

- Show "About {km} km", rounded to one decimal place.
- If a contact is placed at its area's centre (`precision: sector`, the polyclinics) and is under 1 km away, show "In your area" instead. "0 km" would look broken.

## Action plan headings (screen 7)

"Your plan for {date}" · "Step 1: Call {first contact}" · "What to ask" · "What to bring" · "Estimated monthly cost" · "You may qualify for" · "Split between {n} people" · footer disclaimer (short version from spec 07)
