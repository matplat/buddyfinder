import type { APIRoute } from "astro";
import { MatchesService } from "@/lib/services/matches.service";
import { validateMatchesQuery } from "@/lib/dto/matches.dto";
import { createErrorResponse, ApiErrorCode } from "@/lib/api/errors";

export const prerender = false;

/**
 * GET /api/matches
 * Returns a list of potential matches for the current user based on location and sports preferences.
 * Supports pagination via limit and offset query parameters.
 */
export const GET: APIRoute = async ({ locals, url }) => {
  const { session, supabase } = locals;

  // Validate authentication
  if (!session?.user) {
    return createErrorResponse(ApiErrorCode.UNAUTHORIZED, "Authentication required", "UNAUTHORIZED");
  }

  try {
    // Parse and validate query parameters
    const queryParams = validateMatchesQuery(url.searchParams);

    // Initialize service and get matches
    const matchesService = new MatchesService(supabase);
    const matches = await matchesService.getMatches(session.user.id, queryParams.limit, queryParams.offset);

    return new Response(JSON.stringify(matches), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // Handle validation errors
    if (error instanceof Error && error.name === "ZodError") {
      return createErrorResponse(ApiErrorCode.VALIDATION_ERROR, "Invalid query parameters", error);
    }

    // Handle profile completeness errors
    if (error instanceof Error && error.message.includes("Profile is incomplete")) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "Your profile must have a location and default range set to find matches",
        "PROFILE_INCOMPLETE"
      );
    }

    // Handle unexpected errors
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Error getting matches:", error);
    }

    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "An unexpected error occurred while finding matches",
      "INTERNAL_SERVER_ERROR"
    );
  }
};
