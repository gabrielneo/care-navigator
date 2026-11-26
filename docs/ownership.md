# Ownership and handover (9.16)

Who keeps Care Navigator correct, what runs by itself, and when to take it down. Written 26 Nov 2026.

## Who owns what

| What | Where | Owner |
|---|---|---|
| Code and data | GitHub `gabrielneo/care-navigator` | Gabriel (repo owner) |
| Hosting | Vercel Hobby, `care-navigator-xi.vercel.app` (a free subdomain; nothing to renew) | Gabriel's Vercel account |
| Reports from families ("Report a problem", accessibility, personal data requests) | neoyikai3@gmail.com (`web/src/lib/report.ts`) | Gabriel |
| Official figures and steps | `data/curated/*.yaml`, checked in `docs/verified/` | Whoever owns the repo |

## What runs by itself

- **Every Monday** the data workflow rebuilds the open data and checks every official page. It fails, and GitHub emails the owner, when a source is past its review date or a page is gone (9.1).
- **Every push** runs the tests in Chromium, WebKit and Firefox, plus the size budget.
- **Every month** Dependabot opens update pull requests. Merge them when CI passes.

## What a person must do

| When | Task | How long |
|---|---|---|
| The Monday run fails | Read the run's summary. Recheck each overdue source on its official page, update the figure and `checked_on`/`next_review` in `source_registry.yaml`, and push | 15 to 60 minutes |
| Every April, and when MOH or AIC announce changes | Recheck fees, subsidy rates and grant amounts (they usually change from 1 April or 1 July) | About 2 hours |
| An email arrives | Reply within a week. If a figure is wrong, fix it with its official source | Varies |
| Dependabot PR | Merge when green; if CI fails, look before merging | 5 minutes |
| A native speaker is available | Have them review a language, then remove its "draft" banner | Their time |

## When to take it down

Take the site down (delete the Vercel project, or replace the planner with a notice pointing to AIC's Care Services
Recommender and the AIC hotline) if any of these holds:

- Any source has been past its review date for **3 months** and nobody has rechecked it.
- The owner can no longer answer emails or fix a wrong figure within a month.
- AIC or MOH asks for it, or launches a tool that does the same job.

A site with wrong subsidies or fees does more harm than no site, because families may plan around the figures.

## Handing it to someone else

1. Transfer the GitHub repo and the Vercel project, or add the new owner to both.
2. Change `REPORT_EMAIL` in `web/src/lib/report.ts`, and the email on the Privacy page follows.
3. Update this page and the owner line in `README.md`.
4. Walk them through `CLAUDE.md` (the rules) and `docs/verified/` (how facts are checked).
