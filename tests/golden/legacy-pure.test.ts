import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { legacyFunction } from "./legacy-harness";

type UnknownFunction = (...args: any[]) => any;

function fixture(name: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)),
    "utf8",
  );
}

const parseSeconds = legacyFunction<UnknownFunction>("parseSeconds");
const formatClock = legacyFunction<UnknownFunction>("formatClock");
const extractBvid = legacyFunction<UnknownFunction>("extractBvid");

describe("v6.0.2 Golden Baseline", () => {
  it("识别 Bilibili BV、单视频与合集路由", () => {
    expect(extractBvid("https://www.bilibili.com/video/bv1Ab411c7mD")).toBe(
      "BV1Ab411c7mD",
    );
    expect(extractBvid("not-a-video")).toBe("");

    const detectContext = legacyFunction<UnknownFunction>("detectContext", {
      extractBvid,
      extractPageHints: () => ({}),
      pickHintIds: () => ({}),
    });
    const single = JSON.parse(fixture("single-video.json"));
    const collection = JSON.parse(fixture("collection.json"));

    expect(detectContext(single.url)).toEqual(single.expected);
    expect(detectContext(collection.url)).toEqual(collection.expected);
  });

  it("解析字幕并保持 SRT/TXT 输出", () => {
    const toCues = legacyFunction<UnknownFunction>("toCues");
    const formatSrtTimestamp = legacyFunction<UnknownFunction>(
      "formatSrtTimestamp",
    );
    const cuesToSrt = legacyFunction<UnknownFunction>("cuesToSrt", {
      formatSrtTimestamp,
      parseSeconds,
    });
    const cuesToTxt = legacyFunction<UnknownFunction>("cuesToTxt");
    const cues = toCues([
      { sid: 9, from: 1.2, to: 3.456, content: "第一行" },
      { from: 4, to: 5, content: "第二行\n续行" },
    ]);

    expect(cues).toEqual([
      {
        index: 9,
        from: "1.20s",
        to: "3.46s",
        from_sec: 1.2,
        to_sec: 3.456,
        content: "第一行",
      },
      {
        index: 2,
        from: "4.00s",
        to: "5.00s",
        from_sec: 4,
        to_sec: 5,
        content: "第二行\n续行",
      },
    ]);
    expect(cuesToSrt(cues)).toBe(
      "1\n00:00:01,200 --> 00:00:03,456\n第一行\n\n" +
        "2\n00:00:04,000 --> 00:00:05,000\n第二行\n续行\n",
    );
    expect(cuesToTxt(cues)).toBe("第一行\n第二行\n续行");
  });

  it("按时间切 PRE chunk 并保留 overlap", () => {
    const cuesToAiText = legacyFunction<UnknownFunction>("cuesToAiText", {
      formatClock,
      parseSeconds,
    });
    const cueTextLength = legacyFunction<UnknownFunction>("cueTextLength", {
      formatClock,
      parseSeconds,
    });
    const splitCuesForPreprocess = legacyFunction<UnknownFunction>(
      "splitCuesForPreprocess",
      { cueTextLength, cuesToAiText, parseSeconds },
    );
    const item = JSON.parse(fixture("long-transcript.json"));
    const chunks = splitCuesForPreprocess(item, {
      targetMinutes: 2,
      overlapSeconds: 30,
      maxChars: 8_000,
    });

    expect(chunks).toHaveLength(2);
    expect(chunks.map((chunk: any) => ({
      coreStartSec: chunk.coreStartSec,
      chunkStartSec: chunk.chunkStartSec,
      endSec: chunk.endSec,
      coreStartIdx: chunk.coreStartIdx,
      overlapStartIdx: chunk.overlapStartIdx,
      endIdx: chunk.endIdx,
    }))).toEqual([
      { coreStartSec: 0, chunkStartSec: 0, endSec: 100, coreStartIdx: 0, overlapStartIdx: 0, endIdx: 4 },
      { coreStartSec: 120, chunkStartSec: 90, endSec: 190, coreStartIdx: 4, overlapStartIdx: 3, endIdx: 7 },
    ]);
    expect(chunks[1].text).toContain("[BV1TEST P2 01:30] 第三点");
  });

  it("按 coreStart 去 overlap 并确定性拼接", () => {
    const parseEvidenceTimestampSeconds = legacyFunction<UnknownFunction>(
      "parseEvidenceTimestampSeconds",
    );
    const trimProcessedOverlap = legacyFunction<UnknownFunction>(
      "trimProcessedOverlap",
      { parseEvidenceTimestampSeconds },
    );
    const dedupeExactBlocks = legacyFunction<UnknownFunction>(
      "dedupeExactBlocks",
    );
    const stitchPreprocessChunks = legacyFunction<UnknownFunction>(
      "stitchPreprocessChunks",
      { dedupeExactBlocks, trimProcessedOverlap },
    );
    const [first, second] = fixture("pre-output.txt").split("\n---CHUNK---\n");

    expect(
      stitchPreprocessChunks(
        [{ coreStartSec: 0 }, { coreStartSec: 120 }],
        [first, second],
      ),
    ).toBe(
      "[BV1TEST P2 00:00] 开场整理\n\n" +
        "[BV1TEST P2 01:30] 第三点整理\n\n" +
        "[BV1TEST P2 02:00] 第四点整理\n\n" +
        "[BV1TEST P2 02:30] 第五点整理",
    );
  });

  it("渲染 Prompt 且保留未知变量", () => {
    const renderPromptTemplate = legacyFunction<UnknownFunction>(
      "renderPromptTemplate",
    );
    expect(
      renderPromptTemplate(
        "{{ title }} · {{bvid}}\n{{subtitle}}\n{{unknown}}",
        { title: "标题", bvid: "BV1TEST", subtitle: "字幕" },
      ),
    ).toBe("标题 · BV1TEST\n字幕\n{{unknown}}");
  });

  it("只清理 Mermaid code fence 内的时间戳", () => {
    const stripMermaidTimestampCitations = legacyFunction<UnknownFunction>(
      "stripMermaidTimestampCitations",
    );
    const sanitize = legacyFunction<UnknownFunction>(
      "sanitizeMermaidTimestampCitationsInMarkdown",
      { stripMermaidTimestampCitations },
    );
    const markdown =
      "正文 [BV1TEST P2 03:21]\n```mermaid\ngraph TD\nA[概念 [BV1TEST P2 03:21]] --> B[结论 [P2 04:00]]\n```";
    expect(sanitize(markdown)).toBe(
      "正文 [BV1TEST P2 03:21]\n```mermaid\ngraph TD\nA[概念] --> B[结论]\n```",
    );
  });

  it("解析 Knowledge suggestions 与分支上下文", () => {
    const parseKnowledgeOutput = legacyFunction<UnknownFunction>(
      "parseKnowledgeOutput",
    );
    expect(parseKnowledgeOutput(fixture("knowledge-output.txt"))).toEqual({
      answer: "这是一个基于当前锚点的回答。",
      suggestions: [
        "这个结论的前提是什么？",
        "有哪些反例？",
        "如何应用到实践？",
      ],
    });

    const knowledgeBranchContext = legacyFunction<UnknownFunction>(
      "knowledgeBranchContext",
      { knowledgeAncestorNodes: () => [{ question: "起点？", answer: "起点回答" }] },
    );
    expect(
      knowledgeBranchContext({ question: "继续？", answer: "继续回答" }),
    ).toBe(
      "1. 问题：起点？\n   回答摘要：起点回答\n" +
        "2. 问题：继续？\n   回答摘要：继续回答",
    );
  });

  it("解析快捷键 chord 与 route key", () => {
    const shortcutChordFromEvent = legacyFunction<UnknownFunction>(
      "shortcutChordFromEvent",
    );
    const shortcutKeyLabel = legacyFunction<UnknownFunction>("shortcutKeyLabel");
    const shortcutDisplayChord = legacyFunction<UnknownFunction>(
      "shortcutDisplayChord",
      { shortcutKeyLabel },
    );
    const routeVideoKey = legacyFunction<UnknownFunction>("routeVideoKey");

    const chord = shortcutChordFromEvent({
      code: "Digit1",
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
      metaKey: false,
    });
    expect(chord).toBe("Ctrl+Alt+Digit1");
    expect(shortcutDisplayChord(chord)).toBe("Ctrl + Alt + 1");
    expect(routeVideoKey("bv1Test", 0)).toBe("BV1TEST:P1");
  });

  it("生成稳定 PRE cache key", () => {
    const md5 = legacyFunction<UnknownFunction>("md5");
    const preprocessCacheKey = legacyFunction<UnknownFunction>(
      "preprocessCacheKey",
      { md5 },
    );
    expect(
      preprocessCacheKey(
        { bvid: "BV1TEST", page: 2 },
        "raw transcript",
        { systemPrompt: "system", userPromptTemplate: "Hello {{subtitle}}" },
        {
          baseUrl: "http://127.0.0.1:1234",
          model: "test-model",
          temperature: 0.2,
          maxTokens: 4096,
        },
        { targetMinutes: 8, overlapSeconds: 30, maxChars: 24_000 },
      ),
    ).toBe(
      "ai-preprocess:BV1TEST:P2:cf7b263a3cc99460b01b27ec78c65d16:" +
        "b246d03e9f11698199d7385eb19a3898:" +
        "8495553a552cf22f49f29877c3f174bd:" +
        "6e1d6b1c8ee6b9d809c489496c9b2995",
    );
  });
});

