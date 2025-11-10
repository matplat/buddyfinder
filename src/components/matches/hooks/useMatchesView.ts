/**
 * Custom hook for managing matches data, pagination, and loading states
 */

import { useState, useEffect, useCallback } from "react";
import type { UserMatchViewModel, Pagination } from "../types";
import type { GetMatchesResponseDto } from "@/types";

/**
 * Error types that can occur when fetching matches
 */
export type MatchesError = "no_location" | "generic" | null;

interface UseMatchesViewReturn {
  matches: UserMatchViewModel[];
  isLoading: boolean;
  error: MatchesError;
  pagination: Pagination | null;
  hasNextPage: boolean;
  loadMore: () => Promise<void>;
}

export interface UseMatchesViewProps {
  /** Trigger counter for forcing refresh of matches */
  refreshTrigger?: number;
}

/**
 * Hook for managing matches view state and data fetching
 */
export function useMatchesView(props?: UseMatchesViewProps): UseMatchesViewReturn {
  const { refreshTrigger } = props || {};
  const [matches, setMatches] = useState<UserMatchViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<MatchesError>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  /**
   * Fetch matches from the API
   */
  const fetchMatches = useCallback(async (offset = 0, append = false) => {
    try {
      if (!append) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const url = `/api/matches?limit=20&offset=${offset}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 400) {
          // User doesn't have location set
          setError("no_location");
          setMatches([]);
          setPagination(null);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetMatchesResponseDto = await response.json();

      // Transform DTO to ViewModel
      const viewModels: UserMatchViewModel[] = data.data.map((match) => ({
        user_id: match.id,
        username: match.username || "",
        display_name: match.display_name || match.username || "Unnamed User",
        email: match.email,
        distance_km: match.distance_km,
        social_links: (match.social_links && typeof match.social_links === 'object' && !Array.isArray(match.social_links)) 
          ? match.social_links as Record<string, string>
          : {},
        sports: match.sports.map((sport) => ({
          sport_id: sport.sport_id,
          name: sport.name,
          parameters: (sport.parameters && typeof sport.parameters === 'object' && !Array.isArray(sport.parameters))
            ? sport.parameters as Record<string, any>
            : {},
        })),
      }));

      if (append) {
        setMatches((prev) => [...prev, ...viewModels]);
      } else {
        setMatches(viewModels);
      }

      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError("generic");
      if (!append) {
        setMatches([]);
        setPagination(null);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  /**
   * Load initial matches on mount and when refreshTrigger changes
   */
  useEffect(() => {
    fetchMatches(0, false);
  }, [fetchMatches, refreshTrigger]);

  /**
   * Load more matches (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!pagination || isLoadingMore) return;

    const nextOffset = pagination.offset + pagination.limit;
    if (nextOffset >= pagination.total) return;

    await fetchMatches(nextOffset, true);
  }, [pagination, isLoadingMore, fetchMatches]);

  /**
   * Check if there are more pages to load
   */
  const hasNextPage = pagination
    ? pagination.offset + pagination.limit < pagination.total
    : false;

  return {
    matches,
    isLoading,
    error,
    pagination,
    hasNextPage,
    loadMore,
  };
}
