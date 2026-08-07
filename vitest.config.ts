import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@subbatch/core": fileURLToPath(
        new URL("./packages/core/src/index.ts", import.meta.url),
      ),
      "@subbatch/bilibili": fileURLToPath(
        new URL("./packages/bilibili/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts"],
    coverage: { reporter: ["text", "html"] },
  },
});
