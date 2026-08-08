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
  if (!onChunk) {
    return response.text();
  }
  if (!response.body) {
    const text = await response.text();
    if (text) onChunk(text);
    return text;
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
    const tail = decoder.decode();
    if (tail) {
      text += tail;
      onChunk(tail);
    }
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

class FetchNetworkError extends Error {
  readonly cause: unknown;

  constructor(cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause));
    this.name = "FetchNetworkError";
    this.cause = cause;
  }
}

async function fetchRequest(
  pageWindow: Window,
  url: string,
  request: NetworkRequest = {},
): Promise<NetworkResponse> {
  let response: Response;
  try {
    const fetchFn = pageWindow.fetch || fetch;
    response = await fetchFn.call(pageWindow, url, {
      ...(request.method ? { method: request.method } : {}),
      ...(request.headers ? { headers: request.headers } : {}),
      ...(request.body !== undefined ? { body: request.body } : {}),
      ...(request.signal ? { signal: request.signal } : {}),
      ...(request.credentials ? { credentials: request.credentials } : {}),
      ...(request.cache ? { cache: request.cache } : {}),
    });
  } catch (error) {
    throw new FetchNetworkError(error);
  }
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
  if (typeof GM_xmlhttpRequest !== "function") {
    return Promise.reject(new Error("GM_xmlhttpRequest is unavailable"));
  }
  if (request.signal?.aborted) {
    return Promise.reject(new DOMException("Aborted", "AbortError"));
  }

  const useStream = request.stream === true && typeof request.onChunk === "function";

  return new Promise((resolve, reject) => {
    let lastLength = 0;
    let settled = false;

    const requestHandle: {
      current?: ReturnType<NonNullable<typeof GM_xmlhttpRequest>>;
    } = {};
    const onAbort = (): void => {
      try {
        requestHandle.current?.abort?.();
      } catch {
        /* ignore */
      }
      fail(new DOMException("Aborted", "AbortError"));
    };
    const cleanup = (): void => request.signal?.removeEventListener("abort", onAbort);
    const finish = (response: NetworkResponse): void => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(response);
    };
    const fail = (error: unknown): void => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const emitChunk = (chunk: string): boolean => {
      if (!chunk || settled) return !settled;
      try {
        request.onChunk?.(chunk);
        return true;
      } catch (error) {
        fail(error);
        try {
          requestHandle.current?.abort?.();
        } catch {
          /* ignore */
        }
        return false;
      }
    };

    const details: UserscriptRequestDetails = {
      url,
      ...(request.method ? { method: request.method } : {}),
      ...(request.headers ? { headers: request.headers } : {}),
      ...(request.body !== undefined ? { data: request.body } : {}),
      onload: (response) => {
        const text = String(response.responseText || "");
        if (useStream && text.length > lastLength) {
          if (!emitChunk(text.slice(lastLength))) return;
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
          if (!emitChunk(full.slice(lastLength))) return;
          lastLength = full.length;
        }
      };
    }
    request.signal?.addEventListener("abort", onAbort, { once: true });
    requestHandle.current = GM_xmlhttpRequest(details);
    if (settled) cleanup();
  });
}

function mayRetryHttpFailure(request: NetworkRequest): boolean {
  if (request.fallback !== "network-or-http") return false;
  const method = String(request.method || "GET").toUpperCase();
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
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
  const pageWindow =
    typeof unsafeWindow !== "undefined" && unsafeWindow ? unsafeWindow : window;
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
        const response = await fetchRequest(pageWindow, url, request);
        if (!response.ok && mayRetryHttpFailure(request ?? {})) {
          return privilegedRequest(url, request);
        }
        return response;
      } catch (error) {
        if (request?.signal?.aborted) throw error;
        if (
          error instanceof FetchNetworkError &&
          request?.fallback !== "never"
        ) {
          return privilegedRequest(url, request);
        }
        throw error;
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
    pageWindow,
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
