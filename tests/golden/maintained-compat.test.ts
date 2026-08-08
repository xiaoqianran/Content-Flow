import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  extractFunctionSource,
  legacyFunction,
  legacySource,
  sourceFunction,
} from "./legacy-harness";

type UnknownFunction = (...args: any[]) => any;

const maintainedSource = readFileSync(
  fileURLToPath(new URL("../../loop-bilibili.js", import.meta.url)),
  "utf8",
);

function functionNames(source: string): Set<string> {
  return new Set(
    [...source.matchAll(/\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)]
      .map((match) => match[1])
      .filter((name): name is string => Boolean(name)),
  );
}

describe("Maintained full-feature compatibility source", () => {
  it("retains every named function from the frozen external baseline", () => {
    const baselineNames = functionNames(legacySource);
    const maintainedNames = functionNames(maintainedSource);
    const missing = [...baselineNames].filter((name) => !maintainedNames.has(name));

    expect(baselineNames.size).toBeGreaterThan(250);
    expect(missing).toEqual([]);
    expect(maintainedSource).toContain("function boot()");
    expect(maintainedSource).toContain("scheduleAutoCapture(\"initial\", 180)");
  });

  it("fixes query-key BV corruption while documenting the baseline behavior", () => {
    const baselineExtract = legacyFunction<UnknownFunction>("extractBvid");
    const maintainedExtract = sourceFunction<UnknownFunction>(
      maintainedSource,
      "extractBvid",
    );
    const input = "https://www.bilibili.com/list/1?bvid=BV1Q541167Qg";

    expect(baselineExtract(input)).toBe("BVid");
    expect(maintainedExtract(input)).toBe("BV1Q541167Qg");
  });

  it("renders PRE chunk boundary variables in the maintained product path", () => {
    const render = sourceFunction<UnknownFunction>(
      maintainedSource,
      "renderPromptTemplate",
    );
    expect(
      render("{{chunkStart}}|{{coreStart}}|{{chunkEnd}}", {
        chunkStart: "00:30",
        coreStart: "01:00",
        chunkEnd: "02:00",
      }),
    ).toBe("00:30|01:00|02:00");
  });

  it("clears transcript search state when SPA navigation changes videos", () => {
    const navigateSource = extractFunctionSource(maintainedSource, "onMaybeNavigate");

    expect(navigateSource).toContain('state.transcriptQuery = ""');
    expect(navigateSource).toContain("state.transcriptFilteredIndexes = null");
    expect(navigateSource).toContain("transcriptSearch.value = \"\"");
  });

  it("resets preprocess view to raw when SPA navigation aborts AI state", () => {
    const abortSource = extractFunctionSource(
      maintainedSource,
      "abortAiForAutoNavigation",
    );
    expect(abortSource).toContain('state.aiInputView = "raw"');
    expect(abortSource).toContain("state.preprocessRun = null");
  });

  it("falls back preprocess canvas to raw when processed text is empty", () => {
    const canvasSource = extractFunctionSource(
      maintainedSource,
      "renderPreprocessCanvas",
    );
    expect(canvasSource).toContain(
      'if (state.aiInputView === "processed" && !processed && raw)',
    );
    expect(canvasSource).toContain('state.aiInputView = "raw"');
  });

  it("bridges pure monorepo cores when SubBatch bootstrap is present", () => {
    expect(maintainedSource).toContain("SubBatchMonorepo");
    expect(extractFunctionSource(maintainedSource, "extractBvid")).toContain(
      "SubBatch?.SubBatchMonorepo?.bilibili?.extractBvid",
    );
    expect(extractFunctionSource(maintainedSource, "detectContext")).toContain(
      "SubBatch?.SubBatchMonorepo?.bilibili?.detectContext",
    );
    expect(extractFunctionSource(maintainedSource, "routeVideoKey")).toContain(
      "SubBatch?.SubBatchMonorepo?.bilibili?.routeVideoKey",
    );
    expect(
      extractFunctionSource(maintainedSource, "renderPromptTemplate"),
    ).toContain("SubBatch?.SubBatchMonorepo");
  });

  it("uses two-pane Knowledge Workspace (Navigator | Reader)", () => {
    expect(maintainedSource).toContain("function knowledgeNavigatorHtml(");
    expect(maintainedSource).toContain("function knowledgeReaderHtml(");
    expect(maintainedSource).toContain("function knowledgeContextHtml(");
    expect(maintainedSource).toContain('data-role="knowledge-nav"');
    expect(maintainedSource).toContain('data-role="knowledge-nav-split"');
    expect(maintainedSource).toContain("bsb-knowledge-reader");
    expect(maintainedSource).toContain("bsb-knowledge-evidence-chip");
    expect(maintainedSource).toContain("knowledgeNavW");
    expect(maintainedSource).toContain("--bsb-knowledge-nav-w");
    expect(maintainedSource).not.toContain('data-role="knowledge-tree-split"');
    expect(maintainedSource).not.toContain('data-role="knowledge-list-split"');
    expect(maintainedSource).not.toContain("data-knowledge-workspace-tree-toggle");
    expect(maintainedSource).toContain("Enter 发送");
    // Knowledge 页不得无条件 display:flex，否则会叠在 AI/字幕上。
    expect(maintainedSource).not.toMatch(
      /\[data-view-panel="knowledge"\]\s*\{\s*min-height:0;\s*height:100%;\s*display:flex/,
    );
    expect(maintainedSource).toContain(
      '.bsb-view[data-view-panel="knowledge"]',
    );
    // Knowledge answers reuse AI 处理字幕 segmented card chrome.
    expect(maintainedSource).toContain("function knowledgeAnswerReadingBlocks(");
    expect(maintainedSource).toContain("function renderKnowledgeAnswerCards(");
    expect(maintainedSource).toContain("bsb-knowledge-answer-card");
    expect(maintainedSource).toContain("bsb-preprocess-block bsb-knowledge-answer-card");
  });

  it("refreshes the preprocess canvas after automatic subtitle capture", () => {
    const captureStart = maintainedSource.indexOf(
      "async function autoCaptureCurrentVideo(",
    );
    const captureEnd = maintainedSource.indexOf("// ─── SPA watch", captureStart);
    const refreshStatement =
      'if (currentAiWorkbenchStage() === "preprocess") await renderPreprocessCanvas()';

    expect(captureStart).toBeGreaterThan(0);
    expect(captureEnd).toBeGreaterThan(captureStart);
    expect(maintainedSource.slice(captureStart, captureEnd)).toContain(refreshStatement);
  });
});
