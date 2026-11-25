import type { Metadata } from "next";
import { Planner } from "@/components/planner/Planner";

export const metadata: Metadata = { title: "Your care plan" };

// The first question is in the static HTML, so it shows before the JavaScript loads. A link with a saved plan
// (#s=…) hides it until the plan loads, so question 1 doesn't flash first. Allowed by the CSP's 'unsafe-inline'.
const HIDE_UNTIL_LOADED = 'if(location.hash.length>1)document.documentElement.classList.add("plan-loading")';

export default function PlanPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: HIDE_UNTIL_LOADED }} />
      <Planner />
    </>
  );
}
