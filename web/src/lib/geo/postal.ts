// Postal code → area centre, entirely on the device (ADR-006). No network request, no logging.
// Only the first 2 digits (the postal sector) are used; the full code is never stored or shared.
import type { Sectors } from "../data/types";
import type { Session } from "../engine/urlCodec";

export interface Point { lat: number; lng: number }
export type Region = "central" | "north" | "northeast" | "east" | "west";

export type Located =
  | { kind: "ok"; sector: string; point: Point }
  | { kind: "invalid" }                          // not 6 digits (spec 09, case 10)
  | { kind: "unavailable"; sector: string };     // a valid code in a sector with no centre: offer the region picker (case 9)

export function locate(sectors: Sectors, postalCode: string): Located {
  const code = postalCode.trim();
  if (!/^\d{6}$/.test(code)) return { kind: "invalid" };
  const sector = code.slice(0, 2);
  const c = sectors.sectors[sector];
  return c ? { kind: "ok", sector, point: { lat: c.lat, lng: c.lng } } : { kind: "unavailable", sector };
}

export function regionPoint(sectors: Sectors, region: Region): Point {
  const r = sectors.regions[region];
  if (!r) throw new Error(`no centre for region ${region}`);
  return { lat: r.lat, lng: r.lng };
}

/** The point for a saved session location (a 2-digit sector or a region), or null if none is usable. */
export function pointForSession(sectors: Sectors, loc: Session["loc"]): Point | null {
  if (!loc) return null;
  if ("reg" in loc) return regionPoint(sectors, loc.reg);
  const c = sectors.sectors[loc.sec];
  return c ? { lat: c.lat, lng: c.lng } : null;
}
