export interface StorageAdapter {
  get<T>(key: string, fallback?: T): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface NetworkRequest {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  /**
   * `network-error` retries through the privileged transport only when fetch
   * never produced a response. `network-or-http` additionally retries failed
   * idempotent requests. Unsafe POST requests are never retried after a
   * response has started.
   */
  fallback?: "never" | "network-error" | "network-or-http";
  /** When true, prefer streaming body and invoke onChunk as data arrives. */
  stream?: boolean;
  onChunk?: (chunk: string) => void;
}

export interface NetworkResponse {
  status: number;
  ok: boolean;
  text: string;
  headers: Record<string, string>;
}

export interface NetworkAdapter {
  request(url: string, request?: NetworkRequest): Promise<NetworkResponse>;
  json<T>(url: string, request?: NetworkRequest): Promise<T>;
}

export interface ClipboardAdapter {
  writeText(text: string): Promise<void>;
}

export interface StyleAdapter {
  add(css: string): void;
}

export interface ShortcutBinding {
  chord: string;
  handler: () => void | Promise<void>;
}

export interface ShortcutRegisterOptions {
  /** Default true. When false, keydown is ignored. */
  enabled?: boolean;
  /**
   * When true (default), ignore editable targets, IME composition,
   * key-repeat and AltGraph — matching v6.0.2.
   */
  protectInput?: boolean;
}

export interface ShortcutAdapter {
  register(
    bindings: readonly ShortcutBinding[],
    options?: ShortcutRegisterOptions,
  ): () => void;
}

export interface PageAdapter {
  href(): string;
  window(): Window;
  onNavigate(listener: () => void): () => void;
}

export interface HubAdapter {
  available(): Promise<boolean>;
  send<T>(path: string, payload: unknown): Promise<T>;
}

export interface SubBatchRuntime {
  storage: StorageAdapter;
  network: NetworkAdapter;
  clipboard: ClipboardAdapter;
  style: StyleAdapter;
  shortcuts: ShortcutAdapter;
  page: PageAdapter;
  hub: HubAdapter;
}
