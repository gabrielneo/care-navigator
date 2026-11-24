# ADR-001: No backend, no database, no server code

Status: accepted · 25 Nov 2026

## Context

A family planning care for a parent is sharing sensitive facts (health, income, address). Any server that receives them must be secured, maintained and explained in a privacy notice. The product's jobs (match services, add up costs, sort contacts by distance) are deterministic arithmetic over a few small tables.

## Decision

The site is a static Next.js export. Matching and cost run in the browser from JSON files built ahead of time. A shared plan lives only in the URL hash, which is never sent to a server. No database, no API routes, no accounts.

## Consequences

Running cost is about $0 and there is nothing to breach. The trade-off: no saved plans, no server-side analytics, and every data update needs a rebuild.
