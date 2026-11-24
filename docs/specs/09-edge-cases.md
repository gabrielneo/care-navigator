# 09 · Edge cases

Status: **approved by owner, 25 Nov 2026** · Checklist item 9 · Blocks Stage 3 tests and Stage 5

Each case lists what triggers it, what the screen says, and what the engine does. Every row becomes at least one Vitest or Playwright test.

| # | Case | Trigger | What the screen says | Engine behaviour |
|---|---|---|---|---|
| 1 | Not a citizen or PR | Residency set to "Neither" on screen 5 | "Government subsidies are for Singapore Citizens and PRs. These are full prices." | `withSubsidy` is hidden; `fullPrice` is shown. Grants are hidden except where open to all. |
| 2 | Income above $4,800 per person | Range T5 | "At this income, there's no government subsidy. Both columns show full price." | r = 0. Both columns are equal, so they merge into one column labelled "Full price". The Home Caregiving Grant is hidden; levy concession and MediSave Care stay. |
| 3 | No income, home Annual Value above $21,000 | Income helper: no income + not HDB, and the user confirms | Same message as case 2. | Treated as T5. |
| 4 | Plan with no services | User removes every service on screen 4 | "Your plan is empty. Add a service, or see who to call for advice." Buttons: "Add a service" · "See who to call". | Cost screen is skipped; contacts and the action plan still work. |
| 5 | Two people need care | Shown on the Start screen | "Planning for two people? Make one plan for each, then share both links." | One session = one care recipient. |
| 6 | Quoted fee out of range | Typed fee < $1 or > $10,000 | On blur: "Enter a fee between $1 and $10,000." | Value rejected; the default range is kept. |
| 7 | Quoted fee is $0 | Typed 0 | "If it's free, remove it from your plan instead." | Value rejected. |
| 8 | Sibling split out of range | Split < 1 or > 10 | The stepper stops at 1 and 10. | Clamped. |
| 9 | Postal sector has no centre | Sector 02, 70, 71, 72 or 77 | "We can't place that area. Pick yours below." Then the region picker. | `unavailable` → region centroid. |
| 10 | Postal code isn't 6 digits | On blur | "Enter 6 digits, e.g. 560123." | Not looked up. |
| 11 | Every needs answer is "Not sure" | Screen 3 | "We need a bit more to suggest services." Buttons: "Call the AIC hotline" · "Change answers". | 0 matches; `confirmWithProfessional = true`. |
| 12 | More than 5 rules match | Many answers | Top 5 by rule priority, then "More that may help" (collapsed). | Sorted by `priority`; cut at 5. |
| 13 | "In a nursing home" | Screen 2a | Skips to the nursing-home cost and its questions. | No matching; residential scheme only. |
| 14 | "Recently discharged" | Screen 2a | The hospital branch, minus ward-only services. | `in_hospital` + `discharged = true`, which removes the Interim Caregiver Service. |
| 15 | Born after 1969 | Birth-year toggle | Lower subsidy column; no message needed. | The `sc_after_1969` rates. Rare, since the person would be 56 or younger. |
| 16 | 7 sessions of day care a week | Stepper | Allowed. Note: "Most centres open on weekdays. Check weekend care when you call." | Capped at 7. |
| 17 | Data version older than the site | Shared link `v` ≠ current | Follows checklist item 3. Either "Figures updated on {date}" or "Figures as of {date}". | See spec 10. |
| 18 | Malformed shared link | Hash fails Zod | "We couldn't open that plan. Start again below." | Fresh session. |
| 19 | JavaScript off | — | `<noscript>`: "This planner needs JavaScript. For help, call the AIC hotline on 1800-650-6060." | — |
| 20 | Print with an empty plan | Print button | The print button is disabled with the hint "Add a service to print a plan." | — |
