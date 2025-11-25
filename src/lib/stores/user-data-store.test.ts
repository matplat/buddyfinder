/**
 * Unit tests for user data store.
 *
 * Tests cover:
 * - Initialization with SSR data
 * - Profile updates
 * - Sports CRUD operations
 * - Location updates
 * - State management (loading, error)
 * - Reset functionality
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useUserDataStore } from "./user-data-store";
import type { ProfileDto, UserSportDto, SportDto } from "@/types";
import type { UserLocation } from "./types";

describe("useUserDataStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useUserDataStore.getState().reset();
  });

  describe("Initialization", () => {
    it("should start with null/empty initial state", () => {
      const state = useUserDataStore.getState();

      expect(state.profile).toBeNull();
      expect(state.sports).toEqual([]);
      expect(state.availableSports).toEqual([]);
      expect(state.location).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should initialize with SSR data", () => {
      const mockProfile: ProfileDto = {
        id: "user-123",
        username: "testuser",
        display_name: "Test User",
        location: { type: "Point", coordinates: [21.0122, 52.2297] },
        default_range_km: 10,
        social_links: {},
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const mockSports: UserSportDto[] = [
        {
          sport_id: 1,
          name: "Piłka nożna",
          parameters: { skill_level: 3 },
          custom_range_km: 5,
        },
      ];

      const mockAvailableSports: SportDto[] = [
        { id: 1, name: "Piłka nożna" },
        { id: 2, name: "Koszykówka" },
        { id: 3, name: "Tenis" },
      ];

      const mockLocation: UserLocation = {
        lat: 52.2297,
        lng: 21.0122,
        range: 10,
      };

      useUserDataStore.getState().initialize({
        profile: mockProfile,
        sports: mockSports,
        availableSports: mockAvailableSports,
        location: mockLocation,
      });

      const state = useUserDataStore.getState();

      expect(state.profile).toEqual(mockProfile);
      expect(state.sports).toEqual(mockSports);
      expect(state.availableSports).toEqual(mockAvailableSports);
      expect(state.location).toEqual(mockLocation);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("Profile Actions", () => {
    it("should set profile", () => {
      const mockProfile: ProfileDto = {
        id: "user-123",
        username: "testuser",
        display_name: "Test User",
        location: null,
        default_range_km: 10,
        social_links: {},
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      useUserDataStore.getState().setProfile(mockProfile);

      expect(useUserDataStore.getState().profile).toEqual(mockProfile);
    });

    it("should update profile partially", () => {
      const mockProfile: ProfileDto = {
        id: "user-123",
        username: "testuser",
        display_name: "Test User",
        location: null,
        default_range_km: 10,
        social_links: {},
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      useUserDataStore.getState().setProfile(mockProfile);
      useUserDataStore.getState().updateProfile({
        display_name: "Updated Name",
        default_range_km: 20,
      });

      const updatedProfile = useUserDataStore.getState().profile;

      expect(updatedProfile?.display_name).toBe("Updated Name");
      expect(updatedProfile?.default_range_km).toBe(20);
      expect(updatedProfile?.username).toBe("testuser"); // Other fields unchanged
    });

    it("should handle updateProfile when profile is null", () => {
      useUserDataStore.getState().updateProfile({ display_name: "Test" });

      expect(useUserDataStore.getState().profile).toBeNull();
    });
  });

  describe("Sports Actions", () => {
    const mockSport1: UserSportDto = {
      sport_id: 1,
      name: "Piłka nożna",
      parameters: { skill_level: 3 },
      custom_range_km: 5,
    };

    const mockSport2: UserSportDto = {
      sport_id: 2,
      name: "Koszykówka",
      parameters: { skill_level: 4 },
      custom_range_km: null,
    };

    it("should add sport", () => {
      useUserDataStore.getState().addSport(mockSport1);

      const sports = useUserDataStore.getState().sports;

      expect(sports).toHaveLength(1);
      expect(sports[0]).toEqual(mockSport1);
    });

    it("should add multiple sports", () => {
      useUserDataStore.getState().addSport(mockSport1);
      useUserDataStore.getState().addSport(mockSport2);

      const sports = useUserDataStore.getState().sports;

      expect(sports).toHaveLength(2);
      expect(sports).toContainEqual(mockSport1);
      expect(sports).toContainEqual(mockSport2);
    });

    it("should update sport", () => {
      useUserDataStore.getState().addSport(mockSport1);
      useUserDataStore.getState().updateSport(1, {
        parameters: { skill_level: 5 },
        custom_range_km: 10,
      });

      const sports = useUserDataStore.getState().sports;
      const updatedSport = sports.find((s) => s.sport_id === 1);

      expect(updatedSport?.parameters).toEqual({ skill_level: 5 });
      expect(updatedSport?.custom_range_km).toBe(10);
      expect(updatedSport?.name).toBe("Piłka nożna"); // Name unchanged
    });

    it("should not modify other sports when updating", () => {
      useUserDataStore.getState().addSport(mockSport1);
      useUserDataStore.getState().addSport(mockSport2);
      useUserDataStore.getState().updateSport(1, { custom_range_km: 15 });

      const sports = useUserDataStore.getState().sports;
      const sport2 = sports.find((s) => s.sport_id === 2);

      expect(sport2).toEqual(mockSport2); // Sport 2 unchanged
    });

    it("should remove sport", () => {
      useUserDataStore.getState().addSport(mockSport1);
      useUserDataStore.getState().addSport(mockSport2);
      useUserDataStore.getState().removeSport(1);

      const sports = useUserDataStore.getState().sports;

      expect(sports).toHaveLength(1);
      expect(sports[0].sport_id).toBe(2);
    });

    it("should set sports array", () => {
      const newSports = [mockSport1, mockSport2];
      useUserDataStore.getState().setSports(newSports);

      expect(useUserDataStore.getState().sports).toEqual(newSports);
    });

    it("should set available sports", () => {
      const mockAvailableSports: SportDto[] = [
        { id: 1, name: "Piłka nożna" },
        { id: 2, name: "Koszykówka" },
        { id: 3, name: "Tenis" },
        { id: 4, name: "Pływanie" },
      ];

      useUserDataStore.getState().setAvailableSports(mockAvailableSports);

      expect(useUserDataStore.getState().availableSports).toEqual(mockAvailableSports);
      expect(useUserDataStore.getState().availableSports).toHaveLength(4);
    });
  });

  describe("Location Actions", () => {
    it("should set location", () => {
      const mockLocation: UserLocation = {
        lat: 52.2297,
        lng: 21.0122,
        range: 10,
      };

      useUserDataStore.getState().setLocation(mockLocation);

      expect(useUserDataStore.getState().location).toEqual(mockLocation);
    });

    it("should update location", () => {
      const initialLocation: UserLocation = {
        lat: 52.2297,
        lng: 21.0122,
        range: 10,
      };

      const updatedLocation: UserLocation = {
        lat: 50.0647,
        lng: 19.945,
        range: 20,
      };

      useUserDataStore.getState().setLocation(initialLocation);
      useUserDataStore.getState().setLocation(updatedLocation);

      expect(useUserDataStore.getState().location).toEqual(updatedLocation);
    });
  });

  describe("State Management", () => {
    it("should set loading state", () => {
      useUserDataStore.getState().setLoading(true);

      expect(useUserDataStore.getState().isLoading).toBe(true);

      useUserDataStore.getState().setLoading(false);

      expect(useUserDataStore.getState().isLoading).toBe(false);
    });

    it("should set error", () => {
      useUserDataStore.getState().setError("Test error");

      expect(useUserDataStore.getState().error).toBe("Test error");

      useUserDataStore.getState().setError(null);

      expect(useUserDataStore.getState().error).toBeNull();
    });

    it("should reset to initial state", () => {
      // Set up some state
      const mockProfile: ProfileDto = {
        id: "user-123",
        username: "testuser",
        display_name: "Test User",
        location: null,
        default_range_km: 10,
        social_links: {},
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      useUserDataStore.getState().setProfile(mockProfile);
      useUserDataStore.getState().addSport({
        sport_id: 1,
        name: "Test Sport",
        parameters: {},
        custom_range_km: null,
      });
      useUserDataStore.getState().setAvailableSports([{ id: 1, name: "Test Sport" }]);
      useUserDataStore.getState().setLoading(true);
      useUserDataStore.getState().setError("Test error");

      // Reset
      useUserDataStore.getState().reset();

      // Verify reset
      const state = useUserDataStore.getState();

      expect(state.profile).toBeNull();
      expect(state.sports).toEqual([]);
      expect(state.availableSports).toEqual([]);
      expect(state.location).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
