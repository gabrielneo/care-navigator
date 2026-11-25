# 07 · Legal and privacy text

Status: **approved by owner, 25 Nov 2026** · Checklist item 7 · Blocks Stage 5

This is draft wording for a student project, not legal advice. Per decision 4, the prototype has no analytics or third-party forms. `[contact email]` is a placeholder for a project inbox you create; don't use a personal address.

---

## Privacy notice (`/privacy`)

**Your privacy**

This site does not collect personal data. That includes names, NRIC numbers, phone numbers and exact income.

**What you enter stays on your device.** Your answers and your plan are kept only in this page's web address. We have no database and store nothing on a server. If you share the link, whoever opens it sees the same answers. Share it only with people you trust.

**Your postal code never leaves your phone.** We use only its first two digits to find the nearest offices. That lookup happens on your device. The shared link keeps only those two digits.

**Income.** We ask you to pick an income range, never an exact amount. The range is used only to work out the estimate on your screen.

**No tracking.** This prototype has no analytics, no tracking scripts and no third-party forms. Like any website host, our host (Vercel) keeps standard technical logs of page requests. Those logs never contain your answers, because your answers stay in the part of the link after the # sign, which browsers don't send to servers.

**Singapore's Personal Data Protection Act (PDPA).** We don't collect personal data, so we hold none to access, correct or delete. Questions: [contact email].

*Last updated: [date]*

> **Before a public launch (decision 4):** if Umami Cloud is added, add this paragraph: "**Page counts.** We count visits and button taps anonymously with Umami, a cookie-free analytics service. It records no names, NRIC numbers or answers. [Where Umami stores data and for how long.]"

---

## Disclaimer (shown on `/privacy`; a short version sits on the cost screen and the printed plan)

**Full version:**

> This is an estimate, not a quote. Prices are published "starting from" fees. Subsidies and grants follow the published government rules on the date shown. Your actual fees depend on the provider, the services you use, and a formal means test and assessment.
>
> This site does not decide eligibility. "May qualify" means the published rules suggest you could. Only the official agency can confirm it.
>
> This is not medical, financial or legal advice. In a medical emergency, call 995. For advice on care services, call the AIC hotline on 1800-650-6060.

**Short version (cost screen, printed plan):**

> Estimate only, based on published rules as of {data date}. Not a quote, an eligibility decision or medical advice.

---

## Independence statement (footer and `/about`)

**Footer:** Independent student project. Not affiliated with MOH, AIC or the Government of Singapore.

**`/about`:**

> Care Navigator is an independent project by a student in Singapore. It is not run by, endorsed by or connected to the Ministry of Health, the Agency for Integrated Care or any government agency. It uses public information and open government data, credited on the Data sources page.
>
> It helps families do the planning before they speak to a doctor, a medical social worker or an AIC Link. It does not replace them.

---

## Data sources page (`/data-sources`)

Generated at build time from `manifest.json` and `source_registry.yaml`. Two sections:

**1. Open data (Singapore Open Data Licence)**: one notice per dataset, in this exact form:

> Contains information from {Dataset name} accessed on {date} from data.gov.sg, which is made available under the terms of the [Singapore Open Data Licence version 1.0](https://data.gov.sg/open-data-licence).

Datasets: Family Services; Community Club / PAssion WaVe; CHAS Clinics; Retail Pharmacy Locations; Dementia Go-To-Points.

**2. Official pages we cite (facts, not reproduced)**: one line per source with the page title, owner, link and "checked on" date. These include the MOH subsidy framework pages (non-residential and residential), AIC service pages and AIC Link locations, CPF (CareShield Life, MediSave Care), HealthHub (ElderFund), MOM (levy), and Together for Better (Home Caregiving Grant).

Footer line on this page: "Use of these sources doesn't mean the agencies endorse this site."
