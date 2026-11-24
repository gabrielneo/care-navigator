// Turns the pipeline's JSON Schema into TypeScript types (docs/specs/10-data-contract.md).
// Run after `python -m pipeline.export_schema`. CI checks the committed types.ts matches.
import { compileFromFile } from "json-schema-to-typescript";
import { writeFile } from "node:fs/promises";

const here = new URL("../src/lib/data/", import.meta.url);
const ts = await compileFromFile(new URL("schema.json", here).pathname, {
  bannerComment: "/* Generated from schema.json by `npm run gen:types`. Do not edit by hand. */",
  additionalProperties: false,
  unreachableDefinitions: false,
});
await writeFile(new URL("types.ts", here), ts);
console.log("wrote src/lib/data/types.ts");
