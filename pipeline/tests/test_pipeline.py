"""Pipeline tests. Run: .venv/bin/python -m pytest pipeline -q"""
from __future__ import annotations

import copy
import json
import shutil
from datetime import date
from pathlib import Path

import pytest
import yaml
from pydantic import ValidationError

from pipeline import build_release as br
from pipeline import validate
from pipeline.schemas import Curated, Manifest

CURATED = br.CURATED


def tables() -> dict:
    return {p.stem: yaml.safe_load(p.read_text()) for p in sorted(CURATED.glob("*.yaml"))}


def blocking_for(t: dict) -> list[str]:
    return validate.blocking(Curated(**t))


# ---------- the real curated data ----------
def test_curated_data_passes_every_blocking_check():
    assert validate.blocking(br.load_curated()) == []


# ---------- blocking checks catch what they should ----------
def test_tier_gap_blocks():
    t = tables()
    t["subsidy_tiers"]["tiers"][2]["pchi_min"] = 2400          # T1 ends at 2300 → gap
    assert any("gap or overlap" in e for e in blocking_for(t))


def test_missing_rates_for_a_tier_block():
    t = tables()
    del t["subsidy_tiers"]["schemes"][0]["rates"]["T3"]
    assert any("no rates" in e for e in blocking_for(t))


def test_percentage_over_100_is_a_schema_error():
    t = tables()
    t["subsidy_tiers"]["schemes"][0]["rates"]["T0"]["pr"] = 101
    with pytest.raises(ValidationError):
        Curated(**t)


def test_unknown_source_blocks():
    t = tables()
    t["contacts"]["contacts"][0]["source_id"] = "made_up_source"
    assert any("unknown source_id 'made_up_source'" in e for e in blocking_for(t))


def test_price_low_above_high_blocks():
    t = tables()
    t["price_references"]["prices"][0]["price_low_sgd"] = 999
    assert any("low 999" in e for e in blocking_for(t))


def test_rule_with_an_answer_that_does_not_exist_blocks():
    t = tables()
    t["need_rules"]["rules"][2]["when"][1]["in"] = ["sometimes"]
    assert any("has no answer" in e for e in blocking_for(t))


def test_unquoted_yaml_no_is_rejected():
    # YAML reads a bare `no` as false; the schema must refuse it rather than never matching.
    clause = yaml.safe_load("{q: memory, in: [no]}")
    t = tables()
    t["need_rules"]["rules"][2]["when"][1] = clause
    with pytest.raises(ValidationError):
        Curated(**t)


def test_contact_outside_singapore_is_a_schema_error():
    t = tables()
    t["contacts"]["contacts"][0]["lat"] = 3.14                 # Kuala Lumpur-ish
    with pytest.raises(ValidationError):
        Curated(**t)


def test_unknown_yaml_key_is_a_schema_error():
    t = tables()
    t["service_types"]["services"][0]["defualt_units_per_week"] = 3   # typo
    with pytest.raises(ValidationError):
        Curated(**t)


def test_subsidised_service_without_a_price_blocks():
    t = tables()
    t["price_references"]["prices"] = [p for p in t["price_references"]["prices"] if p["service_id"] != "home_nursing"]
    assert any("home_nursing is subsidised but has no price" in e for e in blocking_for(t))


# ---------- warnings ----------
def test_warnings_flag_overdue_review_and_aggregator_prices():
    c = br.load_curated()
    w = validate.warnings(c, [], 76, today=date(2028, 1, 1))
    assert any("past its review date" in x for x in w)
    assert any("from an aggregator" in x for x in w)
    assert any("over 90 days ago" in x for x in w)


def test_low_sector_count_is_a_warning_not_an_error():
    w = validate.warnings(br.load_curated(), [], 40, today=date(2026, 11, 25))
    assert any("only 40 postal sectors" in x for x in w)


# ---------- end-to-end offline build on fixture layers ----------
def _feature(pc_field, pc, lat, lng, **props):
    return {"type": "Feature", "geometry": {"type": "Point", "coordinates": [lng, lat]},
            "properties": {pc_field: pc, **props}}


