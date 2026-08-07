import { describe, expect, it, vi } from "vitest";

import {
  createUserscriptRuntime,
  type NetworkRequest,
  type NetworkResponse,
  type UserscriptHost,
} from "@subbatch/runtime";

describe("Runtime network streaming / abort contract", () => {
  it("supports stream onChunk and abort signal on the NetworkAdapter", async () => {
    const chunks: string[] = [];
    const hostRequest = vi.fn(
      async (_url: string, request: NetworkRequest = {}): Promise<NetworkResponse> => {
        if (request.signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }
        if (request.stream && request.onChunk) {
          request.onChunk("hello ");
          request.onChunk("world");
          return {
            status: 200,
            ok: true,
            text: "hello world",
            headers: { "content-type": "text/plain" },
          };
        }
        return {
          status: 200,
          ok: true,
          text: "static",
          headers: {},
        };
      },
    );

    const host: UserscriptHost = {
      storageGet: () => undefined,
      storageSet: () => undefined,
      storageRemove: () => undefined,
      request: hostRequest,
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

    const runtime = createUserscriptRuntime(host);
    const streamed = await runtime.network.request("https://example.test/stream", {
      stream: true,
      onChunk: (chunk) => chunks.push(chunk),
    });
    expect(streamed.text).toBe("hello world");
    expect(chunks).toEqual(["hello ", "world"]);
    expect(hostRequest).toHaveBeenCalledWith(
      "https://example.test/stream",
      expect.objectContaining({ stream: true }),
    );

    const controller = new AbortController();
    controller.abort();
    await expect(
      runtime.network.request("https://example.test/abort", {
        signal: controller.signal,
        stream: true,
        onChunk: () => undefined,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
