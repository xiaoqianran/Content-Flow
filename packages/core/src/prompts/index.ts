const PROMPT_KEYS = [
  "title",
  "bvid",
  "author",
  "subtitle",
  "rawSubtitle",
  "processedSubtitle",
  "chunkIndex",
  "chunkCount",
  "anchorText",
  "sourceContext",
  "ancestorPath",
  "question",
] as const;

export type PromptVariables = Partial<Record<(typeof PROMPT_KEYS)[number], unknown>>;

export function renderPromptTemplate(
  template: string,
  variables: PromptVariables | null | undefined,
): string {
  const values = Object.fromEntries(
    PROMPT_KEYS.map((key) => [key, String(variables?.[key] || "")]),
  ) as Record<(typeof PROMPT_KEYS)[number], string>;
  return String(template || "").replace(
    /\{\{\s*(title|bvid|author|subtitle|rawSubtitle|processedSubtitle|chunkIndex|chunkCount|anchorText|sourceContext|ancestorPath|question)\s*\}\}/g,
    (_, key: (typeof PROMPT_KEYS)[number]) => values[key] ?? "",
  );
}

