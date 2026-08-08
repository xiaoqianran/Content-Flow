/**
 * SPA navigation adapter covering the v6.0.2 watch surface:
 * pushState / replaceState / popstate / hashchange / pageshow /
 * visibilitychange / low-frequency URL fallback poll.
 */

export interface SpaHistoryLike {
  pushState: (...args: never[]) => unknown;
  replaceState: (...args: never[]) => unknown;
}

export interface SpaEventTargetLike {
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void;
}

export interface SpaDocumentLike extends SpaEventTargetLike {
  visibilityState?: string;
}

export interface SpaWindowLike extends SpaEventTargetLike {
  history: SpaHistoryLike;
  location?: { href: string };
}

export interface InstallSpaNavigateOptions {
  /** Window that owns history hooks (prefer page/unsafeWindow). */
  historyWindow: SpaWindowLike;
  /** Window for popstate/hashchange/pageshow (usually same or outer window). */
  eventWindow?: SpaWindowLike;
  documentRef?: SpaDocumentLike | null;
  getHref?: () => string;
  /** Low-frequency URL compare; v6 uses 2000ms. Set 0 to disable. */
  pollIntervalMs?: number;
  /** Optional scheduler for tests. */
  setIntervalFn?: typeof setInterval;
  clearIntervalFn?: typeof clearInterval;
  setTimeoutFn?: typeof setTimeout;
}

export interface SpaNavigateHandle {
  /** Manually re-check href (tests / forced refresh). */
  check: () => void;
  dispose: () => void;
}

interface SharedHistoryPatch {
  originalPush: SpaHistoryLike["pushState"];
  originalReplace: SpaHistoryLike["replaceState"];
  wrappedPush: SpaHistoryLike["pushState"];
  wrappedReplace: SpaHistoryLike["replaceState"];
  callbacks: Set<() => void>;
}

const historyPatches = new WeakMap<SpaHistoryLike, SharedHistoryPatch>();

function subscribeHistoryPatch(
  history: SpaHistoryLike,
  callback: () => void,
): () => void {
  let patch = historyPatches.get(history);
  if (!patch) {
    const originalPush = history.pushState;
    const originalReplace = history.replaceState;
    const callbacks = new Set<() => void>();
    const notify = (): void => {
      for (const subscriber of [...callbacks]) subscriber();
    };
    const wrappedPush: SpaHistoryLike["pushState"] = function wrappedPush(
      this: SpaHistoryLike,
      ...args: never[]
    ) {
      const result = originalPush.apply(this, args);
      notify();
      return result;
    };
    const wrappedReplace: SpaHistoryLike["replaceState"] =
      function wrappedReplace(this: SpaHistoryLike, ...args: never[]) {
        const result = originalReplace.apply(this, args);
        notify();
        return result;
      };
    patch = {
      originalPush,
      originalReplace,
      wrappedPush,
      wrappedReplace,
      callbacks,
    };
    history.pushState = wrappedPush;
    history.replaceState = wrappedReplace;
    historyPatches.set(history, patch);
  }
  patch.callbacks.add(callback);

  return () => {
    const current = historyPatches.get(history);
    if (!current) return;
    current.callbacks.delete(callback);
    if (current.callbacks.size) return;
    // Do not overwrite a wrapper installed by the page after ours.
    if (history.pushState === current.wrappedPush) {
      history.pushState = current.originalPush;
    }
    if (history.replaceState === current.wrappedReplace) {
      history.replaceState = current.originalReplace;
    }
    historyPatches.delete(history);
  };
}

export function installSpaNavigateAdapter(
  options: InstallSpaNavigateOptions,
  listener: () => void,
): SpaNavigateHandle {
  const historyWindow = options.historyWindow;
  const eventWindow = options.eventWindow ?? historyWindow;
  const documentRef = options.documentRef ?? null;
  const getHref =
    options.getHref ??
    (() => String(eventWindow.location?.href || historyWindow.location?.href || ""));
  const pollIntervalMs =
    options.pollIntervalMs === undefined ? 2000 : options.pollIntervalMs;
  const setIntervalFn = options.setIntervalFn ?? setInterval;
  const clearIntervalFn = options.clearIntervalFn ?? clearInterval;
  const setTimeoutFn = options.setTimeoutFn ?? setTimeout;

  let lastHref = getHref();
  let disposed = false;

  const check = (): void => {
    if (disposed) return;
    const href = getHref();
    if (href === lastHref) return;
    lastHref = href;
    listener();
  };

  const scheduleCheck = (): void => {
    setTimeoutFn(() => check(), 0);
  };

  const unsubscribeHistory = subscribeHistoryPatch(
    historyWindow.history,
    scheduleCheck,
  );

  const onPopState = (): void => check();
  const onHashChange = (): void => check();
  const onPageShow = (): void => check();
  const onVisibility = (): void => {
    if (!documentRef || documentRef.visibilityState === "visible") check();
  };

  eventWindow.addEventListener("popstate", onPopState);
  eventWindow.addEventListener("hashchange", onHashChange);
  eventWindow.addEventListener("pageshow", onPageShow);
  documentRef?.addEventListener("visibilitychange", onVisibility);

  let pollTimer: ReturnType<typeof setInterval> | null = null;
  if (pollIntervalMs > 0) {
    pollTimer = setIntervalFn(() => {
      if (!documentRef || documentRef.visibilityState === "visible") check();
    }, pollIntervalMs);
  }

  return {
    check,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      unsubscribeHistory();
      eventWindow.removeEventListener("popstate", onPopState);
      eventWindow.removeEventListener("hashchange", onHashChange);
      eventWindow.removeEventListener("pageshow", onPageShow);
      documentRef?.removeEventListener("visibilitychange", onVisibility);
      if (pollTimer != null) clearIntervalFn(pollTimer);
    },
  };
}
