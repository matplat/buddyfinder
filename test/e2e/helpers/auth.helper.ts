import type { Page } from "@playwright/test";
import type { TestUser } from "../fixtures/test-users.fixture";

/**
 * Authentication helper functions for E2E tests
 */

/**
 * Performs user login via the login page UI
 */
export async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto("/login");

  // Fill in credentials
  await page.getByLabel(/email|e-mail/i).fill(user.email);
  await page.getByLabel(/password|hasło/i).fill(user.password);

  // Click sign in button
  await page.getByRole("button", { name: /sign in|zaloguj/i }).click();

  // Wait for redirect to main page
  await page.waitForURL("/", { timeout: 10000 });
}

/**
 * Performs user logout
 */
export async function logout(page: Page): Promise<void> {
  // Click logout button
  await page.getByRole("button", { name: /logout|wyloguj/i }).click();

  // Wait for redirect to login page
  await page.waitForURL("/login", { timeout: 5000 });
}

/**
 * Check if user is authenticated by checking for redirect
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const currentUrl = page.url();
  return !currentUrl.includes("/login") && !currentUrl.includes("/register");
}

/**
 * Navigate to a protected page and ensure user is logged in
 */
export async function navigateAuthenticated(page: Page, path: string, user: TestUser): Promise<void> {
  await page.goto(path);

  // If redirected to login, perform login
  if (page.url().includes("/login")) {
    await login(page, user);
    await page.goto(path);
  }
}
