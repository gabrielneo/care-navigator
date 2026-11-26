"""Checks on the curated data and built layers.

blocking() returns errors that stop the build. warnings() returns notes written into manifest.json.
Schema-level checks (types, 0–100 percentages, Singapore bounding box, postal-code format) already ran
when the YAML was loaded into pipeline.schemas.
"""
from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Iterable

from .schemas import Curated, Place

ANSWER_VALUES = {
    "where": {"in_hospital", "changed_at_home", "struggling", "in_nursing_home"},
    "alone": {"weekdays", "most", "no", "unsure"},
    "memory": {"dx", "undx", "no", "unsure"},
    "helper": {"yes", "considering", "no", "unsure"},
    "limits": {"ok", "tired", "cant", "unsure"},
}
MIN_SECTORS = 70
REGIONS = {"central", "north", "northeast", "east", "west"}


def _source_refs(obj: Any, path: str = "") -> Iterable[tuple[str, str]]:
    """Yield (path, source_id) for every key ending in source_id / source_ids."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            here = f"{path}.{k}" if path else k
            if k.endswith("source_id") and isinstance(v, str):
                yield here, v
            elif k == "source_ids":
                for x in v:
                    yield here, x
            else:
                yield from _source_refs(v, here)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from _source_refs(v, f"{path}[{i}]")


def _dupes(ids: list[str]) -> set[str]:
    return {i for i in ids if ids.count(i) > 1}


def blocking(c: Curated) -> list[str]:
    errors: list[str] = []
    sources = {s.source_id for s in c.source_registry.sources}
    tables = c.model_dump(exclude={"source_registry"})

    # 1. Every source reference exists.
    for path, sid in _source_refs(tables):
        if sid not in sources:
            errors.append(f"{path}: unknown source_id '{sid}'")

    # 2. Unique ids.
    for label, ids in [
        ("source_id", [s.source_id for s in c.source_registry.sources]),
        ("service_id", [s.service_id for s in c.service_types.services]),
        ("rule_id", [r.rule_id for r in c.need_rules.rules]),
        ("grant_id", [g.grant_id for g in c.grant_rules.grants]),
        ("contact_id", [x.contact_id for x in c.contacts.contacts]),
        ("apply_id", [r.apply_id for r in c.how_to_apply.routes]),
        ("step_id", [x.step_id for x in c.next_steps.steps]),
    ]:
        for d in _dupes(ids):
            errors.append(f"duplicate {label} '{d}'")

    # 3. Subsidy tiers cover $0 to infinity with no gaps or overlaps, and every scheme has every tier.
    tiers = c.subsidy_tiers.tiers
    if not tiers or tiers[0].pchi_min != 0:
        errors.append("subsidy tiers must start at PCHI $0")
    for a, b in zip(tiers, tiers[1:]):
        if a.pchi_max is None or b.pchi_min != a.pchi_max + 1:
            errors.append(f"subsidy tiers {a.tier_id} → {b.tier_id}: gap or overlap")
    if tiers and tiers[-1].pchi_max is not None:
        errors.append("last subsidy tier must have no upper bound")
    tier_ids = {t.tier_id for t in tiers}
    for s in c.subsidy_tiers.schemes:
        missing = tier_ids - set(s.rates)
        if missing:
            errors.append(f"subsidy scheme {s.scheme}: no rates for {sorted(missing)}")
    for g in c.grant_rules.grants:
        if set(g.amount_by_band) != tier_ids:
            errors.append(f"grant {g.grant_id}: amount_by_band must list exactly {sorted(tier_ids)}")

    # 4. Cross-table keys.
    services = {s.service_id: s for s in c.service_types.services}
    apply_ids = {r.apply_id for r in c.how_to_apply.routes}
    grant_ids = {g.grant_id for g in c.grant_rules.grants}
    priced = {p.service_id for p in c.price_references.prices}
    for s in services.values():
        if s.how_to_apply_id not in apply_ids:
            errors.append(f"service {s.service_id}: unknown how_to_apply_id '{s.how_to_apply_id}'")
        if s.scheme is not None and s.service_id not in priced:
            errors.append(f"service {s.service_id} is subsidised but has no price reference")
    for p in c.price_references.prices:
        if p.service_id not in services:
            errors.append(f"price for unknown service '{p.service_id}'")
        # 5. Prices.
        if p.price_low_sgd > p.price_high_sgd:
            errors.append(f"price {p.service_id}: low {p.price_low_sgd} > high {p.price_high_sgd}")
    for r in c.need_rules.rules:
        if r.service_id not in services:
            errors.append(f"rule {r.rule_id}: unknown service '{r.service_id}'")
        for cl in r.when:
            if cl.in_ is not None and cl.q in ANSWER_VALUES:
                bad = set(cl.in_) - ANSWER_VALUES[cl.q]
                if bad:
                    errors.append(f"rule {r.rule_id}: '{cl.q}' has no answer {sorted(bad)}")
    for gs in c.how_to_apply.grant_steps:
        if gs.grant_id not in grant_ids:
            errors.append(f"grant step for unknown grant '{gs.grant_id}'")
    # Next steps: known services and grants, valid answers, and "after" points to an earlier step.
    seen: set[str] = set()
    for st in c.next_steps.steps:
        for sid in st.plan_any:
            if sid not in services:
                errors.append(f"step {st.step_id}: unknown service '{sid}'")
        for gid in st.grant_any:
            if gid not in grant_ids:
                errors.append(f"step {st.step_id}: unknown grant '{gid}'")
        for cl in st.when:
            if cl.in_ is not None and cl.q in ANSWER_VALUES and set(cl.in_) - ANSWER_VALUES[cl.q]:
                errors.append(f"step {st.step_id}: '{cl.q}' has no answer {sorted(set(cl.in_) - ANSWER_VALUES[cl.q])}")
        if st.after is not None and st.after not in seen:
            errors.append(f"step {st.step_id}: 'after' must name an earlier step, not '{st.after}'")
        seen.add(st.step_id)
    contact_ids = {x.contact_id for x in c.contacts.contacts}
    missing_regions = REGIONS - {r.region_id for r in c.contacts.regions}
    if missing_regions:
        errors.append(f"contacts.yaml regions: missing {sorted(missing_regions)} (the region picker needs all five)")
    for reg in c.contacts.regions:
        for cid in reg.contact_ids:
            if cid not in contact_ids:
                errors.append(f"region {reg.region_id}: unknown contact '{cid}'")
    branches = {b.branch_id for b in c.branch_rules.branches}
    for a in c.branch_rules.answers:
        if a.branch_id not in branches:
            errors.append(f"answer '{a.label}': no branch '{a.branch_id}'")
    return errors


# 9.1: warnings that need a person now. The weekly data run fails on these, so GitHub emails the owner.
ACTION = ("is past its review date", "official page is gone")


def needs_action(warns: Iterable[str]) -> list[str]:
    return [w for w in warns if any(a in w for a in ACTION)]


def warnings(c: Curated, places: list[Place], sector_count: int, today: date,
             url_failures: Iterable[str] = (), urls_gone: Iterable[str] = ()) -> list[str]:
    out: list[str] = []
    for s in c.source_registry.sources:
        if s.next_review < today:
            out.append(f"source {s.source_id} is past its review date ({s.next_review})")
    for x in c.contacts.contacts:
        if (today - x.checked_on) > timedelta(days=90):
            out.append(f"contact {x.contact_id} was last checked {x.checked_on}, over 90 days ago")
    for p in c.price_references.prices:
        for end, conf, sid in [("low", p.low_confidence, p.low_source_id), ("high", p.high_confidence, p.high_source_id)]:
            if conf == "aggregator":
                out.append(f"price {p.service_id} ({end}) comes from an aggregator ({sid}); check the provider's page")
    stale = [pl.place_id for pl in places
             if pl.feature_updated_on and (today - pl.feature_updated_on) > timedelta(days=730)]
    if stale:
        out.append(f"{len(stale)} open-data places were last edited over 24 months ago")
    if sector_count < MIN_SECTORS:
        out.append(f"only {sector_count} postal sectors have a centre (expected at least {MIN_SECTORS}); others use the region picker")
    used = {sid for _, sid in _source_refs(c.model_dump(exclude={"source_registry"}))}
    for s in c.source_registry.sources:
        if s.source_id not in used:
            out.append(f"source {s.source_id} is not referenced by any table")
    for u in url_failures:
        out.append(f"official page did not return HTTP 200 after retries: {u}")
    for u in urls_gone:
        out.append(f"official page is gone (HTTP 404 or 410): {u}")
    return out
