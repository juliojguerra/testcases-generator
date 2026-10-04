import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderJsonSchema, SCHEMA_PATH } from "../scripts/generate-schema.js";

describe("generated JSON Schema", () => {
  it("matches the committed schemas/test_case_output.schema.json (run `npm run generate:schema` to update)", () => {
    const committed = readFileSync(SCHEMA_PATH, "utf8");
    expect(committed).toBe(renderJsonSchema());
  });
});
