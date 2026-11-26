"""9.8: a public log of what changed in each data version, so someone reopening an old plan sees why its figures moved.
Figures (prices, subsidy rates, income ranges, grant amounts) are compared one by one; other changes get one line."""
from __future__ import annotations

from datetime import date
from typing import Any

KEEP = 60          # entries kept; older ones drop off


def figures(rules: dict[str, Any]) -> dict[str, str]:
    """Every figure a family sees, keyed by a plain label, formatted for reading."""
    names = {s["serviceId"]: s["name"] for s in rules["serviceTypes"]}
    out: dict[str, str] = {}
    for p in rules["priceReferences"]["prices"]:
        n = names.get(p["serviceId"], p["serviceId"])
        out[f"{n}: price per {p['unit']}, low end"] = f"${p['priceLowSgd']:g}"
        out[f"{n}: price per {p['unit']}, high end"] = f"${p['priceHighSgd']:g}"
    for sch in rules["subsidyTiers"]["schemes"]:
        for tier, rates in sch["rates"].items():
            for who, pct in rates.items():
                out[f"Subsidy ({sch['scheme'].replace('_', '-')}), {tier}, {who}"] = f"{pct}%"
    for t in rules["subsidyTiers"]["tiers"]:
        hi = f"${t['pchiMax']:,}" if t["pchiMax"] is not None else "and above"
        out[f"Income range {t['tierId']} (per person a month)"] = f"${t['pchiMin']:,} to {hi}"
    for g in rules["grantRules"]:
        for band, amt in (g.get("amountByBand") or {}).items():
            out[f"{g['name']}, {band}"] = f"${amt:g}"
    return out


def entry(old: dict[str, Any] | None, new: dict[str, Any], version: str, today: date,
          rules_changed: bool, places_changed: bool) -> dict[str, Any]:
    lines: list[str] = []
    if old is not None:
        a, b = figures(old), figures(new)
        lines += [f"{k}: {a[k]} → {b[k]}" for k in b if k in a and a[k] != b[k]]
        lines += [f"Added: {k}, {b[k]}" for k in b if k not in a]
        lines += [f"Removed: {k}" for k in a if k not in b]
    if rules_changed and not lines:
        lines.append("Wording, sources or rules changed; no figures changed.")
    if places_changed:
        lines.append("Places and contacts updated from open data.")
    return {"version": version, "date": today.isoformat(), "changes": lines}


def add(log: list[dict[str, Any]], e: dict[str, Any]) -> list[dict[str, Any]]:
    return ([e] + [x for x in log if x["version"] != e["version"]])[:KEEP]
