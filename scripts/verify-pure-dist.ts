import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { Script } from "node:vm";

import { LEGACY_BODY_MARKER } from "./userscript-build-utils";

const projectRoot = process.cwd();
const outputPath = resolve(projectRoot, "dist/userscript/subbatch.pure.user.js");

function hash(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}

async function verify(): Promise<void> {
  const [output, outputStats] = await Promise.all([
    readFile(outputPath, "utf8"),
    stat(outputPath),
  ]);
  if (!output.startsWith("// ==UserScript==\n")) {
    throw new Error("Userscript metadata must be the first output bytes");
  }
  if ((output.match(/\/\/ ==UserScript==/g) ?? []).length !== 1) {
    throw new Error("Output must contain exactly one metadata header");
  }
  if (/^\s*(?:import|export)\s/m.test(output) || /\brequire\s*\(/.test(output)) {
    throw new Error("Output contains a runtime module dependency");
  }
  new Script(output, { filename: "subbatch.pure.user.js" });
  if (output.includes(LEGACY_BODY_MARKER)) {
    throw new Error("Pure laboratory output must not include the maintained behavior body");
  }
  if (outputStats.size > 350_000) {
    throw new Error(`Pure output is suspiciously large (${outputStats.size} bytes)`);
  }
  if (!output.includes("SubBatchMonorepo")) {
    throw new Error("Pure output missing monorepo API composition");
  }
  console.log(
    `Verified experimental pure ${outputPath}: single-file API bundle, no compatibility body (sha256 ${hash(output)})`,
  );
}

void verify();
