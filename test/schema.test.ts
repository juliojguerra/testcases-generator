import { describe, expect, it } from "vitest";
import { TestCaseOutputSchema } from "../src/schema.js";

const criterionCase = {
  id: "TC-001",
  title: "Log in with valid credentials",
  type: "happy_path",
  priority: "high",
  preconditions: ["A registered account exists"],
  steps: ["Open the login page", "Submit valid credentials"],
  expected_result: "The user lands on the account page",
  test_data: [{ field: "email", value: "user@example.test", rationale: "Reserved example domain" }],
  traces_to: { kind: "criterion", quote: "User is redirected to their account page" },
};

const assumptionCase = { ...criterionCase, id: "TC-002", traces_to: { kind: "assumption" } };

const validOutput = {
  issue: { number: 1, title: "User can log in with email and password" },
  ticket_type: "feature",
  readiness: "ready",
  open_questions: [],
  assumptions: [],
  test_cases: [criterionCase],
};

const parse = (overrides: Record<string, unknown>) =>
  TestCaseOutputSchema.safeParse({ ...validOutput, ...overrides });

const messages = (result: ReturnType<typeof parse>) =>
  result.success ? [] : result.error.issues.map((i) => i.message);

describe("shape", () => {
  it("accepts a valid output", () => {
    expect(TestCaseOutputSchema.safeParse(validOutput).success).toBe(true);
  });

  it("rejects an unknown ticket_type", () => {
    expect(parse({ ticket_type: "epic" }).success).toBe(false);
  });

  it("rejects a malformed test case id", () => {
    expect(parse({ test_cases: [{ ...criterionCase, id: "TC-1" }] }).success).toBe(false);
  });

  it("rejects extra keys at the top level", () => {
    expect(parse({ conflicts_with: [2] }).success).toBe(false);
  });

  it("rejects extra keys inside a test case", () => {
    expect(parse({ test_cases: [{ ...criterionCase, notes: "x" }] }).success).toBe(false);
  });

  it("rejects a test case without traces_to", () => {
    const { traces_to: _omitted, ...withoutTrace } = criterionCase;
    expect(parse({ test_cases: [withoutTrace] }).success).toBe(false);
  });

  it("rejects a criterion trace without a quote", () => {
    expect(parse({ test_cases: [{ ...criterionCase, traces_to: { kind: "criterion" } }] }).success).toBe(false);
  });

  it("rejects an empty quote", () => {
    expect(parse({ test_cases: [{ ...criterionCase, traces_to: { kind: "criterion", quote: "" } }] }).success).toBe(
      false,
    );
  });

  it("rejects a quote on an assumption trace", () => {
    expect(
      parse({
        readiness: "needs_clarification",
        open_questions: ["q"],
        assumptions: ["a"],
        test_cases: [{ ...criterionCase, traces_to: { kind: "assumption", quote: "x" } }],
      }).success,
    ).toBe(false);
  });

  it("rejects a nested object as test data value", () => {
    const bad = { ...criterionCase, test_data: [{ field: "x", value: { a: 1 }, rationale: "r" }] };
    expect(parse({ test_cases: [bad] }).success).toBe(false);
  });

  it.each([["text"], [42], [true], [null]])("accepts %j as a test data value", (value) => {
    const ok = { ...criterionCase, test_data: [{ field: "x", value, rationale: "r" }] };
    expect(parse({ test_cases: [ok] }).success).toBe(true);
  });

  it("accepts empty test_cases when readiness is insufficient_information", () => {
    expect(
      parse({ readiness: "insufficient_information", open_questions: ["What should search return?"], test_cases: [] })
        .success,
    ).toBe(true);
  });
});

describe("readiness invariants (Zod-only)", () => {
  it("rejects 'ready' with open questions", () => {
    const result = parse({ open_questions: ["Is the limit inclusive?"] });
    expect(messages(result)).toContain("readiness is 'ready' but open_questions is not empty");
  });

  it("accepts 'needs_clarification' with open questions", () => {
    expect(parse({ readiness: "needs_clarification", open_questions: ["Is the limit inclusive?"] }).success).toBe(
      true,
    );
  });

  it.each(["needs_clarification", "insufficient_information"])("rejects '%s' without open questions", (readiness) => {
    const result = parse({ readiness, open_questions: [] });
    expect(messages(result)).toContain(`readiness is '${readiness}' but open_questions is empty`);
    expect(!result.success && result.error.issues.map((i) => i.path.join("."))).toContain("open_questions");
  });

  it("rejects assumption cases when 'ready'", () => {
    const result = parse({ assumptions: ["Locale is en-US"], test_cases: [criterionCase, assumptionCase] });
    expect(messages(result)).toContain("readiness is 'ready' but some test cases are assumptions");
  });

  it("accepts assumption cases when not 'ready' and assumptions are listed", () => {
    const result = parse({
      readiness: "needs_clarification",
      open_questions: ["Which locale should be used?"],
      assumptions: ["Locale is en-US"],
      test_cases: [criterionCase, assumptionCase],
    });
    expect(result.success).toBe(true);
  });

  it("rejects assumption cases with an empty assumptions list", () => {
    const result = parse({
      readiness: "needs_clarification",
      open_questions: ["q"],
      test_cases: [assumptionCase],
    });
    expect(messages(result)).toContain("test cases are marked as assumptions but the assumptions list is empty");
  });
});
