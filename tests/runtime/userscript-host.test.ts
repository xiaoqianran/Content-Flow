import { afterEach, describe, expect, it, vi } from "vitest";

import { createUserscriptHost } from "../../apps/userscript/src/userscript-host";

interface GmTestRequestDetails {
  onload(response: {
    status: number;
    responseText: string;
    responseHeaders?: string;
  }): void;
}

function installBrowserGlobals(fetchMock: ReturnType<typeof vi.fn>) {
  const pageWindow = {
    fetch: fetchMock,
    history: { pushState: vi.fn(), replaceState: vi.fn() },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as Window;
  vi.stubGlobal("window", pageWindow);
  vi.stubGlobal("unsafeWindow", pageWindow);
  vi.stubGlobal("location", {
    href: "https://www.bilibili.com/video/BV1TEST",
  });
  vi.stubGlobal("document", {});
  return pageWindow;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Userscript host network policy", () => {
  it("uses page fetch credentials and retries failed idempotent requests via GM", async () => {
    const fetchMock = vi.fn(async () =>
      new Response("unauthorized", { status: 401 }),
    );
    installBrowserGlobals(fetchMock);
    const gmRequest = vi.fn((details: GmTestRequestDetails) => {
      queueMicrotask(() =>
        details.onload({
          status: 200,
          responseText: "ok",
          responseHeaders: "content-type: text/plain",
        }),
      );
      return { abort: vi.fn() };
    });
    vi.stubGlobal("GM_xmlhttpRequest", gmRequest);

    const response = await createUserscriptHost().request(
      "https://api.bilibili.com/x/web-interface/nav",
      {
        credentials: "include",
        cache: "no-store",
        fallback: "network-or-http",
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.bilibili.com/x/web-interface/nav",
      expect.objectContaining({ credentials: "include", cache: "no-store" }),
    );
    expect(gmRequest).toHaveBeenCalledTimes(1);
    expect(response).toMatchObject({ status: 200, ok: true, text: "ok" });
  });

  it("does not replay a POST after response streaming has already started", async () => {
    const fetchMock = vi.fn(async () =>
      ({
        status: 200,
        ok: true,
        headers: new Headers(),
        body: {
          getReader: () => ({
            read: async () => {
              throw new Error("stream broke after POST");
            },
            cancel: async () => undefined,
          }),
        },
      }) as unknown as Response,
    );
    installBrowserGlobals(fetchMock);
    const gmRequest = vi.fn();
    vi.stubGlobal("GM_xmlhttpRequest", gmRequest);

    await expect(
      createUserscriptHost().request("https://llm.example/chat/completions", {
        method: "POST",
        body: "{}",
        stream: true,
        onChunk: () => undefined,
      }),
    ).rejects.toThrow("stream broke after POST");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(gmRequest).not.toHaveBeenCalled();
  });
});
