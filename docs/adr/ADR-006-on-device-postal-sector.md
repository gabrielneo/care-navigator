# ADR-006: Postal code matched on the device by sector

Status: accepted · 25 Nov 2026

## Context

OneMap's search API requires a token (checked 25 Nov 2026). A token needs an account and a server to hide it, and it would send each user's postal code to a third party.

## Decision

The browser takes the first 2 digits of the postal code (the postal sector) and looks it up in a built-in table of area centres, `sectors.json`. The pipeline builds that table from the postal codes and coordinates of five open data.gov.sg layers (Family Service Centres, Community Clubs, CHAS clinics, pharmacies, Dementia Go-To-Points) plus the curated contacts. It covers 76 of 81 sectors, with centres within about 2 km. An unknown sector falls back to a region picker.

## Consequences

No server, no token, and the full postal code never leaves the phone. The shared link holds only the 2-digit sector. Distance is accurate to the neighbourhood, which is enough to pick the nearest of 9 AIC Links. If street-level distance is ever needed, the upgrade is a token-holding serverless OneMap proxy.
