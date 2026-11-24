// Subsidy tiers and the 3-question income helper (ADR-003, docs/specs/08).
import type { RulesBundle } from "../data/types";
import type { Session } from "./urlCodec";

export type TierId = "T0" | "T1" | "T2" | "T3" | "T4" | "T5";
export type Scheme = "non_residential" | "residential";
const AV_LIMIT = 21_000; // no-income households: home Annual Value at or below this → T0, above → T5

/** Tier for a monthly household income per person (whole dollars). */
export function tierForPchi(rules: RulesBundle, pchi: number): TierId {
  const t = rules.subsidyTiers.tiers.find((x) => pchi >= x.pchiMin && (x.pchiMax == null || pchi <= x.pchiMax));
  if (!t) throw new Error(`no tier for PCHI ${pchi}`);
  return t.tierId as TierId;
}

/** Tier for a household with no income, from the home's Annual Value. */
export const tierForAnnualValue = (av: number): TierId => (av <= AV_LIMIT ? "T0" : "T5");

/** Income helper question 3: total-household ranges for a household size (band limits × size). */
export function incomeOptions(rules: RulesBundle, householdSize: number) {
  // Each range starts $1 above the last one's top, so no household total falls between two ranges.
  return rules.subsidyTiers.tiers.map((t, i, all) => ({
    tierId: t.tierId as TierId,
    min: i === 0 ? 0 : all[i - 1]!.pchiMax! * householdSize + 1,
    max: t.pchiMax == null ? null : t.pchiMax * householdSize,
  }));
}

/** Subsidy rate (0–1) for a scheme. Non-citizens and non-PRs get none. */
export function subsidyRate(rules: RulesBundle, scheme: Scheme, s: Pick<Session, "t" | "r" | "b">): number {
  if (!s.t || !s.r || s.r === "none") return 0;
  const rates = rules.subsidyTiers.schemes.find((x) => x.scheme === scheme)?.rates as
    Record<TierId, { scLe1969: number; scGt1969: number; pr: number }> | undefined;
  const row = rates?.[s.t];
  if (!row) throw new Error(`no ${scheme} rates for ${s.t}`);
  const pct = s.r === "pr" ? row.pr : s.b === "gt1969" ? row.scGt1969 : row.scLe1969;
  return pct / 100;
}
