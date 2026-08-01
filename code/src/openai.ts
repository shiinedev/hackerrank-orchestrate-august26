import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { aiDecisionSchema, type AiDecision } from "./schemas.ts";

export type OpenAiConfig = {
  apiKey: string;
  model: string;
};

export function loadOpenAiConfig(env: Record<string, string | undefined> = process.env): OpenAiConfig {
  const apiKey = env.OPENAI_API_KEY?.trim();
  const model = env.OPENAI_MODEL?.trim();

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY. Add it to code/.env before running AI tasks.");
  }
  if (!model) {
    throw new Error("Missing OPENAI_MODEL. Set an OpenAI model ID in code/.env.");
  }

  return { apiKey, model };
}

export function createOpenAiProvider(config = loadOpenAiConfig()) {
  return createOpenAI({ apiKey: config.apiKey });
}

export async function generateRoutingDecision(
  prompt: string,
  config = loadOpenAiConfig(),
): Promise<AiDecision> {
  const openai = createOpenAiProvider(config);
  const result = await generateText({
    model: openai(config.model),
    output: Output.object({
      name: "MessageRoutingDecision",
      description: "A personalized, safety-aware routing decision for one WhatsApp message.",
      schema: aiDecisionSchema,
    }),
    prompt,
  });

  if (!result.output) {
    throw new Error("OpenAI returned no structured routing decision.");
  }

  return result.output;
}
