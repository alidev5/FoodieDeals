import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./test/loadEnv.ts"],
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
