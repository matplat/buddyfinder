/**
 * Unit tests for useMatchesView hook
 *
 * Tests cover:
 * - Initial data fetching with pagination
 * - Load more functionality (pagination)
 * - Error handling (no_location, generic errors)
 * - Loading states
 * - DTO transformations
 * - RefreshTrigger dependency
 */

/* eslint-disable @typescript-eslint/no-empty-function */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockFetch, createMockResponse, createMockErrorResponse } from "@test/unit/mocks/fetch";
import { useMatchesView } from "../useMatchesView";
import {
  mockGetMatchesResponse,
  mockMatchedUsers,
  mockMatchedUserClose,
  mockMatchedUserMedium,
  mockMatchedUserFar,
} from "@test/unit/fixtures/matches";
import type { GetMatchesResponseDto } from "@/types";

describe("useMatchesView", () => {
  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  describe("initialization", () => {
    it("should fetch matches on mount", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce(createMockResponse(mockGetMatchesResponse));

      // Act
      const { result } = renderHook(() => useMatchesView());

      // Assert - initial loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.matches).toEqual([]);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify fetch was called with correct params
      expect(mockFetch).toHaveBeenCalledWith("/api/matches?limit=20&offset=0");

      // Verify data is populated (mockGetMatchesResponse has 2 users)
      expect(result.current.matches).toHaveLength(2);
      expect(result.current.error).toBeNull();
      expect(result.current.pagination).toEqual(mockGetMatchesResponse.pagination);
    });

    it("should set hasNextPage correctly when more results exist", async () => {
      // Arrange - response with more pages available
      const responseWithMorePages: GetMatchesResponseDto = {
        data: [mockMatchedUserClose],
        pagination: {
          total: 50,
          limit: 20,
          offset: 0,
        },
      };
      mockFetch.mockResolvedValueOnce(createMockResponse(responseWithMorePages));

      // Act
      const { result } = renderHook(() => useMatchesView());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert
      expect(result.current.hasNextPage).toBe(true);
    });

    it("should set hasNextPage to false when no more results", async () => {
      // Arrange - response with all results on first page
      const responseNoMorePages: GetMatchesResponseDto = {
        data: mockMatchedUsers,
        pagination: {
          total: 3,
          limit: 20,
          offset: 0,
        },
      };
      mockFetch.mockResolvedValueOnce(createMockResponse(responseNoMorePages));

      // Act
      const { result } = renderHook(() => useMatchesView());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should handle no_location error (400)", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce(createMockErrorResponse("User location not set", 400));

      // Act
      const { result } = renderHook(() => useMatchesView());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert
      expect(result.current.error).toBe("no_location");
      expect(result.current.matches).toEqual([]);
      expect(result.current.pagination).toBeNull();
    });

    it("should handle generic errors", async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockResolvedValueOnce(createMockErrorResponse("Internal server error", 500));

      // Act
      const { result } = renderHook(() => useMatchesView());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert
      expect(result.current.error).toBe("generic");
      expect(result.current.matches).toEqual([]);
      expect(result.current.pagination).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should handle network errors", async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Act
      const { result } = renderHook(() => useMatchesView());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert
      expect(result.current.error).toBe("generic");
      expect(result.current.matches).toEqual([]);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("loadMore pagination", () => {
    it("should load more matches and append to existing list", async () => {
      // Arrange - First page
      const firstPageResponse: GetMatchesResponseDto = {
        data: [mockMatchedUserClose],
        pagination: {
          total: 10,
          limit: 1,
          offset: 0,
        },
      };
      mockFetch.mockResolvedValueOnce(createMockResponse(firstPageResponse));

      const { result } = renderHook(() => useMatchesView());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.matches).toHaveLength(1);
      expect(result.current.hasNextPage).toBe(true);

      // Setup second page
      const secondPageResponse: GetMatchesResponseDto = {
        data: [mockMatchedUserMedium],
        pagination: {
          total: 10,
          limit: 1,
          offset: 1,
        },
      };
      mockFetch.mockResolvedValueOnce(createMockResponse(secondPageResponse));

      // Act
      await result.current.loadMore();

      // Assert
      await waitFor(() => {
        expect(result.current.matches).toHaveLength(2);
      });

      // Verify fetch was called with next offset
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(lastCall[0]).toBe("/api/matches?limit=20&offset=1");

      // Verify both matches are in the list (appended, not replaced)
      expect(result.current.matches[0].user_id).toBe(mockMatchedUserClose.id);
      expect(result.current.matches[1].user_id).toBe(mockMatchedUserMedium.id);
    });

    it("should update hasNextPage after loading more", async () => {
      // Arrange - First page (uses limit=20 by default)
      const firstPageResponse: GetMatchesResponseDto = {
        data: [mockMatchedUserClose, mockMatchedUserMedium],
        pagination: {
          total: 22, // More than first page
          limit: 20,
          offset: 0,
        },
      };
      mockFetch.mockResolvedValueOnce(createMockResponse(firstPageResponse));

      const { result } = renderHook(() => useMatchesView());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.hasNextPage).toBe(true);
      });

      // Setup last page
      const lastPageResponse: GetMatchesResponseDto = {
        data: [mockMatchedUserFar],
        pagination: {
          total: 22,
          limit: 20,
          offset: 20,
        },
      };
      mockFetch.mockResolvedValueOnce(createMockResponse(lastPageResponse));

      // Act
      await result.current.loadMore();

      // Assert
      await waitFor(() => {
        expect(result.current.matches).toHaveLength(3);
        expect(result.current.hasNextPage).toBe(false);
      });
    });

    it("should handle concurrent loadMore calls", async () => {
      // Arrange - First page with hasNextPage = true
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          data: [mockMatchedUserClose],
          pagination: { total: 50, limit: 20, offset: 0 }, // 50 total ensures hasNextPage
        })
      );

      const { result } = renderHook(() => useMatchesView());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.hasNextPage).toBe(true);
      });

      // Setup responses for subsequent calls
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          data: [mockMatchedUserMedium],
          pagination: { total: 50, limit: 20, offset: 20 },
        })
      );

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          data: [mockMatchedUserFar],
          pagination: { total: 50, limit: 20, offset: 40 },
        })
      );

      // Act - call loadMore twice (hook doesn't prevent this, both will execute)
      await result.current.loadMore();
      await result.current.loadMore();

      // Assert - both calls completed
      expect(mockFetch).toHaveBeenCalledTimes(3); // initial + 2 loadMore calls
    });

    it("should not load more when no pagination data", async () => {
      // Arrange - empty results
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          data: [],
          pagination: {
            total: 0,
            limit: 20,
            offset: 0,
          },
        })
      );

      const { result } = renderHook(() => useMatchesView());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = mockFetch.mock.calls.length;

      // Act
      await result.current.loadMore();

      // Assert - should not have made another call
      expect(mockFetch).toHaveBeenCalledTimes(initialCallCount);
    });

    it("should handle errors during loadMore without losing existing data", async () => {
      // Arrange - First page successful
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          data: [mockMatchedUserClose],
          pagination: { total: 10, limit: 1, offset: 0 },
        })
      );

      const { result } = renderHook(() => useMatchesView());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialMatches = result.current.matches.length;

      // Setup error for loadMore
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Act
      await result.current.loadMore();

      // Assert - existing matches should remain
      await waitFor(() => {
        expect(result.current.matches).toHaveLength(initialMatches);
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("refreshTrigger dependency", () => {
    it("should refetch matches when refreshTrigger changes", async () => {
      // Arrange - Initial fetch
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          data: [mockMatchedUserClose],
          pagination: { total: 1, limit: 20, offset: 0 },
        })
      );

      const { result, rerender } = renderHook(({ refreshTrigger }) => useMatchesView({ refreshTrigger }), {
        initialProps: { refreshTrigger: 0 },
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Setup new fetch for refreshed data
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          data: [mockMatchedUserClose, mockMatchedUserMedium],
          pagination: { total: 2, limit: 20, offset: 0 },
        })
      );

      // Act - change refreshTrigger
      rerender({ refreshTrigger: 1 });

      // Assert - should trigger new fetch
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(result.current.matches).toHaveLength(2);
      });
    });
  });

  describe("DTO transformations", () => {
    it("should correctly transform MatchedUserDto to UserMatchViewModel", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce(createMockResponse(mockGetMatchesResponse));

      // Act
      const { result } = renderHook(() => useMatchesView());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert
      const match = result.current.matches[0];
      expect(match).toEqual(
        expect.objectContaining({
          user_id: mockMatchedUserClose.id,
          username: mockMatchedUserClose.username,
          display_name: mockMatchedUserClose.display_name,
          distance_km: mockMatchedUserClose.distance_km,
          social_links: mockMatchedUserClose.social_links,
          sports: expect.arrayContaining([
            expect.objectContaining({
              sport_id: expect.any(Number),
              name: expect.any(String),
              parameters: expect.any(Object),
            }),
          ]),
        })
      );
      // Note: email is NOT included in UserMatchViewModel - it's in DTO but not mapped to view model
    });

    it("should handle missing or invalid social_links", async () => {
      // Arrange - matched user with null social_links
      const matchedUserNoLinks = {
        ...mockMatchedUserClose,
        social_links: null,
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          data: [matchedUserNoLinks],
          pagination: { total: 1, limit: 20, offset: 0 },
        })
      );

      // Act
      const { result } = renderHook(() => useMatchesView());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert - should default to empty object
      expect(result.current.matches[0].social_links).toEqual({});
    });

    it("should handle missing or invalid sport parameters", async () => {
      // Arrange - sport with null parameters
      const matchedUserInvalidParams = {
        ...mockMatchedUserClose,
        sports: [
          {
            sport_id: 1,
            name: "test",
            parameters: null,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          data: [matchedUserInvalidParams],
          pagination: { total: 1, limit: 20, offset: 0 },
        })
      );

      // Act
      const { result } = renderHook(() => useMatchesView());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert - should default to empty object
      expect(result.current.matches[0].sports[0].parameters).toEqual({});
    });
  });
});
