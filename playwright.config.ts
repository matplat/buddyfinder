import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for BuddyFinder E2E tests
 * Tests cover US-004, US-009, and US-010
 */
export default defineConfig({
  testDir: "./test/e2e/specs",

  // Sequential execution to avoid conflicts with shared test database
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,

  // Test timeout (30 seconds)
  timeout: 30000,

  // Test reporters
  reporter: [["html", { outputFolder: "test-results/e2e" }], ["list"]],

  // Shared test configuration
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  // Test projects - only Chromium/Desktop Chrome
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Automatically start dev server before tests
  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
