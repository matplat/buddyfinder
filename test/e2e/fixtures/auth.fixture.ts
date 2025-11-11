import { test as base, Page } from "@playwright/test";
import type { TestUser } from "./test-users.fixture";

/**
 * Custom fixture that extends Playwright's base test with authentication
 * Provides authenticated page context for logged-in users
 */

export interface AuthFixtures {
  authenticatedPage: Page;
}

/**
 * Login helper function
 * Performs login via UI and waits for successful authentication
 */
export async function loginUser(page: Page, user: TestUser): Promise<void> {
  // Navigate to login page
  await page.goto("/login");

  // Fill in login form
  await page.getByLabel(/email|e-mail/i).fill(user.email);
  await page.getByLabel(/password|hasło/i).fill(user.password);

  // Submit form
  await page.getByRole("button", { name: /sign in|zaloguj/i }).click();

  // Wait for successful login (redirect to main page)
  await page.waitForURL("/", { timeout: 10000 });
}

/**
 * Logout helper function
 */
export async function logoutUser(page: Page): Promise<void> {
  // Find and click logout button/link
  await page.getByRole("button", { name: /logout|wyloguj/i }).click();

  // Wait for redirect to login page
  await page.waitForURL("/login", { timeout: 5000 });
}

/**
 * Extended test with authentication fixture
 * Usage: test('my test', async ({ page }) => { await loginUser(page, user); ... })
 * Note: This is a simple export for consistency. Use loginUser/logoutUser helpers directly.
 */
export const test = base;

export { expect } from "@playwright/test";
