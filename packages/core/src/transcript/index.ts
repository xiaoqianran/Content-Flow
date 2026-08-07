export interface SubtitleCue {
  index: number;
  from: string;
  to: string;
  from_sec: number;
  to_sec: number;
  content: string;
}

export interface RawSubtitleCue {
  sid?: number | string;
  from?: number | string;
  to?: number | string;
  content?: unknown;
}

export function parseSeconds(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const parsed = Number(String(value).trim().replace(/s$/i, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toCues(body: RawSubtitleCue[] | null | undefined): SubtitleCue[] {
  return (body ?? []).map((cue, position) => {
    const from = Number(cue.from) || 0;
    const to = Number(cue.to) || 0;
    const sid = cue.sid == null ? Number.NaN : Number(cue.sid);
    return {
      index: Number.isFinite(sid) ? sid : position + 1,
      from: `${from.toFixed(2)}s`,
      to: `${to.toFixed(2)}s`,
      from_sec: from,
      to_sec: to,
      content: String(cue.content || ""),
    };
  });
}

export function formatSrtTimestamp(seconds: number): string {
  const totalMs = Math.round(Math.max(0, seconds) * 1000);
  const hours = Math.floor(totalMs / 3_600_000);
  const minuteRemainder = totalMs % 3_600_000;
  const minutes = Math.floor(minuteRemainder / 60_000);
  const secondRemainder = minuteRemainder % 60_000;
  const secs = Math.floor(secondRemainder / 1000);
  const milliseconds = secondRemainder % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(milliseconds).padStart(3, "0")}`;
}

export function cuesToSrt(cues: readonly SubtitleCue[]): string {
  const lines: string[] = [];
  let sequence = 0;
  for (const cue of cues) {
    const text = String(cue.content || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim();
    if (!text) continue;
    sequence += 1;
    lines.push(String(sequence));
    lines.push(
      `${formatSrtTimestamp(parseSeconds(cue.from_sec ?? cue.from))} --> ${formatSrtTimestamp(parseSeconds(cue.to_sec ?? cue.to))}`,
    );
    lines.push(text, "");
  }
  return lines.join("\n");
}

export function cuesToTxt(cues: readonly SubtitleCue[]): string {
  return cues
    .map((cue) => String(cue.content || "").trim())
    .filter(Boolean)
    .join("\n");
}

export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function cuesToAiText(
  cues: readonly SubtitleCue[],
  bvid: string,
  page: number,
): string {
  const rows: string[] = [];
  let previous = "";
  for (const cue of cues) {
    const content = String(cue.content || "").replace(/\s+/g, " ").trim();
    if (!content || content === previous) continue;
    previous = content;
    rows.push(
      `[${bvid || "BV"} P${Math.max(1, Number(page) || 1)} ${formatClock(cue.from_sec ?? parseSeconds(cue.from))}] ${content}`,
    );
  }
  return rows.join("\n");
}

