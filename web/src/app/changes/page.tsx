import type { Metadata } from "next";
import Link from "next/link";
import changes from "../../../public/data/changes.json";
import { longDate } from "@/lib/data";

export const metadata: Metadata = { title: "What changed", description: "What changed in each version of the figures." };

// 9.8: written by the data pipeline each time the figures change (pipeline/changes.py).
export default function Changes() {
  return (
    <article className="prose">
      <h1>What changed</h1>
      <p>Each time the figures change, a plan&apos;s link shows &ldquo;Figures updated&rdquo; and works the plan out again
        with the new figures. This list says what changed. Each figure&apos;s source is on the{" "}
        <Link href="/data-sources/">Data sources</Link> page.</p>
      {changes.map((c) => (
        <section key={c.version}>
          <h2>{longDate(c.date)} <span className="meta">(version {c.version})</span></h2>
          <ul>{c.changes.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      ))}
    </article>
  );
}
