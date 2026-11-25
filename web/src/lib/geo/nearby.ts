// "Who to call": the nearest contact of each kind, by straight-line distance (docs/specs/06, ADR-005, ADR-006).
// Distances start from an area centre, so they are approximate: show them as "about N km".
import type { Branch, Contact, Place } from "../data/types";
import type { Point } from "./postal";

const EARTH_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(a: Point, b: Point): number {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

export type ContactKind = "ward_msw" | "aic_link" | "polyclinic" | "fsc" | "cc";

export interface NearbyItem {
  kind: ContactKind;
  id: string | null;
  name: string;
  address: string | null;
  hours: string | null;
  km: number | null;            // one decimal place; null for the ward social worker
  /** "sector": placed at its area's centre, so a small km means "in your area", not a real distance. */
  precision: "exact" | "sector" | null;
  checkedOn: string | null;     // curated contacts
  updatedOn: string | null;     // open-data places (last edit of the record)
}

export interface Nearby {
  items: NearbyItem[];
  /** AIC's own pages with locator maps, by source_id (resolve the URL from manifest.json). Always shown. */
  linkOutSourceIds: string[];
}

const LINK_OUTS = ["aic_aac", "aic_day_care", "aic_nursing_home"];
const km1 = (x: number) => Math.round(x * 10) / 10;

const TIE_KM = 0.05;      // area-centred contacts in the same area land on the same point

/** The nearest item. With `keepTies`, also one more at the same point (two polyclinics in one postal area). */
function nearest<T extends Point>(from: Point, xs: T[], keepTies = false): { x: T; km: number }[] {
  const byKm = xs.map((x) => ({ x, km: haversineKm(from, x) })).sort((a, b) => a.km - b.km);
  const best = byKm[0];
  if (!best) return [];
  return keepTies ? byKm.filter((r) => r.km - best.km < TIE_KM).slice(0, 2) : [best];
}

export function nearbyContacts(from: Point, contacts: Contact[], places: Place[], branch: Branch): Nearby {
  const items: NearbyItem[] = [];
  if (branch.branchId === "in_hospital") {
    // Wording comes from branch_rules.yaml so this screen and the action plan always agree.
    items.push({ kind: "ward_msw", id: null, name: branch.firstContact, address: null,
                 hours: null, km: null, precision: null, checkedOn: null, updatedOn: null });
  }
  for (const kind of ["aic_link", "polyclinic"] as const) {
    // Only polyclinics are placed at area centres, so only they can tie for no real reason.
    for (const n of nearest(from, contacts.filter((c) => c.kind === kind), kind === "polyclinic")) {
      items.push({ kind, id: n.x.contactId, name: n.x.name, address: n.x.address, hours: n.x.hours ?? null,
                   km: km1(n.km), precision: n.x.locationPrecision ?? "exact", checkedOn: n.x.checkedOn, updatedOn: null });
    }
  }
  for (const kind of ["fsc", "cc"] as const) {
    for (const n of nearest(from, places.filter((p) => p.kind === kind))) {
      items.push({ kind, id: n.x.placeId, name: n.x.name, address: n.x.address, hours: null,
                   km: km1(n.km), precision: "exact", checkedOn: null, updatedOn: n.x.featureUpdatedOn ?? null });
    }
  }
  return { items, linkOutSourceIds: LINK_OUTS };
}
