"use client";
// The planner's sense of progress: a journey bar across the six stages, and "Her plan so far", which collects each answer
// and result as a chip as the family goes (a strip on phones, a sticky side panel on wide screens).
import { rules } from "@/lib/data";
import { costPlan } from "@/lib/engine/cost";
import { matchServices } from "@/lib/engine/matching";
import type { Clause } from "@/lib/data/types";
import type { TierId } from "@/lib/engine/tiers";
import type { Session, Step } from "@/lib/engine/urlCodec";
import { CountRange } from "./ui";
import { daysOf, daysText } from "@/lib/engine/days";
import { list as join, t } from "@/lib/i18n";

export type Who = NonNullable<Session["who"]>;
/** 9.6: who the plan is for, and the few sentences that name them. Everything else follows "she" or "he" through t(). */
export const WHO: Record<Who, { label: string; where: string; plan: string; about: string }> = {
  mum: { label: "Mum", where: "Where is Mum right now?", plan: "Mum's care plan", about: "About Mum: for her social worker or AIC Link" },
  dad: { label: "Dad", where: "Where is Dad right now?", plan: "Dad's care plan", about: "About Dad: for his social worker or AIC Link" },
  wife: { label: "My wife", where: "Where is your wife right now?", plan: "Your wife's care plan",
    about: "About your wife: for her social worker or AIC Link" },
  husband: { label: "My husband", where: "Where is your husband right now?", plan: "Your husband's care plan",
    about: "About your husband: for his social worker or AIC Link" },
  she: { label: "Someone else (she)", where: "Where is she right now?", plan: "Her care plan", about: "About her: for her social worker or AIC Link" },
  he: { label: "Someone else (he)", where: "Where is he right now?", plan: "His care plan", about: "About him: for his social worker or AIC Link" },
};
export const isMale = (s: Session) => s.who === "dad" || s.who === "husband" || s.who === "he";

export const QUESTIONS: Step[] = ["where", "adl", "alone", "memory", "helper", "limits", "postal"];
const PHASES: [string, Step[]][] = [
  ["About her", QUESTIONS], ["Services", ["matches"]], ["Her week", ["week"]], ["Cost", ["cost"]], ["Who to call", ["contacts"]], ["Plan", ["action"]],
];

export function JourneyBar({ step, flow, go }: { step: Step; flow: Step[]; go: (to: Step) => void }) {
  const phases = PHASES.map(([label, steps]) => [label, steps.filter((x) => flow.includes(x))] as const).filter(([, st]) => st.length);
  const at = phases.findIndex(([, st]) => st.includes(step));
  const q = QUESTIONS.indexOf(step);
  return (
    <nav className="journey no-print" aria-label={t("Progress")}>
      <ol>
        {phases.map(([label, st], i) => {
          const state = i < at ? "done" : i === at ? "now" : "todo";
          const fill = state === "done" ? 1 : state === "now" ? (q >= 0 && st.length > 1 ? (q + 1) / st.length : 1) : 0;
          return (
            <li key={label} className={state} aria-current={state === "now" ? "step" : undefined}>
              <span className="jseg"><i style={{ transform: `scaleX(${fill})` }} /></span>
              {state === "done"
                ? <button type="button" onClick={() => go(st[0]!)}>{t(label)}<span className="sr-only">{t(" (done, go back)")}</span></button>
                : <span className="lbl">{t(label)}</span>}
            </li>
          );
        })}
      </ol>
      <p className="journey-now" aria-hidden="true">{t("Step {n} of {total}: {name}", { n: at + 1, total: phases.length, name: t(phases[at]?.[0] ?? "") })}{q >= 0 && phases[at]?.[1].length !== 1 ? t(", question {q} of 7", { q: q + 1 }) : ""}</p>
    </nav>
  );
}

export const TIER_LABEL: Record<TierId, string> = {
  T0: "$1,500 and below", T1: "$1,501 – $2,300", T2: "$2,301 – $2,600", T3: "$2,601 – $3,600", T4: "$3,601 – $4,800", T5: "Above $4,800",
};
const WHERE: Record<string, string> = {
  in_hospital: "In hospital", changed_at_home: "At home, needs changed", struggling: "At home, hard to cope",
  in_nursing_home: "In a nursing home", unsure: "Not sure where",
};
const COND_SHORT: Record<string, string> = { fall: "Recent fall", stroke: "Stroke", hip: "Broken hip", eol: "Serious illness" };
const ADL: Record<string, string> = { bath: "washing", dress: "dressing", eat: "eating", toilet: "the toilet", move: "walking", transfer: "getting up" };
const ALONE: Record<string, string> = { weekdays: "Alone on weekdays", most: "Alone most days", no: "Usually has company" };
const MEMORY: Record<string, string> = { dx: "Dementia diagnosed", undx: "Memory problems" };
const HELPER: Record<string, string> = { yes: "Live-in helper", considering: "Thinking about a helper" };
const LIMITS: Record<string, string> = { ok: "You're managing", tired: "You need a break", cant: "You're at your limit" };
const REGION: Record<string, string> = { central: "Central", north: "North", northeast: "North-East", east: "East", west: "West" };
const SHORT: Record<string, string> = {
  day_care: "Day care", dementia_day_care: "Dementia day care", home_personal_care: "Home care", home_nursing: "Nurse visits",
  home_therapy: "Therapy", community_rehab: "Centre therapy", medical_escort: "Escort", meals_on_wheels: "Meals", respite: "Respite",
};

