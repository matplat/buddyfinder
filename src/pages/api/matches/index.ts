import type { APIRoute } from "astro";
import { MatchesService } from "@/lib/services/matches.service";
import { validateMatchesQuery } from "@/lib/dto/matches.dto";
import { createErrorResponse, ApiErrorCode } from "@/lib/api/errors";
import { createLogger } from "@/lib/logger";

export const prerender = false;

const logger = createLogger("API:matches");

/**
 * GET /api/matches
 * Returns a list of potential matches for the current user based on location and sports preferences.
 * Supports pagination via limit and offset query parameters.
 */
export const GET: APIRoute = async ({ locals, url, request }) => {
  const { session, supabase } = locals;

  logger.info("GET /api/matches", {
    method: request.method,
    query: Object.fromEntries(url.searchParams),
  });

  // Validate authentication
  if (!session?.user) {
    logger.warn("Unauthorized access attempt");
    return createErrorResponse(ApiErrorCode.UNAUTHORIZED, "Authentication required", "UNAUTHORIZED");
  }

  try {
    // Parse and validate query parameters
    const queryParams = validateMatchesQuery(url.searchParams);

    // Initialize service and get matches
    const matchesService = new MatchesService(supabase);
    const matches = await matchesService.getMatches(session.user.id, queryParams.limit, queryParams.offset);

    logger.info("Successfully fetched matches", {
      userId: session.user.id,
      matchCount: matches.data.length,
      total: matches.pagination.total,
    });

    return new Response(JSON.stringify(matches), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // Handle validation errors
    if (error instanceof Error && error.name === "ZodError") {
      logger.warn("Validation error", { userId: session.user.id, error });
      return createErrorResponse(ApiErrorCode.VALIDATION_ERROR, "Invalid query parameters", error);
    }

    // Handle profile completeness errors
    if (error instanceof Error && error.message.includes("Profile is incomplete")) {
      logger.warn("Profile incomplete", { userId: session.user.id });
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "Your profile must have a location and default range set to find matches",
        "PROFILE_INCOMPLETE"
      );
    }

    // Handle unexpected errors
    logger.error("Error getting matches", { userId: session.user.id, error });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "An unexpected error occurred while finding matches",
      "INTERNAL_SERVER_ERROR"
    );
  }
};
