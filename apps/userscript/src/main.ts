/**
 * Monorepo userscript composition root (P4.5 Real Takeover).
 *
 * Production path is owned by apps/userscript + packages/*.
 * Full Studio UI still lives only in the compat build (legacy body);
 * pure build must never append the frozen v6.0.2 body.
 */
import * as bilibili from "@subbatch/bilibili";
import * as core from "@subbatch/core";
import { createUserscriptRuntime } from "@subbatch/runtime";
import * as schemas from "@subbatch/schemas";

import { createUserscriptHost } from "./userscript-host";

const host = createUserscriptHost();
const runtime = createUserscriptRuntime(host);

/** Public monorepo API surface for the pure userscript bundle. */
const SubBatchMonorepo = {
  version: "6.1.0",
  runtime,
  host,
  core,
  bilibili,
  schemas,
  /** Detect current page context using pure route core. */
  detectContext(href?: string) {
    return bilibili.detectContext(href ?? runtime.page.href());
  },
  routeVideoKey: bilibili.routeVideoKey,
  renderPromptTemplate: core.renderPromptTemplate,
  shortcutCommands: core.SHORTCUT_COMMANDS,
};

export { runtime, host, SubBatchMonorepo };
