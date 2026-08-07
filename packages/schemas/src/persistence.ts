/**
 * v6.0.2 GM storage keys and schema versions.
 * New monorepo code must keep these exact strings so existing user data loads.
 */
export const V6_STORAGE_KEYS = {
  prompts: "bili-subbatch-prompts-v1",
  shortcuts: "bili-subbatch-shortcuts-v1",
  aiConfig: "bili-subbatch-ai-config-v1",
  postTasks: "bili-subbatch-post-tasks-v1",
  knowledgeModel: "bili-subbatch-knowledge-model-v1",
  preprocessMaxChars: "bili-subbatch-preprocess-max-chars-v1",
  preprocessRetries: "bili-subbatch-preprocess-retries-v1",
  autoCapture: "bili-subbatch-auto-capture-v1",
  autoAnalyze: "bili-subbatch-auto-analyze-v1",
  transcriptFollow: "bili-subbatch-transcript-follow-v2",
  playerSubtitle: "bili-subbatch-player-subtitle-v2",
} as const;

export const V6_SCHEMA_VERSIONS = {
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