/** "Because you said…": her own answers behind a match, worded like the chips. Clauses about the hospital stage
 *  itself ("not yet discharged") add nothing she'd recognise, so they're left out. */
export function becauseOf(when: Clause[], s: Session): string[] {
  return when.flatMap((c): string[] => {
    switch (c.q) {
      case "where": return s.w ? [t(s.w === "in_hospital" && s.d ? "Home from hospital" : WHERE[s.w]!)] : [];
      case "adl": {
        const hit = (Array.isArray(s.adl) ? (s.adl as string[]) : []).filter((a) => !c.any || c.any.includes(a));
        return hit.length ? [t("Help with {list}", { list: join(hit.map((a) => t(ADL[a]!))) })] : [];
      }
      case "cond": return (s.cond ?? []).filter((x) => c.any?.includes(x)).map((x) => t(COND_SHORT[x]!));
      case "med": return s.med ? [t("Medical care at home")] : [];
      case "alone": return s.al && ALONE[s.al] ? [t(ALONE[s.al]!)] : [];
      case "memory": return s.mem && MEMORY[s.mem] ? [t(MEMORY[s.mem]!)] : [];
      case "helper": return s.hlp && HELPER[s.hlp] ? [t(HELPER[s.hlp]!)] : [];
      case "limits": return s.lim && LIMITS[s.lim] ? [t(LIMITS[s.lim]!)] : [];
      default: return [];
    }
  });
}

/** The chips for what's known so far; each stage adds its result once the family has reached it. */
function chips(s: Session, reached: (x: Step) => boolean) {
  const out: [string, React.ReactNode][] = [];
  if (s.w) out.push(["where", t(s.w === "in_hospital" && s.d ? "Home from hospital" : WHERE[s.w]!)]);
  if (s.adl) out.push(["adl", s.adl[0] === "unsure" ? t("Help needed: not sure") : s.adl.length
    ? t("Help with {list}", { list: join((s.adl as string[]).map((a) => t(ADL[a]!))) }) : t("No help with daily tasks")]);
  const cant = (s.sev ?? []).filter((a) => Array.isArray(s.adl) && (s.adl as string[]).includes(a));
  if (cant.length) out.push(["sev", t("Can't do at all: {list}", { list: join(cant.map((a) => t(ADL[a]!))) })]);
  if (s.med) out.push(["med", t("Medical care at home")]);
  if (s.cond?.length) out.push(["cond", join(s.cond.map((c) => t(COND_SHORT[c]!)))]);
  for (const [k, v, map] of [["al", s.al, ALONE], ["mem", s.mem, MEMORY], ["hlp", s.hlp, HELPER], ["lim", s.lim, LIMITS]] as const) {
    if (v && map[v]) out.push([k, t(map[v]!)]);
  }
  if (s.loc) out.push(["loc", "sec" in s.loc ? t("Area {sec}", { sec: s.loc.sec }) : t("{region} region", { region: t(REGION[s.loc.reg]!) })]);
  if (reached("week") && s.plan?.some((e) => e.n > 0 && SHORT[e.s])) {
    out.push(["plan", join(s.plan.filter((e) => e.n > 0 && SHORT[e.s]).map((e) => t("{name} ({days})", { name: t(SHORT[e.s]!), days: daysText(daysOf(e), t, join) })))]);
  }
  const total = reached("cost") ? costPlan(rules, s).total : null;
  if (total?.withSubsidy) out.push(["cost", <><CountRange r={total.withSubsidy} />{t(" a month with subsidy")}</>]);
  else if (total) out.push(["cost", <><CountRange r={total.fullPrice} />{t(" a month, full price")}</>]);
  if (reached("contacts")) out.push(["call", t("Call first: {who}", { who: t(matchServices(rules, s).branch.firstContact) })]);
  return out;
}

