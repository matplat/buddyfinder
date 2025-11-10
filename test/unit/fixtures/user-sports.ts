/**
 * Test fixtures for user sports data
 */

import type { UserSportDto, AddUserSportCommand, UpdateUserSportCommand } from "@/types";
import { mockSportBieganie, mockSportRowerSzosowy, mockSportPlywanieBasen } from "./sports";

/**
 * Mock user sport: Bieganie with typical parameters
 */
export const mockUserSportBieganie: UserSportDto = {
  sport_id: mockSportBieganie.id,
  name: mockSportBieganie.name,
  parameters: {
    dystans: 10,
    tempo: 330, // 5:30 min/km in seconds
  },
  custom_range_km: null,
};

/**
 * Mock user sport: Rower szosowy with custom range
 */
export const mockUserSportRowerSzosowy: UserSportDto = {
  sport_id: mockSportRowerSzosowy.id,
  name: mockSportRowerSzosowy.name,
  parameters: {
    dystans: 50,
    prędkość: 30,
  },
  custom_range_km: 25,
};

/**
 * Mock user sport: Pływanie with parameters
 */
export const mockUserSportPlywanieBasen: UserSportDto = {
  sport_id: mockSportPlywanieBasen.id,
  name: mockSportPlywanieBasen.name,
  parameters: {
    dystans: 1500,
    tempo: 120, // 2:00 min/100m in seconds
  },
  custom_range_km: 10,
};

/**
 * All mock user sports as an array
 */
export const mockUserSports: UserSportDto[] = [
  mockUserSportBieganie,
  mockUserSportRowerSzosowy,
  mockUserSportPlywanieBasen,
];

/**
 * Mock AddUserSportCommand for testing add operations
 */
export const mockAddUserSportCommand: AddUserSportCommand = {
  sport_id: mockSportBieganie.id,
  parameters: {
    dystans: 10,
    tempo: 330,
  },
  custom_range_km: null,
};

/**
 * Mock AddUserSportCommand with custom range
 */
export const mockAddUserSportCommandWithCustomRange: AddUserSportCommand = {
  sport_id: mockSportRowerSzosowy.id,
  parameters: {
    dystans: 50,
    prędkość: 30,
  },
  custom_range_km: 25,
};

/**
 * Mock UpdateUserSportCommand for testing update operations
 */
export const mockUpdateUserSportCommand: UpdateUserSportCommand = {
  parameters: {
    dystans: 15,
    tempo: 300, // 5:00 min/km
  },
};

/**
 * Mock UpdateUserSportCommand for custom range only
 */
export const mockUpdateUserSportCommandRangeOnly: UpdateUserSportCommand = {
  custom_range_km: 20,
};

/**
 * Helper to create a user sport with specific parameters
 */
export const createMockUserSport = (
  sportId: number,
  sportName: string,
  parameters: Record<string, string | number>,
  customRange: number | null = null
): UserSportDto => ({
  sport_id: sportId,
  name: sportName,
  parameters,
  custom_range_km: customRange,
});
