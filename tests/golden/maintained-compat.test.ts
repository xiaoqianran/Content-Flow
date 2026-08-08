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
