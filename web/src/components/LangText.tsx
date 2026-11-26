"use client";
// The site banner and footer sit in the shared layout, outside the planner, so they follow the page's language
// (<html lang>, which the planner sets) instead of the planner's state.
import { useSyncExternalStore } from "react";
import { LANGS, tIn } from "@/lib/i18n";

const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  return () => mo.disconnect();
};

export function LangText({ children }: { children: string }) {
  const html = useSyncExternalStore(subscribe, () => document.documentElement.lang, () => "en-SG");
  return <>{tIn(LANGS.find((x) => x.html === html)?.id ?? "en", children)}</>;
}
