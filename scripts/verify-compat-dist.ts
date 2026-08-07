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
const legacyPath = resolve(
  projectRoot,
  "legacy/Bili-SubBatch-v6.0.2.user.js",
);

const requiredMetadata = [
  "// @version      6.1.0",
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
 * Verify compat userscript: monorepo bootstrap + byte-identical legacy body.
 */
async function verify(): Promise<void> {
  const [output, legacy, outputStats] = await Promise.all([
    readFile(outputPath, "utf8"),
    readFile(legacyPath, "utf8"),
    stat(outputPath),
  ]);
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
  const outputLegacyBody = output.slice(markerIndex + marker.length);
  const expectedLegacyBody = stripUserscriptMetadata(legacy);
  if (outputLegacyBody !== expectedLegacyBody) {
    throw new Error(
      `Legacy behavior body mismatch: expected ${hash(expectedLegacyBody)}, received ${hash(outputLegacyBody)}`,
    );
  }
  if (outputStats.size <= Buffer.byteLength(legacy)) {
    throw new Error("Compat output is unexpectedly smaller than the Golden Reference");
  }

  console.log(
    `Verified compat ${outputPath}: metadata, monorepo bootstrap, byte-identical Legacy body`,
  );
}

void verify();
