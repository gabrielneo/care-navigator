# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (static export, `output: 'export'`), TypeScript and one global stylesheet on the warm palette (no Tailwind), hosted free on Vercel (`care-navigator-xi.vercel.app`) with security headers from `web/vercel.json`. No server code, no database, and no outside service at run time. The data pipeline is Python 3.12 + Pydantic in GitHub Actions. The source is `docs/product-design-v2.md` and `docs/architecture-prompts-v2.md`.

## Users

- **Primary:** the adult child, 45–70 (typically a working 55–65 year old), who manages an older parent's money and usually lives apart from them. They arrive at a trigger moment: most often a hospital admission, sometimes a new dementia diagnosis or a caregiver who can no longer cope. They have one evening, a phone, and no knowledge of the system.
- **Secondary:** spouse caregivers in their 60s–70s, reached mainly through the printed plan; siblings sharing costs, reached by the shared link.
- **Channel:** hospital medical social workers and Active Ageing Centre staff who may send families the link.

## Product Purpose

Help a family get from "something has happened to Mum" to "we know roughly what care will cost us and exactly who to call" in one sitting, before they talk to the system. Success means the family makes one well-prepared call: to the ward social worker, a GP or polyclinic doctor, or an AIC Link.

## Positioning

It is the step after AIC's Care Services Recommender. It turns suggested service types into a weekly plan, a monthly cost range after the 1 Jul 2026 subsidies (with and without subsidy), the nearest people to call, and a printable or WhatsApp-shareable plan. The official tools give none of these (Gate 1 walkthrough, `docs/verified/`). It is a briefing for the conversation with a professional, not a replacement for it, and not a provider directory.

## Operating Context

- **Device:** mostly phones, at night or between work, often in a stressful week.
- **Output:** the plan is printed on one A4 page or sent on WhatsApp to siblings or a social worker.
- **The next step:** the conversation the tool prepares for is with the ward medical social worker, a GP or polyclinic doctor, an AIC Link (9 locations) or the AIC hotline.

## Capabilities and Constraints

- **Flow:** seven screens, one decision per screen. The first question is "Where is Mum right now?", using AIC's answer wording.
- **Cost:** shown as ranges, with subsidy and at full price. Grants and payouts are listed as "may qualify" and never subtracted. Nursing homes get a "from" figure next to real published bills.
- **Privacy:**
  - Income is picked as a range, never typed.
  - The postal code is matched to its 2-digit sector on the phone and never leaves it.
  - The plan lives only in the URL hash.
  - Nothing is stored.
  - The prototype has no analytics.
- **Status:** a prototype that is not publicised. Every page carries a prototype banner and `noindex`. The practitioner review is deferred.
- **Terms:** "estimate" and "may qualify", never "eligible". The AIC hotline is in every footer; 995 is in the footer only.

## Brand Commitments

- **Name:** public name **Care Navigator** (repo `care-navigator`; working name Caregiver Navigator). It is separate from the owner's Care-pacity project (renamed 25 Nov 2026).
- **Visual identity:** its own the warm palette in `docs/brand/tokens.css` (cream paper, espresso text, terracotta actions, sage for reassurance; owner's choice, 25 Nov 2026). It deliberately does not use sg-care-capacity's purple and white, so the planner feels warm and inviting. It uses the system-font plus Charter-serif type pairing. Icons and the preview image are in `docs/brand/`.
- **Independence:** an independent student project, not affiliated with MOH, AIC or the Government of Singapore. No government logos, colours or domains.

## Evidence on Hand

- **Verified facts:** subsidy tables, grants, levy and AIC Link data in `docs/verified/` and `docs/product-design-v2.md`.
- **Draft wording:** questions, service cards, "what to ask" lists, documents and edge cases in `docs/specs/08` and `docs/specs/09`.
- **Absent, and must not be invented:** real provider fees beyond published ranges, vacancies, waiting times newer than 2018 for day or home care, testimonials and user counts.

## Product Principles

1. **Prepare the call, don't replace it.** Every screen moves toward one well-prepared contact with a professional.
2. **Honest numbers.** Ranges, dates and sources beside every figure. Never a promise.
3. **Nothing leaves the phone that doesn't have to.**
4. **Plain words for a tired 60-year-old.** Reading age about 12, one decision per screen.
5. **Start from the situation, not the service catalogue.**

## Accessibility & Inclusion

- **Standard:** WCAG 2.2 AA.
- **Text and targets:** body text at least 18px, tap targets at least 48px, works at 200% zoom.
- **Interaction:** keyboard and screen reader support; no time limits, carousels or hover-only content.
- **Testing:** with at least two people over 65.
- **Language:** English at launch. Mandarin readers are reached through family and the printout.
