import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About", description: "An independent student project. Not affiliated with MOH or AIC." };

export default function About() {
  return (
    <article className="prose">
      <h1>About Care Navigator</h1>
      <p>Care Navigator is an independent project by a student in Singapore. It is not run by, endorsed by or
        connected to the Ministry of Health, the Agency for Integrated Care or any government agency. It uses public
        information and open government data, credited on the <Link href="/data-sources/">Data sources</Link> page.</p>
      <p>It helps families do the planning before they speak to a doctor, a medical social worker or an AIC Link. It
        does not replace them.</p>
      <p>This is a prototype for testing. Figures and wording have not yet been checked by a care professional.</p>
    </article>
  );
}
