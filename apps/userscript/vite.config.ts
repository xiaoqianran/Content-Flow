import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: "apps/userscript/src/main.ts",
      formats: ["iife"],
      name: "SubBatch",
      fileName: () => "subbatch.bundle.js",
    },
    outDir: "dist/userscript",
  },
});

