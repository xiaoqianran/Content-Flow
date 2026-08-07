export const SHORTCUT_COMMANDS = [
  { id: "toggle-panel", label: "召唤 / 隐藏", defaultChord: "Ctrl+KeyB" },
  { id: "open-ai", label: "AI 处理字幕", defaultChord: "Ctrl+Alt+Digit1" },
  { id: "run-post", label: "后处理", defaultChord: "Ctrl+Alt+Digit2" },
  { id: "toggle-dock", label: "悬浮 / 靠边", defaultChord: "Ctrl+Alt+KeyD" },
] as const;

export type ShortcutCommandId = (typeof SHORTCUT_COMMANDS)[number]["id"];

export interface ShortcutKeyboardEvent {
  code?: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
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
    Space: "Space", Enter: "Enter", Tab: "Tab", Escape: "Esc",
    Backspace: "Backspace", Delete: "Delete", ArrowUp: "↑", ArrowDown: "↓",
    ArrowLeft: "←", ArrowRight: "→", Minus: "-", Equal: "=",
    BracketLeft: "[", BracketRight: "]", Semicolon: ";", Quote: "'",
    Comma: ",", Period: ".", Slash: "/", Backslash: "\\", Backquote: "`",
    Home: "Home", End: "End", PageUp: "PgUp", PageDown: "PgDn", Insert: "Insert",
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

