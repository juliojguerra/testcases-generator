import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("returns the key and model from the environment", () => {
    expect(loadConfig({ ANTHROPIC_API_KEY: "key", ANTHROPIC_MODEL: "model-id" })).toEqual({
      apiKey: "key",
      model: "model-id",
    });
  });

  it("names every missing variable", () => {
    expect(() => loadConfig({})).toThrow("ANTHROPIC_API_KEY, ANTHROPIC_MODEL");
  });

  it("treats blank values as missing", () => {
    expect(() => loadConfig({ ANTHROPIC_API_KEY: "key", ANTHROPIC_MODEL: "  " })).toThrow("ANTHROPIC_MODEL");
  });
});
