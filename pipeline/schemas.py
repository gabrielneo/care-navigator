"""Pydantic models for every curated table and every JSON file the site reads.

Curated YAML uses snake_case. JSON output uses camelCase (docs/specs/10-data-contract.md).
extra="forbid" makes a mistyped key a blocking schema error instead of a silent drop.
"""
from __future__ import annotations

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel

TierId = Literal["T0", "T1", "T2", "T3", "T4", "T5"]
Pct = Field(ge=0, le=100)


class Model(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")


# ---------- source_registry.yaml ----------
class Source(Model):
    source_id: str
    title: str
    owner: str
    url: str
    licence: Literal["site-terms", "sg-odl-1.0"]
    checked_on: date
    next_review: date


class SourceRegistry(Model):
    sources: list[Source]


# ---------- subsidy_tiers.yaml ----------
class Tier(Model):
    tier_id: TierId
    pchi_min: int = Field(ge=0)
    pchi_max: Optional[int] = None
    av_rule: Optional[str] = None


class Rates(Model):
    sc_le1969: int = Pct
    sc_gt1969: int = Pct
    pr: int = Pct


class SubsidyScheme(Model):
    scheme: Literal["non_residential", "residential"]
    source_id: str
    rates: dict[TierId, Rates]


class SubsidyTiers(Model):
    effective_from: date
    tiers: list[Tier]
    schemes: list[SubsidyScheme]


# ---------- service_types.yaml ----------
class ServiceType(Model):
    service_id: str
    name: str
    official_term: str
    description: str
    setting: Literal["home", "centre", "residential", "ward"]
    scheme: Optional[Literal["non_residential", "residential"]]
    unit: Optional[str]
    default_units_per_week: Optional[int] = Field(default=None, ge=1, le=7)
    block_hours: Optional[int] = None
    ward_only: bool = False
    how_to_apply_id: str
    source_id: str


class ServiceTypes(Model):
    services: list[ServiceType]


# ---------- price_references.yaml ----------
Confidence = Literal["official", "provider", "aggregator"]


class RealBillAnchor(Model):
    low: float
    high: float
    source_id: str


class PriceReference(Model):
    service_id: str
    unit: str
    price_low_sgd: float = Field(gt=0)
    low_source_id: str
    low_confidence: Confidence
    price_high_sgd: float = Field(gt=0)
    high_source_id: str
    high_confidence: Confidence
    derived: Optional[str] = None
    real_bill_anchor: Optional[RealBillAnchor] = None
    checked_on: date


class PriceReferences(Model):
    gst_source_id: str
    prices: list[PriceReference]


# ---------- grant_rules.yaml ----------
class GrantRule(Model):
    grant_id: str
    name: str
    kind: Literal["grant", "payout", "concession"]
    period: Literal["month", "once_then_yearly"]
    amount_by_band: dict[TierId, float]
    amount_is_maximum: bool = False
    amount_meaning: Optional[str] = None
    min_adl: int = Field(ge=0, le=6)
    alt_min_age: Optional[int] = None
    requires_helper: bool = False
    citizens_only: bool = False
    other_conditions: str
    official_url: str
    official_source_id: Optional[str] = None
    standard_levy_source_id: Optional[str] = None
    effective_from: date
    source_id: str


class GrantRules(Model):
    grants: list[GrantRule]


# ---------- need_rules.yaml ----------
Question = Literal["where", "discharged", "adl", "alone", "memory", "helper", "limits", "med"]
ADL = Literal["bath", "dress", "eat", "toilet", "move", "transfer"]


class Clause(Model):
    q: Question
    in_: Optional[list[str]] = Field(default=None, alias="in")
    any: Optional[list[ADL]] = None
    none: Optional[bool] = None
    is_: Optional[bool] = Field(default=None, alias="is")

    @model_validator(mode="after")
    def exactly_one_test(self) -> "Clause":
        tests = [self.in_ is not None, self.any is not None, self.none is not None, self.is_ is not None]
        if sum(tests) != 1:
            raise ValueError(f"clause on '{self.q}' needs exactly one of in / any / none / is")
        if (self.any is not None or self.none is not None) and self.q != "adl":
            raise ValueError("any / none only apply to q: adl")
        return self


class NeedRule(Model):
    rule_id: str
    service_id: str
    when: list[Clause]
    reason_text: str
    priority: int = Field(ge=1)
    enabled: bool = True
    note: Optional[str] = None
    source_id: str


class NeedRules(Model):
    rules: list[NeedRule]


# ---------- branch_rules.yaml ----------
BranchId = Literal["in_hospital", "changed_at_home", "struggling", "in_nursing_home"]


class BranchAnswer(Model):
    label: str
    branch_id: BranchId
    discharged: Optional[bool] = None
    not_sure: bool = False


class Link(Model):
    label: str
    source_id: str


class Branch(Model):
    branch_id: BranchId
    first_contact: str
    flags: list[str]
    ask_list: list[str]
    ask_list_conditions: Optional[dict[str, dict[str, int]]] = None
    timeline_notes: list[str]
    links: Optional[list[Link]] = None
    source_ids: list[str]


class DementiaFlag(Model):
    when: Clause
    note: str
    source_id: str


class BranchRules(Model):
    answers: list[BranchAnswer]
    branches: list[Branch]
    dementia_flag: DementiaFlag


# ---------- how_to_apply.yaml ----------
class Route(Model):
    apply_id: str
    first_contact: str
    steps: list[str]
    extra_documents: list[str]
    source_id: str


class GrantStep(Model):
    grant_id: str
    steps: Optional[list[str]] = None
    extra_documents: Optional[list[str]] = None
    source_id: str


class HowToApply(Model):
    always_bring: list[str]
    routes: list[Route]
    grant_steps: list[GrantStep]


# ---------- contacts.yaml ----------
LatSG = Field(ge=1.15, le=1.48)
LngSG = Field(ge=103.6, le=104.1)


class Contact(Model):
    contact_id: str
    kind: Literal["aic_link", "polyclinic"]
    name: str
    address: str
    postal_code: str = Field(pattern=r"^\d{6}$")
    lat: float = LatSG
    lng: float = LngSG
    hours: Optional[str] = None
    location_note: Optional[str] = None
    location_precision: Literal["exact", "sector"] = "exact"
    checked_on: date
    source_id: str


class Hotline(Model):
    name: str
    phone: str
    hours: str
    languages: list[str]
    checked_on: date
    source_id: str


class Region(Model):
    region_id: Literal["central", "north", "northeast", "east", "west"]
    label: str
    contact_ids: list[str]


class Contacts(Model):
    contacts: list[Contact]
    hotline: Hotline
    regions: list[Region]


# ---------- built outputs ----------
class Place(Model):
    place_id: str
    kind: Literal["fsc", "cc"]
    name: str
    address: str
    postal_code: str = Field(pattern=r"^\d{6}$")
    lat: float = LatSG
    lng: float = LngSG
    feature_updated_on: Optional[date] = None


class Point(Model):
    lat: float = LatSG
    lng: float = LngSG


class SectorCentre(Point):
    n: int = Field(ge=1)


class RegionCentre(Point):
    label: str


class Sectors(Model):
    sectors: dict[str, SectorCentre]
    regions: dict[str, RegionCentre]


class RulesBundle(Model):
    """rules.json: everything the engine needs to match and cost."""
    service_types: list[ServiceType]
    need_rules: list[NeedRule]
    branch_rules: BranchRules
    price_references: PriceReferences
    subsidy_tiers: SubsidyTiers
    grant_rules: list[GrantRule]
    how_to_apply: HowToApply


class ContactsBundle(Model):
    """contacts.json."""
    contacts: list[Contact]
    hotline: Hotline


class ManifestSource(Model):
    source_id: str
    title: str
    url: str
    licence: str
    checked_on: date
    next_review: date


class Manifest(Model):
    data_version: str = Field(pattern=r"^\d{4}\.\d{2}\.\d{2}-\d+$")
    built_at: str
    curated_hash: str
    sources: list[ManifestSource]
    files: dict[str, str]
    sizes: dict[str, int]
    warnings: list[str]


class Curated(Model):
    """Every curated YAML file, loaded together."""
    source_registry: SourceRegistry
    subsidy_tiers: SubsidyTiers
    service_types: ServiceTypes
    price_references: PriceReferences
    grant_rules: GrantRules
    need_rules: NeedRules
    branch_rules: BranchRules
    how_to_apply: HowToApply
    contacts: Contacts
