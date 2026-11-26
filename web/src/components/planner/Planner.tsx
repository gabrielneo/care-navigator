"use client";
// The /plan wizard. State lives only in the URL hash (docs/specs/06 and 10): each step is one history entry,
// small edits replace the entry, refresh keeps your place, Back goes to the previous step.
import { useCallback, useEffect, useState } from "react";
import { dataDate, manifest } from "@/lib/data";
import { loadGeo } from "@/lib/data/geo";
import { decodeHash, encodeHash, type Session, type Step } from "@/lib/engine/urlCodec";
import { locate, type Region } from "@/lib/geo/postal";
import { JourneyBar, PlanSoFar, QUESTIONS } from "./Journey";
import { LangMenu } from "@/components/LangMenu";
import { LANGS, setLang, t } from "@/lib/i18n";
import { Action, ContactsScreen, CostScreen, Matches, Week } from "./Screens";
import { Check, Radio } from "./ui";

const ALL: Step[] = [...QUESTIONS, "matches", "week", "cost", "contacts", "action"];
const flow = (s: Session): Step[] => (s.w === "in_nursing_home" ? ["where", "cost", "action"] : ALL);

const ANSWERED: Partial<Record<Step, (s: Session) => boolean>> = {
  where: (s) => s.w != null, adl: (s) => s.adl != null, alone: (s) => s.al != null,
  memory: (s) => s.mem != null, helper: (s) => s.hlp != null, limits: (s) => s.lim != null,
};
/** The furthest step a session's answers allow (a link can't jump past an unanswered question). */
function allowed(s: Session, step: Step): Step {
  const f = flow(s);
  const firstGap = f.find((x) => ANSWERED[x] && !ANSWERED[x]!(s));
  if (!firstGap) return f.includes(step) ? step : f[0]!;
  return f.indexOf(step) > f.indexOf(firstGap) || !f.includes(step) ? firstGap : step;
}

