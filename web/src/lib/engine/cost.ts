// Monthly cost ranges, grants and the nursing-home figure (ADR-004, ADR-007, docs/specs/09 and 10).
// Every amount is an estimate: ranges, rounded to $5, never a quote.
import type { GrantRule, RulesBundle } from "../data/types";
import { subsidyRate, type Scheme, type TierId } from "./tiers";
import type { Session } from "./urlCodec";

export const WEEKS_PER_MONTH = 52 / 12;
const TRANSPORT = "day_care_transport";
const DAY_CARE = ["day_care", "dementia_day_care"];

export const round5 = (x: number) => Math.round(x / 5) * 5;
export interface Range { low: number; high: number }
const r5 = (low: number, high: number): Range => ({ low: round5(low), high: round5(high) });

export interface CostLine {
  serviceId: string;
  unitsPerMonth: number;
  priceLow: number;
  priceHigh: number;
  quoted: boolean;
  subsidyPct: number;          // 0–100; 0 when the service isn't MOH-subsidised
  withSubsidy: Range | null;   // null until band and residency are set, or when residency is "none"
  fullPrice: Range;
  mayAddGst: true;             // full price only: MOH absorbs GST for subsidised patients
  sourceIds: string[];
  isEstimate: true;
}

export interface PlanCost {
  lines: CostLine[];
  unpriced: string[];          // in the plan but no published price (e.g. Interim Caregiver Service)
  total: { withSubsidy: Range | null; fullPrice: Range; sameAsFullPrice: boolean } | null;  // null: empty plan
  split: { people: number; each: Range } | null;
}

/** The plan's entries, with day-care transport added automatically unless the plan sets it (n: 0 removes it). */
export function planEntries(s: Session): { s: string; n: number }[] {
  const plan = s.plan ?? [];
  const entries = plan.filter((e) => e.n > 0 && e.s !== TRANSPORT);
  const hasDayCare = entries.some((e) => DAY_CARE.includes(e.s));
  const transportN = plan.find((e) => e.s === TRANSPORT)?.n ?? 1;
  return hasDayCare && transportN > 0 ? [...entries, { s: TRANSPORT, n: 1 }] : entries;
}

export function costPlan(rules: RulesBundle, s: Session): PlanCost {
  const services = new Map(rules.serviceTypes.map((x) => [x.serviceId, x]));
  const prices = new Map(rules.priceReferences.prices.map((p) => [p.serviceId, p]));
  const lines: CostLine[] = [];
  const unpriced: string[] = [];
  const raw = { subLow: 0, subHigh: 0, fullLow: 0, fullHigh: 0 };
  // No subsidy figure until band and residency are picked, or when she is neither SC nor PR (spec 09, case 1).
  const showSubsidy = Boolean(s.t && s.r && s.r !== "none");

  for (const e of planEntries(s)) {
    const svc = services.get(e.s);
    if (!svc) continue;                                   // unknown id from an old link: ignore
    const ref = prices.get(e.s);
    if (!ref) { unpriced.push(e.s); continue; }
    const unitsPerMonth = svc.unit === "month" ? e.n : e.n * (svc.blockHours ?? 1) * WEEKS_PER_MONTH;
    const quote = s.q?.[e.s];
    const priceLow = quote ?? ref.priceLowSgd;
    const priceHigh = quote ?? ref.priceHighSgd;
    const rate = svc.scheme ? subsidyRate(rules, svc.scheme as Scheme, s) : 0;
    const fullLow = unitsPerMonth * priceLow, fullHigh = unitsPerMonth * priceHigh;
    const subLow = fullLow * (1 - rate), subHigh = fullHigh * (1 - rate);
    raw.subLow += subLow; raw.subHigh += subHigh; raw.fullLow += fullLow; raw.fullHigh += fullHigh;
    lines.push({
      serviceId: e.s, unitsPerMonth, priceLow, priceHigh, quoted: quote != null,
      subsidyPct: Math.round(rate * 100),
      withSubsidy: showSubsidy ? r5(subLow, subHigh) : null,
      fullPrice: r5(fullLow, fullHigh),
      mayAddGst: true,
      sourceIds: [ref.lowSourceId, ref.highSourceId, ...(svc.scheme ? [schemeSource(rules, svc.scheme as Scheme)] : [])],
      isEstimate: true,
    });
  }

  if (lines.length === 0) return { lines, unpriced, total: null, split: null };
  const withSubsidy = showSubsidy ? r5(raw.subLow, raw.subHigh) : null;   // totals round the raw sum, not the lines
  const fullPrice = r5(raw.fullLow, raw.fullHigh);
  const people = s.x ?? 1;
  const [low, high] = withSubsidy ? [raw.subLow, raw.subHigh] : [raw.fullLow, raw.fullHigh];
  return {
    lines, unpriced,
    total: { withSubsidy, fullPrice, sameAsFullPrice: withSubsidy?.low === fullPrice.low && withSubsidy?.high === fullPrice.high },
    split: people > 1 ? { people, each: r5(low / people, high / people) } : null,
  };
}

