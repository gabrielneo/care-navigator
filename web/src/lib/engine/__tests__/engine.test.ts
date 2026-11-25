import { describe, expect, it } from "vitest";
import rulesJson from "../../../../public/data/rules.json";
import type { RulesBundle } from "../../data/types";
import { costPlan, nursingHome, planEntries, potentialGrants, round5, WEEKS_PER_MONTH } from "../cost";
import { clauseHolds, matchServices, MAX_MATCHES } from "../matching";
import { incomeOptions, subsidyRate, tierForAnnualValue, tierForPchi, type TierId } from "../tiers";
import { decodeHash, decodeSession, encodeHash, encodeSession, type Session } from "../urlCodec";

const rules = rulesJson as unknown as RulesBundle;
const V = "2026.11.25-1";

// Golden table, typed in from MOH's pages (1 Jul 2026, raw HTML; docs/verified). If the data drifts, this fails.
const GOLDEN = {
  non_residential: { T0: [95, 80, 55], T1: [85, 70, 45], T2: [75, 60, 35], T3: [55, 40, 20], T4: [35, 20, 10], T5: [0, 0, 0] },
  residential: { T0: [80, 75, 50], T1: [65, 60, 40], T2: [55, 50, 30], T3: [35, 30, 15], T4: [15, 10, 5], T5: [0, 0, 0] },
} as const;
const TIERS: TierId[] = ["T0", "T1", "T2", "T3", "T4", "T5"];

describe("subsidy tiers", () => {
  for (const scheme of ["non_residential", "residential"] as const) {
    for (const t of TIERS) {
      const [scLe, scGt, pr] = GOLDEN[scheme][t];
      it(`${scheme} ${t}: SC≤1969 ${scLe}%, SC>1969 ${scGt}%, PR ${pr}%`, () => {
        expect(subsidyRate(rules, scheme, { t, r: "sc", b: "le1969" })).toBeCloseTo(scLe / 100);
        expect(subsidyRate(rules, scheme, { t, r: "sc", b: "gt1969" })).toBeCloseTo(scGt / 100);
        expect(subsidyRate(rules, scheme, { t, r: "pr", b: "le1969" })).toBeCloseTo(pr / 100);
        expect(subsidyRate(rules, scheme, { t, r: "none", b: "le1969" })).toBe(0);
      });
    }
  }

  it.each([
    [0, "T0"], [900, "T0"], [901, "T0"], [1500, "T0"], [1501, "T1"], [2300, "T1"], [2301, "T2"],
    [2600, "T2"], [2601, "T3"], [3600, "T3"], [3601, "T4"], [4800, "T4"], [4801, "T5"], [99999, "T5"],
  ] as const)("PCHI $%i → %s", (pchi, tier) => {
    expect(tierForPchi(rules, pchi)).toBe(tier);
  });

  it("no income: Annual Value $21,000 → T0, $21,001 → T5", () => {
    expect(tierForAnnualValue(21000)).toBe("T0");
    expect(tierForAnnualValue(21001)).toBe("T5");
  });

  it("income helper ranges are band limits × household size (spec 08, 2 people)", () => {
    expect(incomeOptions(rules, 2).map((o) => [o.min, o.max])).toEqual([
      [0, 3000], [3001, 4600], [4601, 5200], [5201, 7200], [7201, 9600], [9601, null],
    ]);
  });

  it("income helper ranges leave no gaps for any household size", () => {
    for (const size of [1, 2, 3, 7, 10]) {
      const o = incomeOptions(rules, size);
      o.slice(1).forEach((x, i) => expect(x.min).toBe(o[i]!.max! + 1));
    }
  });
});

// ---------- matching: one positive and one negative test per rule, generated from the rule itself ----------
const NEUTRAL: Session = { v: V, w: "changed_at_home", d: false, adl: [], al: "no", mem: "no", hlp: "no", lim: "ok", med: false };
const ALT: Record<string, string[]> = {
  where: ["in_hospital", "changed_at_home", "struggling"], alone: ["weekdays", "most", "no", "unsure"],
  memory: ["dx", "undx", "no", "unsure"], helper: ["yes", "considering", "no", "unsure"], limits: ["ok", "tired", "cant", "unsure"],
};
const FIELD: Record<string, keyof Session> = { where: "w", discharged: "d", alone: "al", memory: "mem", helper: "hlp", limits: "lim", med: "med", adl: "adl" };

