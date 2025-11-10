/**
 * Unit tests for MatchesService (TC-006)
 * Tests user matching functionality with pagination
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "@test/unit/mocks/supabase";
import { MatchesService } from "../matches.service";
import {
  mockMatchedUsers,
  mockMatchedUserClose,
  mockMatchedUserMultipleSports,
  mockMatchedUserFar,
  mockGetMatchesResponse,
} from "@test/unit/fixtures/matches";

// Mock logger to avoid console noise during tests
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("MatchesService", () => {
  let service: MatchesService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  const testUserId = "test-user-123";

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new MatchesService(mockSupabase.mockClient);
  });

  describe("getMatches", () => {
    it("should successfully fetch matches with default pagination", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            total_count: 3,
            matched_users: mockMatchedUsers,
          },
        ],
        error: null,
      });

      // Act
      const result = await service.getMatches(testUserId);

      // Assert
      expect(result.data).toEqual(mockMatchedUsers);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.offset).toBe(0);
      expect(mockSupabase.mocks.rpc).toHaveBeenCalledWith("get_matches_for_user", {
        current_user_id: testUserId,
        page_limit: 20,
        page_offset: 0,
      });
    });

    it("should fetch matches with custom limit", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            total_count: 3,
            matched_users: [mockMatchedUserClose],
          },
        ],
        error: null,
      });

      // Act
      const result = await service.getMatches(testUserId, 1);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.pagination.limit).toBe(1);
      expect(mockSupabase.mocks.rpc).toHaveBeenCalledWith("get_matches_for_user", {
        current_user_id: testUserId,
        page_limit: 1,
        page_offset: 0,
      });
    });

    it("should fetch matches with pagination offset", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            total_count: 3,
            matched_users: [mockMatchedUserFar],
          },
        ],
        error: null,
      });

      // Act
      const result = await service.getMatches(testUserId, 1, 2);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.pagination.limit).toBe(1);
      expect(result.pagination.offset).toBe(2);
      expect(mockSupabase.mocks.rpc).toHaveBeenCalledWith("get_matches_for_user", {
        current_user_id: testUserId,
        page_limit: 1,
        page_offset: 2,
      });
    });

    it("should return empty array when no matches found", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            total_count: 0,
            matched_users: [],
          },
        ],
        error: null,
      });

      // Act
      const result = await service.getMatches(testUserId);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it("should throw error when userId is not provided", async () => {
      // Act & Assert
      await expect(service.getMatches("")).rejects.toThrow("User ID is required");
    });

    it("should throw specific error for incomplete profile (PGRST400)", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: null,
        error: {
          code: "PGRST400",
          message: "Missing location or range",
          details: "",
          hint: "",
        },
      });

      // Act & Assert
      await expect(service.getMatches(testUserId)).rejects.toThrow(
        "Profile is incomplete: location and default_range_km are required"
      );
    });

    it("should propagate database errors", async () => {
      // Arrange
      const dbError = new Error("Database connection lost");
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: null,
        error: dbError,
      });

      // Act & Assert
      await expect(service.getMatches(testUserId)).rejects.toThrow(dbError);
    });

    it("should throw error when response is not an array", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act & Assert
      await expect(service.getMatches(testUserId)).rejects.toThrow("Invalid response format from matches function");
    });

    it("should throw error when response array is empty", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Act & Assert
      await expect(service.getMatches(testUserId)).rejects.toThrow("Invalid response format from matches function");
    });

    it("should throw error when response is missing total_count", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            matched_users: mockMatchedUsers,
            // missing total_count
          },
        ],
        error: null,
      });

      // Act & Assert
      await expect(service.getMatches(testUserId)).rejects.toThrow("Invalid response format from matches function");
    });

    it("should throw error when response is missing matched_users", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            total_count: 5,
            // missing matched_users
          },
        ],
        error: null,
      });

      // Act & Assert
      await expect(service.getMatches(testUserId)).rejects.toThrow("Invalid response format from matches function");
    });

    it("should throw error when matched_users is not an array", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            total_count: 1,
            matched_users: "invalid",
          },
        ],
        error: null,
      });

      // Act & Assert
      await expect(service.getMatches(testUserId)).rejects.toThrow("Invalid response format from matches function");
    });

    it("should handle large offset for pagination", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            total_count: 100,
            matched_users: [],
          },
        ],
        error: null,
      });

      // Act
      const result = await service.getMatches(testUserId, 20, 100);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.pagination.offset).toBe(100);
      expect(result.pagination.total).toBe(100);
    });

    it("should correctly map matched users with all properties", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            total_count: 1,
            matched_users: [mockMatchedUserMultipleSports],
          },
        ],
        error: null,
      });

      // Act
      const result = await service.getMatches(testUserId);

      // Assert
      const user = result.data[0];
      expect(user.id).toBe(mockMatchedUserMultipleSports.id);
      expect(user.username).toBe(mockMatchedUserMultipleSports.username);
      expect(user.display_name).toBe(mockMatchedUserMultipleSports.display_name);
      expect(user.distance_km).toBe(mockMatchedUserMultipleSports.distance_km);
      expect(user.sports).toHaveLength(2);
      expect(user.social_links).toBeDefined();
    });

    it("should handle users with minimal data", async () => {
      // Arrange
      const minimalUser = {
        id: "user-minimal",
        username: "minimal",
        display_name: null,
        email: "minimal@test.com",
        social_links: {},
        distance_km: 1.0,
        sports: [],
      };

      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            total_count: 1,
            matched_users: [minimalUser],
          },
        ],
        error: null,
      });

      // Act
      const result = await service.getMatches(testUserId);

      // Assert
      expect(result.data[0]).toEqual(minimalUser);
      expect(result.data[0].display_name).toBeNull();
      expect(result.data[0].sports).toHaveLength(0);
    });
  });

  describe("pagination scenarios", () => {
    it("should fetch first page correctly", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            total_count: 50,
            matched_users: mockMatchedUsers,
          },
        ],
        error: null,
      });

      // Act
      const result = await service.getMatches(testUserId, 20, 0);

      // Assert
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(50);
    });

    it("should fetch second page correctly", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            total_count: 50,
            matched_users: [mockMatchedUserClose],
          },
        ],
        error: null,
      });

      // Act
      const result = await service.getMatches(testUserId, 20, 20);

      // Assert
      expect(result.pagination.offset).toBe(20);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(50);
    });

    it("should fetch last partial page correctly", async () => {
      // Arrange - total 45 users, fetching page 3 (offset 40, limit 20)
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            total_count: 45,
            matched_users: [mockMatchedUserClose, mockMatchedUserMultipleSports], // Only 5 remaining
          },
        ],
        error: null,
      });

      // Act
      const result = await service.getMatches(testUserId, 20, 40);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.pagination.offset).toBe(40);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(45);
    });

    it("should handle custom page sizes", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            total_count: 100,
            matched_users: Array(50).fill(mockMatchedUserClose),
          },
        ],
        error: null,
      });

      // Act
      const result = await service.getMatches(testUserId, 50, 0);

      // Assert
      expect(result.pagination.limit).toBe(50);
      expect(result.data).toHaveLength(50);
    });
  });

  describe("edge cases", () => {
    it("should handle zero results with pagination info", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            total_count: 0,
            matched_users: [],
          },
        ],
        error: null,
      });

      // Act
      const result = await service.getMatches(testUserId, 10, 0);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(0);
    });

    it("should handle RPC function returning malformed data", async () => {
      // Arrange
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [{ invalid: "structure" }],
        error: null,
      });

      // Act & Assert
      await expect(service.getMatches(testUserId)).rejects.toThrow("Invalid response format from matches function");
    });

    it("should handle concurrent requests independently", async () => {
      // Arrange - first request
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            total_count: 10,
            matched_users: [mockMatchedUserClose],
          },
        ],
        error: null,
      });

      // Arrange - second request
      mockSupabase.mocks.rpc.mockResolvedValueOnce({
        data: [
          {
            total_count: 10,
            matched_users: [mockMatchedUserMultipleSports],
          },
        ],
        error: null,
      });

      // Act - concurrent calls
      const [result1, result2] = await Promise.all([
        service.getMatches(testUserId, 1, 0),
        service.getMatches(testUserId, 1, 1),
      ]);

      // Assert
      expect(result1.data[0].id).toBe(mockMatchedUserClose.id);
      expect(result2.data[0].id).toBe(mockMatchedUserMultipleSports.id);
    });
  });
});
