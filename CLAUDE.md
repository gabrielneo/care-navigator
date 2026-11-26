# Care Navigator: notes for coding assistants

- **Source of truth:**
  - `docs/product-design-v2.md` (design and pre-build checklist)
  - `docs/architecture-prompts-v2.md` (build stages)
  - `docs/specs/` (approved specs)
  - `PRODUCT.md`

  The old .docx files are out of date.
- **One build stage at a time:** finish it, run its tests, show the result, and wait for the owner's go-ahead.
- **The owner runs git:** never run `git add`, `git commit` or `git push`.
- **Colours** come only from `docs/brand/tokens.css` (the warm palette). Never use sg-care-capacity's purple.
- **Facts:** never invent fees, waiting times, vacancies or eligibility. Every number needs a `source_id`. Use "estimate" and "may qualify", never "eligible".
- **Next steps and processes:** every step that tells a family what to do, who refers, what comes first or what something unlocks needs the official page that describes that process (`data/curated/next_steps.yaml`, checked in `docs/verified/`). If no official page says it, leave it out or label it "our suggestion".
- **Translations (Chinese, Malay, Tamil drafts):** new or changed wording in the planner goes through `t()` and needs an entry in `web/src/lib/zh.ts`, `ms.ts` and `ta.ts` (the coverage tests enforce this). Keep official scheme names in English, and keep each "draft, not reviewed" banner until a native speaker has reviewed that language. New English wording that says she or her also needs its "he" version in `web/src/lib/he.ts` (a plan can be for Dad; the unit test enforces it).
- **Privacy:** no analytics, tracking or third-party scripts in the prototype. The full postal code never leaves the browser.
