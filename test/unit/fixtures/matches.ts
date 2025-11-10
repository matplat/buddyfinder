/**
 * Test fixtures for matches data
 */

import type { MatchedUserDto, GetMatchesResponseDto, PaginationDto } from "@/types";
import { mockUserSportBieganie, mockUserSportRowerSzosowy } from "./user-sports";

/**
 * Mock matched user close by
 */
export const mockMatchedUserClose: MatchedUserDto = {
  id: "user-123",
  username: "runner_anna",
  display_name: "Anna Kowalska",
  email: "anna@example.com",
  social_links: {
    strava: "https://strava.com/athletes/12345",
  },
  distance_km: 2.5,
  sports: [mockUserSportBieganie],
};

/**
 * Mock matched user with multiple sports
 */
export const mockMatchedUserMultipleSports: MatchedUserDto = {
  id: "user-456",
  username: "cyclist_jan",
  display_name: "Jan Nowak",
  email: "jan@example.com",
  social_links: {
    strava: "https://strava.com/athletes/67890",
    facebook: "https://facebook.com/jan.nowak",
  },
  distance_km: 5.8,
  sports: [mockUserSportBieganie, mockUserSportRowerSzosowy],
};

/**
 * Mock matched user medium distance
 */
export const mockMatchedUserMedium: MatchedUserDto = {
  id: "user-456-med",
  username: "runner_medium",
  display_name: "Medium Runner",
  email: "medium@example.com",
  social_links: {},
  distance_km: 7.5,
  sports: [mockUserSportBieganie],
};

/**
 * Mock matched user far away
 */
export const mockMatchedUserFar: MatchedUserDto = {
  id: "user-789",
  username: "swimmer_maria",
  display_name: "Maria Wiśniewska",
  email: "maria@example.com",
  social_links: {},
  distance_km: 15.2,
  sports: [
    {
      sport_id: 4,
      name: "pływanie w basenie",
      parameters: {
        dystans: 2000,
        tempo: 150,
      },
      custom_range_km: 20,
    },
  ],
};

/**
 * Mock matched user without display name
 */
export const mockMatchedUserNoDisplayName: MatchedUserDto = {
  id: "user-101",
  username: "test_user",
  display_name: null,
  email: "test@example.com",
  social_links: {},
  distance_km: 3.0,
  sports: [mockUserSportBieganie],
};

/**
 * All mock matched users as an array
 */
export const mockMatchedUsers: MatchedUserDto[] = [
  mockMatchedUserClose,
  mockMatchedUserMultipleSports,
  mockMatchedUserFar,
  mockMatchedUserNoDisplayName,
];

/**
 * Mock pagination metadata
 */
export const mockPagination: PaginationDto = {
  total: 50,
  limit: 20,
  offset: 0,
};

/**
 * Mock pagination for second page
 */
export const mockPaginationPage2: PaginationDto = {
  total: 50,
  limit: 20,
  offset: 20,
};

/**
 * Mock pagination for last page
 */
export const mockPaginationLastPage: PaginationDto = {
  total: 45,
  limit: 20,
  offset: 40,
};

/**
 * Mock GetMatchesResponseDto with default data
 */
export const mockGetMatchesResponse: GetMatchesResponseDto = {
  data: [mockMatchedUserClose, mockMatchedUserMultipleSports],
  pagination: mockPagination,
};

/**
 * Mock GetMatchesResponseDto with empty results
 */
export const mockGetMatchesResponseEmpty: GetMatchesResponseDto = {
  data: [],
  pagination: {
    total: 0,
    limit: 20,
    offset: 0,
  },
};

/**
 * Mock GetMatchesResponseDto with many results
 */
export const mockGetMatchesResponseFull: GetMatchesResponseDto = {
  data: mockMatchedUsers,
  pagination: mockPagination,
};

/**
 * Helper to create a matched user with specific distance
 */
export const createMockMatchedUser = (
  id: string,
  username: string,
  distanceKm: number,
  sportsCount = 1
): MatchedUserDto => ({
  id,
  username,
  display_name: username.replace("_", " "),
  email: `${username}@example.com`,
  social_links: {},
  distance_km: distanceKm,
  sports: [mockUserSportBieganie].slice(0, sportsCount),
});

/**
 * Helper to create matches response with specific pagination
 */
export const createMockMatchesResponse = (
  users: MatchedUserDto[],
  total: number,
  limit: number,
  offset: number
): GetMatchesResponseDto => ({
  data: users,
  pagination: {
    total,
    limit,
    offset,
  },
});
