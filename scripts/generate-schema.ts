import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { TestCaseOutputSchema } from "../src/schema.js";

export const SCHEMA_PATH = fileURLToPath(new URL("../schemas/test_case_output.schema.json", import.meta.url));

export function renderJsonSchema(): string {
  const jsonSchema = z.toJSONSchema(TestCaseOutputSchema, { target: "draft-2020-12" });
  return JSON.stringify(jsonSchema, null, 2) + "\n";
}

// Only write when run directly (npm run generate:schema), not when imported by the drift test.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(SCHEMA_PATH, renderJsonSchema());
  console.log(`Wrote ${SCHEMA_PATH}`);
}
