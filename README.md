# testcases-generator

Generates test cases and test data from user stories in GitHub Issues, using Claude.

See `CLAUDE.md` for the project goal, staged plan and design decisions.

## Setup

Requires Node >= 24 (the current LTS). With nvm, run `nvm use`.

```sh
npm install
```

Create a `.env` file (gitignored) with:

```
ANTHROPIC_API_KEY=<your key>
ANTHROPIC_MODEL=<model id>
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm test` | Runs the Vitest suite (offline; includes the schema drift test). |
| `npm run typecheck` | Type-checks `src/`, `scripts/` and `test/`. |
| `npm run generate:schema` | Regenerates `schemas/test_case_output.schema.json` from the Zod schema in `src/schema.ts`. |

The Zod schema is the single source of truth. Never edit the JSON file by hand: change `src/schema.ts`, run `npm run generate:schema`, and commit both.
