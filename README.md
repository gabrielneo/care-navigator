# Care Navigator

Helps a family get from "something has happened to Mum" to "we know roughly what care will cost us and exactly who to call", in one sitting, before they talk to the system. It's a static site, built for Singapore family caregivers of older parents.

**Repository:** https://github.com/gabrielneo/care-navigator · **Site:** https://care-navigator-xi.vercel.app

**Status:** an unpublicised prototype. Figures and wording have not yet been reviewed by a care professional. Working name: Caregiver Navigator.

## Where things are

| Path | What |
|---|---|
| `PRODUCT.md` | Product record (users, purpose, constraints) |
| `docs/product-design-v2.md` | Product and solution design, including the pre-build checklist |
| `docs/architecture-prompts-v2.md` | The six build stages |
| `docs/specs/` | Approved specs 06–11 (navigation, legal text, wording, edge cases, data contract, sharing) |
| `docs/adr/` | Architecture decision records |
| `docs/verified/` | Facts checked against official sources, with dates; the source audit and desk evaluation |
| `docs/competitive-landscape.md` | Other tools, what's different here, and what to borrow |
| `docs/requirements-traceability.md`, `docs/assumption-register.md` | Each requirement's evidence and test; what we assume and how well it's supported |
| `docs/brand/` | Colour tokens (warm palette), icons, preview image |
| `docs/wireframes/index.html` | Lo-fi wireframes of every screen |
| `data/curated/` | Hand-curated rules, prices, grants and contacts (YAML; every row has a source) |
| `pipeline/` | Python 3.12 pipeline that validates the YAML and builds the JSON the site reads (Stage 2) |
| `web/` | Next.js static site (Stages 3–5). `web/public/data/` holds the built JSON; `web/vercel.json` the security headers |
| `web/tests/e2e/` | End-to-end, accessibility, print and privacy checks (Stage 6) |
| `.github/workflows/` | `ci` (every push), `data` (weekly data rebuild), `review` (monthly source-review issue) |
| `reports/`, `research_notes/` | The research behind the design |

## Running it

From `web/` (Node 26):

```bash
npm ci
npm test            # engine unit tests
npm run build       # static site into web/out
npm run e2e         # end-to-end checks against web/out (needs the build; first time: npx playwright install chromium)
```

From the repo root (Python 3.12): `python -m pytest pipeline -q` runs the pipeline tests, and `python -m pipeline.build_release` rebuilds `web/public/data/`.

## Ground rules

- No server, no database, and no outside service at run time. Nothing a user enters is stored.
- Every figure traces to a row in `data/curated/source_registry.yaml`, with a `checked_on` date.
- Re-check subsidy, grant and price tables after each February Budget and March Committee of Supply.
