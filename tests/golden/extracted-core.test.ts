import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  knowledgeBranchContext,
  md5,
  parseKnowledgeOutput,
  preprocessCacheKey,
  renderPromptTemplate,
  sanitizeMermaidTimestampCitationsInMarkdown,
  shortcutChordFromEvent,
  shortcutDisplayChord,
  splitCuesForPreprocess,
  stitchPreprocessChunks,
  toCues,
  cuesToSrt,
  cuesToTxt,
  type PreprocessItem,
} from "@subbatch/core";
import { detectContext, extractBvid, routeVideoKey } from "@subbatch/bilibili";

function fixture(name: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)),
    "utf8",
  );
}

describe("P2 extracted Pure Core", () => {
  it("matches route and subtitle Golden outputs", () => {
    const single = JSON.parse(fixture("single-video.json"));
    const collection = JSON.parse(fixture("collection.json"));
    expect(extractBvid("https://www.bilibili.com/video/bv1Ab411c7mD")).toBe(
      "BV1Ab411c7mD",
    );
    expect(detectContext(single.url)).toEqual(single.expected);
    expect(detectContext(collection.url)).toEqual(collection.expected);
    expect(routeVideoKey("bv1Test", 0)).toBe("BV1TEST:P1");

    const cues = toCues([
      { sid: 9, from: 1.2, to: 3.456, content: "第一行" },
      { from: 4, to: 5, content: "第二行\n续行" },
    ]);
    expect(cuesToSrt(cues)).toBe(
      "1\n00:00:01,200 --> 00:00:03,456\n第一行\n\n" +
        "2\n00:00:04,000 --> 00:00:05,000\n第二行\n续行\n",
    );
    expect(cuesToTxt(cues)).toBe("第一行\n第二行\n续行");
  });

  it("matches PRE chunk, stitch and cache Golden outputs", () => {
    const item = JSON.parse(fixture("long-transcript.json")) as PreprocessItem;
    const chunks = splitCuesForPreprocess(item, {
      targetMinutes: 2,
      overlapSeconds: 30,
      maxChars: 8_000,
    });
    expect(chunks.map((chunk) => ({
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

    expect(md5("raw transcript")).toBe("cf7b263a3cc99460b01b27ec78c65d16");
    expect(
      preprocessCacheKey(
        { bvid: "BV1TEST", page: 2 },
        "raw transcript",
        { systemPrompt: "system", userPromptTemplate: "Hello {{subtitle}}" },
        { baseUrl: "http://127.0.0.1:1234", model: "test-model", temperature: 0.2, maxTokens: 4096 },
        { targetMinutes: 8, overlapSeconds: 30, maxChars: 24_000 },
      ),
    ).toBe(
      "ai-preprocess:BV1TEST:P2:cf7b263a3cc99460b01b27ec78c65d16:" +
        "b246d03e9f11698199d7385eb19a3898:" +
        "8495553a552cf22f49f29877c3f174bd:" +
        "6e1d6b1c8ee6b9d809c489496c9b2995",
    );
  });

  it("matches Prompt, Mermaid, Knowledge and shortcut Golden outputs", () => {
    expect(
      renderPromptTemplate("{{ title }} · {{bvid}}\n{{subtitle}}\n{{unknown}}", {
        title: "标题",
        bvid: "BV1TEST",
        subtitle: "字幕",
      }),
    ).toBe("标题 · BV1TEST\n字幕\n{{unknown}}");

    const markdown =
      "正文 [BV1TEST P2 03:21]\n```mermaid\ngraph TD\nA[概念 [BV1TEST P2 03:21]] --> B[结论 [P2 04:00]]\n```";
    expect(sanitizeMermaidTimestampCitationsInMarkdown(markdown)).toBe(
      "正文 [BV1TEST P2 03:21]\n```mermaid\ngraph TD\nA[概念] --> B[结论]\n```",
    );

    expect(parseKnowledgeOutput(fixture("knowledge-output.txt"))).toEqual({
      answer: "这是一个基于当前锚点的回答。",
      suggestions: ["这个结论的前提是什么？", "有哪些反例？", "如何应用到实践？"],
    });
    expect(
      knowledgeBranchContext(
        { question: "继续？", answer: "继续回答" },
        [{ question: "起点？", answer: "起点回答" }],
      ),
    ).toBe(
      "1. 问题：起点？\n   回答摘要：起点回答\n" +
        "2. 问题：继续？\n   回答摘要：继续回答",
    );

    const chord = shortcutChordFromEvent({
      code: "Digit1",
      ctrlKey: true,
      altKey: true,
    });
    expect(chord).toBe("Ctrl+Alt+Digit1");
    expect(shortcutDisplayChord(chord)).toBe("Ctrl + Alt + 1");
  });
});
