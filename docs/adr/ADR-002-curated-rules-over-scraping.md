# ADR-002: Curated rules over scraping

Status: accepted · 25 Nov 2026

## Context

Subsidy tables, grants, prices and contacts change a few times a year and need judgement to read (the MOH table hides its $901–$1,500 row in merged cells). The official sites aren't open-licensed and often refuse automated requests.

## Decision

Rules, prices and contacts are typed by hand into `data/curated/*.yaml`. Every row has a `source_id` and a `checked_on` date. Only open-licence data.gov.sg layers are downloaded automatically. MOH tables are copied from the page's raw HTML, never from scraped text, because text scrapers drop merged cells.

## Consequences

Git history is the audit trail. The cost is a manual review after each Budget (February) and Committee of Supply (March), plus a monthly check of contacts and prices.
