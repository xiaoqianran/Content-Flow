const PROMPT_KEYS = [
  "title",
  "bvid",
  "author",
  "subtitle",
  "rawSubtitle",
  "processedSubtitle",
  "chunkIndex",
  "chunkCount",
  "chunkStart",
  "coreStart",
  "chunkEnd",
  "anchorText",
  "sourceContext",
  "ancestorPath",
  "question",
] as const;

export type PromptVariableKey = (typeof PROMPT_KEYS)[number];
export type PromptVariables = Partial<Record<PromptVariableKey, unknown>>;

const PROMPT_KEY_PATTERN =
  /\{\{\s*(title|bvid|author|subtitle|rawSubtitle|processedSubtitle|chunkIndex|chunkCount|chunkStart|coreStart|chunkEnd|anchorText|sourceContext|ancestorPath|question)\s*\}\}/g;

/**
 * Render a prompt template.
 * Unknown placeholders are left intact (v6 behavior).
 * chunkStart / coreStart / chunkEnd are required by PRE chunk templates.
 */
export function renderPromptTemplate(
  template: string,
  variables: PromptVariables | null | undefined,
): string {
  const values = Object.fromEntries(
    // Legacy uses `value || ""`; retain false/zero compatibility while the
    // new chunk boundary variables extend the supported key set.
    PROMPT_KEYS.map((key) => [key, String(variables?.[key] || "")]),
  ) as Record<PromptVariableKey, string>;
  return String(template || "").replace(
    PROMPT_KEY_PATTERN,
    (_, key: PromptVariableKey) => values[key] ?? "",
  );
}

export { PROMPT_KEYS };
