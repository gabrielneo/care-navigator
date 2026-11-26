// Branch and service matching from the answers (data/curated/need_rules.yaml, branch_rules.yaml; docs/specs/09).
import type { Branch, Clause, NeedRule, RulesBundle } from "../data/types";
import type { Session } from "./urlCodec";

export const MAX_MATCHES = 3;   // top 3 first, the rest under "More that may help" (8.10, after CareCompass)
type BranchId = Branch["branchId"];

export interface Match {
  serviceId: string;
  reasonText: string;
  priority: number;
  sourceId: string;
}

export interface MatchResult {
  branchId: BranchId;
  branch: Branch;
  matches: Match[];          // up to 5, by priority
  more: Match[];             // "More that may help" (spec 09, case 12)
  adlCount: number;          // the 6 daily activities only; the medical-care card never counts
  confirmWithProfessional: boolean;
  dementiaNote: string | null;
  askList: string[];
}

const adlOf = (s: Session): string[] => (s.adl && s.adl[0] !== "unsure" ? (s.adl as string[]) : []);

/** The value a clause tests, from the session (field names: docs/specs/10). */
function answer(s: Session, q: Clause["q"]): unknown {
  switch (q) {
    case "where": return s.w === "unsure" ? "changed_at_home" : s.w;
    case "discharged": return s.d ?? false;
    case "alone": return s.al;
    case "memory": return s.mem;
    case "helper": return s.hlp;
    case "limits": return s.lim;
    case "med": return s.med ?? false;
    case "adl": return adlOf(s);
    case "cond": return s.cond ?? [];
  }
}

export function clauseHolds(c: Clause, s: Session): boolean {
  const v = answer(s, c.q);
  if (c.in != null) return typeof v === "string" && c.in.includes(v);
  if (c.is != null) return v === c.is;
  const list = v as string[];           // adl or cond
  if (c.any != null) return c.any.some((a) => list.includes(a));
  if (c.none != null) return c.none === (list.length === 0);
  return false;
}

export const ruleHolds = (r: NeedRule, s: Session) => r.enabled !== false && r.when.every((c) => clauseHolds(c, s));

export function matchServices(rules: RulesBundle, s: Session): MatchResult {
  const where = s.w === "unsure" || !s.w ? "changed_at_home" : s.w;
  const branch = rules.branchRules.branches.find((b) => b.branchId === where);
  if (!branch) throw new Error(`no branch ${where}`);
  const adlCount = adlOf(s).length;

  // In a nursing home: no matching; the cost screen shows the nursing-home figure (spec 09, case 13).
  const all: Match[] = where === "in_nursing_home" ? [] : rules.needRules
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => ruleHolds(r, s))
    .sort((a, b) => a.r.priority - b.r.priority || a.i - b.i)
    .map(({ r }) => ({ serviceId: r.serviceId, reasonText: r.reasonText, priority: r.priority, sourceId: r.sourceId }))
    .filter((m, i, arr) => arr.findIndex((x) => x.serviceId === m.serviceId) === i);
  // "We're struggling to cope": a break for the carer comes first (branch_rules.yaml flag).
  if (branch.flags.includes("lead_with_respite")) all.sort((a, b) => Number(b.serviceId === "respite") - Number(a.serviceId === "respite"));

  const unsure = [s.al, s.mem, s.hlp, s.lim, s.w].includes("unsure") || s.adl?.[0] === "unsure";
  const conditions = branch.askListConditions ?? {};
  const askList = branch.askList.filter((q) => {
    const need = conditions[q]?.adl_min;   // dict values keep their YAML snake_case keys
    return need == null || adlCount >= need;
  });
  const dementia = rules.branchRules.dementiaFlag;

  return {
    branchId: where,
    branch,
    matches: all.slice(0, MAX_MATCHES),
    more: all.slice(MAX_MATCHES),
    adlCount,
    confirmWithProfessional: unsure || (all.length === 0 && where !== "in_nursing_home"),   // that branch skips matching on purpose
    dementiaNote: clauseHolds(dementia.when, s) ? dementia.note : null,
    askList,
  };
}
