// The Start page, in English (/) and in the Chinese, Malay and Tamil drafts (/zh/, /ms/, /ta/). Rendered at build time,
// so the text goes through tl() with the page's language rather than the planner's module language.
import Link from "next/link";
import { LangMenu } from "@/components/LangMenu";
import { Hero3D } from "@/components/start/Hero3D";
import { Tilt } from "@/components/planner/ui";
import { range } from "@/lib/format";
import { LANGS, loadLang, tl, type Lang } from "@/lib/i18n";
import { manifest, rules } from "@/lib/data";
import { costPlan } from "@/lib/engine/cost";
import { matchServices } from "@/lib/engine/matching";
import { encodeHash, type Session } from "@/lib/engine/urlCodec";

// The example plan is worked out by the real engine from today's rules at build time, so its figures stay true.
const EXAMPLE: Session = {
  v: manifest.dataVersion, w: "in_hospital", d: false, adl: ["bath", "dress"], al: "weekdays", mem: "no", hlp: "no", lim: "ok",
  plan: [{ s: "day_care", n: 5 }, { s: "home_personal_care", n: 2 }], t: "T1", r: "sc", b: "le1969", x: 3,
};

const STEPS: [string, string, string][] = [
  ["Tell us about her", "Seven short questions: where she is now, what she needs help with, and how you're coping.",
    "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0"],
  ["See her week and the cost", "Services that may fit, a week you can change, and the monthly cost with and without subsidy.",
    "M4 6h16M4 12h16M4 18h10"],
  ["Know who to call", "The right first contact, what to ask and what to bring, ready to print or send on WhatsApp.",
    "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"],
];

export async function Landing({ lang }: { lang: Lang }) {
  await loadLang(lang);
  const T = (en: string, vars?: Record<string, string | number>) => tl(lang, en, vars);
  const info = LANGS.find((x) => x.id === lang)!;
  const plan = lang === "en" ? "/plan/" : `/plan/${encodeHash("where", { v: manifest.dataVersion, l: lang })}`;
  const m = matchServices(rules, EXAMPLE);
  const c = costPlan(rules, EXAMPLE);
  // Mid-sentence, "The medical social worker" reads "the medical…", as on the action plan.
  const whoRaw = T(m.branch.firstContact);
  const who = /^[A-Z][a-z]/.test(whoRaw) ? whoRaw.charAt(0).toLowerCase() + whoRaw.slice(1) : whoRaw;
  return (
    <div className="landing" lang={info.html}>
      <LangMenu value={lang} />
      {info.banner && <p className="notice lang-draft" role="note">{info.banner}</p>}
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{T("For families in Singapore")}</p>
          <h1>{T("Plan care for someone you look after")}</h1>
          <p>{T("See which services fit, what they may cost after the 2026 subsidies, and who to call first.")}</p>
          <div className="hero-cta">
            <Link className="btn" href={plan}>{T("Start planning")}</Link>
            <span className="hero-note">{T("Free. About 5 minutes. Nothing you enter is saved.")}</span>
          </div>
        </div>
        <Hero3D />
      </section>

      <p className="help two-people">{T("Planning for two people? Make one plan for each, then share both links.")}</p>

      <section className="band reveal" aria-labelledby="how">
        <h2 id="how">{T("How it works")}</h2>
        <ol className="how-steps">
          {STEPS.map(([title, text, icon], i) => (
            <li key={title}>
              <Tilt className="how-card">
                <span className="how-num" aria-hidden="true">{i + 1}</span>
                <svg className="how-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={icon} /></svg>
                <h3>{T(title)}</h3>
                <p>{T(text)}</p>
              </Tilt>
            </li>
          ))}
        </ol>
      </section>

      <section className="band example reveal" aria-labelledby="takeaway">
        <div className="example-copy">
          <h2 id="takeaway">{T("What you take away")}</h2>
          <p>{T("One page with the first call to make, the questions to ask and a monthly cost range. Share the link with family, or print it for the ward.")}</p>
          <Link className="link" href={plan}>{T("Make yours")}</Link>
        </div>
        <Tilt className="example-card">
          <p className="tag">{T("Example plan")}</p>
          <h3>{T("Mum's care plan")}</h3>
          <ol className="steps">
            <li><b>{T("Call {who}, before she's discharged.", { who })}</b>
              <ul className="plain">{m.askList.slice(0, 2).map((q) => <li key={q}>&ldquo;{T(q)}&rdquo;</li>)}</ul>
            </li>
            <li><b>{T("{amount} a month with subsidy", { amount: range(c.total!.withSubsidy!) })}</b><br />
              <span className="meta">{T("{amount} each, split between {n}", { amount: range(c.split!.each), n: 3 })}</span></li>
          </ol>
          <p className="meta">{T("Mum is leaving hospital after a fall, needs help washing and dressing, and is alone on weekdays. Day care 5 days and home care twice a week; household income per person $1,501 to $2,300; Singapore Citizen.")}</p>
        </Tilt>
      </section>

      <section className="band trust reveal" aria-label={T("Why you can trust the figures")}>
        <div><b>{T("{n} official sources", { n: manifest.sources.length })}</b><p>{T("Each figure links to its source and the date it was checked.")}</p></div>
        <div><b>{T("Nothing stored")}</b><p>{T("Your plan lives only in its own link. The postal code stays on your phone. We never ask for her NRIC number, bank details or Singpass.")}</p></div>
        <div><b>{T("Independent and free")}</b><p>{T("A student project, not a government site. No sign-up and no ads.")}</p></div>
      </section>

      <section className="cta-band reveal">
        <h2>{T("Ready when you are")}</h2>
        <Link className="btn" href={plan}>{T("Start planning")}</Link>
      </section>
    </div>
  );
}
