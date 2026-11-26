import Link from "next/link";
import { Hero3D } from "@/components/start/Hero3D";
import { Tilt } from "@/components/planner/ui";
import { range } from "@/lib/format";
import { LANGS } from "@/lib/i18n";
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

export default function Start() {
  const m = matchServices(rules, EXAMPLE);
  const c = costPlan(rules, EXAMPLE);
  const first = m.branch.firstContact.charAt(0).toLowerCase() + m.branch.firstContact.slice(1);
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">For families in Singapore</p>
          <h1>Plan care for someone you look after</h1>
          <p>See which services fit, what they may cost after the 2026 subsidies, and who to call first.</p>
          <div className="hero-cta">
            <Link className="btn" href="/plan/">Start planning</Link>
            <span className="hero-note">Free. About 5 minutes. Nothing you enter is saved.</span>
            <span className="hero-langs">
              {LANGS.filter((x) => x.id !== "en").map((x) => (
                <a key={x.id} href={`/plan/${encodeHash("where", { v: manifest.dataVersion, l: x.id as "zh" | "ms" | "ta" })}`} lang={x.html}>{x.name}</a>
              ))}
            </span>
          </div>
        </div>
        <Hero3D />
      </section>

      <p className="help two-people">Planning for two people? Make one plan for each, then share both links.</p>

      <section className="band reveal" aria-labelledby="how">
        <h2 id="how">How it works</h2>
        <ol className="how-steps">
          {STEPS.map(([title, text, icon], i) => (
            <li key={title}>
              <Tilt className="how-card">
                <span className="how-num" aria-hidden="true">{i + 1}</span>
                <svg className="how-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={icon} /></svg>
                <h3>{title}</h3>
                <p>{text}</p>
              </Tilt>
            </li>
          ))}
        </ol>
      </section>

      <section className="band example reveal" aria-labelledby="takeaway">
        <div className="example-copy">
          <h2 id="takeaway">What you take away</h2>
          <p>One page with the first call to make, the questions to ask and a monthly cost range. Share the link with
            family, or print it for the ward.</p>
          <Link className="link" href="/plan/">Make yours</Link>
        </div>
        <Tilt className="example-card">
          <p className="tag">Example plan</p>
          <h3>Mum&apos;s care plan</h3>
          <ol className="steps">
            <li><b>Call {first}</b>, before she&apos;s discharged
              <ul className="plain">{m.askList.slice(0, 2).map((q) => <li key={q}>&quot;{q}&quot;</li>)}</ul>
            </li>
            <li><b>{range(c.total!.withSubsidy!)}</b> a month with subsidy<br />
              <span className="meta">{range(c.split!.each)} each, split between 3</span></li>
          </ol>
          <p className="meta">Mum is leaving hospital after a fall, needs help washing and dressing, and is alone on weekdays.
            Day care 5 days and home care twice a week; household income per person $1,501 to $2,300; Singapore Citizen.</p>
        </Tilt>
      </section>

      <section className="band trust reveal" aria-label="Why you can trust the figures">
        <div><b>{manifest.sources.length} official sources</b><p>Each figure links to its source and the date it was checked.</p></div>
        <div><b>Nothing stored</b><p>Your plan lives only in its own link. The postal code stays on your phone. We never ask for her NRIC number, bank details or Singpass.</p></div>
        <div><b>Independent and free</b><p>A student project, not a government site. No sign-up and no ads.</p></div>
      </section>

      <section className="cta-band reveal">
        <h2>Ready when you are</h2>
        <Link className="btn" href="/plan/">Start planning</Link>
      </section>
    </div>
  );
}
