import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of use", description: "Care Navigator gives estimates, not advice." };

// 9.9: what the site is and isn't. Plain language, no legal boilerplate beyond what a family needs to know.
export default function Terms() {
  return (
    <article className="prose">
      <h1>Terms of use</h1>
      <h2>Estimates, not advice</h2>
      <p>Care Navigator gives estimates. Costs, subsidies and grants are worked out from public information, and the
        amount you pay may be different. Grants and payouts are shown as ones the person you care for &ldquo;may qualify&rdquo; for: only the
        agency that runs each one decides.</p>
      <p>It doesn&apos;t give medical, financial or legal advice, and it doesn&apos;t replace a doctor, a medical social
        worker or an AIC Link. Check what matters with them before you decide.</p>
      <h2>Where the figures come from</h2>
      <p>Every figure shows its official source and the date we last checked it. Figures can change after that date.
        See <Link href="/data-sources/">Data sources</Link> and <Link href="/changes/">What changed</Link>.</p>
      <h2>Who runs it</h2>
      <p>An independent student project. It isn&apos;t run by, endorsed by or connected to the Ministry of Health, the
        Agency for Integrated Care or any government agency. It&apos;s free and has no ads.</p>
      <h2>Your information</h2>
      <p>Nothing you enter is stored by us. See <Link href="/privacy/">Privacy</Link>.</p>
      <h2>Emergencies</h2>
      <p>For a medical emergency, call 995.</p>
    </article>
  );
}
