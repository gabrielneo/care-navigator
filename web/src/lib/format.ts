// Money formatting shared by the planner (client) and the Start page (server).
import type { Range } from "@/lib/engine/cost";

export const money = (n: number) => `$${n.toLocaleString("en-SG")}`;
export const range = (r: Range) => (r.low === r.high ? money(r.low) : `${money(r.low)} – ${money(r.high)}`);
