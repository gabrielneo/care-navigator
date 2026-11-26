// 8.13: the Chinese draft covers every text the rules data can show, and templates keep their placeholders.
import { beforeAll, describe, expect, it } from "vitest";
import rulesJson from "../../../public/data/rules.json";
import { HE } from "../he";
import { loadLang, loadMale, setLang, setMale, t } from "../i18n";
import { MS } from "../ms";
import { TA } from "../ta";
import { ZH } from "../zh";

const r = rulesJson as Record<string, any>;
function dataTexts(): string[] {
  const out = new Set<string>();
  const add = (x: unknown) => { if (typeof x === "string" && x.trim()) out.add(x); };
  for (const s of r.serviceTypes) { add(s.name); add(s.description); (s.askProvider ?? []).forEach(add); }
  for (const n of r.needRules) if (n.enabled !== false) add(n.reasonText);
  for (const b of r.branchRules.branches) { add(b.firstContact); b.askList.forEach(add); (b.links ?? []).forEach((l: any) => add(l.label)); }
  add(r.branchRules.dementiaFlag.note);
  r.howToApply.alwaysBring.forEach(add);
  r.howToApply.routes.forEach((x: any) => (x.extraDocuments ?? []).forEach(add));
  for (const st of r.nextSteps) { add(st.label); add(st.text); add(st.unlocks); }
  for (const g of r.grantRules) { add(g.name); add(g.amountMeaning); add(g.askIf); g.criteria.forEach(add); }
  return [...out];
}

describe.each([["Chinese", ZH], ["Malay", MS], ["Tamil", TA]] as const)("%s draft (8.13)", (_name, dict) => {
  it("has an entry for every text in the rules data", () => {
    expect(dataTexts().filter((x) => !(x in dict))).toEqual([]);
  });
  it("has an entry for every key the Chinese draft has (the screens' wording)", () => {
    expect(Object.keys(ZH).filter((k) => !(k in dict))).toEqual([]);
  });
  it("keeps every {placeholder} of the English template", () => {
    const names = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const broken = Object.entries(dict).filter(([en, tr]) => names(en).join() !== names(tr).join()).map(([en]) => en);
    expect(broken).toEqual([]);
  });
});

describe("t()", () => {
  beforeAll(() => Promise.all((["zh", "ms", "ta"] as const).map(loadLang)));
  it("falls back to English when there's no entry, and fills values in both languages", () => {
    setLang("zh");
    expect(t("{n} services may fit", { n: 3 })).toBe("3 项服务可能适合");
    expect(t("No such text")).toBe("No such text");
    setLang("ms");
    expect(t("{n} services may fit", { n: 3 })).toBe("3 perkhidmatan mungkin sesuai");
    setLang("en");
    expect(t("{n} services may fit", { n: 3 })).toBe("3 services may fit");
  });
});

describe("9.6 a plan for a man", () => {
  beforeAll(() => Promise.all([loadLang("zh"), loadMale()]));
  it("has a 'he' version of every English text that says she or her", () => {
    const pronoun = /\b(she|her|She|Her|herself|hers)\b/;
    expect(Object.keys(ZH).filter((k) => pronoun.test(k) && !/^(About (Mum|her|your wife)|Her care plan|Where is she|Someone else \(she\))/.test(k) && !(k in HE))).toEqual([]);
    expect(Object.values(HE).filter((v) => pronoun.test(v))).toEqual([]);
  });
  it("switches the pronouns in English and Chinese, and leaves them alone for a woman", () => {
    setLang("en"); setMale(true);
    expect(t("Build her week")).toBe("Build his week");
    setLang("zh");
    expect(t("Build her week")).not.toContain("她");
    setMale(false);
    expect(t("Build her week")).toContain("她");
    setLang("en");
    expect(t("Build her week")).toBe("Build her week");
  });
});
