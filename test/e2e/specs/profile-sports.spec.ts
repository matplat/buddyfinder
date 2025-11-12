import { expect } from "@playwright/test";

import { DatabaseHelper } from "../helpers/database.helper";
import { ProfileHelper } from "../helpers/profile.helper";
import { test } from "../fixtures/auth.fixture";

const TEST_USER_EMAIL = "testuser1@buddyfinder.test";

test.describe("US-004: Zarządzanie sportami w profilu", () => {
  test("TC-E2E-004-001 dodaje nowy sport do profilu", async ({ authenticatedPage }) => {
    const db = new DatabaseHelper();
    const profile = new ProfileHelper(authenticatedPage);

    await db.clearUserSports(TEST_USER_EMAIL);

    try {
      await profile.navigateToSportsSection();

      await profile.openAddSportDialog();

      await profile.fillSportForm("rower mtb", {
        dystans: "30",
        czas: "1:20h",
        przewyższenie: "600",
      });

      await profile.setCustomRange("15");

      await profile.saveSport();

      await profile.assertSportCardContains("rower mtb", [
        "rower mtb",
        "Dystans: 30 km",
        "Czas: 1:20h",
        "Przewyższenie: 600 m",
        "Zasięg: 15 km",
      ]);

      const userId = await ensureTestUser(db);
      const sportId = await db.ensureSportExists("rower mtb");
      const { data: row } = await db.client
        .from("user_sports")
        .select("custom_range_km, parameters")
        .eq("user_id", userId)
        .eq("sport_id", sportId)
        .maybeSingle();

      expect(row?.custom_range_km).toBe(15);
      const params = (row?.parameters ?? {}) as Record<string, unknown>;
      expect(params).toMatchObject({ dystans: 30, czas: 80, przewyższenie: 600 });
    } finally {
      await db.clearUserSports(TEST_USER_EMAIL);
    }
  });

  test("TC-E2E-004-002 edytuje istniejący sport", async ({ authenticatedPage }) => {
    const db = new DatabaseHelper();
    const profile = new ProfileHelper(authenticatedPage);

    await db.clearUserSports(TEST_USER_EMAIL);
    await db.seedTestUserWithSports([
      {
        userEmail: TEST_USER_EMAIL,
        sportName: "bieganie",
        customRangeKm: 10,
        parameters: {
          dystans: 10,
          tempo: 330,
        },
      },
    ]);

    try {
      await profile.navigateToSportsSection();

      await profile.openEditSportDialog("bieganie");

      await profile.updateSportParameters({
        dystans: "15",
        tempo: "5:00",
      });

      await profile.setCustomRange("12");
      await profile.saveSport();

      await profile.assertSportCardContains("bieganie", [
        "Dystans: 15 km",
        "Tempo: 5:00 min/km",
        "Zasięg: 12 km",
      ]);

      const userId = await ensureTestUser(db);
      const sportId = await db.ensureSportExists("bieganie");
      const { data: row } = await db.client
        .from("user_sports")
        .select("custom_range_km, parameters")
        .eq("user_id", userId)
        .eq("sport_id", sportId)
        .maybeSingle();

      expect(row?.custom_range_km).toBe(12);
      const params = (row?.parameters ?? {}) as Record<string, unknown>;
      expect(params).toMatchObject({ dystans: 15, tempo: 300 });
    } finally {
      await db.clearUserSports(TEST_USER_EMAIL);
    }
  });

  test("TC-E2E-004-003 usuwa sport z profilu", async ({ authenticatedPage }) => {
    const db = new DatabaseHelper();
    const profile = new ProfileHelper(authenticatedPage);

    await db.clearUserSports(TEST_USER_EMAIL);
    await db.seedTestUserWithSports([
      {
        userEmail: TEST_USER_EMAIL,
        sportName: "rower szosowy",
        customRangeKm: 20,
        parameters: {
          dystans: 50,
          prędkość: 32,
        },
      },
    ]);

    try {
      await profile.navigateToSportsSection();

      await profile.assertSportCardContains("rower szosowy", ["rower szosowy", "Dystans: 50 km"]);

      await profile.deleteSport("rower szosowy");

      await expect(profile.getSportCard("rower szosowy")).toHaveCount(0);

      const userId = await ensureTestUser(db);
      const sportId = await db.ensureSportExists("rower szosowy");
      const { data: row } = await db.client
        .from("user_sports")
        .select("sport_id")
        .eq("user_id", userId)
        .eq("sport_id", sportId)
        .maybeSingle();

      expect(row).toBeNull();
    } finally {
      await db.clearUserSports(TEST_USER_EMAIL);
    }
  });

  test("TC-E2E-004-005 waliduje obowiązkowe pole wyboru sportu", async ({ authenticatedPage }) => {
    const db = new DatabaseHelper();
    const profile = new ProfileHelper(authenticatedPage);

    await db.clearUserSports(TEST_USER_EMAIL);

    try {
      await profile.navigateToSportsSection();
      await profile.openAddSportDialog();

      await profile.submitSportFormExpectingValidationError();

      await expect(authenticatedPage.getByText("Wybierz sport z listy")).toBeVisible();
      await expect(authenticatedPage.getByTestId("sport-editor--dialog")).toBeVisible();

      await authenticatedPage.getByTestId("sport-editor--cancel-button").click();
      await authenticatedPage.getByTestId("sport-editor--dialog").waitFor({ state: "hidden" });
    } finally {
      await db.clearUserSports(TEST_USER_EMAIL);
    }
  });
});

/**
 * Pomocnicza funkcja do pobrania identyfikatora użytkownika testowego.
 */
async function ensureTestUser(db: DatabaseHelper): Promise<string> {
  const userId = await db.getUserId(TEST_USER_EMAIL);
  if (!userId) {
    throw new Error(`Test user ${TEST_USER_EMAIL} not found. Ensure seed auth user exists.`);
  }
  return userId;
}
