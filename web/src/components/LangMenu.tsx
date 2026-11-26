"use client";
// The language menu on the Start page and the planner. On the planner it changes the plan's link; on the Start page it
// goes to that language's Start page and marks the page's language for screen readers.
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LANGS, type Lang } from "@/lib/i18n";

export function LangMenu({ value, onChange }: { value: Lang; onChange?: (l: Lang) => void }) {
  const router = useRouter();
  const html = LANGS.find((x) => x.id === value)!.html;
  useEffect(() => {
    if (onChange) return;                                   // the planner sets the page language itself
    document.documentElement.lang = html;
    return () => { document.documentElement.lang = "en-SG"; };
  }, [html, onChange]);
  return (
    <div className="lang no-print">
      <label className="lang-menu">
        <span className="sr-only">Language / 语言 / Bahasa / மொழி</span>
        <svg className="lang-globe" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
        </svg>
        <select id="lang" value={value}
          onChange={(e) => { const l = e.target.value as Lang; if (onChange) onChange(l); else router.push(l === "en" ? "/" : `/${l}/`); }}>
          {LANGS.map((x) => <option key={x.id} value={x.id} lang={x.html}>{x.name}</option>)}
        </select>
        <svg className="lang-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </label>
    </div>
  );
}
