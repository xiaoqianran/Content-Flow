import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    minify: false,
    sourcemap: false,
    lib: {
      entry: "apps/userscript/src/main.ts",
      formats: ["iife"],
      name: "SubBatch",
      fileName: () => "subbatch.bundle.js",
    },
    rollupOptions: {
      output: {
        // Keep named exports on the IIFE global (SubBatch.runtime, etc.).
        exports: "named",
      },
    },
    outDir: "dist/userscript/.build",
  },
});
