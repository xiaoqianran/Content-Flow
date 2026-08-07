/** Frozen command IDs — must match v6.0.2 shortcut bindings in GM storage. */
export const SHORTCUT_COMMANDS = [
  {
    id: "toggle-panel",
    label: "召唤 / 隐藏面板",
    defaultChord: "Ctrl+KeyB",
  },
  {
    id: "open-processed",
    label: "AI 处理字幕",
    defaultChord: "Ctrl+Alt+Digit1",
  },
  {
    id: "open-postprocess",
    label: "后处理结果",
    defaultChord: "Ctrl+Alt+Digit2",
  },
  {
    id: "toggle-dock",
    label: "悬浮 / 靠边",
    defaultChord: "Ctrl+Alt+KeyD",
  },
] as const;

export type ShortcutCommandId = (typeof SHORTCUT_COMMANDS)[number]["id"];

export interface ShortcutKeyboardEvent {
  code?: string;
  key?: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  repeat?: boolean;
  isComposing?: boolean;
  target?: EventTarget | null;
  getModifierState?: (key: string) => boolean;
}

export function shortcutChordFromEvent(event: ShortcutKeyboardEvent): string {
  const code = String(event.code || "");
  if (!code || /^(Control|Shift|Alt|Meta)(Left|Right)?$/.test(code)) return "";
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  if (event.metaKey) parts.push("Meta");
  parts.push(code);
  return parts.join("+");
}

export function shortcutKeyLabel(code: string): string {
  const value = String(code || "");
  if (/^Key[A-Z]$/.test(value)) return value.slice(3);
  if (/^Digit[0-9]$/.test(value)) return value.slice(5);
  if (/^Numpad[0-9]$/.test(value)) return `Num ${value.slice(6)}`;
  const labels: Record<string, string> = {
    Space: "Space",
    Enter: "Enter",
    Tab: "Tab",
    Escape: "Esc",
    Backspace: "Backspace",
    Delete: "Delete",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Minus: "-",
    Equal: "=",
    BracketLeft: "[",
    BracketRight: "]",
    Semicolon: ";",
    Quote: "'",
    Comma: ",",
    Period: ".",
    Slash: "/",
    Backslash: "\\",
    Backquote: "`",
    Home: "Home",
    End: "End",
    PageUp: "PgUp",
    PageDown: "PgDn",
    Insert: "Insert",
  };
  if (labels[value]) return labels[value];
  if (/^F\d{1,2}$/.test(value)) return value;
  return value.replace(/^(Arrow|Numpad)/, "") || value;
}

export function shortcutDisplayChord(chord: string): string {
  const parts = String(chord || "").split("+").filter(Boolean);
  if (!parts.length) return "未绑定";
  return parts
    .map((part) =>
      ["Ctrl", "Alt", "Shift", "Meta"].includes(part)
        ? part
        : shortcutKeyLabel(part),
    )
    .join(" + ");
}

export function shortcutHasStrongModifier(chord: string): boolean {
  const parts = new Set(String(chord || "").split("+"));
  return parts.has("Ctrl") || parts.has("Alt") || parts.has("Meta");
}

/** Match v6: ignore shortcuts while typing in form / contenteditable targets. */
export function shortcutEditableTarget(target: EventTarget | null | undefined): boolean {
  if (!target || typeof (target as Element).closest !== "function") return false;
  return !!(target as Element).closest(
    'input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]',
  );
}

/**
 * Runtime guards from v6.0.2:
 * - disabled / empty chord skips elsewhere
 * - event.repeat (key auto-repeat)
 * - event.isComposing (IME)
 * - AltGraph (AltGr)
 * - editable targets (inputs, contenteditable)
 */
export function shouldIgnoreShortcutEvent(
  event: ShortcutKeyboardEvent,
  options: { enabled?: boolean } = {},
): boolean {
  if (options.enabled === false) return true;
  if (event.repeat || event.isComposing) return true;
  if (event.getModifierState?.("AltGraph")) return true;
  if (shortcutEditableTarget(event.target ?? null)) return true;
  return false;
}
