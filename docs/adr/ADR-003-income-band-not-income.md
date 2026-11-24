# ADR-003: Income as a band, not a number

Status: accepted · 25 Nov 2026

## Context

Subsidy depends on household income per person (PCHI). Asking for an exact income is intrusive, and the product only needs to know which of 6 bands applies.

## Decision

Users pick a PCHI band (T0–T5). A 3-question helper works it out from household size and a rough total income range, never an exact amount. If no one earns, the helper uses the home's Annual Value.

## Consequences

Exact income never enters the system, so the shared link can't leak it. The estimate is band-accurate, not to the dollar, which suits an estimate.
