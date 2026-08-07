export const SCHEMA_VERSION = 1;

export type { Content, ContentType } from "./content";
export type { TranscriptSegment, TranscriptVersion } from "./transcript";
export type { Artifact, RunStatus } from "./artifact";
export type { KnowledgeAnchor, KnowledgeThreadNode } from "./knowledge";
export type { Job } from "./job";
export type { LlmProfile, Prompt, PromptStage } from "./prompt";
export {
  PROMPT_STAGES,
  isPromptStage,
  normalizePromptStage,
} from "./prompt";
export type { SubBatchEvent } from "./events";
export {
  V6_BUILTIN_PROMPT_IDS,
  V6_KNOWLEDGE_DB,
  V6_SCHEMA_VERSIONS,
  V6_SHORTCUT_COMMAND_IDS,
  V6_STORAGE_KEYS,
} from "./persistence";
export type { V6ShortcutCommandId } from "./persistence";
