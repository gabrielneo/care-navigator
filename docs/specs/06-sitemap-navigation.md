# 06 · Sitemap and navigation

Status: **approved by owner, 25 Nov 2026** · Checklist item 6 · Blocks Stage 5

## Routes

| Route | What it is | Notes |
|---|---|---|
| `/` | Start screen (screen 1) | One button: "Start planning". Links to About and Privacy. |
| `/plan` | The wizard (screens 2–7) | One page. The current step and all answers live in the URL hash. |
| `/about` | What this is, who made it, independence statement | Text from spec 07. |
| `/privacy` | Privacy notice and disclaimer | Text from spec 07. |
| `/data-sources` | Every dataset and official page used, with dates and licence notices | Generated from `manifest.json` and `source_registry`. |
| `404` | Not found | "We can't find that page." Buttons: "Start planning" and "Go to home". |

Every route is a static file from `next build` with `output: 'export'`. There are no API routes.

## Footer (every page)

- AIC hotline 1800-650-6060 (Mon–Fri 8.30am–8.30pm, Sat 8.30am–4pm)
- 995 for medical emergencies
- "Independent student project. Not affiliated with MOH, AIC or the Government of Singapore."
- Links: About · Privacy · Data sources. (No feedback link in the prototype: decision 4.)

**Prototype banner (top of every page, until a public launch):** "Prototype for testing. Figures and wording have not yet been checked by a care professional."

## Steps inside `/plan`

| Step id | Screen | Can be skipped? |
|---|---|---|
| `where` | 2a · Where is Mum right now? | No |
| `adl` | 2b · Daily activities (6 cards) | "Not sure" allowed |
| `alone` | 2c · Alone in the day | "Not sure" allowed |
| `memory` | 2d · Memory problems | "Not sure" allowed |
| `helper` | 2e · Live-in helper | "Not sure" allowed |
| `limits` | 2f · Your own limits | "Not sure" allowed |
| `postal` | 2g · Postal code or region | Yes ("Skip and pick a region") |
| `matches` | 3 · Your matches | — |
| `week` | 4 · Build your week | — |
| `cost` | 5 · Monthly cost | — |
| `contacts` | 6 · Who to call | — |
| `action` | 7 · Your action plan | — |

The `in_nursing_home` answer jumps from `where` straight to `cost`, which shows the nursing-home figure, and then to `action`.

## URL hash format

```
/plan#s=<stepId>&p=<base64url JSON>
```

`p` is the session object defined in spec 10, carrying its own data version `v`. `s` is kept outside `p` so a person can read which step a link opens.

## Browser behaviour

| Action | What happens |
|---|---|
| Next / answering a step | `history.pushState` with the new hash. Each step is one history entry. |
| Changing an answer on the same step (e.g. a stepper) | `history.replaceState`. Small edits don't fill up history. |
| Browser Back | Goes to the previous step with every answer kept. From the first step, it returns to `/`. |
| Refresh | Restores the same step and answers from the hash. Nothing is lost. |
| Opening a link at a step later than its answers support | Jumps to the first step that still needs an answer. |
| Opening a shared link (`s=action`) | Shows the action plan read-only, with a "Change answers" button that goes to `where`. |
| Malformed or tampered hash | Starts fresh at `where` with a banner: "We couldn't open that plan. Start again below." |
| Hash from an older data version | Follows the decision in checklist item 3 (spec 10 has both options). |

## Not included

- No accounts, no saved plans and no server routes.
- No step-specific path URLs such as `/plan/cost`. They would need server routing or duplicate pages.
