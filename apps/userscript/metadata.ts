export interface UserscriptMetadata {
  name: string;
  namespace: string;
  version: string;
  description: string;
  author: string;
  match: string[];
  connect: string[];
  grant: string[];
  runAt: string;
  license: string;
}

export const userscriptMetadata: UserscriptMetadata = {
  // Keep the historical identity so Tampermonkey upgrades the installed v6.0.2.
  name: "Bili SubBatch (loop-bilibili)",
  namespace: "https://github.com/loop-bilibili/bili-subbatch",
  version: "6.1.7",
  description:
    "B站知识阅读工作台：字幕预处理、多产物后处理、Anchor 局部追问树与持久 Knowledge Workspace",
  author: "loop-bilibili",
  match: [
    "*://www.bilibili.com/video/*",
    "*://www.bilibili.com/list/*",
    "*://www.bilibili.com/bangumi/play/*",
    "*://www.bilibili.com/medialist/*",
    "*://www.bilibili.com/favlist*",
    "*://space.bilibili.com/*",
    "*://search.bilibili.com/*",
  ],
  connect: [
    "api.bilibili.com",
    "aisubtitle.hdslb.com",
    "*.hdslb.com",
    "bilibili.com",
    "*",
    "cdn.jsdelivr.net",
  ],
  grant: [
    "unsafeWindow",
    "GM_xmlhttpRequest",
    "GM_setClipboard",
    "GM_addStyle",
    "GM_info",
    "GM_setValue",
    "GM_getValue",
    "GM_deleteValue",
  ],
  runAt: "document-idle",
  license: "MIT",
};

export function renderUserscriptMetadata(
  metadata: UserscriptMetadata = userscriptMetadata,
): string {
  const rows = [
    "// ==UserScript==",
    `// @name         ${metadata.name}`,
    `// @namespace    ${metadata.namespace}`,
    `// @version      ${metadata.version}`,
    `// @description  ${metadata.description}`,
    `// @author       ${metadata.author}`,
    ...metadata.match.map((value) => `// @match        ${value}`),
    ...metadata.connect.map((value) => `// @connect      ${value}`),
    ...metadata.grant.map((value) => `// @grant        ${value}`),
    `// @run-at       ${metadata.runAt}`,
    `// @license      ${metadata.license}`,
    "// ==/UserScript==",
  ];
  return rows.join("\n");
}
