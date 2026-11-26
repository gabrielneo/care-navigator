// To-do 8.13: draft translations (Chinese, Malay, Tamil). Text is keyed by its English, so anything without an entry
// falls back to English instead of disappearing. The planner sets the language from the plan's link (`l`) at the top
// of each render. Each draft's dictionary is its own chunk, loaded with loadLang() only when that language is chosen, so
// English readers never download them (9.5: they were 50 KB gzipped on every page).
// shortcut: a module-level language instead of React context; fine while only the planner is translated, use context if
// more pages get a language switch.

export type Lang = "en" | "zh" | "ms" | "ta";
const DICT: Partial<Record<Exclude<Lang, "en">, Record<string, string>>> = {};
const LOADERS = {
  zh: () => import("./zh").then((m) => m.ZH),
  ms: () => import("./ms").then((m) => m.MS),
  ta: () => import("./ta").then((m) => m.TA),
};

/** Loads a draft's dictionary once; call before showing that language. */
export async function loadLang(l: Lang) {
  if (l !== "en" && !DICT[l]) DICT[l] = await LOADERS[l]();
}

/** The language menu, each language named in itself, and each draft's banner in its own language. */
export const LANGS: { id: Lang; name: string; html: string; banner?: string }[] = [
  { id: "en", name: "English", html: "en-SG" },
  { id: "zh", name: "中文（草稿）", html: "zh-SG", banner: "中文版是草稿，尚未经过专业人士审核。如与英文版有出入，以英文版为准。" },
  { id: "ms", name: "Bahasa Melayu (draf)", html: "ms-SG",
    banner: "Versi Bahasa Melayu ini ialah draf dan belum disemak oleh pakar. Jika ada perbezaan, versi Bahasa Inggeris terpakai." },
  { id: "ta", name: "தமிழ் (வரைவு)", html: "ta-SG",
    banner: "இந்தத் தமிழ்ப் பதிப்பு ஒரு வரைவு. இது இன்னும் நிபுணர்களால் சரிபார்க்கப்படவில்லை. வேறுபாடு இருந்தால், ஆங்கிலப் பதிப்பே பொருந்தும்." },
];

let lang: Lang = "en";
let male = false;
export const setLang = (l: Lang) => { lang = l; };
let HE: Record<string, string> = {};
/** 9.6: the plan is for a man, so "she" reads "he" (English from he.ts, Chinese 她 to 他; Malay and Tamil already fit).
 *  The English table loads with loadMale() first, like the dictionaries. */
export const setMale = (m: boolean) => { male = m; };
export async function loadMale() {
  if (!Object.keys(HE).length) HE = (await import("./he")).HE;
}
export const getLang = () => lang;

/** This English text in a given language, else the English. */
export const tIn = (l: Lang, en: string) => (l === "en" ? en : DICT[l]?.[en] ?? en);

/** t("{n} services may fit", { n: 3 }): this English text in the plan's language, else the English. */
export const t = (en: string, vars?: Record<string, string | number>) => tl(lang, en, vars, male);

/** t() for a given language, for pages rendered at build time (the Start pages), where the module language can't be used. */
export function tl(l: Lang, en: string, vars?: Record<string, string | number>, m = false): string {
  let s = m && l === "en" ? HE[en] ?? en : tIn(l, en);
  if (m && l === "zh") s = s.replace(/她/g, "他");
  return vars ? s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? "")) : s;
}

/** Joins a list the way the language does: "a、b" in Chinese, "a, b" otherwise. */
export const list = (xs: string[]) => xs.join(lang === "zh" ? "、" : ", ");