// Which question or screen each chip came from, so tapping a chip goes straight back to change it.
const CHIP_STEP: Record<string, Step> = { where: "where", adl: "adl", sev: "adl", med: "adl", cond: "adl", al: "alone", mem: "memory",
  hlp: "helper", lim: "limits", loc: "postal", plan: "week", cost: "cost", call: "contacts" };

export function PlanSoFar({ s, step, flow, go, startNew }: {
  s: Session; step: Step; flow: Step[]; go: (to: Step) => void; startNew: () => void;
}) {
  const reached = (x: Step) => flow.includes(x) && flow.indexOf(step) >= flow.indexOf(x);
  const list = chips(s, reached);
  if (!list.length || step === "action") return null;
  return (
    <aside className="sofar no-print" aria-label={t("Her plan so far")}>
      <div className="sofar-head">
        <h2>{t("Her plan so far")}</h2>
        <button type="button" className="link" onClick={startNew}>{t("Start a new plan")}</button>
      </div>
      <ul>{list.map(([k, v], i) => {
        const to = CHIP_STEP[k];
        const latest = i === list.length - 1 ? <span className="sr-only">{t(" (latest)")}</span> : null;
        return (
          <li key={`${k}-${typeof v === "string" ? v : k}`}>
            {to && to !== step && flow.includes(to)
              ? <button type="button" onClick={() => go(to)}>{v}{latest}<span className="sr-only">{t(" (change)")}</span></button>
              : <span>{v}{latest}</span>}
          </li>
        );
      })}</ul>
    </aside>
  );
}

/** To-do 8.4: what a ward social worker or AIC Link officer asks first, from the answers given. No free text, no exact
 *  income, nothing sent anywhere: it's shown on the phone or printed on its own page. */
export function Handover({ s }: { s: Session }) {
  const adl = Array.isArray(s.adl) && s.adl[0] !== "unsure" ? (s.adl as string[]) : null;
  const cant = (s.sev ?? []).filter((a) => adl?.includes(a));
  const T = (x: string | undefined) => (x ? t(x) : undefined);
  const rows: [string, string | undefined][] = [
    ["Where she is now", T(s.w ? (s.w === "in_hospital" && s.d ? "Recently discharged from hospital" : WHERE[s.w]) : undefined)],
    ["Needs help with", s.adl?.[0] === "unsure" ? t("Not sure") : adl ? (adl.length ? join(adl.map((a) => t(ADL[a]!))) : t("None of the daily activities")) : undefined],
    ["Can't do at all", cant.length ? join(cant.map((a) => t(ADL[a]!))) : undefined],
    ["Medical care at home", T(s.med ? "Wounds, tubes, injections or many medicines" : undefined)],
    ["Recent health events", s.cond?.length ? join(s.cond.map((c) => t(COND_SHORT[c]!))) : undefined],
    ["During the day", T(s.al ? (ALONE[s.al] ?? "Not sure") : undefined)],
    ["Memory", T(s.mem ? (MEMORY[s.mem] ?? (s.mem === "no" ? "No problems noticed" : "Not sure")) : undefined)],
    ["Live-in helper", T(s.hlp ? ({ yes: "Yes", considering: "No, thinking about one", no: "No" } as Record<string, string>)[s.hlp] ?? "Not sure" : undefined)],
    ["Family carer", T(s.lim ? ({ ok: "Managing", tired: "Tired and needs a break", cant: "Can't keep going like this" } as Record<string, string>)[s.lim] ?? "Not sure" : undefined)],
    ["Area", s.loc ? ("sec" in s.loc ? t("Postal area {sec}", { sec: s.loc.sec }) : t("{region} region", { region: t(REGION[s.loc.reg]!) })) : undefined],
    ["Being considered", s.plan?.filter((e) => e.n > 0 && SHORT[e.s]).map((e) => t("{name} ({days})", { name: t(SHORT[e.s]!), days: daysText(daysOf(e), t, join) })).join("; ") || undefined],
    ["Household income per person", s.t ? t("{band} a month (range {id})", { band: t(TIER_LABEL[s.t as TierId]), id: s.t }) : undefined],
    ["Residency", T(s.r ? ({ sc: "Singapore Citizen", pr: "Permanent Resident", none: "Neither" } as Record<string, string>)[s.r] : undefined)],
    ["Generation", T(s.g === "pg" ? "Pioneer Generation" : s.g === "mg" ? "Merdeka Generation" : undefined)],
  ];
  return (
    <div className="handover">
      <h2>{t(WHO[s.who ?? "mum"].about)}</h2>
      <p className="meta">{t("What the family told Care Navigator, to save time when you talk. It isn't an assessment.")}</p>
      <dl>{rows.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{t(k)}</dt><dd>{v}</dd></div>)}</dl>
    </div>
  );
}
