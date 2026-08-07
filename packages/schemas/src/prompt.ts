/** v6.0.2 persistence values — do not rename. */
export type PromptStage = "preprocess" | "postprocess" | "knowledge";

/**
 * Prompt profile shape compatible with GM storage key
 * `bili-subbatch-prompts-v1` (schema version 5).
 */
export interface Prompt {
  id: string;
  name: string;
  stage: PromptStage;
  /** Short label shown in Studio lists (v6 field). */
  hint?: string;
  systemPrompt: string;
  userPromptTemplate: string;
  /** Optional monorepo metadata; absent in raw v6 payloads. */
  builtIn?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * LLM profile shape compatible with GM storage key
 * `bili-subbatch-ai-config-v1`.
 */
export interface LlmProfile {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  /** Default true in v6 — streaming avoids intermediary 10s cuts. */
  stream?: boolean;
  enabled: boolean;
}

export const PROMPT_STAGES: readonly PromptStage[] = [
  "preprocess",
  "postprocess",
  "knowledge",
] as const;

export function isPromptStage(value: unknown): value is PromptStage {
  return (
    value === "preprocess" || value === "postprocess" || value === "knowledge"
  );
}

export function normalizePromptStage(value: unknown): PromptStage {
  if (value === "postprocess" || value === "postprocessing") return "postprocess";
  if (value === "knowledge") return "knowledge";
  if (value === "preprocess" || value === "preprocessing") return "preprocess";
  return "preprocess";
}
