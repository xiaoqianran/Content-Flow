import { describe, expect, it, vi } from "vitest";

import { registerShortcutRuntime } from "@subbatch/runtime";
import type { ShortcutKeyboardEvent } from "@subbatch/core";

function createTarget() {
  const listeners = new Set<(event: ShortcutKeyboardEvent) => void>();
  return {
    addEventListener: (
      _type: string,
      listener: (event: ShortcutKeyboardEvent) => void,
    ) => {
      listeners.add(listener);
    },
    removeEventListener: (
      _type: string,
      listener: (event: ShortcutKeyboardEvent) => void,
    ) => {
      listeners.delete(listener);
    },
    dispatch(event: ShortcutKeyboardEvent) {
      for (const listener of listeners) listener(event);
    },
  };
}

describe("Shortcut runtime protections", () => {
  it("fires binding and ignores editable / IME / repeat / AltGr", () => {
    const target = createTarget();
    const handler = vi.fn();
    const dispose = registerShortcutRuntime(
      [{ chord: "Ctrl+KeyB", handler }],
      { target, protectInput: true },
    );

    const base = {
      code: "KeyB",
      ctrlKey: true,
      preventDefault: vi.fn(),
      stopImmediatePropagation: vi.fn(),
    };

    target.dispatch({ ...base, repeat: true });
    target.dispatch({ ...base, isComposing: true });
    target.dispatch({
      ...base,
      getModifierState: (key: string) => key === "AltGraph",
    });
    target.dispatch({
      ...base,
      target: {
        closest: () => ({}),
      } as unknown as EventTarget,
    });
    expect(handler).not.toHaveBeenCalled();

    target.dispatch({ ...base, target: null });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(base.preventDefault).toHaveBeenCalled();
    expect(base.stopImmediatePropagation).toHaveBeenCalled();

    dispose();
    target.dispatch({ ...base, target: null });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("reports asynchronous binding failures without an unhandled rejection", async () => {
    const target = createTarget();
    const onError = vi.fn();
    registerShortcutRuntime(
      [
        {
          chord: "Ctrl+KeyB",
          handler: async () => {
            throw new Error("shortcut failed");
          },
        },
      ],
      { target, onError },
    );

    target.dispatch({ code: "KeyB", ctrlKey: true, target: null });
    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0]?.[0]).toMatchObject({
      message: "shortcut failed",
    });
  });
});
