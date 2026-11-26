"""Build the JSON files the site reads, from the curated YAML and five open data.gov.sg layers.

    python -m pipeline.build_release              download layers, validate, write web/public/data/
    python -m pipeline.build_release --offline    reuse the snapshots already in data/raw/
    python -m pipeline.build_release --check-urls also check every official page answers HTTP 200 (warnings only)

Exit code 1 means a blocking check failed and nothing was written.
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Optional

import yaml

from . import changes, validate
from .schemas import (
    ContactsBundle, Curated, Manifest, ManifestSource, Place, RegionCentre, RulesBundle, SectorCentre, Sectors,
)

ROOT = Path(__file__).resolve().parent.parent
CURATED = ROOT / "data" / "curated"
RAW = ROOT / "data" / "raw"
OUT = ROOT / "web" / "public" / "data"

API = "https://api-open.data.gov.sg/v1/public/api/datasets/{id}/poll-download"
USER_AGENT = "care-navigator-pipeline/1.0"
# name: (dataset id, postal-code field, becomes a "nearest place"?)
LAYERS = {
    "fsc": ("d_add23c06f7267e799185c79ccaa2099b", "ADDRESSPOSTALCODE", True),
    "cc": ("d_9de02d3fb33d96da1855f4fbef549a0f", "ADDRESSPOSTALCODE", True),
    "chas": ("d_548c33ea2d99e29ec63a7cc9edcccedc", "POSTAL_CD", False),
    "pharm": ("d_bb92615f43de22933e4479558b1f6c36", "POSTAL_CODE", False),
    "dgtp": ("d_e2d10e591bc8560b8946a0da24790fa5", "POSTAL_CODE", False),
}
SG_BOX = (1.15, 1.48, 103.6, 104.1)
GZIP_BUDGET = 100_000          # bytes, all data files together (checklist item 14)
# The "Community Club / PAssion WaVe" layer also holds sea-sports clubs and clubs still under construction.
# Neither is somewhere to send a family; "(Temp Office)" entries stay, since that's where those clubs operate now.
NOT_A_CC = re.compile(r"PAssion WaVe|\(U/C\)", re.IGNORECASE)
GROWTH_LIMIT = 1.5             # a file may not grow >50% between builds unless the curated YAML changed


# ---------- loading ----------
def load_curated(directory: Path = CURATED) -> Curated:
    tables = {p.stem: yaml.safe_load(p.read_text()) for p in sorted(directory.glob("*.yaml"))}
    return Curated(**tables)


def curated_hash(directory: Path = CURATED) -> str:
    h = hashlib.sha256()
    for p in sorted(directory.glob("*.yaml")):
        h.update(p.name.encode() + b"\0" + p.read_bytes())
    return h.hexdigest()


# ---------- downloading ----------
def _get(url: str, tries: int = 5) -> bytes:
    """GET with backoff. data.gov.sg allows 2 unauthenticated downloads per 10 seconds and answers 429 above that."""
    for attempt in range(tries):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < tries - 1:
                time.sleep(6 * (attempt + 1))
                continue
            raise
    raise RuntimeError(f"gave up on {url}")


def fetch_layer(name: str, raw_dir: Path = RAW) -> Path:
    dataset_id = LAYERS[name][0]
    meta = json.loads(_get(API.format(id=dataset_id)))
    url = meta["data"]["url"]
    body = _get(url)
    raw_dir.mkdir(parents=True, exist_ok=True)
    path = raw_dir / f"{name}.geojson"
    path.write_bytes(body)
    (raw_dir / f"{name}.meta.json").write_text(json.dumps({
        "dataset_id": dataset_id,
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "sha256": hashlib.sha256(body).hexdigest(),
    }, indent=2))
    time.sleep(6)
    return path


# ---------- transforming ----------
def _clean(v) -> Optional[str]:
    if v is None:
        return None
    s = str(v).strip()
    return None if s in ("", "None", "NIL", "null") else s


def _in_sg(lat: float, lng: float) -> bool:
    return SG_BOX[0] <= lat <= SG_BOX[1] and SG_BOX[2] <= lng <= SG_BOX[3]


def _address(p: dict) -> str:
    blk, street = _clean(p.get("ADDRESSBLOCKHOUSENUMBER")), _clean(p.get("ADDRESSSTREETNAME"))
    floor, unit = _clean(p.get("ADDRESSFLOORNUMBER")), _clean(p.get("ADDRESSUNITNUMBER"))
    building = _clean(p.get("ADDRESSBUILDINGNAME"))
    parts = [" ".join(x for x in (blk, street) if x)]
    if floor and unit:
        parts.append(f"#{floor.zfill(2)}-{unit}")
    if building:
        parts.append(building)
    return ", ".join(x for x in parts if x)


def _updated(p: dict) -> Optional[date]:
    v = _clean(p.get("FMEL_UPD_D"))
    return datetime.strptime(v[:8], "%Y%m%d").date() if v and re.fullmatch(r"\d{8,14}", v) else None


def read_layer(path: Path, postal_field: str) -> list[tuple[str, float, float, dict]]:
    """Return (postal_code, lat, lng, properties) for every feature with a valid code inside Singapore."""
    rows = []
    for f in json.loads(path.read_text())["features"]:
        p = f["properties"]
        pc = _clean(p.get(postal_field))
        lng, lat = f["geometry"]["coordinates"][:2]
        if pc and re.fullmatch(r"\d{6}", pc) and _in_sg(lat, lng):
            rows.append((pc, lat, lng, p))
    return rows


def build_places(layers: dict[str, list]) -> list[Place]:
    places = []
    for kind in ("fsc", "cc"):
        for pc, lat, lng, p in layers.get(kind, []):
            name = _clean(p.get("NAME"))
            if not name or NOT_A_CC.search(name):
                continue
            places.append(Place(place_id=f"{kind}_{_clean(p.get('OBJECTID')) or pc}", kind=kind, name=name,
                                address=_address(p) or pc, postal_code=pc, lat=round(lat, 6), lng=round(lng, 6),
                                feature_updated_on=_updated(p)))
    return sorted(places, key=lambda x: x.place_id)


def build_sectors(layers: dict[str, list], c: Curated) -> Sectors:
    pts: dict[str, list[tuple[float, float]]] = {}
    for rows in layers.values():
        for pc, lat, lng, _ in rows:
            pts.setdefault(pc[:2], []).append((lat, lng))
    for x in c.contacts.contacts:
        if x.location_precision == "exact":   # sector-placed contacts would only echo the centre back
            pts.setdefault(x.postal_code[:2], []).append((x.lat, x.lng))
    sectors = {s: SectorCentre(lat=round(sum(p[0] for p in v) / len(v), 5),
                               lng=round(sum(p[1] for p in v) / len(v), 5), n=len(v))
               for s, v in sorted(pts.items())}
    by_id = {x.contact_id: x for x in c.contacts.contacts}
    regions = {}
    for r in c.contacts.regions:
        members = [by_id[i] for i in r.contact_ids]
        regions[r.region_id] = RegionCentre(label=r.label,
                                            lat=round(sum(m.lat for m in members) / len(members), 5),
                                            lng=round(sum(m.lng for m in members) / len(members), 5))
    return Sectors(sectors=sectors, regions=regions)


# ---------- writing ----------
def _json(model_or_list) -> bytes:
    if isinstance(model_or_list, list):
        data = [m.model_dump(mode="json", by_alias=True) for m in model_or_list]
    else:
        data = model_or_list.model_dump(mode="json", by_alias=True)
    return (json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n").encode()


def check_urls(c: Curated) -> tuple[list[str], list[str]]:
    """(pages that didn't answer 200, pages that are gone). Gone means 404 or 410, so a person must act; other
    failures are often a government site refusing automated requests."""
    urls = sorted({s.url for s in c.source_registry.sources} | {g.official_url for g in c.grant_rules.grants})
    failures, gone = [], []
    for u in urls:
        ok, code = False, 0
        for _ in range(2):
            try:
                req = urllib.request.Request(u, headers={"User-Agent": USER_AGENT})
                with urllib.request.urlopen(req, timeout=20) as r:
                    ok = r.status == 200
                    break
            except urllib.error.HTTPError as e:
                code = e.code
                if code in (404, 410):
                    break
                time.sleep(2)
            except Exception:
                time.sleep(2)
        if not ok:
            (gone if code in (404, 410) else failures).append(u)
    return failures, gone


def next_version(previous: Optional[Manifest], today: date) -> str:
    stamp = today.strftime("%Y.%m.%d")
    if previous and previous.data_version.startswith(stamp + "-"):
        return f"{stamp}-{int(previous.data_version.rsplit('-', 1)[1]) + 1}"
    return f"{stamp}-1"


def build(offline: bool = False, check: bool = False, today: Optional[date] = None,
          curated_dir: Path = CURATED, raw_dir: Path = RAW, out_dir: Path = OUT) -> int:
    today = today or date.today()
    c = load_curated(curated_dir)
    errors = validate.blocking(c)
    if errors:
        print("Blocking errors, nothing written:", *errors, sep="\n  - ", file=sys.stderr)
        return 1

    layers = {}
    for name, (_, postal_field, _) in LAYERS.items():
        path = raw_dir / f"{name}.geojson"
        if not offline:
            print(f"downloading {name} …")
            path = fetch_layer(name, raw_dir)
        if not path.exists():
            print(f"Blocking: no snapshot for {name} in {raw_dir}; run without --offline first.", file=sys.stderr)
            return 1
        layers[name] = read_layer(path, postal_field)

    places = build_places({k: v for k, v in layers.items() if LAYERS[k][2]})
    sectors = build_sectors(layers, c)
    files = {
        "rules.json": _json(RulesBundle(
            service_types=c.service_types.services, need_rules=c.need_rules.rules, branch_rules=c.branch_rules,
            price_references=c.price_references, subsidy_tiers=c.subsidy_tiers, grant_rules=c.grant_rules.grants,
            how_to_apply=c.how_to_apply, next_steps=c.next_steps.steps)),
        "contacts.json": _json(ContactsBundle(contacts=c.contacts.contacts, hotline=c.contacts.hotline)),
        "places.json": _json(places),
        "sectors.json": _json(sectors),
    }
    hashes = {k: hashlib.sha256(v).hexdigest() for k, v in files.items()}
    sizes = {k: len(gzip.compress(v, mtime=0)) for k, v in files.items()}

    prev_path = out_dir / "manifest.json"
    previous = Manifest.model_validate_json(prev_path.read_text()) if prev_path.exists() else None
    chash = curated_hash(curated_dir)

    total = sum(sizes.values())
    if total > GZIP_BUDGET:
        print(f"Blocking: data files are {total} bytes gzipped, over the {GZIP_BUDGET} budget.", file=sys.stderr)
        return 1
    if previous and previous.curated_hash == chash:
        grown = [k for k, s in sizes.items() if k in previous.sizes and s > previous.sizes[k] * GROWTH_LIMIT]
        if grown:
            print(f"Blocking: {grown} grew over 50% with no curated change; check the open-data snapshots.",
                  file=sys.stderr)
            return 1

    url_failures, urls_gone = check_urls(c) if check else ([], [])
    warns = validate.warnings(c, places, len(sectors.sectors), today, url_failures, urls_gone)

    if previous and previous.files == hashes and previous.warnings == warns:
        print(f"No change. Data version stays {previous.data_version}.")
        return 0

    # Only a change in the data files bumps the version: shared links show "Figures updated" when it changes.
    same_data = previous is not None and previous.files == hashes
    manifest = Manifest(
        data_version=previous.data_version if same_data else next_version(previous, today),
        built_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        curated_hash=chash,
        sources=[ManifestSource(**s.model_dump(include={"source_id", "title", "url", "licence", "checked_on",
                                                        "next_review"})) for s in c.source_registry.sources],
        files=hashes, sizes=sizes, warnings=warns,
    )
    out_dir.mkdir(parents=True, exist_ok=True)
    if not same_data:                                   # 9.8: say what changed in this data version
        old_rules = json.loads((out_dir / "rules.json").read_text()) if (out_dir / "rules.json").exists() else None
        changed = lambda k: previous is None or previous.files.get(k) != hashes[k]
        log_path = out_dir / "changes.json"
        log = json.loads(log_path.read_text()) if log_path.exists() else []
        e = changes.entry(old_rules, json.loads(files["rules.json"]), manifest.data_version, today,
                          rules_changed=changed("rules.json"),
                          places_changed=any(changed(k) for k in ("places.json", "contacts.json", "sectors.json")))
        log_path.write_text(json.dumps(changes.add(log, e), ensure_ascii=False, indent=1) + "\n")
    for name, body in files.items():
        (out_dir / name).write_bytes(body)
    (out_dir / "manifest.json").write_bytes(
        (json.dumps(manifest.model_dump(mode="json", by_alias=True), ensure_ascii=False, indent=1) + "\n").encode())

    print(f"Data version {manifest.data_version}: {len(places)} places, {len(sectors.sectors)} sectors, "
          f"{len(c.contacts.contacts)} contacts, {total} bytes gzipped.")
    for w in warns:
        print(f"  warning: {w}")
    return 0


def main(argv: Optional[list[str]] = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--offline", action="store_true", help="reuse data/raw snapshots instead of downloading")
    ap.add_argument("--check-urls", action="store_true", help="check official pages answer HTTP 200 (warnings only)")
    ap.add_argument("--today", type=date.fromisoformat, help="pretend today is this date (for tests)")
    a = ap.parse_args(argv)
    return build(offline=a.offline, check=a.check_urls, today=a.today)


if __name__ == "__main__":
    sys.exit(main())
