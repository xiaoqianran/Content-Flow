import { md5 } from "../utils/md5";
import {
  cuesToAiText,
  formatClock,
  parseSeconds,
  type SubtitleCue,
} from "../transcript";

export interface PreprocessSettings {
  targetMinutes: number;
  overlapSeconds: number;
  maxChars: number;
}

export interface PreprocessItem {
  bvid?: string;
  page?: number;
  data?: SubtitleCue[];
}

export interface PreprocessChunk {
  text: string;
  coreStartSec: number;
  chunkStartSec: number;
  endSec: number;
  coreStartIdx: number;
  overlapStartIdx: number;
  endIdx: number;
}

export interface PreprocessPrompt {
  systemPrompt: string;
  userPromptTemplate: string;
}

export interface PreprocessModelConfig {
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

function cueTextLength(cue: SubtitleCue, bvid: string, page: number): number {
  return String(
    `[${bvid || "BV"} P${Math.max(1, Number(page) || 1)} ${formatClock(cue.from_sec ?? parseSeconds(cue.from))}] ${String(cue.content || "").trim()}\n`,
  ).length;
}

export function splitCuesForPreprocess(
  item: PreprocessItem,
  settings: PreprocessSettings,
): PreprocessChunk[] {
  const cues = (item.data ?? []).filter((cue) =>
    String(cue.content || "").trim(),
  );
  if (!cues.length) return [];
  const page = item.page || 1;
  const bvid = item.bvid || "BV";
  const targetSeconds = Math.max(120, settings.targetMinutes * 60);
  const overlapSeconds = Math.max(0, settings.overlapSeconds);
  const hardChars = Math.max(8000, settings.maxChars);
  const specs: PreprocessChunk[] = [];
  let coreStartIndex = 0;

  while (coreStartIndex < cues.length) {
    const firstCue = cues[coreStartIndex];
    if (!firstCue) break;
    const coreStartSeconds = Number(
      firstCue.from_sec ?? parseSeconds(firstCue.from),
    );
    let endIndex = coreStartIndex;
    let chars = 0;
    while (endIndex < cues.length) {
      const cue = cues[endIndex];
      if (!cue) break;
      const nextChars = chars + cueTextLength(cue, bvid, page);
      const cueEnd = Number(cue.to_sec ?? parseSeconds(cue.to));
      const duration = Math.max(0, cueEnd - coreStartSeconds);
      if (
        endIndex > coreStartIndex &&
        (nextChars > hardChars || duration >= targetSeconds)
      ) {
        break;
      }
      chars = nextChars;
      endIndex += 1;
    }
    if (endIndex <= coreStartIndex) endIndex = coreStartIndex + 1;

    let overlapStartIndex = coreStartIndex;
    if (specs.length && overlapSeconds > 0) {
      const wanted = coreStartSeconds - overlapSeconds;
      while (overlapStartIndex > 0) {
        const previous = cues[overlapStartIndex - 1];
        if (!previous) break;
        const previousSeconds = Number(
          previous.from_sec ?? parseSeconds(previous.from),
        );
        if (previousSeconds < wanted) break;
        overlapStartIndex -= 1;
      }
    }

    let chunkText = cuesToAiText(
      cues.slice(overlapStartIndex, endIndex),
      bvid,
      page,
    );
    while (chunkText.length > hardChars && overlapStartIndex < coreStartIndex) {
      overlapStartIndex += 1;
      chunkText = cuesToAiText(
        cues.slice(overlapStartIndex, endIndex),
        bvid,
        page,
      );
    }
    if (chunkText.length > hardChars) chunkText = chunkText.slice(0, hardChars);

    const overlapCue = cues[overlapStartIndex];
    const lastCue = cues[Math.max(coreStartIndex, endIndex - 1)];
    if (!overlapCue || !lastCue) break;
    specs.push({
      text: chunkText,
      coreStartSec: coreStartSeconds,
      chunkStartSec: Number(
        overlapCue.from_sec ?? parseSeconds(overlapCue.from),
      ),
      endSec: Number(lastCue.to_sec ?? parseSeconds(lastCue.to)),
      coreStartIdx: coreStartIndex,
      overlapStartIdx: overlapStartIndex,
      endIdx: endIndex,
    });
    coreStartIndex = endIndex;
  }
  return specs;
}

export function parseEvidenceTimestampSeconds(text: string): number | null {
  const match = String(text || "").match(
    /\[[^\]\n]*?\b(?:(\d{1,2}):)?(\d{2}):(\d{2})\]/,
  );
  if (!match) return null;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  return [hours, minutes, seconds].every(Number.isFinite)
    ? hours * 3600 + minutes * 60 + seconds
    : null;
}

export function trimProcessedOverlap(text: string, coreStartSec: number): string {
  const source = String(text || "").trim();
  if (!source || !(coreStartSec > 0)) return source;
  const blocks = source
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  const kept: string[] = [];
  let pending: string[] = [];
  let sawKeptTimestamp = false;
  let sawAnyTimestamp = false;
  for (const block of blocks) {
    const seconds = parseEvidenceTimestampSeconds(block);
    if (seconds == null) {
      if (sawKeptTimestamp) kept.push(block);
      else pending.push(block);
      continue;
    }
    sawAnyTimestamp = true;
    if (seconds + 0.75 < coreStartSec) {
      pending = [];
      continue;
    }
    if (!sawKeptTimestamp && pending.length) kept.push(...pending);
    pending = [];
    kept.push(block);
    sawKeptTimestamp = true;
  }
  if (!sawAnyTimestamp || !sawKeptTimestamp) return source;
  return kept.join("\n\n").trim();
}

export function dedupeExactBlocks(text: string): string {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const block of String(text || "")
    .split(/\n{2,}/)
    .map((value) => value.trim())
    .filter(Boolean)) {
    const key = block.replace(/\s+/g, " ").trim().toLocaleLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(block);
  }
  return output.join("\n\n").trim();
}

export function stitchPreprocessChunks(
  chunkSpecs: readonly Pick<PreprocessChunk, "coreStartSec">[],
  outputs: readonly (string | null | undefined)[],
): string {
  const parts: string[] = [];
  for (let index = 0; index < chunkSpecs.length; index += 1) {
    const spec = chunkSpecs[index];
    if (!spec) continue;
    const cleaned =
      index === 0
        ? String(outputs[index] || "").trim()
        : trimProcessedOverlap(String(outputs[index] || ""), spec.coreStartSec);
    if (cleaned) parts.push(cleaned);
  }
  return dedupeExactBlocks(parts.join("\n\n"));
}

export function preprocessCacheKey(
  item: Pick<PreprocessItem, "bvid" | "page">,
  raw: string,
  prompt: PreprocessPrompt,
  config: PreprocessModelConfig,
  settings: PreprocessSettings,
): string {
  const source = `${item.bvid || "BV"}:P${item.page || 1}`;
  const promptSignature = md5(
    `${prompt.systemPrompt}\n---\n${prompt.userPromptTemplate}`,
  );
  const modelSignature = md5(
    `${config.baseUrl}|${config.model}|${config.temperature}|${config.maxTokens}`,
  );
  const chunkSignature = md5(
    `${settings.targetMinutes}|${settings.overlapSeconds}|${settings.maxChars}`,
  );
  return `ai-preprocess:${source}:${md5(raw)}:${promptSignature}:${modelSignature}:${chunkSignature}`;
}

