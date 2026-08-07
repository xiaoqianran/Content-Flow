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

const projectRoot = process.cwd();
const legacyPath = resolve(
  projectRoot,
  "legacy/Bili-SubBatch-v6.0.2.user.js",
);
const outputDirectory = resolve(projectRoot, "dist/userscript");
const buildDirectory = resolve(outputDirectory, ".build");
const bundlePath = resolve(buildDirectory, "subbatch.bundle.js");
const outputPath = resolve(outputDirectory, "subbatch.user.js");
const expectedLegacyHash =
  "26FAD055B6449205DA0EF067F5F943CF94B84141FAAE4911EA2B50F84A77BF50";

function sha256(source: string): string {
  return createHash("sha256").update(source).digest("hex").toUpperCase();
}

async function buildUserscript(): Promise<void> {
  const legacyBytes = await readFile(legacyPath);
  const legacyHash = createHash("sha256").update(legacyBytes).digest("hex").toUpperCase();
  if (legacyHash !== expectedLegacyHash) {
    throw new Error(
      `Legacy Golden Reference changed: expected ${expectedLegacyHash}, received ${legacyHash}`,
    );
  }

  await rm(buildDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  await build({
    configFile: resolve(projectRoot, "apps/userscript/vite.config.ts"),
    root: projectRoot,
    logLevel: "warn",
  });

  const bootstrap = await readFile(bundlePath, "utf8");
  const legacySource = legacyBytes.toString("utf8");
  const legacyBody = stripUserscriptMetadata(legacySource);
  const output = [
    renderUserscriptMetadata(userscriptMetadata),
    "",
    `// SubBatch Monorepo runtime bootstrap (${userscriptMetadata.version})`,
    bootstrap.trim(),
    "",
    LEGACY_BODY_MARKER,
    legacyBody,
  ].join("\n");
  await writeFile(outputPath, output, "utf8");
  await rm(buildDirectory, { recursive: true, force: true });

  console.log(
    `Built ${outputPath} (${Buffer.byteLength(output)} bytes, sha256 ${sha256(output)})`,
  );
}

void buildUserscript();
