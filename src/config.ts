export interface Config {
  apiKey: string;
  model: string;
}

// Reads settings from the environment (loaded from .env by `node --env-file`, no dotenv).
// The model ID is deliberately not defaulted here so it can never be hardcoded by accident.
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const apiKey = env.ANTHROPIC_API_KEY?.trim();
  const model = env.ANTHROPIC_MODEL?.trim();

  const missing: string[] = [];
  if (!apiKey) missing.push("ANTHROPIC_API_KEY");
  if (!model) missing.push("ANTHROPIC_MODEL");
  if (!apiKey || !model) {
    throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
  }

  return { apiKey, model };
}
