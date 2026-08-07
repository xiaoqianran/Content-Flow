import {
  type ShortcutKeyboardEvent,
} from "@subbatch/core";
import {
  installSpaNavigateAdapter,
  registerShortcutRuntime,
  type NetworkRequest,
  type NetworkResponse,
  type ShortcutBinding,
  type ShortcutRegisterOptions,
  type UserscriptHost,
} from "@subbatch/runtime";

function parseResponseHeaders(raw: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of String(raw || "").split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator <= 0) continue;
    headers[line.slice(0, separator).trim().toLowerCase()] = line
      .slice(separator + 1)
      .trim();
  }
  return headers;
}

async function readFetchStream(
  response: Response,
  onChunk?: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  if (!response.body || !onChunk) {
    return response.text();
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        throw new DOMException("Aborted", "AbortError");
      }
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      text += chunk;
      onChunk(chunk);
    }
    text += decoder.decode();
    return text;
  } catch (error) {
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
    throw error;
  }
}

async function fetchRequest(
  url: string,
  request: NetworkRequest = {},
): Promise<NetworkResponse> {
  const response = await fetch(url, {
    ...(request.method ? { method: request.method } : {}),
    ...(request.headers ? { headers: request.headers } : {}),
    ...(request.body !== undefined ? { body: request.body } : {}),
    ...(request.signal ? { signal: request.signal } : {}),
  });
  const headers = Object.fromEntries(response.headers.entries());
  const useStream = request.stream === true && typeof request.onChunk === "function";
  const text = useStream
    ? await readFetchStream(response, request.onChunk, request.signal)
    : await response.text();
  return {
    status: response.status,
    ok: response.ok,
    text,
    headers,
  };
}

function privilegedRequest(
  url: string,
  request: NetworkRequest = {},
): Promise<NetworkResponse> {
  if (typeof GM_xmlhttpRequest !== "function") return fetchRequest(url, request);

  const useStream = request.stream === true && typeof request.onChunk === "function";

  return new Promise((resolve, reject) => {
    let lastLength = 0;
    let settled = false;

    const finish = (response: NetworkResponse): void => {
      if (settled) return;
      settled = true;
      resolve(response);
    };
    const fail = (error: unknown): void => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const details: UserscriptRequestDetails = {
      url,
      ...(request.method ? { method: request.method } : {}),
      ...(request.headers ? { headers: request.headers } : {}),
      ...(request.body !== undefined ? { data: request.body } : {}),
      onload: (response) => {
        const text = String(response.responseText || "");
        if (useStream && text.length > lastLength) {
          request.onChunk?.(text.slice(lastLength));
          lastLength = text.length;
        }
        finish({
          status: response.status,
          ok: response.status >= 200 && response.status < 300,
          text,
          headers: parseResponseHeaders(response.responseHeaders),
        });
      },
      onerror: (error) => fail(error),
      onabort: () => fail(new DOMException("Aborted", "AbortError")),
    };
    if (useStream) {
      details.responseType = "text";
      details.onprogress = (response) => {
        const full = String(response.responseText || "");
        if (full.length > lastLength) {
          request.onChunk?.(full.slice(lastLength));
          lastLength = full.length;
        }
      };
    }
    const handle = GM_xmlhttpRequest(details);

    request.signal?.addEventListener(
      "abort",
      () => {
        try {
          handle.abort?.();
        } catch {
          /* ignore */
        }
        fail(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function registerShortcuts(
  bindings: readonly ShortcutBinding[],
  options: ShortcutRegisterOptions = {},
): () => void {
  return registerShortcutRuntime(bindings, {
    ...options,
    target: document,
    capture: true,
    stopOnMatch: true,
  });
}

function onNavigate(listener: () => void): () => void {
  const pageWindow =
    typeof unsafeWindow !== "undefined" && unsafeWindow ? unsafeWindow : window;
  const handle = installSpaNavigateAdapter(
    {
      historyWindow: pageWindow,
      eventWindow: pageWindow,
      documentRef: document,
      getHref: () => location.href,
      pollIntervalMs: 2000,
    },
    listener,
  );
  return () => handle.dispose();
}

export function createUserscriptHost(): UserscriptHost {
  return {
    storageGet: (key, fallback) =>
      typeof GM_getValue === "function" ? GM_getValue(key, fallback) : fallback,
    storageSet: (key, value) => {
      if (typeof GM_setValue === "function") GM_setValue(key, value);
    },
    storageRemove: (key) => {
      if (typeof GM_deleteValue === "function") GM_deleteValue(key);
    },
    request: async (url, request) => {
      try {
        return await fetchRequest(url, request);
      } catch (error) {
        if (request?.signal?.aborted) throw error;
        return privilegedRequest(url, request);
      }
    },
    writeClipboard: async (text) => {
      if (typeof GM_setClipboard === "function") GM_setClipboard(text);
      else await navigator.clipboard.writeText(text);
    },
    addStyle: (css) => {
      if (typeof GM_addStyle === "function") {
        GM_addStyle(css);
        return;
      }
      const style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
    },
    pageWindow:
      typeof unsafeWindow !== "undefined" && unsafeWindow ? unsafeWindow : window,
    pageHref: () => location.href,
    registerShortcuts,
    onNavigate,
    hubAvailable: async () => false,
    hubSend: async () => {
      throw new Error("Local Hub 尚未启用");
    },
  };
}

// Re-export for tests that want host-level keyboard typing helpers.
export type { ShortcutKeyboardEvent };
