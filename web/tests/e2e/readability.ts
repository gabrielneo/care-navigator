// Spec 08's writing rules, measured: sentences under 20 words and a reading age of about 12
// (Flesch–Kincaid grade 7; reading age ≈ grade + 5). Only our own wording counts: links, official page titles,
// addresses, contact names, dates and the calculation table are other people's words or data.
import type { Page } from "@playwright/test";

export const MAX_WORDS = 20;

/** The sentences we wrote that are on screen now, one per block or sentence. */
export async function ourSentences(page: Page): Promise<string[]> {
  const blocks = await page.locator("main").evaluate((main) => {
    const BLOCK = "h1,h2,h3,p,li,summary,button,label,legend";
    return [...main.querySelectorAll<HTMLElement>(BLOCK)]
      .filter((el) => !el.querySelector(BLOCK) && el.offsetParent !== null)
      .filter((el) => !el.closest("a, .meta, table, select, .contact, .tag, .print-only"))
      .map((el) => { const c = el.cloneNode(true) as HTMLElement; c.querySelectorAll("a").forEach((a) => a.remove()); return c.textContent ?? ""; })
      .map((t) => t.replace(/\s+/g, " ").trim())
      .filter((t) => t && !/^Sources?:/.test(t));
  });
  return blocks.flatMap((b) => b.split(/(?<=[.!?])\s+(?=[A-Z"$])/)).map((s) => s.trim()).filter((s) => /[a-z]/i.test(s));
}

const words = (s: string) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 1;                                                    // numbers and amounts read as one unit
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
}

/** Flesch–Kincaid grade of the text as a whole, and the sentences that are too long. */
export function readability(sentences: string[]) {
  const full = sentences.filter((s) => words(s).length >= 5);           // labels like "Next" would flatter the grade
  const ws = full.flatMap(words);
  const grade = 0.39 * (ws.length / Math.max(1, full.length)) + 11.8 * (ws.reduce((n, w) => n + syllables(w), 0) / Math.max(1, ws.length)) - 15.59;
  return { grade, long: sentences.filter((s) => words(s).length >= MAX_WORDS), sentences: sentences.length };
}
