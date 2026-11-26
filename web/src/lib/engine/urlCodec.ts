// The session lives only in the URL hash: #s=<step>&p=<base64url JSON> (docs/specs/06 and 10).
// The Zod allowlist is the privacy boundary: no free text, no names, no exact income, no full postal code.
import * as z from "zod/mini";   // the mini build: same checks, much smaller bundle

export const STEPS = [
  "where", "adl", "alone", "memory", "helper", "limits", "postal",
  "matches", "week", "cost", "contacts", "action",
] as const;
export type Step = (typeof STEPS)[number];

const ADL = z.enum(["bath", "dress", "eat", "toilet", "move", "transfer"]);
const id = z.string().check(z.regex(/^[a-z][a-z0-9_]{1,40}$/));
// Repeats would inflate the activity count (grants) or double-count a service (cost).
const unique = (xs: string[]) => new Set(xs).size === xs.length;
const intIn = (min: number, max: number) => z.int().check(z.gte(min), z.lte(max));

export const SessionSchema = z.strictObject({
  v: z.string().check(z.regex(/^\d{4}\.\d{2}\.\d{2}-\d+$/)),           // data version the plan was made with
  w: z.optional(z.enum(["in_hospital", "changed_at_home", "struggling", "in_nursing_home", "unsure"])),
  d: z.optional(z.boolean()),                                          // recently discharged
  adl: z.optional(z.union([
    z.array(ADL).check(z.maxLength(6), z.refine(unique, "repeated activity")),
    z.tuple([z.literal("unsure")]),
  ])),
  // Of those, the ones she can't do at all (severe disability: CareShield Life, MediSave Care, ElderFund). Absent on
  // older links, which then read as "some help" and show no severe-only payouts.
  sev: z.optional(z.array(ADL).check(z.maxLength(6), z.refine(unique, "repeated activity"))),
  // Health events (8.7): a recent fall, a stroke, a hip fracture, a serious illness with under a year expected.
  cond: z.optional(z.array(z.enum(["fall", "stroke", "hip", "eol"])).check(z.maxLength(4), z.refine(unique, "repeated condition"))),
  al: z.optional(z.enum(["weekdays", "most", "no", "unsure"])),
  mem: z.optional(z.enum(["dx", "undx", "no", "unsure"])),
  hlp: z.optional(z.enum(["yes", "considering", "no", "unsure"])),
  lim: z.optional(z.enum(["ok", "tired", "cant", "unsure"])),
  med: z.optional(z.boolean()),
  loc: z.optional(z.union([
    z.strictObject({ sec: z.string().check(z.regex(/^\d{2}$/)) }),    // 2-digit postal sector only
    z.strictObject({ reg: z.enum(["central", "north", "northeast", "east", "west"]) }),
  ])),
  plan: z.optional(z.array(z.strictObject({ s: id, n: intIn(0, 7) }))
    .check(z.maxLength(13), z.refine((p) => unique(p.map((e) => e.s)), "repeated service"))),
  t: z.optional(z.enum(["T0", "T1", "T2", "T3", "T4", "T5"])),
  r: z.optional(z.enum(["sc", "pr", "none"])),
  b: z.optional(z.enum(["le1969", "gt1969"])),
  g: z.optional(z.enum(["pg", "mg", "no", "unsure"])),               // Pioneer or Merdeka Generation (8.12)
  q: z.optional(z.record(id, intIn(1, 10_000))),                     // quoted fee per unit, whole dollars
  x: z.optional(intIn(1, 10)),                                       // split between n people
  l: z.optional(z.enum(["zh", "ms", "ta"])),                          // language: a draft translation (8.13); absent = English
  done: z.optional(z.array(id).check(z.maxLength(20), z.refine(unique, "repeated step"))),  // ticked next steps (8.6)
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
