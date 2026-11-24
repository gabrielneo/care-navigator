# Care-pacity Planner: notes for coding assistants

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
- **Privacy:** no analytics, tracking or third-party scripts in the prototype. The full postal code never leaves the browser.
