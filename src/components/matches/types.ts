/**
 * View model types for the MatchesView component
 */

/**
 * Represents a sport that a matched user practices
 */
export interface UserSportViewModel {
  sport_id: number;
  name: string;
  parameters: Record<string, any>;
}

/**
 * Represents a matched user with all relevant information
 */
export interface UserMatchViewModel {
  user_id: string;
  username: string;
  display_name: string;
  email: string;
  distance_km: number;
  social_links: Record<string, string>;
  sports: UserSportViewModel[];
}

/**
 * Pagination information from API response
 */
export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}
