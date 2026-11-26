import type { Metadata } from "next";
import { mailto, REPORT_EMAIL } from "@/lib/report";

export const metadata: Metadata = { title: "Accessibility", description: "What we test for accessibility, and the known limits." };

// 9.9: what is tested (docs/requirements-traceability.md, N1 and R21) and what isn't yet.
export default function Accessibility() {
  return (
    <article className="prose">
      <h1>Accessibility</h1>
      <p>We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA, so that older carers and people
        using assistive technology can make a plan.</p>
      <h2>What we test every time the site changes</h2>
      <ul>
        <li>Every screen and every answer is checked with the axe accessibility checker on a phone and a computer.</li>
        <li>The whole planner works with a keyboard alone, with a visible focus outline on every control.</li>
        <li>Main text is 18 px or more, and buttons and answers are at least 48 px tall.</li>
        <li>Every screen works at 320 px wide (about 400% zoom) without scrolling sideways, in all four languages.</li>
        <li>The plan prints on one A4 page, in all four languages.</li>
        <li>Sentences are kept short and plain.</li>
      </ul>
      <h2>Known limits</h2>
      <ul>
        <li>We haven&apos;t yet tested with a screen reader such as VoiceOver or TalkBack.</li>
        <li>The Chinese, Malay and Tamil versions are drafts that native speakers haven&apos;t reviewed yet.</li>
        <li>The About, Privacy and Data sources pages are in English only.</li>
        <li>Official pages we link to are run by others and may not meet the same standard.</li>
      </ul>
      <p>If something doesn&apos;t work for you, call the AIC hotline on 1800-650-6060 for help with care, or{" "}
        email <a href={mailto("Accessibility problem")}>{REPORT_EMAIL}</a> to tell us about the problem.</p>
    </article>
  );
}
