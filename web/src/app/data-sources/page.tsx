import type { Metadata } from "next";
import { dataDate, longDate, manifest } from "@/lib/data";

export const metadata: Metadata = { title: "Data sources", description: "The open data and official pages behind every figure." };

// The five data.gov.sg layers the pipeline downloads (pipeline/build_release.py, LAYERS).
const OPEN_DATA = [
  "Family Services", "Community Club / PAssion WaVe outlets", "CHAS Clinics", "Retail Pharmacy Locations", "Dementia Go-To-Points",
];

export default function DataSources() {
  const accessed = longDate(manifest.builtAt);
  return (
    <article className="prose">
      <h1>Data sources</h1>
      <p className="help">Data version {manifest.dataVersion} ({dataDate}).</p>

      <h2>Open data</h2>
      <ul className="plain">
        {OPEN_DATA.map((d) => (
          <li key={d}>
            Contains information from {d} accessed on {accessed} from data.gov.sg, which is made available under the
            terms of the <a href="https://data.gov.sg/open-data-licence">Singapore Open Data Licence version 1.0</a>.
          </li>
        ))}
      </ul>

      <h2>Official pages we cite</h2>
      <p className="help">Facts are taken from these pages and linked, not reproduced.</p>
      <ul className="plain">
        {manifest.sources.map((s) => (
          <li key={s.sourceId}>
            <a href={s.url}>{s.title}</a> · checked {longDate(s.checkedOn)}
          </li>
        ))}
      </ul>
      <p className="note">Use of these sources doesn't mean the agencies endorse this site.</p>
    </article>
  );
}
