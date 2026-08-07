export type PromptStage = "preprocessing" | "postprocessing" | "knowledge";

export interface Prompt {
  id: string;
  name: string;
  stage: PromptStage;
  systemPrompt: string;
  userPromptTemplate: string;
  builtIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LlmProfile {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
}

