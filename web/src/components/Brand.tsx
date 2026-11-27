"use client";
// The logo in the top bar: the brand mark (docs/brand/icon.svg, drawn here in the palette's tokens) and the name.
// It goes to the Start page in the page's language, so a family reading the Chinese draft lands on /zh/.
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { LANGS } from "@/lib/i18n";

const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  return () => mo.disconnect();
};

export function Brand() {
  const html = useSyncExternalStore(subscribe, () => document.documentElement.lang, () => "en-SG");
  const id = LANGS.find((x) => x.html === html)?.id ?? "en";
  return (
    <Link href={id === "en" ? "/" : `/${id}/`} className="brand" aria-label="Care Navigator, home">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="var(--hero-bg)" />
        <path d="M42 22.5a13 13 0 1 0 0 19" fill="none" stroke="var(--on-hero)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="45" cy="32" r="4" fill="var(--on-hero-muted)" />
      </svg>
      <span>Care Navigator</span>
    </Link>
  );
}
