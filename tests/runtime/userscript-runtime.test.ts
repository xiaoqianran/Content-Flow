import { describe, expect, it, vi } from "vitest";

import {
  createUserscriptRuntime,
  type UserscriptHost,
} from "@subbatch/runtime";

function fakeHost(): UserscriptHost {
  const values = new Map<string, unknown>();
  return {
    storageGet: (key, fallback) => values.get(key) ?? fallback,
    storageSet: (key, value) => {
      values.set(key, value);
    },
    storageRemove: (key) => {
      values.delete(key);
    },
    request: async () => ({
      status: 200,
      ok: true,
      text: '{"status":"ok"}',
      headers: { "content-type": "application/json" },
    }),
    writeClipboard: vi.fn(),
    addStyle: vi.fn(),
    pageWindow: {} as Window,
    pageHref: () => "https://www.bilibili.com/video/BV1TEST",
    registerShortcuts: () => vi.fn(),
    onNavigate: () => vi.fn(),
    hubAvailable: async () => false,
    hubSend: async () => {
      throw new Error("disabled");
    },
  };
}

describe("Userscript Runtime Adapter", () => {
  it("统一 storage 与 network 端口", async () => {
    const runtime = createUserscriptRuntime(fakeHost());
    expect(await runtime.storage.get("missing", "fallback")).toBe("fallback");
    await runtime.storage.set("key", { enabled: true });
    expect(await runtime.storage.get("key", { enabled: false })).toEqual({
      enabled: true,
    });
    await runtime.storage.remove("key");
    expect(await runtime.storage.get("key", null)).toBeNull();
    expect(await runtime.network.json("https://example.test/health")).toEqual({
      status: "ok",
    });
  });

  it("代理 clipboard、style、page 与 shortcut 能力", async () => {
    const host = fakeHost();
    const runtime = createUserscriptRuntime(host);
    await runtime.clipboard.writeText("text");
    runtime.style.add("body {} ");
    expect(host.writeClipboard).toHaveBeenCalledWith("text");
    expect(host.addStyle).toHaveBeenCalledWith("body {} ");
    expect(runtime.page.href()).toContain("BV1TEST");
    expect(typeof runtime.shortcuts.register([])).toBe("function");
  });
});
