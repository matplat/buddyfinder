import { test, expect } from "../fixtures/auth.fixture";
import { login } from "../helpers/auth.helper";
import { TEST_USER_1 } from "../fixtures/test-users.fixture";

/**
 * E2E Tests for US-004: Wybór uprawianych sportów
 * Tests cover adding, editing, and deleting sports from user profile
 */

test.describe("US-004: Profile Sports Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login as Test User 1
    await login(page, TEST_USER_1);

    // Navigate to profile page
    await page.goto("/");
    await page.getByRole("tab", { name: /profil|profile/i }).click();
  });

  test("TC-E2E-004-001: Add new sport to profile", async ({ page }) => {
    // Click "Add Sport" button
    await page.getByRole("button", { name: /dodaj sport|add sport/i }).click();

    // Wait for dialog to open
    await expect(page.getByRole("dialog").getByRole("heading", { name: /dodaj sport|add sport/i })).toBeVisible();

    // Select sport from dropdown
    await page.getByLabel(/wybierz sport|select sport/i).click();
    await page.getByRole("option", { name: /rower mtb|mtb/i }).click();

    // Fill in parameters
    // Note: Parameter names depend on sport configuration
    await page.getByLabel(/dystans|distance/i).fill("30");
    await page.getByLabel(/średnia prędkość|average speed/i).fill("25");

    // Optional: Set custom range
    await page.getByLabel(/zasięg|range/i).fill("15");

    // Save
    await page.getByRole("button", { name: /zapisz|save/i }).click();

    // Verify dialog closes
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Verify sport appears in the list
    await expect(page.getByText(/rower mtb/i)).toBeVisible();

    // Verify parameters are displayed
    await expect(page.getByText(/30.*km/i)).toBeVisible();
    await expect(page.getByText(/25.*km\/h/i)).toBeVisible();

    // Verify success toast
    await expect(page.getByRole("status")).toContainText(/dodano|added|success/i);
  });

  test("TC-E2E-004-002: Edit existing sport", async ({ page }) => {
    // Find the "Bieganie" sport card (already exists for Test User 1)
    const sportCard = page.locator('[data-testid="sport-card"]').filter({ hasText: /bieganie/i });

    // Click edit button
    await sportCard.getByRole("button", { name: /edytuj|edit/i }).click();

    // Wait for dialog
    await expect(page.getByRole("dialog")).toBeVisible();

    // Verify form is pre-filled with current values
    await expect(page.getByLabel(/dystans|distance/i)).toHaveValue("10");
    await expect(page.getByLabel(/tempo|pace/i)).toHaveValue("5:30");

    // Update values
    await page.getByLabel(/tempo|pace/i).fill("5:00");
    await page.getByLabel(/dystans|distance/i).fill("15");

    // Save changes
    await page.getByRole("button", { name: /zapisz|save/i }).click();

    // Verify dialog closes
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Verify updated values are displayed
    await expect(page.getByText(/15.*km/i)).toBeVisible();
    await expect(page.getByText(/5:00.*min\/km/i)).toBeVisible();

    // Verify success toast
    await expect(page.getByRole("status")).toContainText(/zaktualizowano|updated|success/i);
  });

  test("TC-E2E-004-003: Delete sport from profile", async ({ page }) => {
    // Find a sport card to delete
    const sportCard = page.locator('[data-testid="sport-card"]').filter({ hasText: /bieganie/i });

    // Click delete button
    await sportCard.getByRole("button", { name: /usuń|delete|remove/i }).click();

    // Wait for confirmation dialog
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByText(/czy na pewno|are you sure/i)).toBeVisible();

    // Confirm deletion
    await page.getByRole("button", { name: /potwierdź|confirm|yes/i }).click();

    // Verify confirmation dialog closes
    await expect(page.getByRole("alertdialog")).not.toBeVisible();

    // Verify sport is removed from the list
    await expect(sportCard).not.toBeVisible();

    // Verify success toast
    await expect(page.getByRole("status")).toContainText(/usunięto|deleted|removed/i);
  });

  test("TC-E2E-004-004: Add multiple sports", async ({ page }) => {
    const sportsToAdd = [
      { name: "Rower MTB", distance: "40", speed: "20" },
      { name: "Pływanie w basenie", distance: "2" },
      { name: "Tenis", level: "intermediate" },
    ];

    for (const sport of sportsToAdd) {
      // Click add button
      await page.getByRole("button", { name: /dodaj sport|add sport/i }).click();

      // Select sport
      await page.getByLabel(/wybierz sport|select sport/i).click();
      await page.getByRole("option", { name: new RegExp(sport.name, "i") }).click();

      // Fill in parameters based on sport type
      if ("distance" in sport) {
        await page.getByLabel(/dystans|distance/i).fill(sport.distance);
      }
      if ("speed" in sport) {
        await page.getByLabel(/prędkość|speed/i).fill(sport.speed);
      }
      if ("level" in sport) {
        await page.getByLabel(/poziom|level|skill/i).click();
        await page.getByRole("option", { name: new RegExp(sport.level, "i") }).click();
      }

      // Save
      await page.getByRole("button", { name: /zapisz|save/i }).click();

      // Wait for dialog to close
      await expect(page.getByRole("dialog")).not.toBeVisible();

      // Verify sport appears
      await expect(page.getByText(new RegExp(sport.name, "i"))).toBeVisible();
    }

    // Verify all sports are displayed
    for (const sport of sportsToAdd) {
      await expect(page.getByText(new RegExp(sport.name, "i"))).toBeVisible();
    }
  });

  test("TC-E2E-004-005: Validation - cannot save sport without required parameters", async ({ page }) => {
    // Click add button
    await page.getByRole("button", { name: /dodaj sport|add sport/i }).click();

    // Select sport
    await page.getByLabel(/wybierz sport|select sport/i).click();
    await page.getByRole("option", { name: /bieganie/i }).click();

    // Try to save without filling parameters
    await page.getByRole("button", { name: /zapisz|save/i }).click();

    // Verify validation errors are shown
    await expect(page.getByText(/pole wymagane|required field|required/i)).toBeVisible();

    // Verify dialog remains open
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill in one parameter
    await page.getByLabel(/dystans|distance/i).fill("10");

    // Try to save again (still missing pace)
    await page.getByRole("button", { name: /zapisz|save/i }).click();

    // Verify validation error for pace
    await expect(page.getByText(/pole wymagane|required field|required/i)).toBeVisible();

    // Fill in all required parameters
    await page.getByLabel(/tempo|pace/i).fill("5:30");

    // Now save should work
    await page.getByRole("button", { name: /zapisz|save/i }).click();

    // Verify dialog closes
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});
