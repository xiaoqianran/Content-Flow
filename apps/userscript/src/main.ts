/**
 * Monorepo userscript composition root (P4.5 Real Takeover).
 *
 * Production path is owned by apps/userscript + packages/*.
 * Full Studio UI still lives only in the compat build (maintained body);
 * pure build must never append the frozen v6.0.2 body.
 *
 * Vite IIFE global: `SubBatch` with named exports
 * (`SubBatch.SubBatchMonorepo`, `SubBatch.runtime`, `SubBatch.host`).
 * The maintained body bridges pure cores via `SubBatch.SubBatchMonorepo`.
 */
import * as bilibili from "@subbatch/bilibili";
import * as core from "@subbatch/core";
import { createUserscriptRuntime } from "@subbatch/runtime";
import * as schemas from "@subbatch/schemas";

import { createUserscriptHost } from "./userscript-host";

const host = createUserscriptHost();
const runtime = createUserscriptRuntime(host);

/** Public monorepo API surface for pure bundle + production body bridge. */
const SubBatchMonorepo = {
  version: "6.1.5",
  runtime,
  host,
  core,
  bilibili,
  schemas,
  /** Detect current page context using pure route core (URL-only unless hints given). */
  detectContext(href?: string, hints?: bilibili.BilibiliPageHints) {
    return bilibili.detectContext(href ?? runtime.page.href(), hints);
  },
  extractBvid: bilibili.extractBvid,
  extractUrlHints: bilibili.extractUrlHints,
  routeVideoKey: bilibili.routeVideoKey,
  renderPromptTemplate: core.renderPromptTemplate,
  splitCuesForPreprocess: core.splitCuesForPreprocess,
  stitchPreprocessChunks: core.stitchPreprocessChunks,
  preprocessCacheKey: core.preprocessCacheKey,
  shortcutCommands: core.SHORTCUT_COMMANDS,
  shouldIgnoreShortcutEvent: core.shouldIgnoreShortcutEvent,
};

export { runtime, host, SubBatchMonorepo };
