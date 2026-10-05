import { z } from "zod";

export const TICKET_TYPES = ["feature", "bug_report", "task"] as const;
export const READINESS_VALUES = ["ready", "needs_clarification", "insufficient_information"] as const;
export const TEST_CASE_TYPES = [
  "happy_path",
  "negative",
  "boundary",
  "edge_case",
  "security",
  "regression",
  "performance",
] as const;
export const PRIORITIES = ["high", "medium", "low"] as const;

// A discriminated union on `kind` so the "criterion needs a quote" rule shows up in the
// generated JSON Schema. That `quote` is a verbatim substring of the ticket cannot be
// checked here (the schema never sees the ticket); the evals check it.
export const TraceSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("criterion"),
    quote: z
      .string()
      .min(1)
      .describe("Verbatim quote from the ticket of the acceptance criterion this test case covers."),
  }),
  z.strictObject({
    kind: z.literal("assumption"),
  }),
]);

export const TestDataItemSchema = z.strictObject({
  field: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  rationale: z.string(),
});

export const TestCaseSchema = z.strictObject({
  id: z
    .string()
    .regex(/^TC-\d{3}$/)
    .describe("Unique within the issue, e.g. TC-001."),
  title: z.string(),
  type: z.enum(TEST_CASE_TYPES),
  priority: z.enum(PRIORITIES),
  preconditions: z.array(z.string()),
  steps: z.array(z.string()),
  expected_result: z.string(),
  test_data: z.array(TestDataItemSchema),
  traces_to: TraceSchema,
});

// Cross-field rules JSON Schema cannot express. They are enforced by Zod only, so the
// generated JSON file (and the drift test) do not cover them; schema.test.ts does.
export const TestCaseOutputSchema = z
  .strictObject({
    issue: z.strictObject({
      number: z.number().int(),
      title: z.string(),
    }),
    ticket_type: z.enum(TICKET_TYPES),
    readiness: z.enum(READINESS_VALUES),
    open_questions: z.array(z.string()),
    assumptions: z.array(z.string()),
    test_cases: z.array(TestCaseSchema),
  })
  .describe("Test cases generated for one GitHub issue.")
  .superRefine((output, ctx) => {
    const assumptionCases = output.test_cases.filter((tc) => tc.traces_to.kind === "assumption");

    if (output.readiness === "ready" && output.open_questions.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["open_questions"],
        message: "readiness is 'ready' but open_questions is not empty",
      });
    }

    if (output.readiness !== "ready" && output.open_questions.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["open_questions"],
        message: `readiness is '${output.readiness}' but open_questions is empty`,
      });
    }

    if (output.readiness === "ready" && assumptionCases.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["test_cases"],
        message: "readiness is 'ready' but some test cases are assumptions",
      });
    }

    if (assumptionCases.length > 0 && output.assumptions.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["assumptions"],
        message: "test cases are marked as assumptions but the assumptions list is empty",
      });
    }
  });

export type Trace = z.infer<typeof TraceSchema>;
export type TestDataItem = z.infer<typeof TestDataItemSchema>;
export type TestCase = z.infer<typeof TestCaseSchema>;
export type TestCaseOutput = z.infer<typeof TestCaseOutputSchema>;
