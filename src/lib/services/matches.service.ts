import type { GetMatchesResponseDto, MatchedUserDto } from "@/types";
import type { supabaseClient } from "@/db/supabase.client";

interface GetMatchesResult {
  total_count: number;
  matched_users: MatchedUserDto[];
}

export class MatchesService {
  constructor(private readonly supabase: typeof supabaseClient) {}

  /**
   * Retrieves potential matches for the current user based on location and sports preferences
   * @param userId The ID of the user to find matches for
   * @param limit Maximum number of results to return
   * @param offset Number of results to skip for pagination
   * @throws {Error} If the user's profile is incomplete (missing location or default_range_km)
   */
  async getMatches(userId: string, limit = 20, offset = 0): Promise<GetMatchesResponseDto> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Call the RPC function to get matches
    const { data, error } = await this.supabase.rpc("get_matches_for_user", {
      current_user_id: userId,
      page_limit: limit,
      page_offset: offset,
    });

    if (error) {
      // Special handling for known error cases
      if (error.code === "PGRST400") {
        throw new Error("Profile is incomplete: location and default_range_km are required");
      }
      throw error;
    }

    // Type assertion and validation
    const result = data as GetMatchesResult;
    if (!result || !Array.isArray(result.matched_users)) {
      throw new Error("Invalid response format from matches function");
    }

    // Return formatted response
    return {
      data: result.matched_users,
      pagination: {
        total: result.total_count,
        limit,
        offset,
      },
    };
  }
}
