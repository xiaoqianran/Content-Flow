import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { Script } from "node:vm";

import {
  LEGACY_BODY_MARKER,
  stripUserscriptMetadata,
} from "./userscript-build-utils";

const projectRoot = process.cwd();
const outputPath = resolve(projectRoot, "dist/userscript/subbatch.compat.user.js");
const maintainedSourcePath = resolve(projectRoot, "loop-bilibili.js");
const productionOutputPath = resolve(projectRoot, "dist/userscript/subbatch.user.js");

const requiredMetadata = [
  "// @version      6.1.7",
  "// @run-at       document-idle",
  "// @match        *://www.bilibili.com/video/*",
  "// @match        *://www.bilibili.com/list/*",
  "// @grant        GM_xmlhttpRequest",
  "// @grant        GM_setClipboard",
  "// @grant        GM_addStyle",
  "// @grant        GM_info",
  "// @grant        GM_setValue",
  "// @grant        GM_getValue",
  "// @grant        unsafeWindow",
];

function hash(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}

/**
 * Verify compat userscript: monorepo bootstrap + byte-identical maintained body.
 */
async function verify(): Promise<void> {
  const [output, maintainedSource, productionOutput, outputStats] = await Promise.all([
    readFile(outputPath, "utf8"),
    readFile(maintainedSourcePath, "utf8"),
    readFile(productionOutputPath, "utf8"),
    stat(outputPath),
  ]);
  if (output !== productionOutput) {
    throw new Error("Compatibility alias must be byte-identical to the production userscript");
  }
  if (!output.startsWith("// ==UserScript==\n")) {
    throw new Error("Userscript metadata must be the first output bytes");
  }
  if ((output.match(/\/\/ ==UserScript==/g) ?? []).length !== 1) {
    throw new Error("Output must contain exactly one metadata header");
  }
  for (const row of requiredMetadata) {
    if (!output.includes(row)) throw new Error(`Missing metadata row: ${row}`);
  }
  if (/^\s*(?:import|export)\s/m.test(output) || /\brequire\s*\(/.test(output)) {
    throw new Error("Output contains a runtime module dependency");
  }
  new Script(output, { filename: "subbatch.compat.user.js" });

  const marker = `${LEGACY_BODY_MARKER}\n`;
  const markerIndex = output.indexOf(marker);
  if (markerIndex < 0) throw new Error("Compatibility runtime marker not found");
  const outputBehaviorBody = output.slice(markerIndex + marker.length);
  const expectedBehaviorBody = stripUserscriptMetadata(maintainedSource);
  if (outputBehaviorBody !== expectedBehaviorBody) {
    throw new Error(
      `Maintained behavior body mismatch: expected ${hash(expectedBehaviorBody)}, received ${hash(outputBehaviorBody)}`,
    );
  }
  if (outputStats.size <= Buffer.byteLength(maintainedSource)) {
    throw new Error("Compat output is unexpectedly smaller than the maintained source");
  }

  console.log(
    `Verified compat alias ${outputPath}: identical to production and includes exact maintained behavior body`,
  );
}

void verify();
