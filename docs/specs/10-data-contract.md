# 10 · Data contract (pipeline ↔ web) and session format

Status: **approved by owner, 25 Nov 2026** · Checklist item 10 · Blocks Stage 3

## One source of truth

The Pydantic models in `pipeline/schemas.py` define every JSON file the site reads.

1. `python -m pipeline.export_schema` writes `web/src/lib/data/schema.json` (a JSON Schema, one definition per file).
2. `json-schema-to-typescript` (a dev dependency, not shipped to users) turns it into `web/src/lib/data/types.ts` during `npm run build`.
3. Two checks catch drift:
   - **pytest:** every file in `web/public/data/` validates against its Pydantic model.
   - **CI:** fails if `schema.json` or `types.ts` differ from what the commands above produce, so the committed copies always match the models.

`tsc` then fails if the engine reads a field that no longer exists.

## Files the site reads (`web/public/data/`)

| File | Top-level shape | Approx. size |
|---|---|---|
| `manifest.json` | `{ dataVersion, builtAt, sources: [{ sourceId, url, checkedOn, nextReview }], files: { name: sha256 }, warnings: [string] }` | < 5 KB |
| `rules.json` | `{ serviceTypes[], needRules[], branchRules[], priceReferences[], subsidyTiers[], grantRules[], howToApply[] }` | < 40 KB |
| `contacts.json` | `[{ contactId, kind, name, address, postalCode, lat, lng, hours, phone?, checkedOn, sourceId }]` | < 10 KB |
| `places.json` | `[{ placeId, kind: "fsc" \| "cc", name, address, postalCode, lat, lng, featureUpdatedOn }]` | < 40 KB |
| `sectors.json` | `{ "<2-digit sector>": { lat, lng, n } }`, plus `regions: { central \| north \| northeast \| east \| west: { lat, lng } }` | < 5 KB |

**Total budget:** under 100 KB gzipped (checklist item 14). The pipeline fails the build if any file grows more than 50% between versions without a matching YAML change.

### Key rules

- **`dataVersion`:** `YYYY.MM.DD-N` (build date plus a counter). It changes whenever any data file's hash changes.
- **Money:** whole Singapore dollars or cents as numbers, never strings. Percentages are integers from 0 to 100.
- **Dates:** ISO `YYYY-MM-DD`.
- **Optional fields:** marked `?` above. Every other field is required, and the pipeline blocks on a missing one.

## Session object (the `p` in the URL hash, spec 06)

```jsonc
{
  "v": "2026.11.25-1",          // dataVersion the plan was made with
  "w": "in_hospital",           // where (branch id)
  "d": false,                   // recently discharged (true drops ward-only services)
  "adl": ["bath", "dress"],     // subset of: bath, dress, eat, toilet, move, transfer; or ["unsure"]
  "med": false,                 // "Medical care at home" card on 2b (not an ADL)
  "al": "weekdays",             // alone: weekdays | most | no | unsure
  "mem": "no",                  // memory: dx | undx | no | unsure
  "hlp": "no",                  // helper: yes | considering | no | unsure
  "lim": "tired",               // limits: ok | tired | cant | unsure
  "loc": { "sec": "56" },       // OR { "reg": "northeast" } — never the full postal code
  "plan": [{ "s": "day_care", "n": 5 }, { "s": "home_personal_care", "n": 2 }],
  "t": "T1",                    // income range
  "r": "sc",                    // residency: sc | pr | none
  "b": "le1969",                // birth year: le1969 | gt1969
  "q": { "day_care": 70 },      // quoted fees (whole dollars), optional
  "x": 3                        // split between n people, 1–10
}
```

- Base64url-encoded JSON, typically 250–350 characters.
- **Zod allowlist:** any unknown key, out-of-range number or string outside the listed values rejects the whole session. Spec 09, case 18 covers what the user sees.
- There is no free-text field anywhere, so nothing a user types can reach the URL except numbers.

## Older shared links (decision 3: option A)

| Option | What happens when `p.v` ≠ current `dataVersion` | Cost |
|---|---|---|
| **A. Recalculate (chosen)** | The plan opens with today's rules and a banner: "Figures updated on {date}. They may differ from when this plan was made." | No extra data to ship. Simple. |
| B. Keep the original rules | The site keeps every past `rules.json` under `/data/archive/{v}/` and loads the one matching `p.v`, with a banner: "Figures as of {date}. Newer rules may apply." | Archive grows with each change. More code and tests. |

Either way, the `v` field is written from day one.
