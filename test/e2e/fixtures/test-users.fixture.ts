/**
 * Test user fixtures for E2E tests
 * Defines 6 test users with different configurations for testing various scenarios
 */

export interface TestUser {
  email: string;
  password: string;
  username: string;
  displayName: string;
  location?: {
    lat: number;
    lng: number;
    name: string;
  };
  defaultRange?: number;
  sports?: {
    sportId: number;
    sportName: string;
    parameters: Record<string, unknown>;
    customRange?: number;
  }[];
  socialLinks?: Record<string, string>;
}

/**
 * Test User 1: Main test user - Full profile with location and sports
 * Location: Warszawa centrum (52.2297, 21.0122)
 * Default range: 10 km
 * Sports: Bieganie, Rower szosowy
 */
export const TEST_USER_1: TestUser = {
  email: "testuser1@buddyfinder.test",
  password: "TestPass123!",
  username: "testuser1",
  displayName: "Jan Kowalski",
  location: {
    lat: 52.2297,
    lng: 21.0122,
    name: "Warszawa centrum",
  },
  defaultRange: 10,
  sports: [
    {
      sportId: 1, // Bieganie
      sportName: "Bieganie",
      parameters: {
        distance_km: 10,
        pace_min_per_km: "5:30",
      },
    },
  ],
  socialLinks: {
    strava: "https://strava.com/athletes/testuser1",
  },
};

/**
 * Test User 2: In range, common sports
 * Location: Warszawa Mokotów (52.1951, 21.0244) - ~4.5 km from User 1
 * Default range: 15 km
 * Sports: Bieganie, Pływanie w basenie
 */
export const TEST_USER_2: TestUser = {
  email: "testuser2@buddyfinder.test",
  password: "TestPass123!",
  username: "testuser2",
  displayName: "Anna Nowak",
  location: {
    lat: 52.1951,
    lng: 21.0244,
    name: "Warszawa Mokotów",
  },
  defaultRange: 15,
  sports: [
    {
      sportId: 1, // Bieganie
      sportName: "Bieganie",
      parameters: {
        distance_km: 5,
        pace_min_per_km: "6:00",
      },
    },
    {
      sportId: 4, // Pływanie w basenie
      sportName: "Pływanie w basenie",
      parameters: {
        distance_km: 2,
      },
    },
  ],
  socialLinks: {
    facebook: "https://facebook.com/testuser2",
    instagram: "https://instagram.com/testuser2",
  },
};

/**
 * Test User 3: In range, no common sports
 * Location: Warszawa Wilanów (52.1652, 21.0892) - ~8.2 km from User 1
 * Default range: 12 km
 * Sports: Tenis, Rolki
 */
export const TEST_USER_3: TestUser = {
  email: "testuser3@buddyfinder.test",
  password: "TestPass123!",
  username: "testuser3",
  displayName: "Piotr Wiśniewski",
  location: {
    lat: 52.1652,
    lng: 21.0892,
    name: "Warszawa Wilanów",
  },
  defaultRange: 12,
  sports: [
    {
      sportId: 8, // Tenis
      sportName: "Tenis",
      parameters: {
        skill_level: "intermediate",
      },
    },
    {
      sportId: 6, // Rolki
      sportName: "Rolki",
      parameters: {
        distance_km: 15,
      },
    },
  ],
};

/**
 * Test User 4: Out of range
 * Location: Kraków (50.0647, 19.9450) - ~252 km from User 1
 * Default range: 20 km
 * Sports: Bieganie, Rower MTB
 */
export const TEST_USER_4: TestUser = {
  email: "testuser4@buddyfinder.test",
  password: "TestPass123!",
  username: "testuser4",
  displayName: "Ewa Zielińska",
  location: {
    lat: 50.0647,
    lng: 19.945,
    name: "Kraków",
  },
  defaultRange: 20,
  sports: [
    {
      sportId: 1, // Bieganie
      sportName: "Bieganie",
      parameters: {
        distance_km: 10,
        pace_min_per_km: "5:00",
      },
    },
    {
      sportId: 3, // Rower MTB
      sportName: "Rower MTB",
      parameters: {
        distance_km: 40,
        avg_speed_kmh: 20,
      },
    },
  ],
  socialLinks: {
    strava: "https://strava.com/athletes/testuser4",
  },
};

/**
 * Test User 5: No location set
 * Sports: Bieganie
 */
export const TEST_USER_5: TestUser = {
  email: "testuser5@buddyfinder.test",
  password: "TestPass123!",
  username: "testuser5",
  displayName: "Tomasz Kamiński",
  sports: [
    {
      sportId: 1, // Bieganie
      sportName: "Bieganie",
      parameters: {
        distance_km: 8,
        pace_min_per_km: "5:45",
      },
    },
  ],
};

/**
 * Test User 6: Location set, no sports
 * Location: Warszawa Śródmieście (52.2319, 21.0067) - ~1.5 km from User 1
 * Default range: 5 km
 */
export const TEST_USER_6: TestUser = {
  email: "testuser6@buddyfinder.test",
  password: "TestPass123!",
  username: "testuser6",
  displayName: "Maria Lewandowska",
  location: {
    lat: 52.2319,
    lng: 21.0067,
    name: "Warszawa Śródmieście",
  },
  defaultRange: 5,
};

/**
 * All test users in an array for easy iteration
 */
export const ALL_TEST_USERS = [TEST_USER_1, TEST_USER_2, TEST_USER_3, TEST_USER_4, TEST_USER_5, TEST_USER_6];
