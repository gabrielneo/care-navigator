import { describe, expect, it } from "vitest";
import rulesJson from "../../../../public/data/rules.json";
import type { RulesBundle } from "../../data/types";
import { costPlan, nursingHome, planEntries, potentialGrants, round5, severeCount, severeOnlyHidden, WEEKS_PER_MONTH } from "../cost";
import { clauseHolds, matchServices, MAX_MATCHES } from "../matching";
import { nextSteps } from "../steps";
import { reminders, remindersIcs } from "../reminders";
import { incomeOptions, subsidyRate, tierForAnnualValue, tierForPchi, type TierId } from "../tiers";
import { decodeHash, decodeSession, encodeHash, encodeSession, type Session } from "../urlCodec";
import { daysOf, daysText, entryFor } from "../days";

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
const FIELD: Record<string, keyof Session> = { where: "w", discharged: "d", alone: "al", memory: "mem", helper: "hlp", limits: "lim", med: "med", adl: "adl", cond: "cond" };

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

  it("8.1: severe-only payouts need 3 activities she can't do at all; some-help grants need only help", () => {
    const three: Session = { ...MEI, adl: ["bath", "dress", "toilet"], t: "T0", r: "sc" };
    const ids = (s: Session) => potentialGrants(rules, s, 3).map((g) => g.grantId);
    // Needs help with 3, can't do none: Home Caregiving Grant and Pioneer scheme yes; CareShield, MediSave Care, ElderFund no.
    expect(ids(three)).toEqual(expect.arrayContaining(["home_caregiving_grant", "pioneer_das"]));
    expect(ids(three)).not.toEqual(expect.arrayContaining(["careshield_life"]));
    for (const severe of ["careshield_life", "medisave_care", "elderfund"]) expect(ids(three)).not.toContain(severe);
    expect(severeOnlyHidden(rules, three, 3)).toEqual(["MediSave Care", "CareShield Life payout", "ElderFund"]);
    // Can't do 2 of them: still not severe enough.
    expect(ids({ ...three, sev: ["bath", "dress"] })).not.toContain("careshield_life");
    // Can't do all 3: the severe payouts appear, and nothing is left out.
    const severe = { ...three, sev: ["bath", "dress", "toilet"] } as Session;
    expect(ids(severe)).toEqual(expect.arrayContaining(["careshield_life", "medisave_care", "elderfund"]));
    expect(severeOnlyHidden(rules, severe, 3)).toEqual([]);
    // "Can't do" only counts activities also marked as needing help.
    expect(severeCount({ ...three, sev: ["eat", "move", "transfer"] } as Session)).toBe(0);
    // A PR: ElderFund is citizens only, so it isn't listed or mentioned.
    expect(severeOnlyHidden(rules, { ...three, r: "pr" }, 3)).not.toContain("ElderFund");
    expect(potentialGrants(rules, three, 3).find((g) => g.grantId === "pioneer_das")?.askIf).toBe("if she is a Pioneer Generation member");
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

  it("8.1: links carry which activities she can't do at all; older links without it still open", () => {
    const s: Session = { v: V, adl: ["bath", "dress"], sev: ["bath"] };
    expect(decodeSession(encodeSession(s))).toEqual(s);
    expect(decodeSession(encodeSession({ v: V, adl: ["bath"] }))).toEqual({ v: V, adl: ["bath"] });
    const repeated = { v: V, sev: ["bath", "bath"] } as Session;
    expect(() => encodeSession(repeated)).toThrow();                                          // never written
    expect(decodeSession(Buffer.from(JSON.stringify(repeated)).toString("base64url"))).toBeNull();   // never read
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

describe("next steps (8.2)", () => {
  const ids = (s: Session) => nextSteps(rules, s).map((x) => `${x.timing}:${x.id}`);
  const MEI_PLAN: Session = { v: V, w: "in_hospital", d: false, adl: ["bath", "dress"], al: "weekdays", mem: "no", hlp: "no", lim: "ok",
    plan: [{ s: "day_care", n: 5 }, { s: "home_personal_care", n: 2 }], t: "T1", r: "sc", b: "le1969" };

  it("starts with the first call, then follows her services and grants in order", () => {
    expect(ids(MEI_PLAN)).toEqual(["now:call_first", "week:apply_services", "week:means_test", "later:medifund", "later:caregiver_training", "later:lpa", "later:acp"]);
    const groups = Object.fromEntries(nextSteps(rules, MEI_PLAN).map((x) => [x.id, x.group]));
    expect(groups).toMatchObject({ call_first: "plan", means_test: "plan", caregiver_training: "carer", lpa: "ahead", acp: "ahead" });
    expect(nextSteps(rules, MEI_PLAN)[0]!.text).toBe("Call the medical social worker on her ward, before she's discharged.");
  });

  it("9.10 and 9.11: ComCare when the carer is struggling, helper-leave respite when there's a helper", () => {
    expect(ids(MEI_PLAN)).not.toContain("week:comcare");
    expect(ids({ ...MEI_PLAN, lim: "tired" } as Session)).toContain("week:comcare");
    expect(ids(MEI_PLAN)).not.toContain("later:helper_leave_respite");
    expect(ids({ ...MEI_PLAN, hlp: "yes" } as Session)).toContain("later:helper_leave_respite");
    expect(ids({ ...MEI_PLAN, plan: [] } as Session)).not.toContain("later:medifund");       // no services, no bill yet
  });

  it("adds the assessment report before the Home Caregiving Grant, and says which comes first", () => {
    const heavy = { ...MEI_PLAN, adl: ["bath", "dress", "toilet"] } as Session;
    const steps = nextSteps(rules, heavy);
    const far = steps.findIndex((x) => x.id === "far"), hcg = steps.findIndex((x) => x.id === "apply_hcg");
    expect(far).toBeGreaterThan(0);
    expect(hcg).toBeGreaterThan(far);
    expect(steps[hcg]!.after).toBe("Functional Assessment Report");
    expect(ids(heavy)).not.toContain("month:severe_assessment");        // needs help, but none "can't do at all"
    expect(ids({ ...heavy, sev: ["bath", "dress", "toilet"] } as Session)).toContain("month:severe_assessment");
  });

  it("respite referral for a tired carer; nothing about grants before income is known", () => {
    expect(ids({ ...MEI_PLAN, lim: "tired" })).toContain("week:respite_referral");
    expect(ids({ ...MEI_PLAN, t: undefined, r: undefined })).not.toContain("later:caregiver_training");
  });

  it("every step names a source in the manifest", () => {
    const heavy = { ...MEI_PLAN, adl: ["bath", "dress", "toilet"], sev: ["bath", "dress", "toilet"], hlp: "yes", lim: "cant" } as Session;
    for (const st of nextSteps(rules, heavy)) expect(st.sourceIds.length).toBeGreaterThan(0);
  });

  it("8.6: ticked steps travel in the link", () => {
    const s: Session = { v: V, done: ["call_first", "far"] };
    expect(decodeSession(encodeSession(s))).toEqual(s);
    expect(() => encodeSession({ v: V, done: ["far", "far"] })).toThrow();
  });
});

describe("grant criteria (8.5)", () => {
  it("every grant she may qualify for carries its criteria", () => {
    const s: Session = { v: V, w: "changed_at_home", adl: ["bath", "dress", "toilet"], sev: ["bath", "dress", "toilet"], hlp: "yes", t: "T0", r: "sc" };
    const gs = potentialGrants(rules, s, 3);
    expect(gs.length).toBeGreaterThanOrEqual(6);
    for (const g of gs) expect(g.criteria.length).toBeGreaterThan(0);
  });
});

describe("health events (8.7) and support for the carer (8.8)", () => {
  const BASE: Session = { v: V, w: "changed_at_home", adl: [], al: "no", mem: "no", hlp: "no", lim: "ok" };
  it("a fall, stroke or broken hip suggests home therapy; a serious illness suggests palliative care at home", () => {
    for (const c of ["fall", "stroke", "hip"] as const) expect(allServices({ ...BASE, cond: [c] })).toContain("home_therapy");
    expect(allServices({ ...BASE, cond: ["eol"] })).toContain("home_palliative_care");
    expect(allServices(BASE)).not.toContain("home_palliative_care");
  });
  it("a serious illness adds the specially trained Advance Care Plan step", () => {
    const steps = nextSteps(rules, { ...BASE, cond: ["eol"] }).map((x) => x.id);
    expect(steps).toContain("acp_serious");
    expect(nextSteps(rules, BASE).map((x) => x.id)).not.toContain("acp_serious");
  });
  it("mindline only when the carer can't keep going; the support network when tired or worse", () => {
    const ids = (lim: Session["lim"]) => nextSteps(rules, { ...BASE, lim }).map((x) => x.id);
    expect(ids("ok")).not.toContain("carer_network");
    expect(ids("tired")).toContain("carer_network");
    expect(ids("tired")).not.toContain("mindline");
    expect(ids("cant")).toEqual(expect.arrayContaining(["mindline", "carer_network"]));
  });
  it("the condition list travels in the link, with no repeats", () => {
    expect(decodeSession(encodeSession({ v: V, cond: ["fall", "eol"] }))).toEqual({ v: V, cond: ["fall", "eol"] });
    expect(() => encodeSession({ v: V, cond: ["fall", "fall"] })).toThrow();
  });
});

describe("calendar reminders (8.11)", () => {
  const S: Session = { v: V, w: "in_hospital", d: false, adl: ["bath", "dress", "toilet"], al: "weekdays", mem: "no", hlp: "no", lim: "tired",
    plan: [{ s: "day_care", n: 5 }], t: "T1", r: "sc", b: "le1969" };
  const today = new Date(2026, 10, 26);
  it("reminds about open this-week and this-month steps, skips ticked ones, and adds a review", () => {
    const steps = nextSteps(rules, S);
    const all = reminders(steps, [], today);
    const ticked = reminders(steps, ["far"], today);
    expect(all.find((r) => r.title === "Care plan: Functional Assessment Report")!.date).toEqual(new Date(2026, 11, 3));
    expect(all.find((r) => r.title === "Care plan: Home Caregiving Grant")!.date).toEqual(new Date(2026, 11, 26));
    expect(ticked.some((r) => r.title === "Care plan: Functional Assessment Report")).toBe(false);
    expect(all.at(-1)!.title).toBe("Care plan: review it");
    expect(all.some((r) => r.title.includes("First call"))).toBe(false);          // "now" steps aren't reminders
  });
  it("writes a valid calendar file with escaped text and folded lines", () => {
    const ics = remindersIcs([{ date: today, title: "Care plan: a, b; c", detail: "x".repeat(200) }], "https://example.org/plan/#s=action", today);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0")).toBe(true);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261126");
    expect(ics).toContain("SUMMARY:Care plan: a\\, b\\; c");
    for (const line of ics.split("\r\n")) expect(line.length).toBeLessThanOrEqual(75);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });
});

describe("Pioneer and Merdeka Generation (8.12)", () => {
  const S: Session = { v: V, w: "changed_at_home", adl: ["bath", "dress", "toilet"], t: "T1", r: "sc", b: "le1969" };
  const pio = (g?: Session["g"]) => potentialGrants(rules, { ...S, g }, 3).find((x) => x.grantId === "pioneer_das");
  it("shows the Pioneer scheme with a caveat until known, without it for Pioneers, and hides it otherwise", () => {
    expect(pio()?.askIf).toBe("if she is a Pioneer Generation member");
    expect(pio("unsure")?.askIf).toBe("if she is a Pioneer Generation member");
    expect(pio("pg")).toBeDefined();
    expect(pio("pg")?.askIf).toBeNull();
    expect(pio("mg")).toBeUndefined();
    expect(pio("no")).toBeUndefined();
  });
});

describe("9.3 link length", () => {
  it("the heaviest possible plan still makes a link under 2,000 characters", () => {
    // Every field at its limit: all services at 7 a week with a 5-digit quote, every activity severe, the longest step
    // ids ticked, Tamil, a split, the longest data version. 2,000 is the classic safe URL length for old browsers and apps.
    const ids = rules.serviceTypes.map((x) => x.serviceId).slice(0, 13);
    const steps = rules.nextSteps.map((x) => x.stepId).sort((a, b) => b.length - a.length).slice(0, 20);
    const all = ["bath", "dress", "toilet", "move", "eat", "transfer"] as const;
    const heavy: Session = {
      v: "2026.11.26-999", w: "in_hospital", d: true, adl: [...all], sev: [...all], cond: ["fall", "stroke", "hip", "eol"],
      al: "weekdays", mem: "undx", hlp: "considering", lim: "unsure", med: true, loc: { sec: "56" },
      plan: ids.map((s) => ({ s, n: 7 })), t: "T5", r: "none", b: "gt1969", g: "unsure",
      q: Object.fromEntries(ids.map((s) => [s, 10_000])), x: 10, l: "ta", done: steps,
    };
    const url = `https://care-navigator-xi.vercel.app/plan/${encodeHash("contacts", heavy)}`;
    expect(decodeHash(new URL(url).hash)?.session).toEqual(heavy);
    expect(url.length).toBeLessThan(2000);
  });
});

describe("days of the week (week builder)", () => {
  const same = (x: string) => x;
  const comma = (xs: string[]) => xs.join(", ");
  it("says the days the way people do", () => {
    expect(daysText([0, 1, 2, 3, 4], same, comma)).toBe("Mon–Fri");
    expect(daysText([1, 3], same, comma)).toBe("Tue, Thu");
    expect(daysText([5, 6], same, comma)).toBe("Sat, Sun");
    expect(daysText([0, 1, 2, 5], same, comma)).toBe("Mon–Wed, Sat");
    expect(daysText([0, 1, 2, 3, 4, 5, 6], same, comma)).toBe("Every day");
  });
  it("keeps chosen days in the link, and older links get the usual spread", () => {
    const e = entryFor("day_care", [0, 2, 5]);
    expect(e).toEqual({ s: "day_care", n: 3, d: 0b100101 });
    expect(daysOf(e)).toEqual([0, 2, 5]);
    expect(daysOf({ n: 2 })).toEqual([1, 3]);
    const s = { v: V, plan: [e] } as Session;
    expect(decodeSession(encodeSession(s))?.plan).toEqual([e]);
  });
  it("rejects a link whose days and count disagree", () => {
    expect(() => encodeSession({ v: V, plan: [{ s: "day_care", n: 5, d: 0b11 }] } as Session)).toThrow();
  });
});