function satisfy(rule: RulesBundle["needRules"][number]): Session {
  const s: Record<string, unknown> = { ...NEUTRAL };
  for (const c of rule.when) {
    const f = FIELD[c.q]!;
    if (c.in) s[f] = c.in[0];
    else if (c.is != null) s[f] = c.is;
    else if (c.any) s[f] = [c.any[0]];
    else if (c.none) s[f] = [];
  }
  return s as Session;
}
function breakFirst(rule: RulesBundle["needRules"][number], s: Session): Session {
  const c = rule.when[0]!;
  const f = FIELD[c.q]!;
  const out: Record<string, unknown> = { ...s };
  if (c.in) out[f] = ALT[c.q]!.find((v) => !c.in!.includes(v));
  else if (c.is != null) out[f] = !c.is;
  else if (c.any) out[f] = [];
  else if (c.none) out[f] = ["bath"];
  return out as Session;
}
const allServices = (s: Session) => { const m = matchServices(rules, s); return [...m.matches, ...m.more].map((x) => x.serviceId); };

describe("matching rules", () => {
  it("movement trouble at home matches home therapy, not the retired centre rehab (source audit)", () => {
    const ids = matchServices(rules, { v: V, w: "changed_at_home", adl: ["move"], al: "no", mem: "no", hlp: "no", lim: "ok" }).matches.map((m) => m.serviceId);
    expect(ids).toContain("home_therapy");
    expect(ids).not.toContain("centre_rehab");
  });
  it("struggling branch leads with respite; other branches keep priority order", () => {
    const tan: Session = { v: V, w: "struggling", adl: ["bath"], al: "most", mem: "dx", hlp: "no", lim: "cant" };
    expect(matchServices(rules, tan).matches.map((m) => m.serviceId)).toEqual(["respite", "dementia_day_care", "home_personal_care"]);
    const home = matchServices(rules, { ...tan, w: "changed_at_home" }).matches.map((m) => m.serviceId);
    expect(home.at(-1)).toBe("respite");
  });
  for (const rule of rules.needRules.filter((r) => r.enabled !== false)) {
    it(`${rule.ruleId} suggests ${rule.serviceId} when its answers hold, and not otherwise`, () => {
      const yes = satisfy(rule);
      expect(rule.when.every((c) => clauseHolds(c, yes))).toBe(true);
      expect(allServices(yes)).toContain(rule.serviceId);
      expect(allServices(breakFirst(rule, yes))).not.toContain(rule.serviceId);
    });
  }

  it("the medical-care card never counts as a daily activity", () => {
    expect(matchServices(rules, { ...NEUTRAL, med: true }).adlCount).toBe(0);
  });

  it("recently discharged drops the ward-only service", () => {
    const s: Session = { ...NEUTRAL, w: "in_hospital", d: false };
    expect(allServices(s)).toContain("interim_caregiver_service");
    expect(allServices({ ...s, d: true })).not.toContain("interim_caregiver_service");
  });

  it("all 'not sure' gives no matches and asks to confirm with a professional (case 11)", () => {
    const m = matchServices(rules, { v: V, w: "unsure", adl: ["unsure"], al: "unsure", mem: "unsure", hlp: "unsure", lim: "unsure" });
    expect(m.matches).toHaveLength(0);
    expect(m.confirmWithProfessional).toBe(true);
    expect(m.branchId).toBe("changed_at_home");
  });

  it(`more than ${MAX_MATCHES} matches: top ${MAX_MATCHES} by priority, the rest under "more" (case 12)`, () => {
    const m = matchServices(rules, { ...NEUTRAL, w: "in_hospital", adl: ["bath", "eat", "move"], al: "weekdays", lim: "tired", med: true });
    expect(m.matches).toHaveLength(MAX_MATCHES);
    expect(m.more.length).toBeGreaterThan(0);
    const p = m.matches.map((x) => x.priority);
    expect(p).toEqual([...p].sort((a, b) => a - b));
  });

  it("in a nursing home: no matching (case 13), and no 'we need more' prompt", () => {
    const m = matchServices(rules, { ...NEUTRAL, w: "in_nursing_home", adl: ["bath"] });
    expect(m.matches).toEqual([]);
    expect(m.confirmWithProfessional).toBe(false);
  });

  it("the grant question appears in the hospital ask list only at 3+ daily activities", () => {
    const q = "Can she be assessed for the Home Caregiving Grant?";
    expect(matchServices(rules, { ...NEUTRAL, w: "in_hospital", adl: ["bath", "dress"] }).askList).not.toContain(q);
    expect(matchServices(rules, { ...NEUTRAL, w: "in_hospital", adl: ["bath", "dress", "eat"] }).askList).toContain(q);
  });

  it("memory problems raise the dementia note", () => {
    expect(matchServices(rules, { ...NEUTRAL, mem: "dx" }).dementiaNote).toMatch(/psychiatric care needs take longer/);
    expect(matchServices(rules, NEUTRAL).dementiaNote).toBeNull();
  });
});