export function Planner() {
  const fresh: Session = { v: manifest.dataVersion };
  const [step, setStep] = useState<Step>("where");
  const [s, setS] = useState<Session>(fresh);
  const [banner, setBanner] = useState<"damaged" | "updated" | null>(null);

  const load = useCallback((hash: string) => {
    const got = hash.length > 1 ? decodeHash(hash) : null;
    if (hash.length > 1 && !got) { setBanner("damaged"); setS(fresh); setStep("where"); return; }
    if (!got) { setS(fresh); setStep("where"); return; }
    // In-app steps always carry today's version, so a mismatch means an older link was opened (option A: recalculate).
    if (got.session.v !== manifest.dataVersion) setBanner("updated");
    const session = { ...got.session, v: manifest.dataVersion };
    setS(session);
    setStep(allowed(session, got.step));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(window.location.hash);
    document.documentElement.classList.remove("plan-loading");   // set by plan/page.tsx for links with a saved plan
    const onPop = () => load(window.location.hash);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [load]);

  // The page's language, so screen readers read the Chinese draft in Chinese.
  const langInfo = LANGS.find((x) => x.id === (s.l ?? "en"))!;
  useEffect(() => { document.documentElement.lang = langInfo.html; }, [langInfo.html]);
  useEffect(() => () => { document.documentElement.lang = "en-SG"; setLang("en"); }, []);   // the other pages are English

  const update = (patch: Partial<Session>) => setS((prev) => {
    const next = { ...prev, ...patch };
    history.replaceState(null, "", encodeHash(step, next));
    return next;
  });
  const go = (to: Step, session: Session = s) => {
    history.pushState(null, "", encodeHash(to, session));
    setS(session);   // a step can hand over answers (the postal area) that aren't in state yet
    setStep(to);
    window.scrollTo(0, 0);
  };
  const f = flow(s);
  const next = (session: Session = s) => go(f[f.indexOf(step) + 1] ?? "action", session);
  // The on-screen Back goes to the previous step even on a shared link, where there's no history to go back to.
  const back = () => { const i = f.indexOf(step); if (i > 0) go(f[i - 1]!); else window.location.href = "/"; };

  setLang(s.l ?? "en");
  const qIndex = QUESTIONS.indexOf(step);
  const screen = { s, update, next, restart: () => go("where") };
  return (
    <>
      <LangMenu value={s.l ?? "en"} onChange={(l) => update({ l: l === "en" ? undefined : l })} />
      {langInfo.banner && <p className="notice lang-draft" role="note">{langInfo.banner}</p>}
      {banner === "damaged" && <p className="notice warn" role="status">{t("We couldn't open that plan. Start again below.")}</p>}
      {banner === "updated" && (
        <p className="notice" role="status">{t("Figures updated on {date}. They may differ from when this plan was made.", { date: dataDate })}</p>
      )}
      <div className="planner">
      <JourneyBar step={step} flow={f} go={(to) => go(to)} />
      <PlanSoFar s={s} step={step} flow={f} />
      <div className="scr enter" key={step}>
        {step !== "action" && <div className="top no-print">
          <button type="button" className="link" onClick={back}>{t("Back")}</button>
        </div>}
        {qIndex >= 0 ? <Question step={step} s={s} update={update} next={next} />
          : step === "matches" ? <Matches {...screen} />
          : step === "week" ? <Week {...screen} />
          : step === "cost" ? <CostScreen {...screen} />
          : step === "contacts" ? <ContactsScreen {...screen} />
          : <Action {...screen} />}
      </div>
      </div>
    </>
  );
}

type Q = { step: Step; s: Session; update: (p: Partial<Session>) => void; next: (s?: Session) => void };

/** Screens 2a–2g: one question each. Next is always clickable; a missing answer shows an inline message. */
function Question({ step, s, update, next }: Q) {
  const [missing, setMissing] = useState(false);
  const proceed = (ok: boolean, session?: Session) => (ok ? (setMissing(false), next(session)) : setMissing(true));
  const ask = <span className="errtxt" role="alert">{missing ? t("Choose an answer to go on.") : ""}</span>;

  if (step === "where") {
    const opts: [string, Session["w"], boolean | undefined][] = [
      ["Soon to be discharged from hospital", "in_hospital", false],
      ["Recently discharged from hospital (within 2 weeks)", "in_hospital", true],
      ["Living at home, and something has just changed", "changed_at_home", undefined],
      ["Living at home, and we're struggling to cope", "struggling", undefined],
      ["In a nursing home", "in_nursing_home", undefined],
      ["Not sure", "unsure", undefined],
    ];
    const key = s.w === "in_hospital" ? `in_hospital-${s.d ? 1 : 0}` : s.w;
    return (
      <fieldset>
        <legend><h1>{t("Where is Mum right now?")}</h1></legend>
        <p className="help">{t('The person you care for. We use "Mum" in examples.')}</p>
        {opts.map(([label, w, d]) => {
          const id = w === "in_hospital" ? `in_hospital-${d ? 1 : 0}` : w!;
          return <Radio key={id} name="where" value={id} checked={key === id}
            onChange={() => update({ w, d: w === "in_hospital" ? d : undefined })}>{t(label)}</Radio>;
        })}
        {ask}
        <button type="button" className="btn" onClick={() => proceed(s.w != null)}>{t("Next")}</button>
      </fieldset>
    );
  }

  if (step === "adl") {
    const ADL: [string, string][] = [["bath", "Washing or bathing"], ["dress", "Dressing"], ["eat", "Eating"],
      ["toilet", "Using the toilet"], ["move", "Walking or moving around"], ["transfer", "Getting in and out of bed or a chair"]];
    const chosen = s.adl && s.adl[0] !== "unsure" ? (s.adl as string[]) : [];
    const toggle = (a: string, on: boolean) => {
      const list = on ? [...chosen, a] : chosen.filter((x) => x !== a);
      update({ adl: list as Session["adl"], sev: s.sev?.filter((x) => list.includes(x)) });
    };
    // Which of the chosen activities she can't do at all. Worded apart from the list above so the two never read as repeats.
    const SEVERE: Record<string, string> = { bath: "Washing", dress: "Getting dressed", eat: "Feeding herself", toilet: "Toileting",
      move: "Moving around", transfer: "Getting in and out of bed" };
    const sev = s.sev ?? [];
    const COND: [NonNullable<Session["cond"]>[number], string][] = [["fall", "A recent fall"], ["stroke", "A stroke"],
      ["hip", "A broken hip"], ["eol", "A serious illness, with doctors expecting less than a year"]];
    const setSev = (a: string, on: boolean) => update({ sev: (on ? [...sev, a] : sev.filter((x) => x !== a)) as Session["sev"] });
    return (
      <fieldset>
        <legend><h1>{t("Which of these does she need help with?")}</h1></legend>
        <p className="help">{t('Pick all that apply. "Help" means someone has to assist or watch.')}</p>
        <div className="grid2">
          {ADL.map(([k, label]) => <Check key={k} checked={chosen.includes(k)} onChange={(on) => toggle(k, on)}>{t(label)}</Check>)}
        </div>
        {chosen.length > 0 && (
          <fieldset className="panel">
            <legend><h3>{t("Which of these can't she do at all?")}</h3></legend>
            <p className="help">{t("Someone has to do it for her. Some payouts depend on this. Leave blank if none.")}</p>
            {chosen.map((a) => <Check key={a} checked={(sev as string[]).includes(a)} onChange={(on) => setSev(a, on)}>{t(SEVERE[a]!)}</Check>)}
          </fieldset>
        )}
        <fieldset className="panel">
          <legend><h3>{t("Has any of these happened? (optional)")}</h3></legend>
          {COND.map(([k, label]) => <Check key={k} checked={(s.cond ?? []).includes(k)}
            onChange={(on) => update({ cond: on ? [...(s.cond ?? []), k] : (s.cond ?? []).filter((x) => x !== k) })}>{t(label)}</Check>)}
        </fieldset>
        <Check checked={s.med ?? false} onChange={(on) => update({ med: on })}>
          <b>{t("Medical care at home")}</b><br /><span className="help">{t("Wounds, tubes, injections or many medicines")}</span>
        </Check>
        <div className="row">
          <Check checked={s.adl != null && s.adl.length === 0} onChange={(on) => update({ adl: on ? [] : undefined, sev: undefined })}>{t("None of these")}</Check>
          <Check checked={s.adl?.[0] === "unsure"} onChange={(on) => update({ adl: on ? ["unsure"] : undefined, sev: undefined })}>{t("Not sure")}</Check>
        </div>
        {ask}
        <button type="button" className="btn" onClick={() => proceed(s.adl != null)}>{t("Next")}</button>
      </fieldset>
    );
  }

  const SIMPLE: Partial<Record<Step, { field: "al" | "mem" | "hlp" | "lim"; title: string; help?: string; opts: [string, string][] }>> = {
    alone: { field: "al", title: "Is she alone for most of the day?",
      opts: [["weekdays", "Yes, on weekdays"], ["most", "Yes, most days"], ["no", "No, someone is usually with her"], ["unsure", "Not sure"]] },
    memory: { field: "mem", title: "Does she have memory problems?", help: "For example, getting lost, forgetting to eat, or repeating questions.",
      opts: [["dx", "Yes, diagnosed with dementia"], ["undx", "Yes, but not diagnosed"], ["no", "No"], ["unsure", "Not sure"]] },
    helper: { field: "hlp", title: "Is there a live-in helper?", help: "A migrant domestic worker who lives with her.",
      opts: [["yes", "Yes"], ["considering", "No, but we're thinking about one"], ["no", "No"], ["unsure", "Not sure"]] },
    limits: { field: "lim", title: "How are you coping?", help: "Your own limits matter too.",
      opts: [["ok", "I'm managing"], ["tired", "I'm tired and need a break"], ["cant", "I can't keep going like this"], ["unsure", "Not sure"]] },
  };
  const q = SIMPLE[step];
  if (q) {
    return (
      <fieldset>
        <legend><h1>{t(q.title)}</h1></legend>
        {q.help && <p className="help">{t(q.help)}</p>}
        {q.opts.map(([v, label]) => (
          <Radio key={v} name={q.field} value={v} checked={s[q.field] === v}
            onChange={() => update({ [q.field]: v } as Partial<Session>)}>{t(label)}</Radio>
        ))}
        {ask}
        <button type="button" className="btn" onClick={() => proceed(s[q.field] != null)}>{t("Next")}</button>
      </fieldset>
    );
  }

  return <Postal s={s} next={next} />;
}

/** 2g: the postal code is matched to its 2-digit area on this device; only the area is kept. */
function Postal({ s, next }: Pick<Q, "s" | "next">) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const check = () => { if (code && !/^\d{6}$/.test(code)) setError(t("Enter 6 digits, e.g. 560123.")); };
  useEffect(() => { loadGeo(); }, []);   // start fetching the area centres while she types
  const submit = async () => {
    const r = locate((await loadGeo()).sectors, code);
    if (r.kind === "invalid") { setError(t("Enter 6 digits, e.g. 560123.")); return; }
    if (r.kind === "unavailable") { setPicker(true); setError(null); return; }
    next({ ...s, loc: { sec: r.sector } });
  };
  const pick = (reg: Region) => next({ ...s, loc: { reg } });
  const REGIONS: [Region, string][] = [["central", "Central"], ["north", "North"], ["northeast", "North-East"], ["east", "East"], ["west", "West"]];
  return (
    <>
      <h1>{t("Where does she live?")}</h1>
      <div className="field">
        <label htmlFor="postal">{t("Postal code")}</label>
        <input id="postal" className="input" inputMode="numeric" autoComplete="postal-code" maxLength={6}
          value={code} aria-invalid={error ? true : undefined} aria-describedby="postal-help postal-err"
          onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(null); }} onBlur={check} />
        <p id="postal-err" className="errtxt" role="alert">{error ?? ""}</p>
        <p id="postal-help" className="help">{t("6 digits, e.g. 560123. Only the first 2 digits are used, and they stay on your phone.")}</p>
      </div>
      <button type="button" className="btn" onClick={submit}>{t("Next")}</button>
      <button type="button" className="link" onClick={() => setPicker(true)}>{t("Skip and pick a region")}</button>
      {picker && (
        <fieldset className="panel">
          <legend><h3>{code ? t("We can't place that area. Pick yours:") : t("Pick her area:")}</h3></legend>
          <div className="grid2">
            {REGIONS.map(([r, label]) => <button key={r} type="button" className="chip" onClick={() => pick(r)}>{t(label)}</button>)}
          </div>
        </fieldset>
      )}
    </>
  );
}
