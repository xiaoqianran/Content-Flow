export interface KnowledgeContextNode {
  question: string;
  answer?: string;
}

export interface ParsedKnowledgeOutput {
  answer: string;
  suggestions: string[];
}

export function parseKnowledgeOutput(raw: string): ParsedKnowledgeOutput {
  const source = String(raw || "");
  const match = source.match(/<suggestions>([\s\S]*?)(?:<\/suggestions>|$)/i);
  const answer = source.replace(/\n?<suggestions>[\s\S]*$/i, "").trim();
  const suggestions = match
    ? (match[1] ?? "")
        .split(/\r?\n/)
        .map((item) => item.replace(/^\s*[-*\d.)]+\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];
  return { answer, suggestions };
}

export function knowledgeBranchContext(
  parentNode: KnowledgeContextNode | null | undefined,
  ancestors: readonly KnowledgeContextNode[] = [],
): string {
  if (!parentNode) return "（这是该锚点下的新分支）";
  return [...ancestors, parentNode]
    .slice(-6)
    .map((node, index) => {
      const answer = String(node.answer || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 1800);
      return `${index + 1}. 问题：${node.question}\n   回答摘要：${answer || "（尚无回答）"}`;
    })
    .join("\n");
}