// ---------- cost ----------
const MEI: Session = {
  v: V, w: "in_hospital", d: false, adl: ["bath", "dress"], al: "weekdays", mem: "no", hlp: "no", lim: "ok",
  plan: [{ s: "day_care", n: 5 }, { s: "home_personal_care", n: 2 }], t: "T0", r: "sc", b: "le1969", x: 3,
};

describe("cost", () => {
  it("Mei's plan matches the wireframe figures", () => {
    const c = costPlan(rules, MEI);
    expect(c.total!.withSubsidy).toEqual({ low: 355, high: 575 });
    expect(c.total!.fullPrice).toEqual({ low: 2310, high: 3155 });
    expect(c.split).toEqual({ people: 3, each: { low: 120, high: 190 } });
    expect(c.lines.map((l) => l.serviceId)).toEqual(["day_care", "home_personal_care", "day_care_transport"]);
    const dc = c.lines[0]!;
    expect(dc.withSubsidy).toEqual({ low: 60, high: 80 });
    expect(dc.fullPrice).toEqual({ low: 1190, high: 1605 });
    expect(c.lines[2]!.withSubsidy).toEqual(c.lines[2]!.fullPrice);   // transport: full price in both columns
  });

  it("one day-care session a week, every tier and residency, matches the golden table", () => {
    for (const t of TIERS) {
      for (const [r, b, i] of [["sc", "le1969", 0], ["sc", "gt1969", 1], ["pr", "le1969", 2]] as const) {
        const pct = GOLDEN.non_residential[t][i];
        const c = costPlan(rules, { v: V, plan: [{ s: "day_care", n: 1 }, { s: "day_care_transport", n: 0 }], t, r, b });
        expect(c.lines[0]!.withSubsidy!.low).toBe(round5(55 * WEEKS_PER_MONTH * (1 - pct / 100)));
      }
    }
  });

  it("every service's low stays at or below its high after rounding", () => {
    for (const p of rules.priceReferences.prices) {
      for (const n of [1, 3, 7]) {
        const c = costPlan(rules, { v: V, plan: [{ s: p.serviceId, n }], t: "T2", r: "sc", b: "le1969" });
        for (const l of c.lines) {
          expect(l.fullPrice.low).toBeLessThanOrEqual(l.fullPrice.high);
          expect(l.withSubsidy!.low).toBeLessThanOrEqual(l.withSubsidy!.high);
        }
      }
    }
  });

  it("grants and payouts are never subtracted from any total (ADR-004)", () => {
    const heavy: Session = { ...MEI, adl: ["bath", "dress", "eat", "toilet"] };
    const m = matchServices(rules, heavy);
    expect(potentialGrants(rules, heavy, m.adlCount).length).toBeGreaterThan(0);
    expect(costPlan(rules, heavy).total).toEqual(costPlan(rules, MEI).total);   // same plan, more grants, same total
  });

  it("Home Caregiving Grant only at 3+ daily activities and the right band", () => {
    const hcg = (adl: number, t: TierId) =>
      potentialGrants(rules, { ...MEI, t }, adl).find((g) => g.grantId === "home_caregiving_grant")?.amount;
    expect(hcg(2, "T0")).toBeUndefined();
    expect(hcg(3, "T0")).toBe(600);
    expect(hcg(3, "T1")).toBe(400);
    expect(hcg(3, "T3")).toBe(400);
    expect(hcg(3, "T4")).toBe(200);
    expect(hcg(3, "T5")).toBeUndefined();
    expect(potentialGrants(rules, { ...MEI, w: "in_nursing_home" }, 6).some((g) => g.grantId === "home_caregiving_grant")).toBe(false);
  });

  it("levy concession needs a helper; without 1 activity it is flagged for the age check", () => {
    expect(potentialGrants(rules, MEI, 0).some((g) => g.grantId === "levy_concession")).toBe(false);
    const g = potentialGrants(rules, { ...MEI, hlp: "yes" }, 0).find((x) => x.grantId === "levy_concession");
    expect(g?.needsAgeCheck).toBe(true);
    expect(potentialGrants(rules, { ...MEI, hlp: "yes" }, 1).find((x) => x.grantId === "levy_concession")?.needsAgeCheck).toBe(false);
  });

  it("not a citizen or PR: full prices only, no grants (case 1)", () => {
    const c = costPlan(rules, { ...MEI, r: "none" });
    expect(c.total!.withSubsidy).toBeNull();
    expect(c.lines.every((l) => l.withSubsidy === null)).toBe(true);
    expect(potentialGrants(rules, { ...MEI, r: "none" }, 6)).toEqual([]);
  });

  it("no subsidy figure until both income band and residency are picked", () => {
    for (const s of [{ ...MEI, t: undefined }, { ...MEI, r: undefined }]) {
      const c = costPlan(rules, s);
      expect(c.total!.withSubsidy).toBeNull();
      expect(c.lines.every((l) => l.withSubsidy === null)).toBe(true);
      expect(c.split!.each).toEqual({ low: 770, high: 1050 });      // split falls back to full price
    }
  });

  it("income above $4,800 per person: both columns equal (case 2)", () => {
    expect(costPlan(rules, { ...MEI, t: "T5" }).total!.sameAsFullPrice).toBe(true);
  });

  it("empty plan: no totals (case 4)", () => {
    expect(costPlan(rules, { ...MEI, plan: [] }).total).toBeNull();
  });

  it("a quote replaces both ends of the price", () => {
    const l = costPlan(rules, { ...MEI, q: { day_care: 70 } }).lines[0]!;
    expect([l.priceLow, l.priceHigh, l.quoted]).toEqual([70, 70, true]);
  });

  it("transport: added with day care, removable with n: 0, never on its own", () => {
    expect(planEntries({ v: V, plan: [{ s: "day_care", n: 3 }] }).map((e) => e.s)).toContain("day_care_transport");
    expect(planEntries({ v: V, plan: [{ s: "day_care", n: 3 }, { s: "day_care_transport", n: 0 }] }).map((e) => e.s)).not.toContain("day_care_transport");
    expect(planEntries({ v: V, plan: [{ s: "day_care_transport", n: 1 }] })).toEqual([]);
  });

  it("services without a published price are listed, not costed", () => {
    expect(costPlan(rules, { ...MEI, plan: [{ s: "interim_caregiver_service", n: 1 }] }).unpriced).toEqual(["interim_caregiver_service"]);
  });

  it("nursing home: a 'from' figure beside real bills (ADR-007)", () => {
    const nh = nursingHome(rules, MEI);
    expect(nh.from).toBe(980);                        // $4,900 × (1 − 80%)
    expect(nh.realBills).toEqual({ low: 620, high: 3069, sourceId: "renci_fees" });
    expect(nursingHome(rules, { ...MEI, t: "T5" }).from).toBe(4900);
  });
});

