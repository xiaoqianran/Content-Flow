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

export interface ShortcutAdapter {
  register(bindings: readonly ShortcutBinding[]): () => void;
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

