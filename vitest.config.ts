import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Global test environment setup
    globals: true,
    environment: "node",

    // Test file patterns
    include: ["tests/**/*.spec.ts"],

    // Coverage configuration (optional)
    coverage: {
      provider: "v8",
      reporter: ["text", "json"],
      exclude: ["node_modules/", "tests/"],
    },
  },
});
