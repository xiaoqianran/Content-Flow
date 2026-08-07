import {
  shortcutChordFromEvent,
  type ShortcutKeyboardEvent,
} from "@subbatch/core";
import type {
  NetworkRequest,
  NetworkResponse,
  ShortcutBinding,
  UserscriptHost,
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
  return {
    status: response.status,
    ok: response.ok,
    text: await response.text(),
    headers: Object.fromEntries(response.headers.entries()),
  };
}

function privilegedRequest(
  url: string,
  request: NetworkRequest = {},
): Promise<NetworkResponse> {
  if (typeof GM_xmlhttpRequest !== "function") return fetchRequest(url, request);
  return new Promise((resolve, reject) => {
    const handle = GM_xmlhttpRequest({
      url,
      ...(request.method ? { method: request.method } : {}),
      ...(request.headers ? { headers: request.headers } : {}),
      ...(request.body !== undefined ? { data: request.body } : {}),
      onload: (response) =>
        resolve({
          status: response.status,
          ok: response.status >= 200 && response.status < 300,
          text: response.responseText,
          headers: parseResponseHeaders(response.responseHeaders),
        }),
      onerror: reject,
      onabort: () => reject(new DOMException("Aborted", "AbortError")),
    });
    request.signal?.addEventListener("abort", () => handle.abort?.(), {
      once: true,
    });
  });
}

function registerShortcuts(bindings: readonly ShortcutBinding[]): () => void {
  const listener = (event: KeyboardEvent): void => {
    const chord = shortcutChordFromEvent(event as ShortcutKeyboardEvent);
    const binding = bindings.find((candidate) => candidate.chord === chord);
    if (!binding) return;
    event.preventDefault();
    void binding.handler();
  };
  document.addEventListener("keydown", listener, true);
  return () => document.removeEventListener("keydown", listener, true);
}

function onNavigate(listener: () => void): () => void {
  window.addEventListener("popstate", listener);
  window.addEventListener("hashchange", listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener("hashchange", listener);
  };
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

