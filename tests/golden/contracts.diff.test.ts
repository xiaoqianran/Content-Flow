import { describe, expect, it } from "vitest";

import {
  SHORTCUT_COMMANDS,
  renderPromptTemplate,
  shortcutChordFromEvent,
  shortcutDisplayChord,
  shortcutEditableTarget,
  shouldIgnoreShortcutEvent,
} from "@subbatch/core";
import {
  PROMPT_STAGES,
  V6_BUILTIN_PROMPT_IDS,
  V6_SHORTCUT_COMMAND_IDS,
  V6_STORAGE_KEYS,
  isPromptStage,
  normalizePromptStage,
  type PromptStage,
} from "@subbatch/schemas";

import { legacyFunction, legacySource } from "./legacy-harness";

type UnknownFunction = (...args: any[]) => any;

describe("Migration contracts differential", () => {
  it("PromptStage is preprocess / postprocess / knowledge", () => {
    expect([...PROMPT_STAGES]).toEqual([
      "preprocess",
      "postprocess",
      "knowledge",
    ]);
    for (const stage of PROMPT_STAGES) {
      expect(isPromptStage(stage)).toBe(true);
    }
    expect(isPromptStage("preprocessing")).toBe(false);
    expect(normalizePromptStage("preprocessing")).toBe("preprocess");
    expect(normalizePromptStage("postprocessing")).toBe("postprocess");
    expect(normalizePromptStage("knowledge")).toBe("knowledge");

    // Legacy source freezes these stage string literals in product data.
    for (const stage of ["preprocess", "postprocess", "knowledge"] as PromptStage[]) {
      expect(legacySource).toContain(`stage: "${stage}"`);
    }
  });

  it("Shortcut command IDs match v6.0.2 bindings", () => {
    expect(SHORTCUT_COMMANDS.map((item) => item.id)).toEqual([
      ...V6_SHORTCUT_COMMAND_IDS,
    ]);
    expect([...V6_SHORTCUT_COMMAND_IDS]).toEqual([
      "toggle-panel",
      "open-processed",
      "open-postprocess",
      "toggle-dock",
    ]);
    for (const id of V6_SHORTCUT_COMMAND_IDS) {
      expect(legacySource).toContain(`id: "${id}"`);
    }
    // Reject the mistaken monorepo-only renames.
    expect(SHORTCUT_COMMANDS.map((item) => item.id)).not.toContain("open-ai");
    expect(SHORTCUT_COMMANDS.map((item) => item.id)).not.toContain("run-post");
  });

  it("renderPromptTemplate supports chunkStart / coreStart / chunkEnd", () => {
    const legacyRender = legacyFunction<UnknownFunction>("renderPromptTemplate");
    const baseVars = {
      title: "标题",
      bvid: "BV1TEST",
      subtitle: "字幕",
      chunkIndex: "2",
      chunkCount: "5",
      chunkStart: "01:30",
      coreStart: "02:00",
      chunkEnd: "03:00",
    };
    const template =
      "{{title}} · {{bvid}}\n" +
      "字幕分块：{{chunkIndex}} / {{chunkCount}}\n" +
      "本块上下文起点：{{chunkStart}}\n" +
      "本块新内容起点：{{coreStart}}\n" +
      "本块结束：{{chunkEnd}}\n" +
      "{{unknown}}";

    const next = renderPromptTemplate(template, baseVars);
    // New monorepo intentionally fills chunk markers used by PRE templates.
    expect(next).toBe(
      "标题 · BV1TEST\n" +
        "字幕分块：2 / 5\n" +
        "本块上下文起点：01:30\n" +
        "本块新内容起点：02:00\n" +
        "本块结束：03:00\n" +
        "{{unknown}}",
    );

    // Legacy leaves chunk* unsubstituted — document the gap we closed.
    const legacy = legacyRender(template, baseVars);
    expect(legacy).toContain("{{chunkStart}}");
    expect(legacy).toContain("{{coreStart}}");
    expect(legacy).toContain("{{chunkEnd}}");
    // Shared variables still match legacy.
    expect(renderPromptTemplate("{{ title }} · {{bvid}}\n{{subtitle}}\n{{unknown}}", baseVars)).toBe(
      legacyRender("{{ title }} · {{bvid}}\n{{subtitle}}\n{{unknown}}", baseVars),
    );
  });

  it("shortcut pure helpers match legacy chords", () => {
    const legacyChord = legacyFunction<UnknownFunction>("shortcutChordFromEvent");
    const legacyLabel = legacyFunction<UnknownFunction>("shortcutKeyLabel");
    const legacyDisplay = legacyFunction<UnknownFunction>("shortcutDisplayChord", {
      shortcutKeyLabel: legacyLabel,
    });
    const event = {
      code: "Digit1",
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
      metaKey: false,
    };
    expect(shortcutChordFromEvent(event)).toBe(legacyChord(event));
    expect(shortcutDisplayChord(shortcutChordFromEvent(event))).toBe(
      legacyDisplay(legacyChord(event)),
    );
  });

  it("shortcut runtime guards: editable / IME / repeat / AltGr", () => {
    const input = {
      closest: (selector: string) =>
        selector.includes("input") ? {} : null,
    } as unknown as Element;

    expect(
      shouldIgnoreShortcutEvent({
        code: "KeyB",
        ctrlKey: true,
        repeat: true,
      }),
    ).toBe(true);
    expect(
      shouldIgnoreShortcutEvent({
        code: "KeyB",
        ctrlKey: true,
        isComposing: true,
      }),
    ).toBe(true);
    expect(
      shouldIgnoreShortcutEvent({
        code: "KeyB",
        ctrlKey: true,
        getModifierState: (key) => key === "AltGraph",
      }),
    ).toBe(true);
    expect(
      shouldIgnoreShortcutEvent({
        code: "KeyB",
        ctrlKey: true,
        target: input,
      }),
    ).toBe(true);
    expect(shortcutEditableTarget(input)).toBe(true);
    expect(
      shouldIgnoreShortcutEvent({
        code: "KeyB",
        ctrlKey: true,
        repeat: false,
        isComposing: false,
        target: null,
      }),
    ).toBe(false);
  });

  it("v6 storage keys and builtin prompt ids stay frozen", () => {
    expect(V6_STORAGE_KEYS.prompts).toBe("bili-subbatch-prompts-v1");
    expect(V6_STORAGE_KEYS.shortcuts).toBe("bili-subbatch-shortcuts-v1");
    expect(V6_BUILTIN_PROMPT_IDS).toEqual({
      preprocess: "builtin-subtitle-normalizer",
      postprocess: "builtin-mermaid-learning-map",
      knowledge: "builtin-knowledge-drilldown",
    });
    expect(legacySource).toContain(V6_STORAGE_KEYS.prompts);
    expect(legacySource).toContain(V6_STORAGE_KEYS.shortcuts);
    expect(legacySource).toContain(V6_BUILTIN_PROMPT_IDS.preprocess);
    expect(legacySource).toContain(V6_BUILTIN_PROMPT_IDS.postprocess);
    expect(legacySource).toContain(V6_BUILTIN_PROMPT_IDS.knowledge);
  });
});