function schemeSource(rules: RulesBundle, scheme: Scheme): string {
  return rules.subsidyTiers.schemes.find((x) => x.scheme === scheme)!.sourceId;
}

export interface PotentialGrant {
  grantId: string;
  name: string;
  amount: number;
  period: GrantRule["period"];
  isMaximum: boolean;
  amountMeaning: string | null; // e.g. "$400 to start, then $200 a year, for approved caregiver courses."
  needsAgeCheck: boolean;      // e.g. levy concession: met by age 67+, which the planner doesn't ask
  conditions: string;
  officialUrl: string;
  sourceId: string;
}

/** Grants and payouts she may qualify for. Listed beside the total, never subtracted (ADR-004). */
export function potentialGrants(rules: RulesBundle, s: Session, adlCount: number): PotentialGrant[] {
  if (!s.t || !s.r || s.r === "none") return [];
  const inHome = s.w === "in_nursing_home";
  return rules.grantRules.flatMap((g) => {
    const amount = (g.amountByBand as Record<TierId, number>)[s.t as TierId] ?? 0;
    if (amount <= 0) return [];
    if (g.citizensOnly && s.r !== "sc") return [];
    if (g.requiresHelper && !(s.hlp === "yes" || s.hlp === "considering")) return [];
    if (g.grantId === "home_caregiving_grant" && inHome) return [];       // not for residents of a nursing home
    const adlMet = adlCount >= g.minAdl;
    if (!adlMet && g.altMinAge == null) return [];
    return [{
      grantId: g.grantId, name: g.name, amount, period: g.period, isMaximum: g.amountIsMaximum ?? false,
      amountMeaning: g.amountMeaning ?? null,
      needsAgeCheck: !adlMet, conditions: g.otherConditions, officialUrl: g.officialUrl, sourceId: g.sourceId,
    }];
  });
}

export interface NursingHomeEstimate {
  from: number;                // $4,900 × (1 − residential subsidy), rounded to $5
  subsidyPct: number;
  realBills: { low: number; high: number; sourceId: string } | null;
  label: string;
  sourceIds: string[];
}

/** Nursing home as a "from" figure beside real bills, never one exact number (ADR-007). */
export function nursingHome(rules: RulesBundle, s: Session): NursingHomeEstimate {
  const ref = rules.priceReferences.prices.find((p) => p.serviceId === "nursing_home");
  if (!ref) throw new Error("no nursing home price");
  const rate = subsidyRate(rules, "residential", s);
  const anchor = ref.realBillAnchor ?? null;
  return {
    from: round5(ref.priceLowSgd * (1 - rate)),
    subsidyPct: Math.round(rate * 100),
    realBills: anchor && { low: anchor.low, high: anchor.high, sourceId: anchor.sourceId },
    label: "Subsidised bed at a government-funded home, after assessment",
    sourceIds: [ref.lowSourceId, schemeSource(rules, "residential")],
  };
}
