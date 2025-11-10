import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for React component testing
    environment: "jsdom",

    // Setup files to run before each test file
    setupFiles: ["./test/unit/setup.ts"],

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "test/", "**/*.d.ts", "**/*.config.*", "**/mockData", "dist/", ".astro/"],
      // Target 70% coverage as per test plan
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Include patterns for test files
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],

    // Exclude patterns
    exclude: ["node_modules", "dist", ".astro", "coverage", "**/node_modules/**", "**/dist/**", "**/.astro/**"],
  },

  // Resolve aliases to match tsconfig.json
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@test": resolve(__dirname, "./test"),
    },
  },
});
