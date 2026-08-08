import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const legacyPath = fileURLToPath(
  new URL("../../legacy/Bili-SubBatch-v6.0.2.user.js", import.meta.url),
);

export const legacySource = readFileSync(legacyPath, "utf8");

export function extractFunctionSource(source: string, name: string): string {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Legacy function not found: ${name}`);

  const bodyStart = source.indexOf("{", start + marker.length);
  if (bodyStart < 0) throw new Error(`Legacy function body not found: ${name}`);

  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Unterminated legacy function: ${name}`);
}

export function extractLegacyFunctionSource(name: string): string {
  return extractFunctionSource(legacySource, name);
}

export function sourceFunction<
  TFunction extends (...args: never[]) => unknown,
>(
  source: string,
  name: string,
  scope: Record<string, unknown> = {},
): TFunction {
  const names = Object.keys(scope);
  const values = Object.values(scope);
  const factory = new Function(
    ...names,
    `"use strict"; return (${extractFunctionSource(source, name)});`,
  );
  return factory(...values) as TFunction;
}

export function legacyFunction<TFunction extends (...args: never[]) => unknown>(
  name: string,
  scope: Record<string, unknown> = {},
): TFunction {
  return sourceFunction<TFunction>(legacySource, name, scope);
}
