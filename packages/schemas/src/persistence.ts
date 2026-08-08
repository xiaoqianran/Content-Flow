/**
 * v6.0.2 GM storage keys and schema versions.
 * New monorepo code must keep these exact strings so existing user data loads.
 */
export const V6_STORAGE_KEYS = {
  ui: "bili-subbatch-ui-v2",
  aiLegacy: "bili-subbatch-ai-v2",
  aiProfiles: "bili-subbatch-ai-profiles-v1",
  /** @deprecated Use aiProfiles. Kept as a source-compatible alias. */
  aiConfig: "bili-subbatch-ai-profiles-v1",
  prompts: "bili-subbatch-prompts-v1",
  shortcuts: "bili-subbatch-shortcuts-v1",
  postTasks: "bili-subbatch-post-tasks-v1",
  knowledgeModel: "bili-subbatch-knowledge-model-v1",
  preprocessEnabled: "bili-subbatch-preprocess-enabled-v1",
  preprocessModel: "bili-subbatch-preprocess-model-v1",
  preprocessConcurrency: "bili-subbatch-preprocess-concurrency-v1",
  preprocessTargetMinutes: "bili-subbatch-preprocess-target-minutes-v1",
  preprocessOverlapSeconds: "bili-subbatch-preprocess-overlap-seconds-v1",
  preprocessMaxChars: "bili-subbatch-preprocess-max-chars-v1",
  preprocessRetries: "bili-subbatch-preprocess-retries-v1",
  autoCapture: "bili-subbatch-auto-capture-v1",
  autoAnalyze: "bili-subbatch-auto-analyze-v1",
  transcriptFollow: "bili-subbatch-transcript-follow-v2",
  playerSubtitle: "bili-subbatch-player-subtitle-v2",
} as const;

export const V6_SCHEMA_VERSIONS = {
  aiProfiles: 4,
  prompts: 5,
  shortcuts: 2,
  postTasks: 1,
} as const;

export const V6_BUILTIN_PROMPT_IDS = {
  preprocess: "builtin-subtitle-normalizer",
  postprocess: "builtin-mermaid-learning-map",
  knowledge: "builtin-knowledge-drilldown",
} as const;

export const V6_KNOWLEDGE_DB = {
  name: "bili-subbatch-knowledge-v1",
  version: 1,
  anchorStore: "anchors",
  nodeStore: "nodes",
} as const;

/** Shortcut command IDs frozen by v6.0.2 user bindings. */
export const V6_SHORTCUT_COMMAND_IDS = [
  "toggle-panel",
  "open-processed",
  "open-postprocess",
  "toggle-dock",
] as const;

export type V6ShortcutCommandId = (typeof V6_SHORTCUT_COMMAND_IDS)[number];
