import { afterEach, describe, expect, it, vi } from "vitest";
import contactsJson from "../../../../public/data/contacts.json";
import manifestJson from "../../../../public/data/manifest.json";
import placesJson from "../../../../public/data/places.json";
import rulesJson from "../../../../public/data/rules.json";
import sectorsJson from "../../../../public/data/sectors.json";
import type { Branch, ContactsBundle, Manifest, Place, RulesBundle, Sectors } from "../../data/types";
import { haversineKm, nearbyContacts } from "../nearby";
import { locate, pointForSession, regionPoint } from "../postal";

const sectors = sectorsJson as unknown as Sectors;
const { contacts } = contactsJson as unknown as ContactsBundle;
const places = placesJson as unknown as Place[];
const manifest = manifestJson as unknown as Manifest;
const branch = (id: Branch["branchId"]) => (rulesJson as unknown as RulesBundle).branchRules.branches.find((b) => b.branchId === id)!;

afterEach(() => vi.restoreAllMocks());

describe("postal sector lookup", () => {
  it("a valid code resolves to its sector's centre", () => {
    const r = locate(sectors, " 560123 ");
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") {
      expect(r.sector).toBe("56");
      expect(r.point).toEqual({ lat: sectors.sectors["56"]!.lat, lng: sectors.sectors["56"]!.lng });
    }
  });

  it.each(["0212", "56012", "5601234", "56O123", ""])("'%s' is not a postal code (case 10)", (code) => {
    expect(locate(sectors, code)).toEqual({ kind: "invalid" });
  });

  it("a code in a sector with no centre asks for a region (case 9)", () => {
    const missing = ["02", "70", "71", "72", "77"].find((s) => !sectors.sectors[s])!;
    expect(locate(sectors, `${missing}1234`)).toEqual({ kind: "unavailable", sector: missing });
  });

  it("every region has a centre inside Singapore", () => {
    for (const r of ["central", "north", "northeast", "east", "west"] as const) {
      const p = regionPoint(sectors, r);
      expect(p.lat).toBeGreaterThan(1.15); expect(p.lat).toBeLessThan(1.48);
      expect(p.lng).toBeGreaterThan(103.6); expect(p.lng).toBeLessThan(104.1);
    }
  });

  it("a saved session location uses only the sector or the region", () => {
    expect(pointForSession(sectors, { sec: "56" })).toEqual(regionOrSector("56"));
    expect(pointForSession(sectors, { reg: "east" })).toEqual(regionPoint(sectors, "east"));
    expect(pointForSession(sectors, undefined)).toBeNull();
  });

  it("makes no network request", () => {
    const spy = vi.spyOn(globalThis, "fetch");
    locate(sectors, "560123");
    expect(spy).not.toHaveBeenCalled();
  });
});

const regionOrSector = (s: string) => ({ lat: sectors.sectors[s]!.lat, lng: sectors.sectors[s]!.lng });

describe("distance", () => {
  it("haversine: zero to itself, symmetric, ~1.11 km per 0.01° of latitude", () => {
    const a = { lat: 1.30, lng: 103.80 }, b = { lat: 1.31, lng: 103.80 };
    expect(haversineKm(a, a)).toBe(0);
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10);
    expect(haversineKm(a, b)).toBeCloseTo(1.112, 2);
  });
});

describe("who to call", () => {
  const amk = (locate(sectors, "560123") as { point: { lat: number; lng: number } }).point;

  it("Ang Mo Kio: TTSH is the nearest AIC Link (about 5 km) and AMK Polyclinic the nearest polyclinic", () => {
    const { items } = nearbyContacts(amk, contacts, places, branch("changed_at_home"));
    expect(items.map((i) => i.kind)).toEqual(["aic_link", "polyclinic", "fsc", "cc"]);
    expect(items[0]!.id).toBe("aic_link_ttsh");
    expect(items[0]!.km).toBeGreaterThan(4); expect(items[0]!.km).toBeLessThan(7);
    expect(items[1]!.id).toBe("poly_ang_mo_kio");
    expect(items[1]!.precision).toBe("sector");       // the screen says "In your area", not "0 km"
    expect(items[0]!.precision).toBe("exact");
  });

  it("in hospital: the ward social worker comes first, above every distance", () => {
    const { items } = nearbyContacts(amk, contacts, places, branch("in_hospital"));
    expect(items[0]).toMatchObject({ kind: "ward_msw", km: null, name: branch("in_hospital").firstContact });
    expect(items).toHaveLength(5);
  });

  it("two polyclinics in the same postal area are both shown (Tampines and Tampines North)", () => {
    const tampines = (locate(sectors, "529203") as { point: { lat: number; lng: number } }).point;
    const polys = nearbyContacts(tampines, contacts, places, branch("changed_at_home")).items.filter((i) => i.kind === "polyclinic");
    expect(polys.map((p) => p.id).sort()).toEqual(["poly_tampines", "poly_tampines_north"]);
  });

  it("no sea-sports club or unfinished building is ever a 'nearest Community Club'", () => {
    expect(places.filter((p) => p.kind === "cc" && /PAssion WaVe|\(U\/C\)/i.test(p.name))).toEqual([]);
  });

  it("every result carries a checked-on or updated-on date", () => {
    for (const i of nearbyContacts(amk, contacts, places, branch("struggling")).items) {
      expect(i.checkedOn ?? i.updatedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("AIC locator link-outs always come back, and each resolves to a URL in the manifest", () => {
    const { linkOutSourceIds } = nearbyContacts(amk, contacts, places, branch("changed_at_home"));
    const urls = new Map(manifest.sources.map((s) => [s.sourceId, s.url]));
    expect(linkOutSourceIds.length).toBe(3);
    for (const id of linkOutSourceIds) expect(urls.get(id)).toMatch(/^https:\/\/(www\.)?aic\.sg\//);
  });

  it("every region centre finds an AIC Link within 15 km", () => {
    for (const r of ["central", "north", "northeast", "east", "west"] as const) {
      expect(nearbyContacts(regionPoint(sectors, r), contacts, places, branch("struggling")).items[0]!.km!).toBeLessThan(15);
    }
  });
});
