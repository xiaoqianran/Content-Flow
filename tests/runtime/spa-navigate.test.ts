import { describe, expect, it, vi } from "vitest";

import { installSpaNavigateAdapter } from "@subbatch/runtime";

function createMockSpa() {
  const listeners = new Map<string, Set<() => void>>();
  let href = "https://www.bilibili.com/video/BV1AAAA?p=1";

  const history = {
    pushState: vi.fn(function pushState(
      this: unknown,
      _state: unknown,
      _title: string,
      url?: string | URL | null,
    ) {
      if (url != null) href = String(url);
    }),
    replaceState: vi.fn(function replaceState(
      this: unknown,
      _state: unknown,
      _title: string,
      url?: string | URL | null,
    ) {
      if (url != null) href = String(url);
    }),
  };

  const eventTarget = {
    addEventListener: (type: string, listener: () => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener: (type: string, listener: () => void) => {
      listeners.get(type)?.delete(listener);
    },
    dispatch(type: string) {
      for (const listener of listeners.get(type) ?? []) listener();
    },
  };

  const documentRef = {
    visibilityState: "visible" as string,
    addEventListener: eventTarget.addEventListener,
    removeEventListener: eventTarget.removeEventListener,
    dispatch: eventTarget.dispatch,
  };

  const windowLike = {
    history,
    location: {
      get href() {
        return href;
      },
    },
    addEventListener: eventTarget.addEventListener,
    removeEventListener: eventTarget.removeEventListener,
    dispatch: eventTarget.dispatch,
    setHref(next: string) {
      href = next;
    },
  };

  return { windowLike, documentRef, getHref: () => href };
}

describe("SPA route adapter", () => {
  it("covers pushState / replaceState / popstate / hashchange / pageshow / visibility / poll", () => {
    vi.useFakeTimers();
    const { windowLike, documentRef, getHref } = createMockSpa();
    const onNavigate = vi.fn();
    const intervals: Array<{ id: number; fn: () => void; ms: number }> = [];
    let intervalId = 0;

    const handle = installSpaNavigateAdapter(
      {
        historyWindow: windowLike as never,
        eventWindow: windowLike as never,
        documentRef: documentRef as never,
        getHref,
        pollIntervalMs: 2000,
        setTimeoutFn: ((fn: () => void) => {
          fn();
          return 0 as unknown as ReturnType<typeof setTimeout>;
        }) as typeof setTimeout,
        setIntervalFn: ((fn: () => void, ms?: number) => {
          const id = ++intervalId;
          intervals.push({ id, fn, ms: ms ?? 0 });
          return id as unknown as ReturnType<typeof setInterval>;
        }) as typeof setInterval,
        clearIntervalFn: ((id: ReturnType<typeof setInterval>) => {
          const index = intervals.findIndex((item) => item.id === Number(id));
          if (index >= 0) intervals.splice(index, 1);
        }) as typeof clearInterval,
      },
      onNavigate,
    );

    windowLike.history.pushState({}, "", "https://www.bilibili.com/video/BV1AAAA?p=2");
    expect(onNavigate).toHaveBeenCalledTimes(1);

    windowLike.history.replaceState({}, "", "https://www.bilibili.com/video/BV1AAAA?p=3");
    expect(onNavigate).toHaveBeenCalledTimes(2);

    windowLike.setHref("https://www.bilibili.com/video/BV1BBBB?p=1");
    windowLike.dispatch("popstate");
    expect(onNavigate).toHaveBeenCalledTimes(3);

    windowLike.setHref("https://www.bilibili.com/video/BV1BBBB?p=1#section");
    windowLike.dispatch("hashchange");
    expect(onNavigate).toHaveBeenCalledTimes(4);

    windowLike.setHref("https://www.bilibili.com/video/BV1CCCC");
    windowLike.dispatch("pageshow");
    expect(onNavigate).toHaveBeenCalledTimes(5);

    windowLike.setHref("https://www.bilibili.com/video/BV1DDDD");
    documentRef.visibilityState = "visible";
    documentRef.dispatch("visibilitychange");
    expect(onNavigate).toHaveBeenCalledTimes(6);

    // URL fallback poll
    windowLike.setHref("https://www.bilibili.com/video/BV1EEEE");
    expect(intervals).toHaveLength(1);
    intervals[0]!.fn();
    expect(onNavigate).toHaveBeenCalledTimes(7);

    handle.dispose();
    windowLike.history.pushState({}, "", "https://www.bilibili.com/video/BV1FFFF");
    // After dispose, history is restored to original mocks — adapter no longer schedules.
    expect(onNavigate).toHaveBeenCalledTimes(7);

    vi.useRealTimers();
  });

  it("keeps multiple subscribers isolated and restores exact history methods", () => {
    const { windowLike, documentRef, getHref } = createMockSpa();
    const originalPush = windowLike.history.pushState;
    const originalReplace = windowLike.history.replaceState;
    const first = vi.fn();
    const second = vi.fn();
    const options = {
      historyWindow: windowLike as never,
      eventWindow: windowLike as never,
      documentRef: documentRef as never,
      getHref,
      pollIntervalMs: 0,
      setTimeoutFn: ((fn: () => void) => {
        fn();
        return 0 as unknown as ReturnType<typeof setTimeout>;
      }) as typeof setTimeout,
    };

    const firstHandle = installSpaNavigateAdapter(options, first);
    const secondHandle = installSpaNavigateAdapter(options, second);
    windowLike.history.pushState({}, "", "https://www.bilibili.com/video/BV1MULTI?p=1");
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    firstHandle.dispose();
    windowLike.history.pushState({}, "", "https://www.bilibili.com/video/BV1MULTI?p=2");
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);

    secondHandle.dispose();
    expect(windowLike.history.pushState).toBe(originalPush);
    expect(windowLike.history.replaceState).toBe(originalReplace);
  });
});
