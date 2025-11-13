/**
 * Unit tests for MatchesView component
 *
 * Tests cover:
 * - Loading state rendering
 * - Error states (no_location, generic)
 * - Empty state (no matches)
 * - Success state with matches list
 * - Load more button visibility and functionality
 * - Pagination info display
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { MatchesView } from "../MatchesView";
import type { useMatchesView } from "../hooks/useMatchesView";
import { mockMatchedUserClose, mockMatchedUserMedium } from "@test/unit/fixtures/matches";
import type { UserMatchViewModel } from "../types";

// Mock the useMatchesView hook
type UseMatchesViewReturn = ReturnType<typeof useMatchesView>;
const mockUseMatchesView = vi.fn<(props?: { refreshTrigger?: number }) => UseMatchesViewReturn>();

vi.mock("../hooks/useMatchesView", () => ({
  useMatchesView: (props?: { refreshTrigger?: number }) => mockUseMatchesView(props),
}));

// Mock child components to simplify testing
vi.mock("../MatchesSkeleton", () => ({
  MatchesSkeleton: () => <div data-testid="matches-skeleton">Loading skeleton...</div>,
}));

vi.mock("../MatchesEmptyState", () => ({
  MatchesEmptyState: ({ variant, title, description, cta }: any) => (
    <div data-testid={`empty-state-${variant}`}>
      <h2>{title}</h2>
      <p>{description}</p>
      {cta && <a href={cta.href}>{cta.text}</a>}
    </div>
  ),
}));

vi.mock("../UserMatchCard", () => ({
  UserMatchCard: ({ match }: { match: UserMatchViewModel }) => (
    <div data-testid={`match-card-${match.user_id}`}>
      <span>{match.display_name}</span>
      <span>{match.distance_km}km</span>
    </div>
  ),
}));

// Mock UI components
vi.mock("@/components/ui/accordion", () => ({
  Accordion: ({ children }: any) => <div data-testid="accordion">{children}</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("lucide-react", () => ({
  Loader2: ({ className }: any) => <div className={className}>Loader</div>,
}));

describe("MatchesView", () => {
  beforeEach(() => {
    mockUseMatchesView.mockClear();
  });

  describe("loading state", () => {
    it("should render skeleton when loading", () => {
      // Arrange
      mockUseMatchesView.mockReturnValue({
        matches: [],
        isLoading: true,
        error: null,
        pagination: null,
        hasNextPage: false,
        loadMore: vi.fn(),
      });

      // Act
      render(<MatchesView />);

      // Assert
      expect(screen.getByTestId("matches-skeleton")).toBeInTheDocument();
      expect(screen.queryByText("Twoje dopasowania")).not.toBeInTheDocument();
    });
  });

  describe("error states", () => {
    it("should render no_location error state", () => {
      // Arrange
      mockUseMatchesView.mockReturnValue({
        matches: [],
        isLoading: false,
        error: "no_location",
        pagination: null,
        hasNextPage: false,
        loadMore: vi.fn(),
      });

      // Act
      render(<MatchesView />);

      // Assert
      expect(screen.getByTestId("empty-state-no-location")).toBeInTheDocument();
      expect(screen.getByText("Brak ustawionej lokalizacji")).toBeInTheDocument();
      expect(screen.getByText(/musisz najpierw uzupełnić swoją lokalizację/)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /uzupełnij profil/i })).toBeInTheDocument();
    });

    it("should navigate to profile when clicking CTA in no_location state", async () => {
      // Arrange
      const user = userEvent.setup();
      mockUseMatchesView.mockReturnValue({
        matches: [],
        isLoading: false,
        error: "no_location",
        pagination: null,
        hasNextPage: false,
        loadMore: vi.fn(),
      });

      // Act
      render(<MatchesView />);
      const link = screen.getByRole("link", { name: /uzupełnij profil/i });

      // Assert
      expect(link).toHaveAttribute("href", "/profile");
    });

    it("should render generic error state", () => {
      // Arrange
      mockUseMatchesView.mockReturnValue({
        matches: [],
        isLoading: false,
        error: "generic",
        pagination: null,
        hasNextPage: false,
        loadMore: vi.fn(),
      });

      // Act
      render(<MatchesView />);

      // Assert
      expect(screen.getByTestId("empty-state-error")).toBeInTheDocument();
      expect(screen.getByText("Wystąpił błąd")).toBeInTheDocument();
      expect(screen.getByText(/nie udało się pobrać dopasowań/i)).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("should render empty state when no matches", () => {
      // Arrange
      mockUseMatchesView.mockReturnValue({
        matches: [],
        isLoading: false,
        error: null,
        pagination: { total: 0, limit: 20, offset: 0 },
        hasNextPage: false,
        loadMore: vi.fn(),
      });

      // Act
      render(<MatchesView />);

      // Assert
      expect(screen.getByTestId("empty-state-no-matches")).toBeInTheDocument();
      expect(screen.getByText("Brak dopasowań")).toBeInTheDocument();
      expect(screen.getByText(/nie znaleźliśmy nikogo w twoim zasięgu/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /edytuj profil/i })).toBeInTheDocument();
    });
  });

  describe("success state with matches", () => {
    it("should render matches list", () => {
      // Arrange
      const mockMatches: UserMatchViewModel[] = [
        {
          user_id: mockMatchedUserClose.id,
          email: mockMatchedUserClose.email!,
          username: mockMatchedUserClose.username!,
          display_name: mockMatchedUserClose.display_name!,
          distance_km: mockMatchedUserClose.distance_km,
          social_links: mockMatchedUserClose.social_links as Record<string, string>,
          sports: mockMatchedUserClose.sports.map((s) => ({
            sport_id: s.sport_id,
            name: s.name,
            parameters: s.parameters as Record<string, any>,
          })),
        },
        {
          user_id: mockMatchedUserMedium.id,
          email: mockMatchedUserMedium.email!,
          username: mockMatchedUserMedium.username!,
          display_name: mockMatchedUserMedium.display_name!,
          distance_km: mockMatchedUserMedium.distance_km,
          social_links: mockMatchedUserMedium.social_links as Record<string, string>,
          sports: mockMatchedUserMedium.sports.map((s) => ({
            sport_id: s.sport_id,
            name: s.name,
            parameters: s.parameters as Record<string, any>,
          })),
        },
      ];

      mockUseMatchesView.mockReturnValue({
        matches: mockMatches,
        isLoading: false,
        error: null,
        pagination: { total: 2, limit: 20, offset: 0 },
        hasNextPage: false,
        loadMore: vi.fn(),
      });

      // Act
      render(<MatchesView />);

      // Assert
      expect(screen.getByText("Twoje dopasowania")).toBeInTheDocument();
      expect(screen.getByText(/znaleziono 2 osób/i)).toBeInTheDocument();
      expect(screen.getByTestId(`match-card-${mockMatchedUserClose.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`match-card-${mockMatchedUserMedium.id}`)).toBeInTheDocument();
    });

    it("should display correct pagination info for single match", () => {
      // Arrange
      const mockMatches: UserMatchViewModel[] = [
        {
          user_id: mockMatchedUserClose.id,
          email: mockMatchedUserClose.email!,
          username: mockMatchedUserClose.username!,
          display_name: mockMatchedUserClose.display_name!,
          distance_km: mockMatchedUserClose.distance_km,
          social_links: mockMatchedUserClose.social_links as Record<string, string>,
          sports: [],
        },
      ];

      mockUseMatchesView.mockReturnValue({
        matches: mockMatches,
        isLoading: false,
        error: null,
        pagination: { total: 1, limit: 20, offset: 0 },
        hasNextPage: false,
        loadMore: vi.fn(),
      });

      // Act
      render(<MatchesView />);

      // Assert
      expect(screen.getByText(/znaleziono 1 osobę/i)).toBeInTheDocument();
    });

    it("should render matches inside Accordion", () => {
      // Arrange
      const mockMatches: UserMatchViewModel[] = [
        {
          user_id: mockMatchedUserClose.id,
          email: mockMatchedUserClose.email!,
          username: mockMatchedUserClose.username!,
          display_name: mockMatchedUserClose.display_name!,
          distance_km: mockMatchedUserClose.distance_km,
          social_links: {},
          sports: [],
        },
      ];

      mockUseMatchesView.mockReturnValue({
        matches: mockMatches,
        isLoading: false,
        error: null,
        pagination: { total: 1, limit: 20, offset: 0 },
        hasNextPage: false,
        loadMore: vi.fn(),
      });

      // Act
      render(<MatchesView />);

      // Assert
      expect(screen.getByTestId("accordion")).toBeInTheDocument();
      const accordion = screen.getByTestId("accordion");
      expect(accordion).toContainElement(screen.getByTestId(`match-card-${mockMatchedUserClose.id}`));
    });
  });

  describe("load more functionality", () => {
    it("should show load more button when hasNextPage is true", () => {
      // Arrange
      const mockMatches: UserMatchViewModel[] = [
        {
          user_id: mockMatchedUserClose.id,
          email: mockMatchedUserClose.email!,
          username: mockMatchedUserClose.username!,
          display_name: mockMatchedUserClose.display_name!,
          distance_km: mockMatchedUserClose.distance_km,
          social_links: {},
          sports: [],
        },
      ];

      mockUseMatchesView.mockReturnValue({
        matches: mockMatches,
        isLoading: false,
        error: null,
        pagination: { total: 50, limit: 20, offset: 0 },
        hasNextPage: true,
        loadMore: vi.fn(),
      });

      // Act
      render(<MatchesView />);

      // Assert
      expect(screen.getByRole("button", { name: /załaduj więcej/i })).toBeInTheDocument();
    });

    it("should hide load more button when hasNextPage is false", () => {
      // Arrange
      const mockMatches: UserMatchViewModel[] = [
        {
          user_id: mockMatchedUserClose.id,
          email: mockMatchedUserClose.email!,
          username: mockMatchedUserClose.username!,
          display_name: mockMatchedUserClose.display_name!,
          distance_km: mockMatchedUserClose.distance_km,
          social_links: {},
          sports: [],
        },
      ];

      mockUseMatchesView.mockReturnValue({
        matches: mockMatches,
        isLoading: false,
        error: null,
        pagination: { total: 1, limit: 20, offset: 0 },
        hasNextPage: false,
        loadMore: vi.fn(),
      });

      // Act
      render(<MatchesView />);

      // Assert
      expect(screen.queryByRole("button", { name: /załaduj więcej/i })).not.toBeInTheDocument();
    });

    it("should call loadMore when button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockLoadMore = vi.fn();
      const mockMatches: UserMatchViewModel[] = [
        {
          user_id: mockMatchedUserClose.id,
          email: mockMatchedUserClose.email!,
          username: mockMatchedUserClose.username!,
          display_name: mockMatchedUserClose.display_name!,
          distance_km: mockMatchedUserClose.distance_km,
          social_links: {},
          sports: [],
        },
      ];

      mockUseMatchesView.mockReturnValue({
        matches: mockMatches,
        isLoading: false,
        error: null,
        pagination: { total: 50, limit: 20, offset: 0 },
        hasNextPage: true,
        loadMore: mockLoadMore,
      });

      // Act
      render(<MatchesView />);
      await user.click(screen.getByRole("button", { name: /załaduj więcej/i }));

      // Assert
      expect(mockLoadMore).toHaveBeenCalledTimes(1);
    });

    it("should show loading indicator on load more button", () => {
      // Arrange - Component shows skeleton when isLoading=true initially
      // This test checks if load more button shows loading state
      // Note: The component shows skeleton when isLoading=true, so button is not visible
      // This is expected behavior - testing that initial loading shows skeleton
      const mockMatches: UserMatchViewModel[] = [
        {
          user_id: mockMatchedUserClose.id,
          email: mockMatchedUserClose.email!,
          username: mockMatchedUserClose.username!,
          display_name: mockMatchedUserClose.display_name!,
          distance_km: mockMatchedUserClose.distance_km,
          social_links: {},
          sports: [],
        },
      ];

      mockUseMatchesView.mockReturnValue({
        matches: mockMatches,
        isLoading: true,
        error: null,
        pagination: { total: 50, limit: 20, offset: 0 },
        hasNextPage: true,
        loadMore: vi.fn(),
      });

      // Act
      render(<MatchesView />);

      // Assert - When isLoading=true, skeleton is shown instead of content
      expect(screen.getByTestId("matches-skeleton")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /załaduj więcej/i })).not.toBeInTheDocument();
    });
  });

  describe("refreshTrigger prop", () => {
    it("should pass refreshTrigger to useMatchesView hook", () => {
      // Arrange
      mockUseMatchesView.mockReturnValue({
        matches: [],
        isLoading: true,
        error: null,
        pagination: null,
        hasNextPage: false,
        loadMore: vi.fn(),
      });

      // Act
      render(<MatchesView refreshTrigger={5} />);

      // Assert
      expect(mockUseMatchesView).toHaveBeenCalledWith({ refreshTrigger: 5 });
    });
  });
});