// ---------- shared link ----------
describe("URL codec", () => {
  it("round-trips a full session and a step", () => {
    const s: Session = { ...MEI, loc: { sec: "56" }, q: { day_care: 70 }, med: true };
    expect(decodeSession(encodeSession(s))).toEqual(s);
    expect(decodeHash(encodeHash("action", s))).toEqual({ step: "action", session: s });
  });

  it("rejects unknown fields, a full postal code and free text", () => {
    expect(() => encodeSession({ ...MEI, name: "Mum" } as Session)).toThrow();
    expect(() => encodeSession({ ...MEI, loc: { sec: "560123" } })).toThrow();
    const smuggled = btoa(JSON.stringify({ v: V, nric: "S1234567A" })).replace(/=+$/, "");
    expect(decodeSession(smuggled)).toBeNull();
  });

  it("enforces the edge-case limits: quotes $1–$10,000, split 1–10 (cases 6–8)", () => {
    expect(() => encodeSession({ ...MEI, q: { day_care: 0 } })).toThrow();
    expect(() => encodeSession({ ...MEI, q: { day_care: 10_001 } })).toThrow();
    expect(() => encodeSession({ ...MEI, x: 11 })).toThrow();
  });

  it("rejects repeated daily activities and repeated services (they would inflate grants and costs)", () => {
    expect(() => encodeSession({ ...MEI, adl: ["bath", "bath", "bath"] })).toThrow();
    expect(() => encodeSession({ ...MEI, plan: [{ s: "day_care", n: 5 }, { s: "day_care", n: 5 }] })).toThrow();
    const tampered = btoa(JSON.stringify({ v: V, adl: ["bath", "bath", "bath"] })).replace(/=+$/, "");
    expect(decodeSession(tampered)).toBeNull();
  });

  it("falls back safely on a malformed link (case 18)", () => {
    expect(decodeHash("#s=cost&p=not-base64!!")).toBeNull();
    expect(decodeHash("#s=nowhere&p=" + encodeSession(MEI))!.step).toBe("where");
  });

  it("a typical link stays short", () => {
    expect(encodeHash("action", { ...MEI, loc: { sec: "56" } }).length).toBeLessThan(400);
  });
});
