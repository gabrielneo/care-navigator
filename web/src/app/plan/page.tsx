import type { Metadata } from "next";
import { Planner } from "@/components/planner/Planner";

export const metadata: Metadata = { title: "Your care plan" };

export default function PlanPage() {
  return <Planner />;
}
