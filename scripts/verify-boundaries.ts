import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const packageRoot = join(process.cwd(), "packages");
const forbidden = [
  { name: "Userscript global", pattern: /\bGM_[A-Za-z0-9_]+/ },
  { name: "Chrome extension global", pattern: /\bchrome\s*\./ },
  { name: "Browser extension global", pattern: /\bbrowser\s*\./ },
];

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory()
        ? sourceFiles(path)
        : Promise.resolve(extname(entry.name) === ".ts" ? [path] : []);
    }),
  );
  return nested.flat();
}

async function main(): Promise<void> {
  const violations: string[] = [];
  for (const file of await sourceFiles(packageRoot)) {
    const source = await readFile(file, "utf8");
    for (const rule of forbidden) {
      if (rule.pattern.test(source)) {
        violations.push(`${relative(process.cwd(), file)}: ${rule.name}`);
      }
    }
  }

  if (violations.length) {
    throw new Error(`Shared package boundary violations:\n${violations.join("\n")}`);
  }

  console.log("Shared package runtime boundaries verified");
}

void main();
