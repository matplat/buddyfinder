/**
 * Unit tests for useProfileView hook
 *
 * Tests cover:
 * - Sport management (add, update, delete)
 * - Loading states
 * - Error handling
 * - Toast notifications
 * - DTO transformations
 */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockFetch, createMockResponse, createMockErrorResponse } from "@test/unit/mocks/fetch";
import { useProfileView } from "../useProfileView";
import { mockProfile } from "@test/unit/fixtures/profile";
import { mockAllSports, mockSportBieganie } from "@test/unit/fixtures/sports";
import {
  mockUserSports,
  mockUserSportBieganie,
  mockAddUserSportCommand,
  mockUpdateUserSportCommand,
} from "@test/unit/fixtures/user-sports";
import type { UserSportDto } from "@/types";

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

// Mock toast notifications
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import toast to verify calls
import { toast } from "sonner";

describe("useProfileView", () => {
  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    // Reset fetch mock completely to clear resolved values queue
    mockFetch.mockReset();
  });

  describe("initialization", () => {
    it("should fetch profile, sports, and user sports on mount", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockProfile)) // profile
        .mockResolvedValueOnce(createMockResponse(mockAllSports)) // all sports
        .mockResolvedValueOnce(createMockResponse(mockUserSports)); // user sports

      // Act
      const { result } = renderHook(() => useProfileView());

      // Assert - initial loading state
      expect(result.current.loading).toBe(true);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify all endpoints were called
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch).toHaveBeenCalledWith("/api/profiles/me");
      expect(mockFetch).toHaveBeenCalledWith("/api/sports");
      expect(mockFetch).toHaveBeenCalledWith("/api/profiles/me/sports");

      // Verify data is populated
      expect(result.current.profile).toEqual(
        expect.objectContaining({
          id: mockProfile.id,
          username: mockProfile.username,
          display_name: mockProfile.display_name,
        })
      );
      expect(result.current.allSports).toHaveLength(mockAllSports.length);
      expect(result.current.userSports).toHaveLength(mockUserSports.length);
    });

    it("should handle fetch errors gracefully", async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch
        .mockResolvedValueOnce(createMockErrorResponse("Profile not found", 404))
        .mockResolvedValueOnce(createMockResponse(mockAllSports))
        .mockResolvedValueOnce(createMockResponse(mockUserSports));

      // Act
      const { result } = renderHook(() => useProfileView());

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("addSport", () => {
    it("should add user sport successfully", async () => {
      // Arrange - setup initial data
      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockProfile))
        .mockResolvedValueOnce(createMockResponse(mockAllSports))
        .mockResolvedValueOnce(createMockResponse([])); // empty user sports initially

      const { result } = renderHook(() => useProfileView());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.userSports).toHaveLength(0);
      });

      // Setup mock for add sport
      const newUserSport: UserSportDto = { ...mockUserSportBieganie };
      mockFetch.mockResolvedValueOnce(createMockResponse(newUserSport));

      // Act
      await result.current.addSport(mockAddUserSportCommand);

      // Assert
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Sport został dodany do Twojego profilu");
        expect(result.current.userSports).toHaveLength(1);
      });

      // Check last call to fetch (the POST request)
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(lastCall[0]).toBe("/api/profiles/me/sports");
      expect(lastCall[1]).toMatchObject({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockAddUserSportCommand),
      });

      expect(result.current.userSports[0].sport_id).toBe(mockSportBieganie.id);
    });

    it("should handle duplicate sport error (409)", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockProfile))
        .mockResolvedValueOnce(createMockResponse(mockAllSports))
        .mockResolvedValueOnce(createMockResponse([mockUserSportBieganie]));

      const { result } = renderHook(() => useProfileView());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock duplicate error
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockResolvedValueOnce(createMockErrorResponse("Sport already exists", 409));

      // Act
      await result.current.addSport(mockAddUserSportCommand);

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Nie udało się dodać sportu");
      });

      consoleErrorSpy.mockRestore();
    });

    it("should handle network error when adding sport", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockProfile))
        .mockResolvedValueOnce(createMockResponse(mockAllSports))
        .mockResolvedValueOnce(createMockResponse([]));

      const { result } = renderHook(() => useProfileView());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock network error
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Act
      await result.current.addSport(mockAddUserSportCommand);

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Nie udało się dodać sportu");
      });

      consoleErrorSpy.mockRestore();
    });

    it("should call onDataChange callback after adding sport", async () => {
      // Arrange
      const onDataChange = vi.fn();

      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockProfile))
        .mockResolvedValueOnce(createMockResponse(mockAllSports))
        .mockResolvedValueOnce(createMockResponse([]));

      const { result } = renderHook(() => useProfileView({ onDataChange }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce(createMockResponse(mockUserSportBieganie));

      // Act
      await result.current.addSport(mockAddUserSportCommand);

      // Assert
      await waitFor(() => {
        expect(onDataChange).toHaveBeenCalledWith({ sportsChanged: true });
      });
    });
  });

  describe("editSport", () => {
    it("should update user sport successfully", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockProfile))
        .mockResolvedValueOnce(createMockResponse(mockAllSports))
        .mockResolvedValueOnce(createMockResponse([mockUserSportBieganie]));

      const { result } = renderHook(() => useProfileView());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.userSports).toHaveLength(1);
      });

      // Updated sport data
      const updatedSport: UserSportDto = {
        ...mockUserSportBieganie,
        parameters: {
          dystans: 15,
          tempo: 300,
        },
      };
      mockFetch.mockResolvedValueOnce(createMockResponse(updatedSport));

      // Act
      await result.current.editSport(mockSportBieganie.id, mockUpdateUserSportCommand);

      // Assert
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Sport został zaktualizowany");
        expect(result.current.userSports[0].params).toEqual(updatedSport.parameters);
      });

      // Check last call to fetch (the PATCH request)
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(lastCall[0]).toBe(`/api/profiles/me/sports/${mockSportBieganie.id}`);
      expect(lastCall[1]).toMatchObject({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockUpdateUserSportCommand),
      });
    });

    it("should handle sport not found error (404)", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockProfile))
        .mockResolvedValueOnce(createMockResponse(mockAllSports))
        .mockResolvedValueOnce(createMockResponse([mockUserSportBieganie]));

      const { result } = renderHook(() => useProfileView());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockResolvedValueOnce(createMockErrorResponse("Sport not found", 404));

      // Act
      await result.current.editSport(999, mockUpdateUserSportCommand);

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Nie udało się zaktualizować sportu");
      });

      consoleErrorSpy.mockRestore();
    });

    it("should call onDataChange callback after editing sport", async () => {
      // Arrange
      const onDataChange = vi.fn();

      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockProfile))
        .mockResolvedValueOnce(createMockResponse(mockAllSports))
        .mockResolvedValueOnce(createMockResponse([mockUserSportBieganie]));

      const { result } = renderHook(() => useProfileView({ onDataChange }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedSport: UserSportDto = {
        ...mockUserSportBieganie,
        parameters: mockUpdateUserSportCommand.parameters!,
      };
      mockFetch.mockResolvedValueOnce(createMockResponse(updatedSport));

      // Act
      await result.current.editSport(mockSportBieganie.id, mockUpdateUserSportCommand);

      // Assert
      await waitFor(() => {
        expect(onDataChange).toHaveBeenCalledWith({ sportsChanged: true });
      });
    });
  });

  describe("deleteSport", () => {
    it("should delete user sport successfully", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockProfile))
        .mockResolvedValueOnce(createMockResponse(mockAllSports))
        .mockResolvedValueOnce(createMockResponse(mockUserSports));

      const { result } = renderHook(() => useProfileView());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.userSports.length).toBeGreaterThan(0);
      });

      const initialCount = result.current.userSports.length;

      // Mock successful delete
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }));

      // Act
      await result.current.deleteSport(mockSportBieganie.id);

      // Assert
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Sport został usunięty z Twojego profilu");
        expect(result.current.userSports.length).toBe(initialCount - 1);
      });

      // Check last call to fetch (the DELETE request)
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(lastCall[0]).toBe(`/api/profiles/me/sports/${mockSportBieganie.id}`);
      expect(lastCall[1]).toMatchObject({
        method: "DELETE",
      });

      expect(result.current.userSports.find((s) => s.sport_id === mockSportBieganie.id)).toBeUndefined();
    });

    it("should handle delete error gracefully", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockProfile))
        .mockResolvedValueOnce(createMockResponse(mockAllSports))
        .mockResolvedValueOnce(createMockResponse([mockUserSportBieganie]));

      const { result } = renderHook(() => useProfileView());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockResolvedValueOnce(createMockErrorResponse("Failed to delete", 500));

      // Act
      await result.current.deleteSport(mockSportBieganie.id);

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Nie udało się usunąć sportu");
      });

      // Sport should still be in the list
      expect(result.current.userSports.length).toBe(1);

      consoleErrorSpy.mockRestore();
    });

    it("should call onDataChange callback after deleting sport", async () => {
      // Arrange
      const onDataChange = vi.fn();

      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockProfile))
        .mockResolvedValueOnce(createMockResponse(mockAllSports))
        .mockResolvedValueOnce(createMockResponse([mockUserSportBieganie]));

      const { result } = renderHook(() => useProfileView({ onDataChange }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }));

      // Act
      await result.current.deleteSport(mockSportBieganie.id);

      // Assert
      await waitFor(() => {
        expect(onDataChange).toHaveBeenCalledWith({ sportsChanged: true });
      });
    });
  });

  describe("DTO transformations", () => {
    it("should correctly map UserSportDto to UserSportViewModel", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockProfile))
        .mockResolvedValueOnce(createMockResponse(mockAllSports))
        .mockResolvedValueOnce(createMockResponse([mockUserSportBieganie]));

      // Act
      const { result } = renderHook(() => useProfileView());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Wait for user sports to be populated
      await waitFor(
        () => {
          expect(result.current.userSports.length).toBe(1);
        },
        { timeout: 3000 }
      );

      // Assert
      const userSport = result.current.userSports[0];
      expect(userSport).toEqual({
        sport_id: mockUserSportBieganie.sport_id,
        sport_name: mockUserSportBieganie.name,
        custom_range_km: mockUserSportBieganie.custom_range_km,
        params: mockUserSportBieganie.parameters,
      });
    });

    it("should correctly map ProfileDto to ProfileViewModel", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockProfile))
        .mockResolvedValueOnce(createMockResponse(mockAllSports))
        .mockResolvedValueOnce(createMockResponse([]));

      // Act
      const { result } = renderHook(() => useProfileView());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert
      expect(result.current.profile).toEqual(
        expect.objectContaining({
          id: mockProfile.id,
          username: mockProfile.username,
          display_name: mockProfile.display_name,
          social_links: mockProfile.social_links,
        })
      );
    });
  });
});
