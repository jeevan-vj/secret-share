import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      "next/server": path.resolve(root, "node_modules/vinext/dist/shims/server.js"),
    },
  },
  test: {
    include: ["tests/**/*.{test,spec}.{ts,mjs,js}"],
    hookTimeout: 30_000,
  },
});
