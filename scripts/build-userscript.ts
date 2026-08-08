import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { build } from "vite";

import {
  renderUserscriptMetadata,
  userscriptMetadata,
} from "../apps/userscript/metadata";
import {
  LEGACY_BODY_MARKER,
  stripUserscriptMetadata,
} from "./userscript-build-utils";

export type UserscriptBuildMode = "pure" | "compat";

const projectRoot = process.cwd();
const legacyPath = resolve(
  projectRoot,
  "legacy/Bili-SubBatch-v6.0.2.user.js",
);
const maintainedSourcePath = resolve(projectRoot, "loop-bilibili.js");
const outputDirectory = resolve(projectRoot, "dist/userscript");
const buildDirectory = resolve(outputDirectory, ".build");
const bundlePath = resolve(buildDirectory, "subbatch.bundle.js");
const productionOutputPath = resolve(outputDirectory, "subbatch.user.js");
const pureOutputPath = resolve(outputDirectory, "subbatch.pure.user.js");
const compatOutputPath = resolve(outputDirectory, "subbatch.compat.user.js");
const expectedLegacyHash =
  "370FE4B3D3A02D8091CFA40C4298BA3CC2A5F08794D0F4E010DCC0DED0806762";

function sha256(source: string): string {
  return createHash("sha256").update(source).digest("hex").toUpperCase();
}

function parseMode(argv: string[]): UserscriptBuildMode {
  const modeArg = argv.find((arg) => arg.startsWith("--mode="));
  if (modeArg) {
    const value = modeArg.slice("--mode=".length);
    if (value === "pure" || value === "compat") return value;
    throw new Error(`Unknown build mode: ${value}`);
  }
  if (argv.includes("--compat")) return "compat";
  if (argv.includes("--pure")) return "pure";
  return "pure";
}

async function assertLegacyHash(): Promise<Buffer> {
  const legacyBytes = await readFile(legacyPath);
  const legacyHash = createHash("sha256").update(legacyBytes).digest("hex").toUpperCase();
  if (legacyHash !== expectedLegacyHash) {
    throw new Error(
      `Legacy Golden Reference changed: expected ${expectedLegacyHash}, received ${legacyHash}`,
    );
  }
  return legacyBytes;
}

async function buildBundle(): Promise<string> {
  await rm(buildDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  await build({
    configFile: resolve(projectRoot, "apps/userscript/vite.config.ts"),
    root: projectRoot,
    logLevel: "warn",
  });
  return readFile(bundlePath, "utf8");
}

/**
 * Pure monorepo userscript: apps/userscript + packages/* only.
 * Forbidden: concatenating the full legacy body.
 */
async function buildPureUserscript(): Promise<void> {
  // Still verify golden hash so drift is caught even on pure builds.
  await assertLegacyHash();
  const bootstrap = await buildBundle();
  if (bootstrap.includes(LEGACY_BODY_MARKER)) {
    throw new Error("Pure bundle must not embed the legacy compatibility marker");
  }
  if (/Bili SubBatch \(loop-bilibili\)[\s\S]{200,}function detectContext\(/.test(bootstrap)) {
    throw new Error("Pure bundle appears to contain a full legacy body");
  }

  const output = [
    renderUserscriptMetadata(userscriptMetadata),
    "",
    `// SubBatch Monorepo pure runtime (${userscriptMetadata.version})`,
    `// Build mode: pure — no legacy body`,
    bootstrap.trim(),
    "",
  ].join("\n");

  if (output.includes(LEGACY_BODY_MARKER)) {
    throw new Error("Pure userscript output must not include the legacy body marker");
  }

  await writeFile(pureOutputPath, output, "utf8");
  await rm(buildDirectory, { recursive: true, force: true });
  console.log(
    `Built pure ${pureOutputPath} (${Buffer.byteLength(output)} bytes, sha256 ${sha256(output)})`,
  );
}

/**
 * Production userscript: monorepo bootstrap + byte-identical maintained body.
 * Safety net while module takeover is incomplete.
 */
async function buildCompatUserscript(): Promise<void> {
  await assertLegacyHash();
  const maintainedSourceBytes = await readFile(maintainedSourcePath);
  const bootstrap = await buildBundle();
  const maintainedBody = stripUserscriptMetadata(
    maintainedSourceBytes.toString("utf8"),
  );
  const output = [
    renderUserscriptMetadata(userscriptMetadata),
    "",
    `// SubBatch Monorepo runtime bootstrap (${userscriptMetadata.version})`,
    `// Build mode: compat — includes maintained full-feature behavior body`,
    bootstrap.trim(),
    "",
    LEGACY_BODY_MARKER,
    maintainedBody,
  ].join("\n");

  // Until the monorepo composition root owns every product capability, the
  // official upgrade path must retain the complete maintained behavior body.
  await Promise.all([
    writeFile(productionOutputPath, output, "utf8"),
    writeFile(compatOutputPath, output, "utf8"),
  ]);
  await rm(buildDirectory, { recursive: true, force: true });
  console.log(
    `Built production ${productionOutputPath} and compat alias (${Buffer.byteLength(output)} bytes, sha256 ${sha256(output)})`,
  );
}

async function main(): Promise<void> {
  const mode = parseMode(process.argv.slice(2));
  if (mode === "compat") await buildCompatUserscript();
  else await buildPureUserscript();
}

void main();
