import type { Metadata } from "next";
import { mailto, REPORT_EMAIL } from "@/lib/report";
import { dataDate } from "@/lib/data";

export const metadata: Metadata = { title: "Privacy", description: "What this site does and doesn't collect." };

// Wording: docs/specs/07-legal-privacy-text.md (prototype version: no analytics, decision 4).
export default function Privacy() {
  return (
    <article className="prose">
      <h1>Your privacy</h1>
      <p>This site does not collect personal data. That includes names, NRIC numbers, phone numbers and exact income.</p>
      <p><b>What you enter stays on your device.</b> Your answers and your plan are kept only in this page's web address.
        We have no database and store nothing on a server. If you share the link, whoever opens it sees the same
        answers. Share it only with people you trust.</p>
      <p><b>Your postal code never leaves your phone.</b> We use only its first two digits to find the nearest offices.
        That lookup happens on your device. The shared link keeps only those two digits.</p>
      <p><b>Income.</b> We ask you to pick an income range, never an exact amount. The range is used only to work out
        the estimate on your screen.</p>
      <p><b>No tracking.</b> This prototype has no analytics, no tracking scripts and no third-party forms. Like any
        website host, our host (Vercel) keeps standard technical logs of page requests. Those logs never contain your
        answers, because your answers stay in the part of the link after the # sign, which browsers don't send to
        servers.</p>
      <p><b>Saved for use without signal.</b> After you open a page, your phone keeps a copy of this site&apos;s own
        files, so a plan opens again without signal. Your answers aren&apos;t in that copy. Clearing this site&apos;s
        data in your browser removes it.</p>
      <p><b>If you email us.</b> &ldquo;Report a problem&rdquo; opens your own email app. The message names only the
        figure&apos;s sources and the data version. It doesn&apos;t include your answers or your plan&apos;s link. If
        you send it, we see your email address and anything you add. We use it only to reply and fix the problem, and
        we don&apos;t share it.</p>
      <p><b>Singapore&apos;s Personal Data Protection Act (PDPA).</b> The site doesn&apos;t collect personal data. The
        only personal data we hold is in emails you choose to send us. To ask us to see, correct or delete it, email{" "}
        <a href={mailto("Personal data request")}>{REPORT_EMAIL}</a>.</p>

      <h2>About the figures</h2>
      <p>This is an estimate, not a quote. Prices are published "starting from" fees. Subsidies and grants follow the
        published government rules on the date shown ({dataDate}). Your actual fees depend on the provider, the
        services you use, and a formal means test and assessment.</p>
      <p>This site does not decide eligibility. "May qualify" means the published rules suggest you could. Only the
        official agency can confirm it.</p>
      <p>This is not medical, financial or legal advice. In a medical emergency, call 995. For advice on care services,
        call the AIC hotline on 1800-650-6060.</p>
    </article>
  );
}
