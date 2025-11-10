/**
 * Test fixtures for profile data
 */

import type { ProfileDto, GeoJsonPoint } from "@/types";

/**
 * Mock location for Kraków
 */
export const mockLocationKrakow: GeoJsonPoint = {
  type: "Point",
  coordinates: [19.945, 50.0647],
};

/**
 * Mock location for Warsaw
 */
export const mockLocationWarsaw: GeoJsonPoint = {
  type: "Point",
  coordinates: [21.0122, 52.2297],
};

/**
 * Mock ProfileDto with complete data
 */
export const mockProfile: ProfileDto = {
  id: "user-123",
  username: "test_user",
  display_name: "Test User",
  default_range_km: 10,
  location: mockLocationKrakow,
  social_links: {
    strava: "https://strava.com/athletes/12345",
    instagram: "test_user",
  },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

/**
 * Mock ProfileDto without location
 */
export const mockProfileNoLocation: ProfileDto = {
  ...mockProfile,
  location: null,
};

/**
 * Mock ProfileDto without social links
 */
export const mockProfileNoSocialLinks: ProfileDto = {
  ...mockProfile,
  social_links: {},
};

/**
 * Helper to create a custom profile
 */
export const createMockProfile = (overrides: Partial<ProfileDto> = {}): ProfileDto => ({
  ...mockProfile,
  ...overrides,
});
