import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const legacyPath = fileURLToPath(
  new URL("../../legacy/Bili-SubBatch-v6.0.2.user.js", import.meta.url),
);

export const legacySource = readFileSync(legacyPath, "utf8");

export function extractLegacyFunctionSource(name: string): string {
  const marker = `function ${name}(`;
  const start = legacySource.indexOf(marker);
  if (start < 0) throw new Error(`Legacy function not found: ${name}`);

  const bodyStart = legacySource.indexOf("{", start + marker.length);
  if (bodyStart < 0) throw new Error(`Legacy function body not found: ${name}`);

  let depth = 0;
  for (let index = bodyStart; index < legacySource.length; index += 1) {
    const char = legacySource[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return legacySource.slice(start, index + 1);
    }
  }
  throw new Error(`Unterminated legacy function: ${name}`);
}

export function legacyFunction<TFunction extends (...args: never[]) => unknown>(
  name: string,
  scope: Record<string, unknown> = {},
): TFunction {
  const names = Object.keys(scope);
  const values = Object.values(scope);
  const factory = new Function(
    ...names,
    `"use strict"; return (${extractLegacyFunctionSource(name)});`,
  );
  return factory(...values) as TFunction;
}

