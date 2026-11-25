# Competitive landscape and what to borrow (26 Nov 2026)

Who else helps Singapore families plan care, where Care Navigator is different, and which ideas to adopt. Features marked **checked** were read on the tool's own page or a news report on 26 Nov 2026; **not verified** means the page wouldn't load and the description comes from the owner's research notes.

## The tools

| Tool | Run by | Cost estimate | Who to call / next steps | Access | Status |
|---|---|---|---|---|---|
| **Care Services Recommender** (aic.sg) | AIC | None | Lists services, schemes and discharge tips; "apply separately"; generic "speak to someone" | Open web, no login | Checked (Gate 1 walkthrough, 25 Nov; page re-read 26 Nov) |
| **CarePal** (in the NHG Health app) | Tan Tock Seng Hospital, NHG Health ("Project Carer Matters 2") | A "caregiving calculator" for total caregiving costs; the method, period and whether subsidies apply aren't published | Resources on financial help, day care, hotlines and future planning; no specific apply steps found | App download; Singpass or guest | Checked via an Ageless Online report (16 Sep 2025) |
| **CareCompass** (carecompass.sg) | Build for Good 2024 team (Government of Singapore) | None found | 3 top recommendations from stated preferences, an AI chatbot trained on Dementia Singapore and AIC material, a planned hand-off to CREST outreach teams | Not stated | Checked (build.gov.sg page, updated 30 Jul 2026); for new caregivers of people with dementia only |
| **SupportGoWhere** | GovTech | None for care | Personalised recommendations and eligibility checks across all government support; apply directly | Web; Singpass for applying | Not verified (page renders by script; developer page didn't resolve) |
| **My Aged Care** (Australia) | Australian Government | Fee estimator | Eligibility checker, find a provider, help explorer | Web | Not verified (pages timed out) |
| **Which? Later Life Care** (UK) | Which? | Cost and eligibility checker | Step-by-step guides | Free | Not verified (site didn't resolve) |
| **Legal & General care hub** (UK) | Insurer | Care costs calculator, "five short steps" (only step 1 readable) | Jump links, "questions to ask" lists for home care and care homes, "start with a free local authority assessment" | Web; calculator open | Checked |

## Where Care Navigator is different

Based on what we could check:

1. **Cost and next steps in one place.** It is the only Singapore tool found that gives a monthly cost range after the 1 Jul 2026 subsidies, with and without subsidy, and also the first person to call, what to ask and what to bring. AIC's Recommender has no cost. CarePal has a calculator, but inside a hospital-cluster app, and its method isn't published. CareCompass covers dementia only and gives no cost.
2. **No app, no login, nothing stored.** One anonymous session in the browser. Income is a range, never an exact figure, and the postal code stays on the phone. CarePal needs an app download, and AIC's Recommender asks for exact income.
3. **Every figure sourced and dated.** Each price, rate and grant links to its official page and the date it was checked, enforced by automated tests. None of the other tools shows that.
4. **Made for the first, panicked week.** Its first question uses AIC's own wording, and the plan is ordered around the next call. It's one page to print, send on WhatsApp or split between siblings.
5. **Honest about limits.** It says "estimate" and "may qualify", shows the prototype banner, and never subtracts grants from the cost.

**Where others are stronger:**
- AIC and SupportGoWhere are official and can lead to applications.
- CareCompass has a conversational fallback.
- CarePal has peer befriending and a caregiver well-being check.

Care Navigator shouldn't try to match those. It should hand off to them clearly.

## What to borrow, and how to do it better

| From | Idea | How Care Navigator would do it | To-do |
|---|---|---|---|
| AIC Recommender | Three levels of help for each daily activity | "Some help" or "can't do it at all", so payouts that need severe disability are only shown when they apply | 8.1 |
| AIC Recommender | Medical conditions (fall, stroke, hip fracture, dementia, end of life) | One optional question; each condition changes the matches, with a sourced reason shown | 8.7 |
| AIC Recommender | Mobility (walking, wheelchair, bedbound) | Folded into the activities question; decides whether centre care and which transport make sense | 8.7 |
| AIC Recommender | Future planning (will, LPA, advance care plan) | An "Also worth doing" list with official links, ordered by urgency | 8.9 |
| AIC Recommender | Pioneer Generation questions | Pioneer Generation Disability Assistance Scheme ($100 a month, some assistance with 3 activities; AIC page) on the grants list | 8.1 |
| CarePal | Caregiver well-being check | A "For you" section built on the existing "How are you coping?" answer: respite timing, training grant, support groups. No scored questionnaire, since validated scales are licensed. | 8.8 |
| CarePal | Care profile that shapes the content | Already "Her plan so far"; extend it into the handover summary | 8.4 |
| CarePal | Peer support | Link to official caregiver support groups (source to be checked) | 8.8 |
| CareCompass | Start with the top 3 recommendations | Show the top 3 first and put the rest under "More that may help" (today up to 5) | 8.10 |
| CareCompass | Hand-off to dementia outreach (CREST) | Add CREST to the contacts for memory problems, once sourced | 8.7 |
| CareCompass / AIC | Official-site and scam guidance | A short note: "We never ask for your NRIC, bank details or Singpass" | 8.10 |
| AIC scheme pages | Key criteria up front with ticks; FAQ accordions; one clear "Apply" button | For each grant: criteria as a short ticked list, and a link to the official application (e.g. AIC's eFASS) | 8.5 |
| Legal & General | "Questions to ask" lists for providers | When you call a day care centre or home care provider: fees after subsidy, waiting list, transport, trial day | 8.3 |
| Legal & General | Jump links on long pages | A small "On this page" list at the top of the cost screen | 8.10 |
| My Aged Care (not verified) | Eligibility check before the fee estimate | Already the flow: answers, then matches, then cost; keep it | none |
| Which? (not verified) | Step-by-step guides | The ordered timeline with dependencies | 8.2 |
| SupportGoWhere (not verified) | Apply directly | Out of scope: Care Navigator never applies on a family's behalf; it links to the official application | none |

## What not to copy

- **Accounts, app downloads or Singpass.** They break the "nothing stored, one sitting" promise.
- **An AI chatbot.** Answers can't be sourced and dated the way every figure is now, and it would need an outside service.
- **Provider directories with ratings or upsells** (as on Legal & General). The site stays independent and doesn't rank providers.
- **Exact income.** The income range is enough for an estimate, and it's kinder to ask.
