import type { APIRoute } from "astro";
import { SportService } from "@/lib/services/sport.service";
import { createErrorResponse } from "@/lib/api/errors";

export const prerender = false;

/**
 * GET /api/sports - Retrieves a list of all available sports
 * @returns A list of sports with their IDs and names
 * @throws 401 if user is not authenticated
 * @throws 500 if there's an internal server error
 */
export const GET: APIRoute = async ({ locals }) => {
  // Ensure user is authenticated (middleware handles this, but we double-check)
  if (!locals.session) {
    return createErrorResponse("UNAUTHORIZED", "Authentication required");
  }

  try {
    const sportService = new SportService(locals.supabase);
    const sports = await sportService.getAllSports();

    return new Response(JSON.stringify(sports), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Sports list is static, so we can cache it
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to fetch sports",
      error instanceof Error ? error.message : undefined
    );
  }
};
