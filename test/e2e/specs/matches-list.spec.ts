import { test, expect } from "../fixtures/auth.fixture";
import { login } from "../helpers/auth.helper";
import { TEST_USER_1, TEST_USER_5 } from "../fixtures/test-users.fixture";

/**
 * E2E Tests for US-009: Przeglądanie listy partnerów
 * E2E Tests for US-010: Widok informacji o użytkowniku
 */

test.describe("US-009 & US-010: Matches List and User Details", () => {
  test.describe("With location set", () => {
    test.beforeEach(async ({ page }) => {
      // Login as Test User 1 (has location)
      await login(page, TEST_USER_1);

      // Navigate to matches tab
      await page.goto("/");
      await page.getByRole("tab", { name: /dopasowania|matches/i }).click();
    });

    test("TC-E2E-009-001: Display list of matches for user with location", async ({ page }) => {
      // Verify matches list is visible
      await expect(page.getByRole("region", { name: /dopasowania|matches/i })).toBeVisible();

      // Verify Test User 2 is visible (in range, common sports)
      await expect(page.getByText(/anna nowak|testuser2/i)).toBeVisible();

      // Verify Test User 3 is visible (in range, no common sports)
      await expect(page.getByText(/piotr wiśniewski|testuser3/i)).toBeVisible();

      // Verify Test User 4 is NOT visible (out of range)
      await expect(page.getByText(/ewa zielińska|testuser4/i)).not.toBeVisible();

      // Verify Test User 5 is NOT visible (no location)
      await expect(page.getByText(/tomasz kamiński|testuser5/i)).not.toBeVisible();
    });

    test("TC-E2E-009-003: Matches are sorted by distance and common sports", async ({ page }) => {
      // Get all match cards
      const matchCards = page.locator('[data-testid="match-card"]');

      // Verify we have at least 2 matches
      await expect(matchCards).toHaveCount(2, { timeout: 10000 });

      // Get the first match (should be closest)
      const firstMatch = matchCards.first();
      await expect(firstMatch).toContainText(/anna nowak|testuser2/i);

      // Verify distance is shown
      await expect(firstMatch).toContainText(/km/i);

      // Get the second match
      const secondMatch = matchCards.nth(1);
      await expect(secondMatch).toContainText(/piotr|testuser3/i);
    });

    test("TC-E2E-010-001: Display full user information when expanded", async ({ page }) => {
      // Find Test User 2's card
      const userCard = page.locator('[data-testid="match-card"]').filter({ hasText: /anna nowak|testuser2/i });

      // Expand the accordion/card
      await userCard.click();

      // Verify username is visible
      await expect(userCard).toContainText(/anna nowak/i);

      // Verify email is visible
      await expect(userCard).toContainText(/testuser2@buddyfinder.test/i);

      // Verify distance is visible
      await expect(userCard).toContainText(/~.*km/i);

      // Verify sports section
      await expect(userCard.getByRole("heading", { name: /sporty|sports/i })).toBeVisible();

      // Verify Bieganie sport with parameters
      await expect(userCard).toContainText(/bieganie/i);
      await expect(userCard).toContainText(/5.*km/i); // distance
      await expect(userCard).toContainText(/6:00/i); // pace

      // Verify Pływanie w basenie sport
      await expect(userCard).toContainText(/pływanie w basenie/i);
      await expect(userCard).toContainText(/2.*km/i);

      // Verify social media section
      await expect(userCard.getByRole("heading", { name: /media społecznościowe|social/i })).toBeVisible();

      // Verify Facebook link
      const facebookLink = userCard.getByRole("link", { name: /facebook/i });
      await expect(facebookLink).toBeVisible();
      await expect(facebookLink).toHaveAttribute("href", /facebook.com/);
      await expect(facebookLink).toHaveAttribute("target", "_blank");

      // Verify Instagram link
      const instagramLink = userCard.getByRole("link", { name: /instagram/i });
      await expect(instagramLink).toBeVisible();
      await expect(instagramLink).toHaveAttribute("href", /instagram.com/);
    });

    test("TC-E2E-010-002: Display user without social media links", async ({ page }) => {
      // Find Test User 3's card (no social media)
      const userCard = page.locator('[data-testid="match-card"]').filter({ hasText: /piotr|testuser3/i });

      // Expand the card
      await userCard.click();

      // Verify user info is visible
      await expect(userCard).toContainText(/piotr wiśniewski/i);
      await expect(userCard).toContainText(/testuser3@buddyfinder.test/i);

      // Verify sports are visible
      await expect(userCard).toContainText(/tenis/i);
      await expect(userCard).toContainText(/rolki/i);

      // Verify social media section is NOT displayed
      await expect(userCard.getByRole("heading", { name: /media społecznościowe|social/i })).not.toBeVisible();
    });
  });

  test.describe("Without location", () => {
    test.beforeEach(async ({ page }) => {
      // Login as Test User 5 (no location)
      await login(page, TEST_USER_5);

      // Navigate to matches tab
      await page.goto("/");
      await page.getByRole("tab", { name: /dopasowania|matches/i }).click();
    });

    test("TC-E2E-009-002: Show message for user without location", async ({ page }) => {
      // Verify empty state is shown
      await expect(page.getByRole("heading", { name: /brak ustawionej lokalizacji|no location/i })).toBeVisible();

      // Verify message explains the issue
      await expect(page.getByText(/ustaw swoją lokalizację.*profilu|set your location.*profile/i)).toBeVisible();

      // Verify CTA button
      const ctaButton = page.getByRole("link", { name: /uzupełnij profil|complete profile/i });
      await expect(ctaButton).toBeVisible();

      // Click CTA and verify redirect to profile
      await ctaButton.click();
      await expect(page).toHaveURL(/\/profile|\/profil/);
    });
  });

  test.describe("No matches", () => {
    test.skip("TC-E2E-009-004: Show message when no matches found", async () => {
      // This test requires a user with location but no one in range
      // TODO: Create Test User 7 with location far from all others
    });
  });
});
