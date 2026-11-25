# Desk evaluation (Stage 7, 25 Nov 2026)

Care-pacity Planner was evaluated without interviews, usability sessions or a practitioner review (owner's decision, 25 Nov 2026). Instead it was checked against published sources, measured, and reviewed with standard methods. This report is the evidence for the portfolio write-up.

**Bottom line:** every figure and rule now has a published source or is marked as our judgement. The wording meets the plain-language rules on every screen, and the site scores 100 on accessibility. Compared with the official route, the planner isn't much faster to operate (about 1 minute of input against 1.5). Its value is in the output: it produces 7 of 7 things a family needs from this task, while the official route gives 1 fully and 2 only partly.

**What this can't show:** whether real caregivers understand and trust it, or whether a care professional agrees with the advice. Those still need people. The prototype banner says so on every page.

## 1. Source audit

Full table: [source-audit-2026-11-25.md](source-audit-2026-11-25.md). We checked 32 claims against official AIC, MOH, MOM, Age Well SG, Together for Better, THK and SGH pages, read on 25 Nov 2026.

| Verdict | Count | What happened |
|---|---|---|
| Supported | 16 | No change, or the source moved to a more official page |
| Partly supported | 11 | Reworded to match the source |
| Not found | 5 | Removed or replaced; the documents to bring are kept and marked as our judgement |

**Changes that matter to a family:**
- Two prices were wrong. **Respite started at $100** (aggregator), but AIC's own price starts at **$131 a day**. **Meals started at $4.90**, but AIC says **$4**. Four "from" prices now come from AIC instead of aggregators.
- Respite needs a **doctor's referral about 4 weeks ahead**, and each stay is **at least 7 days**. The old plan said "ask how much notice is needed".
- "Short-term help after discharge lasts 2 weeks to 2 months" mixed two programmes. Now: the Interim Caregiver Service gives up to 2 weeks, and Hospital-to-Home programmes up to 2 months.
- "Centre-based rehabilitation" has no official page, so it was removed. Movement problems at home now match home therapy, which has one.
- The claim that **dementia day care** has longer waits had no source and was removed. The note now gives only MOH's nursing-home figures for psychiatric care needs.
- Unsourced reassurances were removed, such as "income details come from government records; payslips only if asked".

## 2. Readability and Lighthouse

**Readability** (automatic test, `web/tests/e2e/readability.e2e.ts`): 17 screens across three scenarios. The test fails any sentence of 20+ words, or a Flesch–Kincaid grade above 8 (about reading age 13).

| Result | |
|---|---|
| Sentences of 20+ words | 0, after shortening one grant condition that was 27 words |
| Highest grade | 7.8, on the memory question ("diagnosed", "dementia") |
| Most screens | Grades 2–6 |

**Lighthouse 13.6** (mobile, slow 4G and a 4× slower CPU, real network throttling):

| Page | Performance | Accessibility | Best practices | Largest content | Layout shift |
|---|---|---|---|---|---|
| Start | 100 | 100 | 100 | 1.5 s | 0 |
| Plan | 100 | 100 | 100 | 1.5 s | 0 |
| Data sources | 100 | 100 | 100 | — | 0 |

SEO scores 66 only because of `noindex`, which is deliberate.

Before this stage, the plan page drew nothing until its JavaScript ran. It had a layout shift of 0.063, and its largest content waited for all the JavaScript. The first question is now in the page's HTML, and a link carrying a saved plan hides it until the plan loads. Lighthouse's default simulated throttling still reports about 85 for the plan page. On a local server everything loads before the first paint, so the simulation assumes the text waited for the JavaScript. The run above uses real network throttling, which shows the text arriving first.

## 3. Cognitive walkthrough

Method: for each screen, ask four questions (Wharton et al.).
1. Will she try to do the right thing?
2. Will she see the control?
3. Will she link the control to her goal?
4. Will she see that it worked?

Three scenarios:
- **Mei:** her mother is about to be discharged after a fall, needs help washing and dressing, and is alone on weekdays.
- **Mr Tan:** his wife has dementia, and he is at breaking point.
- **A family whose mother is in a nursing home.**

| Screen | Mei | Mr Tan | Nursing home |
|---|---|---|---|
| Start, questions 1–6 | ✓ One question per screen, a progress count, Next always visible, an inline message if nothing is picked | ✓ | ✓ Skips to cost |
| Postal code | ✓ It says only 2 digits are used | ✓ "Skip and pick a region" is visible | — |
| Matches | ✓ Each card says why it fits | **Fixed:** "Respite care (nursing home respite)" sat inside brackets in the heading. Now AIC's name, "Nursing Home Respite Care" | — |
| Week | ~ Home care is laid out on Sat and Sun because day care fills Mon–Fri; this could read as weekend visits (open) | **Fixed:** respite led his matches, then vanished from the week and cost unexplained. A note now says it's booked as a stay of 7+ days | — |
| Cost | ~ About 3 phone screens long (open) | ✓ | **Fixed:** before income was picked, it said "0% residential subsidy" as if that were a fact. Now: "before subsidy, pick her income range…" |
| Who to call | ✓ Ward social worker first, distances say they're approximate | ✓ Region-based | — |
| Action plan | ✓ | ✓ | **Fixed:** "If you need help later: the AIC hotline…" started in lower case when there was no nearby AIC Link |

## 4. Heuristic review (Nielsen's 10)

Severity uses Nielsen's scale: 0 none, 1 cosmetic, 2 minor, 3 major, 4 catastrophe.

| Heuristic | Finding | Severity | Status |
|---|---|---|---|
| 1. Visibility of status | "Question n of 7", a loading message while places load, a banner for updated or damaged links | 0 | — |
| 2. Match with the real world | Plain names with the official term in brackets. The week view puts home care on weekends because of layout order | 2 | Open |
| 3. User control | Back keeps answers, "Change answers" keeps the plan, every step has its own link | 0 | — |
| 4. Consistency | "Print plan" and "Save as PDF" open the same print dialog | 1 | Kept: phone users look for "PDF" |
| 5. Error prevention | A subsidy figure was shown before income was known (nursing home) | 3 | **Fixed** |
| 6. Recognition over recall | Answers are restored; the income helper replaces recalling the household income per person | 0 | — |
| 7. Flexibility | Skip the postal code, an income helper, your own quotes, add or remove services | 0 | — |
| 8. Minimalist design | The cost screen is about 3 phone screens; source lines add length | 2 | Open: start per-service lines collapsed |
| 9. Error recovery | Inline messages don't blame the user, and every one says what to do | 0 | — |
| 10. Help | "How is this worked out", sources and dates on every figure, the AIC hotline in every footer | 0 | — |

## 5. Before and after: the Gate 1 task

**Task (from the design):** "Your mother is in hospital after a fall, needs help washing, and is alone on weekdays. Find suitable services, an estimated monthly cost and your first step."

**Method:** Keystroke-Level Model (Card, Moran and Newell), with these times:
- point and tap: 1.3 s
- key: 0.28 s
- hand to keyboard: 0.4 s
- mental step: 1.35 s
- page load: 1.5 s for the planner (measured by Lighthouse), 2 s each for official pages (assumed)

The planner's counts come from Mei's automated journey. The official counts are **estimates** built from the Gate 1 walkthrough record of AIC's Care Services Recommender, plus the pages needed to work out cost and find an AIC Link. They aren't a timed session. KLM leaves out reading time, which favours the official route: it has more and longer pages to read.

| | Official sites | Planner |
|---|---|---|
| Taps | 36 | 27 |
| Keystrokes | 38 (income, a calculator) | 6 (postal code) |
| Mental steps | 16 | 13 |
| Page loads | 6 | 1 |
| **Estimated input time** | **about 1.5 min** | **about 1 min** |

**What each route produces:**

| Output the family needs | Official sites | Planner |
|---|---|---|
| Services that may fit | ✓ (a long list of schemes and services) | ✓ (up to 5, each with a reason) |
| Monthly cost with subsidy | ~ Only by hand: find each "from" price, find the subsidy %, then calculate | ✓ Range, by service |
| Full price for comparison | ✗ | ✓ |
| Who to call first | ✗ (a generic "speak to someone") | ✓ Depends on her situation |
| What to ask, what to bring | ~ General discharge tips | ✓ Ask list and documents |
| Nearest contacts | ✗ | ✓ With distances |
| A plan to share or print, cost split | ✗ | ✓ |

**Reading:** operating the planner is only somewhat faster. The difference is that the official route can't produce most of what the task asks for, at any speed.

## 6. Still open

1. **The cost screen is long** (about 3 phone screens). The next step is to collapse each service's lines by default. Testing with users should decide this; without them it's a judgement call.
2. **Week layout:** home care appears on Sat and Sun after a full week of day care. One fix is to fill the week by service type, not in order.
3. **Prices:** aggregators still set the upper end of the range for 5 services.
4. **The documents to bring** are our judgement; no official list exists.
5. **Untested:** real caregivers, a professional's review, WhatsApp's in-app browser, iPhone Safari printing and screen readers.
