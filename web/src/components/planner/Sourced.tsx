// Where a figure or an explanation comes from: the "Source:" line under every figure, "Report a problem", and the
// "What's this?" explanations. Shared by the questions (loaded first) and the later screens.
import { useState } from "react";
import { longDate, manifest, rules, source } from "@/lib/data";
import { t } from "@/lib/i18n";
import { mailto } from "@/lib/report";

/** On screen a source shows its short name ("AIC Day Care"); the details in brackets stay in the link's tooltip and on
 *  the Data sources page (UX audit 17). */
export const shortTitle = (title: string) => title.replace(/\s*\([^)]*\)\s*$/, "");

/** 9.7: a prefilled email saying which figure looks wrong. It carries only the sources and the data version, never her
 *  answers, postal code or the plan's link. */
const reportHref = (srcs: { sourceId: string; url: string }[]) => mailto(
  `Figure may be wrong: ${srcs.map((x) => x.sourceId).join(", ")}`,
  `Data version: ${manifest.dataVersion}\nSources:\n${srcs.map((x) => `- ${x.url}`).join("\n")}\n\nWhat looks wrong, and where did you see the right figure?\n`,
);

/** "What's this?" beside a term: what the official page says it means, in plain words, with its source. The terms
 *  and their sources are in data/curated/glossary.yaml. */
const glossary = new Map(rules.glossary.map((g) => [g.termId, g]));
export const termForStep = new Map(rules.glossary.flatMap((g) => (g.steps ?? []).map((st) => [st, g.termId] as const)));
export function Explain({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const g = glossary.get(id);
  if (!g) return null;
  return (
    <div className="explain no-print">
      <button type="button" className="link" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="q" aria-hidden="true">?</span>{t("What's this?")}<span className="sr-only"> {t(g.term)}</span>
      </button>
      {open && <div className="explain-text"><p>{t(g.text)}</p><Sources ids={[g.sourceId]} /></div>}
    </div>
  );
}

/** "Sources: <title>, checked 25 Nov 2026" under any figure, so every number shows where it's from and when. */
export function Sources({ ids }: { ids: (string | null | undefined)[] }) {
  const [open, setOpen] = useState(false);
  const list = [...new Set(ids)].flatMap((id) => { const src = id ? source(id) : undefined; return src ? [src] : []; });
  if (!list.length) return null;
  // A long list shows its first 2 and opens on tap (UX audit 17); paper always shows them all.
  const fold = list.length > 3 && !open;
  return (
    <p className={`note sources${fold ? " folded" : ""}`}>{list.length > 1 ? t("Sources") : t("Source")}: {list.map((src, i) => (
      <span key={src.sourceId} className={i >= 2 ? "src-more" : undefined}>{i ? "; " : ""}<a href={src.url} title={src.title}>{shortTitle(src.title)}</a>{t(", checked {date}", { date: longDate(src.checkedOn) })}</span>
    ))}{fold && <> <button type="button" className="link src-toggle" aria-expanded="false" onClick={() => setOpen(true)}>
      {t("and {n} more", { n: list.length - 2 })}</button></>}
      <span className="no-print"> · <a href={reportHref(list)}>{t("Report a problem")}</a></span></p>
  );
}
