// The session lives only in the URL hash: #s=<step>&p=<base64url JSON> (docs/specs/06 and 10).
// The Zod allowlist is the privacy boundary: no free text, no names, no exact income, no full postal code.
import { z } from "zod";

export const STEPS = [
  "where", "adl", "alone", "memory", "helper", "limits", "postal",
  "matches", "week", "cost", "contacts", "action",
] as const;
export type Step = (typeof STEPS)[number];

const ADL = z.enum(["bath", "dress", "eat", "toilet", "move", "transfer"]);
const id = z.string().regex(/^[a-z][a-z0-9_]{1,40}$/);
// Repeats would inflate the activity count (grants) or double-count a service (cost).
const unique = (xs: string[]) => new Set(xs).size === xs.length;

export const SessionSchema = z.strictObject({
  v: z.string().regex(/^\d{4}\.\d{2}\.\d{2}-\d+$/),                    // data version the plan was made with
  w: z.enum(["in_hospital", "changed_at_home", "struggling", "in_nursing_home", "unsure"]).optional(),
  d: z.boolean().optional(),                                          // recently discharged
  adl: z.union([z.array(ADL).max(6).refine(unique, "repeated activity"), z.tuple([z.literal("unsure")])]).optional(),
  al: z.enum(["weekdays", "most", "no", "unsure"]).optional(),
  mem: z.enum(["dx", "undx", "no", "unsure"]).optional(),
  hlp: z.enum(["yes", "considering", "no", "unsure"]).optional(),
  lim: z.enum(["ok", "tired", "cant", "unsure"]).optional(),
  med: z.boolean().optional(),
  loc: z.union([
    z.strictObject({ sec: z.string().regex(/^\d{2}$/) }),             // 2-digit postal sector only
    z.strictObject({ reg: z.enum(["central", "north", "northeast", "east", "west"]) }),
  ]).optional(),
  plan: z.array(z.strictObject({ s: id, n: z.number().int().min(0).max(7) })).max(13)
    .refine((p) => unique(p.map((e) => e.s)), "repeated service").optional(),
  t: z.enum(["T0", "T1", "T2", "T3", "T4", "T5"]).optional(),
  r: z.enum(["sc", "pr", "none"]).optional(),
  b: z.enum(["le1969", "gt1969"]).optional(),
  q: z.record(id, z.number().int().min(1).max(10_000)).optional(),   // quoted fee per unit, whole dollars
  x: z.number().int().min(1).max(10).optional(),                     // split between n people
});
export type Session = z.infer<typeof SessionSchema>;

const toB64url = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/"));

/** Encode a session. Throws if it holds anything outside the allowlist. */
export function encodeSession(session: Session): string {
  return toB64url(JSON.stringify(SessionSchema.parse(session)));   // JSON here is ASCII-only: no free text
}

/** Decode a session; null for anything malformed or outside the allowlist (spec 09, case 18). */
export function decodeSession(encoded: string): Session | null {
  try {
    const r = SessionSchema.safeParse(JSON.parse(fromB64url(encoded)));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

export function encodeHash(step: Step, session: Session): string {
  return `#s=${step}&p=${encodeSession(session)}`;
}

/** Read a location hash. Unknown step falls back to "where"; a bad session returns null. */
export function decodeHash(hash: string): { step: Step; session: Session } | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const p = params.get("p");
  const session = p ? decodeSession(p) : null;
  if (!session) return null;
  const s = params.get("s") as Step | null;
  return { step: s && STEPS.includes(s) ? s : "where", session };
}
