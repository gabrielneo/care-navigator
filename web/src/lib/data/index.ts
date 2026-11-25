// Rules and manifest are bundled with the planner; location data loads on demand (./geo). Never edited by hand.
import manifestJson from "../../../public/data/manifest.json";
import rulesJson from "../../../public/data/rules.json";
import type { Manifest, RulesBundle } from "./types";

export const rules = rulesJson as unknown as RulesBundle;
export const manifest = manifestJson as unknown as Manifest;

const sourceUrls = new Map(manifest.sources.map((s) => [s.sourceId, s]));
export const source = (id: string) => sourceUrls.get(id);

/** "25 Nov 2026" from an ISO date. */
export const longDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });

/** The data version's date, e.g. "25 Nov 2026". */
export const dataDate = longDate(manifest.dataVersion.slice(0, 10).replace(/\./g, "-"));
