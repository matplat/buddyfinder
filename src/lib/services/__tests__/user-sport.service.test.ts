/**
 * Unit tests for UserSportService (TC-004)
 * Tests user sport management: adding, updating, deleting, and fetching user sports
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "@test/unit/mocks/supabase";
import {
  UserSportService,
  SportNotFoundError,
  DuplicateSportError,
  UserSportNotFoundError,
} from "../user-sport.service";
import {
  mockUserSportBieganie,
  mockUserSportRowerSzosowy,
  mockUserSportPlywanieBasen,
  mockUserSports,
  mockAddUserSportCommand,
  mockUpdateUserSportCommand,
} from "@test/unit/fixtures/user-sports";
import { mockSportBieganie, mockSportRowerSzosowy } from "@test/unit/fixtures/sports";

// Mock logger to avoid console noise during tests
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("UserSportService", () => {
  let service: UserSportService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  const testUserId = "test-user-123";

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new UserSportService(mockSupabase.mockClient);
  });

  describe("addUserSport", () => {
    it("should successfully add a new sport to user profile", async () => {
      // Arrange - sport exists
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: { id: mockSportBieganie.id },
        error: null,
      });

      // Arrange - user doesn't have this sport yet (PGRST116 = not found)
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "Not found", details: "", hint: "" },
      });

      // Arrange - insert succeeds
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: {
          sport_id: mockUserSportBieganie.sport_id,
          parameters: mockUserSportBieganie.parameters,
          custom_range_km: mockUserSportBieganie.custom_range_km,
          sports: { name: mockUserSportBieganie.name },
        },
        error: null,
      });

      // Act
      const result = await service.addUserSport(testUserId, mockAddUserSportCommand);

      // Assert
      expect(result).toEqual(mockUserSportBieganie);
      expect(mockSupabase.mocks.from).toHaveBeenCalledWith("sports");
      expect(mockSupabase.mocks.from).toHaveBeenCalledWith("user_sports");
      expect(mockSupabase.mocks.insert).toHaveBeenCalledWith({
        user_id: testUserId,
        sport_id: mockAddUserSportCommand.sport_id,
        parameters: mockAddUserSportCommand.parameters,
        custom_range_km: mockAddUserSportCommand.custom_range_km,
      });
    });

    it("should throw SportNotFoundError when sport does not exist", async () => {
      // Arrange - sport not found
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "Not found", details: "", hint: "" },
      });

      // Act & Assert
      await expect(service.addUserSport(testUserId, mockAddUserSportCommand)).rejects.toThrow(SportNotFoundError);
    });

    it("should throw DuplicateSportError when user already has this sport", async () => {
      // Arrange - sport exists
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: { id: mockSportBieganie.id },
        error: null,
      });

      // Arrange - user already has this sport
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: { sport_id: mockSportBieganie.id },
        error: null,
      });

      // Act & Assert
      await expect(service.addUserSport(testUserId, mockAddUserSportCommand)).rejects.toThrow(DuplicateSportError);
    });

    it("should throw error when userId is not provided", async () => {
      // Act & Assert
      await expect(service.addUserSport("", mockAddUserSportCommand)).rejects.toThrow("User ID is required");
    });

    it("should propagate database errors during insert", async () => {
      // Arrange - sport exists
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: { id: mockSportBieganie.id },
        error: null,
      });

      // Arrange - user doesn't have this sport
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "Not found", details: "", hint: "" },
      });

      // Arrange - insert fails
      const dbError = new Error("Database connection lost");
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: null,
        error: dbError,
      });

      // Act & Assert
      await expect(service.addUserSport(testUserId, mockAddUserSportCommand)).rejects.toThrow(dbError);
    });

    it("should handle custom_range_km parameter", async () => {
      const commandWithRange = {
        ...mockAddUserSportCommand,
        custom_range_km: 25,
      };

      // Arrange - sport exists
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: { id: mockSportBieganie.id },
        error: null,
      });

      // Arrange - user doesn't have this sport
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "Not found", details: "", hint: "" },
      });

      // Arrange - insert succeeds
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: {
          sport_id: mockSportBieganie.id,
          parameters: commandWithRange.parameters,
          custom_range_km: commandWithRange.custom_range_km,
          sports: { name: mockSportBieganie.name },
        },
        error: null,
      });

      // Act
      const result = await service.addUserSport(testUserId, commandWithRange);

      // Assert
      expect(result.custom_range_km).toBe(25);
      expect(mockSupabase.mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ custom_range_km: 25 }));
    });
  });

  describe("updateUserSport", () => {
    const sportId = mockSportBieganie.id;

    it("should successfully update user sport parameters", async () => {
      // Arrange
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: {
          sport_id: sportId,
          parameters: mockUpdateUserSportCommand.parameters,
          custom_range_km: mockUpdateUserSportCommand.custom_range_km,
          sports: { name: mockSportBieganie.name },
        },
        error: null,
      });

      // Act
      const result = await service.updateUserSport(testUserId, sportId, mockUpdateUserSportCommand);

      // Assert
      expect(result.parameters).toEqual(mockUpdateUserSportCommand.parameters);
      expect(mockSupabase.mocks.update).toHaveBeenCalledWith({
        parameters: mockUpdateUserSportCommand.parameters,
        custom_range_km: mockUpdateUserSportCommand.custom_range_km,
      });
      expect(mockSupabase.mocks.eq).toHaveBeenCalledWith("user_id", testUserId);
      expect(mockSupabase.mocks.eq).toHaveBeenCalledWith("sport_id", sportId);
    });

    it("should update only parameters when custom_range_km is not provided", async () => {
      const updateCommand = { parameters: { dystans: 15 } };

      // Arrange
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: {
          sport_id: sportId,
          parameters: updateCommand.parameters,
          custom_range_km: null,
          sports: { name: mockSportBieganie.name },
        },
        error: null,
      });

      // Act
      await service.updateUserSport(testUserId, sportId, updateCommand);

      // Assert
      expect(mockSupabase.mocks.update).toHaveBeenCalledWith({
        parameters: updateCommand.parameters,
      });
    });

    it("should update only custom_range_km when parameters are not provided", async () => {
      const updateCommand = { custom_range_km: 30 };

      // Arrange
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: {
          sport_id: sportId,
          parameters: {},
          custom_range_km: 30,
          sports: { name: mockSportBieganie.name },
        },
        error: null,
      });

      // Act
      await service.updateUserSport(testUserId, sportId, updateCommand);

      // Assert
      expect(mockSupabase.mocks.update).toHaveBeenCalledWith({
        custom_range_km: 30,
      });
    });

    it("should allow setting custom_range_km to null", async () => {
      const updateCommand = { custom_range_km: null };

      // Arrange
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: {
          sport_id: sportId,
          parameters: {},
          custom_range_km: null,
          sports: { name: mockSportBieganie.name },
        },
        error: null,
      });

      // Act
      const result = await service.updateUserSport(testUserId, sportId, updateCommand);

      // Assert
      expect(result.custom_range_km).toBeNull();
      expect(mockSupabase.mocks.update).toHaveBeenCalledWith({
        custom_range_km: null,
      });
    });

    it("should throw UserSportNotFoundError when user does not have this sport", async () => {
      // Arrange
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act & Assert
      await expect(service.updateUserSport(testUserId, sportId, mockUpdateUserSportCommand)).rejects.toThrow(
        UserSportNotFoundError
      );
    });

    it("should throw error when userId is not provided", async () => {
      // Act & Assert
      await expect(service.updateUserSport("", sportId, mockUpdateUserSportCommand)).rejects.toThrow(
        "User ID is required"
      );
    });

    it("should propagate database errors during update", async () => {
      // Arrange
      const dbError = new Error("Database connection lost");
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: null,
        error: dbError,
      });

      // Act & Assert
      await expect(service.updateUserSport(testUserId, sportId, mockUpdateUserSportCommand)).rejects.toThrow(dbError);
    });
  });

  describe("deleteUserSport", () => {
    const sportId = mockSportBieganie.id;

    it("should successfully delete user sport", async () => {
      // Arrange
      mockSupabase.mocks.match.mockResolvedValueOnce({
        data: null,
        error: null,
        count: 1,
        status: 204,
        statusText: "No Content",
      });

      // Act
      await service.deleteUserSport(testUserId, sportId);

      // Assert
      expect(mockSupabase.mocks.from).toHaveBeenCalledWith("user_sports");
      expect(mockSupabase.mocks.delete).toHaveBeenCalled();
      expect(mockSupabase.mocks.match).toHaveBeenCalledWith({
        user_id: testUserId,
        sport_id: sportId,
      });
    });

    it("should throw error when userId is not provided", async () => {
      // Act & Assert
      await expect(service.deleteUserSport("", sportId)).rejects.toThrow("User ID is required");
    });

    it("should throw error when sportId is not valid", async () => {
      // Act & Assert
      await expect(service.deleteUserSport(testUserId, NaN)).rejects.toThrow("Valid sport ID is required");
    });

    it("should propagate database errors during delete", async () => {
      // Arrange
      const dbError = new Error("Database connection lost");
      mockSupabase.mocks.match.mockResolvedValueOnce({
        data: null,
        error: dbError,
        count: 0,
        status: 500,
        statusText: "Internal Server Error",
      });

      // Act & Assert
      await expect(service.deleteUserSport(testUserId, sportId)).rejects.toThrow(dbError);
    });

    it("should complete successfully even when sport was not found (idempotent)", async () => {
      // Arrange - delete returns no error even if nothing was deleted
      mockSupabase.mocks.match.mockResolvedValueOnce({
        data: null,
        error: null,
        count: 0,
        status: 204,
        statusText: "No Content",
      });

      // Act & Assert - should not throw
      await expect(service.deleteUserSport(testUserId, sportId)).resolves.toBeUndefined();
    });
  });

  describe("getUserSports", () => {
    it("should successfully fetch all user sports", async () => {
      // Arrange
      const dbResponse = mockUserSports.map((sport) => ({
        sport_id: sport.sport_id,
        parameters: sport.parameters,
        custom_range_km: sport.custom_range_km,
        sports: { name: sport.name },
      }));

      mockSupabase.mocks.eq.mockResolvedValueOnce({
        data: dbResponse,
        error: null,
      });

      // Act
      const result = await service.getUserSports(testUserId);

      // Assert
      expect(result).toEqual(mockUserSports);
      expect(result).toHaveLength(3);
      expect(mockSupabase.mocks.from).toHaveBeenCalledWith("user_sports");
      expect(mockSupabase.mocks.eq).toHaveBeenCalledWith("user_id", testUserId);
    });

    it("should return empty array when user has no sports", async () => {
      // Arrange
      mockSupabase.mocks.eq.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Act
      const result = await service.getUserSports(testUserId);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should throw error when userId is not provided", async () => {
      // Act & Assert
      await expect(service.getUserSports("")).rejects.toThrow("User ID is required");
    });

    it("should propagate database errors", async () => {
      // Arrange
      const dbError = new Error("Database connection lost");
      mockSupabase.mocks.eq.mockResolvedValueOnce({
        data: null,
        error: dbError,
      });

      // Act & Assert
      await expect(service.getUserSports(testUserId)).rejects.toThrow(dbError);
    });

    it("should throw error when database returns invalid format", async () => {
      // Arrange - return non-array data
      mockSupabase.mocks.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act & Assert
      await expect(service.getUserSports(testUserId)).rejects.toThrow("Invalid response format from database");
    });

    it("should correctly map database sports with custom ranges", async () => {
      // Arrange
      const dbResponse = [
        {
          sport_id: mockUserSportRowerSzosowy.sport_id,
          parameters: mockUserSportRowerSzosowy.parameters,
          custom_range_km: mockUserSportRowerSzosowy.custom_range_km,
          sports: { name: mockUserSportRowerSzosowy.name },
        },
      ];

      mockSupabase.mocks.eq.mockResolvedValueOnce({
        data: dbResponse,
        error: null,
      });

      // Act
      const result = await service.getUserSports(testUserId);

      // Assert
      expect(result[0].custom_range_km).toBe(25);
      expect(result[0].parameters).toEqual(mockUserSportRowerSzosowy.parameters);
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle adding multiple different sports", async () => {
      // Test adds 2 different sports sequentially

      // First sport - Bieganie
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: { id: mockSportBieganie.id },
        error: null,
      });
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "Not found", details: "", hint: "" },
      });
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: {
          sport_id: mockSportBieganie.id,
          parameters: {},
          custom_range_km: null,
          sports: { name: mockSportBieganie.name },
        },
        error: null,
      });

      // Second sport - Rower
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: { id: mockSportRowerSzosowy.id },
        error: null,
      });
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "Not found", details: "", hint: "" },
      });
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: {
          sport_id: mockSportRowerSzosowy.id,
          parameters: {},
          custom_range_km: null,
          sports: { name: mockSportRowerSzosowy.name },
        },
        error: null,
      });

      // Act
      const result1 = await service.addUserSport(testUserId, mockAddUserSportCommand);
      const result2 = await service.addUserSport(testUserId, {
        ...mockAddUserSportCommand,
        sport_id: mockSportRowerSzosowy.id,
      });

      // Assert
      expect(result1.sport_id).toBe(mockSportBieganie.id);
      expect(result2.sport_id).toBe(mockSportRowerSzosowy.id);
    });

    it("should handle malformed parameters gracefully", async () => {
      const malformedCommand = {
        sport_id: mockSportBieganie.id,
        parameters: { invalid: "data" },
        custom_range_km: null,
      };

      // Arrange - sport exists
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: { id: mockSportBieganie.id },
        error: null,
      });

      // Arrange - user doesn't have sport
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "Not found", details: "", hint: "" },
      });

      // Arrange - insert succeeds (database accepts the data)
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: {
          sport_id: mockSportBieganie.id,
          parameters: malformedCommand.parameters,
          custom_range_km: null,
          sports: { name: mockSportBieganie.name },
        },
        error: null,
      });

      // Act & Assert - service should pass through to database
      const result = await service.addUserSport(testUserId, malformedCommand);
      expect(result.parameters).toEqual(malformedCommand.parameters);
    });
  });
});
