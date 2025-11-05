import type { APIRoute } from "astro";
import { SportService } from "@/lib/services/sport.service";
import { createErrorResponse } from "@/lib/api/errors";
import { createLogger } from "@/lib/logger";

export const prerender = false;

const logger = createLogger("API:sports");

/**
 * GET /api/sports - Retrieves a list of all available sports
 * @returns A list of sports with their IDs and names
 * @throws 401 if user is not authenticated
 * @throws 500 if there's an internal server error
 */
export const GET: APIRoute = async ({ locals, request }) => {
  logger.info("GET /api/sports", { method: request.method });

  // Ensure user is authenticated (middleware handles this, but we double-check)
  if (!locals.session) {
    logger.warn("Unauthorized access attempt");
    return createErrorResponse("UNAUTHORIZED", "Authentication required");
  }

  try {
    const sportService = new SportService(locals.supabase);
    const sports = await sportService.getAllSports();

    logger.info("Successfully fetched sports", { count: sports.length });
    return new Response(JSON.stringify(sports), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Sports list is static, so we can cache it
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    logger.error("Failed to fetch sports", { error });
    return createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to fetch sports",
      error instanceof Error ? error.message : undefined
    );
  }
};