@pytest.fixture
def raw_dir(tmp_path: Path) -> Path:
    raw = tmp_path / "raw"
    raw.mkdir()
    layers = {
        "fsc": [_feature("ADDRESSPOSTALCODE", "560123", 1.369, 103.849, OBJECTID="1", NAME="AMK Family Centre",
                         ADDRESSBLOCKHOUSENUMBER="123", ADDRESSSTREETNAME="Ang Mo Kio Ave 6", ADDRESSFLOORNUMBER="1",
                         ADDRESSUNITNUMBER="20", ADDRESSBUILDINGNAME="None", FMEL_UPD_D="20260929190908")],
        "cc": [_feature("ADDRESSPOSTALCODE", "828815", 1.3936, 103.9135, OBJECTID="2", NAME="Punggol 21 CC",
                        ADDRESSBLOCKHOUSENUMBER="80", ADDRESSSTREETNAME="Punggol Field", FMEL_UPD_D="20240417181750"),
               _feature("ADDRESSPOSTALCODE", "None", 1.30, 103.80, OBJECTID="3", NAME="No postcode CC")],
        "chas": [_feature("POSTAL_CD", "560456", 1.371, 103.851),
                 _feature("POSTAL_CD", "999999", 3.14, 101.69)],          # outside Singapore: dropped
        "pharm": [_feature("POSTAL_CODE", "188021", 1.2991, 103.8554)],
        "dgtp": [_feature("POSTAL_CODE", "570410", 1.3628, 103.8355)],
    }
    for name, feats in layers.items():
        (raw / f"{name}.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": feats}))
    return raw


def test_offline_build_writes_every_file(raw_dir: Path, tmp_path: Path):
    out = tmp_path / "out"
    assert br.build(offline=True, today=date(2026, 11, 25), raw_dir=raw_dir, out_dir=out) == 0
    for f in ("rules.json", "contacts.json", "places.json", "sectors.json", "manifest.json"):
        assert (out / f).exists(), f

    places = json.loads((out / "places.json").read_text())
    assert [p["placeId"] for p in places] == ["cc_2", "fsc_1"]                # the postcode-less CC is dropped
    assert places[1]["address"] == "123 Ang Mo Kio Ave 6, #01-20"
    assert places[1]["featureUpdatedOn"] == "2026-09-29"

    sectors = json.loads((out / "sectors.json").read_text())
    assert sectors["sectors"]["56"]["n"] == 2                                  # FSC + CHAS in sector 56
    assert "99" not in sectors["sectors"]                                      # the out-of-Singapore point
    assert set(sectors["regions"]) == {"central", "north", "northeast", "east", "west"}

    rules = json.loads((out / "rules.json").read_text())
    assert "serviceTypes" in rules and "needRules" in rules                    # camelCase on the wire
    m = Manifest.model_validate_json((out / "manifest.json").read_text())
    assert m.data_version == "2026.11.25-1"


def test_rebuild_without_changes_keeps_the_version(raw_dir: Path, tmp_path: Path, capsys):
    out = tmp_path / "out"
    br.build(offline=True, today=date(2026, 11, 25), raw_dir=raw_dir, out_dir=out)
    first = (out / "manifest.json").read_text()
    br.build(offline=True, today=date(2026, 11, 25), raw_dir=raw_dir, out_dir=out)
    assert (out / "manifest.json").read_text() == first
    assert "No change" in capsys.readouterr().out


def test_changed_data_on_the_same_day_bumps_the_counter(raw_dir: Path, tmp_path: Path):
    out = tmp_path / "out"
    br.build(offline=True, today=date(2026, 11, 25), raw_dir=raw_dir, out_dir=out)
    fsc = json.loads((raw_dir / "fsc.geojson").read_text())
    fsc["features"][0]["properties"]["NAME"] = "AMK Family Centre (renamed)"
    (raw_dir / "fsc.geojson").write_text(json.dumps(fsc))
    br.build(offline=True, today=date(2026, 11, 25), raw_dir=raw_dir, out_dir=out)
    assert Manifest.model_validate_json((out / "manifest.json").read_text()).data_version == "2026.11.25-2"


def test_warning_change_alone_keeps_the_version(raw_dir: Path, tmp_path: Path):
    out = tmp_path / "out"
    br.build(offline=True, today=date(2026, 11, 25), raw_dir=raw_dir, out_dir=out)
    br.build(offline=True, today=date(2030, 1, 1), raw_dir=raw_dir, out_dir=out)   # new "past review" warnings
    m = Manifest.model_validate_json((out / "manifest.json").read_text())
    assert m.data_version == "2026.11.25-1"
    assert any("past its review date" in w for w in m.warnings)


def test_missing_snapshot_offline_blocks(tmp_path: Path):
    assert br.build(offline=True, raw_dir=tmp_path / "empty", out_dir=tmp_path / "out") == 1


def test_blocking_error_writes_nothing(tmp_path: Path, raw_dir: Path):
    bad = tmp_path / "curated"
    shutil.copytree(CURATED, bad)
    t = yaml.safe_load((bad / "price_references.yaml").read_text())
    t["prices"][0]["price_low_sgd"] = 999
    (bad / "price_references.yaml").write_text(yaml.safe_dump(t))
    out = tmp_path / "out"
    assert br.build(offline=True, curated_dir=bad, raw_dir=raw_dir, out_dir=out) == 1
    assert not out.exists()


def test_schema_export_covers_every_file():
    from pipeline.export_schema import schema
    s = schema()
    assert set(s) == {"rules.json", "contacts.json", "places.json", "sectors.json", "manifest.json"}
    assert "dataVersion" in json.dumps(s["manifest.json"])
