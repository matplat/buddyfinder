import { test as base, request } from "@playwright/test";

import { DatabaseHelper } from "../helpers/database.helper";

/**
 * Fixture logująca użytkownika testowego przed każdym testem US-004.
 * - Czyści dane sportowe w Supabase dla idempotencji.
 * - Loguje użytkownika przez UI (formularz logowania).
 */
const TEST_USER_LOGIN = "testuser1@buddyfinder.test";
const TEST_USER_PASSWORD = "TestPass123!";

export const test = base.extend<{ authenticatedPage: import("@playwright/test").Page }>({
  authenticatedPage: async ({ page }, use) => {
    const db = new DatabaseHelper();

    await db.clearUserSports(TEST_USER_LOGIN);
    
    await page.goto("/");    
    await page.goto("/login");

    await page.getByTestId("login-form--login-input").fill(TEST_USER_LOGIN);
    await page.getByTestId("login-form--password-input").fill(TEST_USER_PASSWORD);
    await page.getByTestId("login-button").click();

    // await page.waitForURL("/");
    await page.waitForResponse(res => res.ok());
    await page.waitForURL("/");    
    await page.getByTestId("profile-view--sports-accordion-toggle").waitFor({ state: "visible" });
    
    await use(page);
  },
});

export { expect } from "@playwright/test";
