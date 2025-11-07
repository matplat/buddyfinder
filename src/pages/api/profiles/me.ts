import type { APIRoute } from "astro";
import { ProfileService } from "@/lib/services/profile.service";
import { validateProfileUpdate } from "@/lib/dto/profile.dto";
import { createErrorResponse, ApiErrorCode } from "@/lib/api/errors";
import { createLogger } from "@/lib/logger";

export const prerender = false;

const logger = createLogger("API:profiles/me");

export const GET: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  logger.info("GET /api/profiles/me", { method: request.method });

  // Validate authentication
  if (!user) {
    logger.warn("Unauthorized access attempt");
    return createErrorResponse(ApiErrorCode.UNAUTHORIZED, "Authentication required", "UNAUTHORIZED");
  }

  const profileService = new ProfileService(supabase);

  try {
    const profile = await profileService.getCurrentUserProfile(user.id);

    if (!profile) {
      logger.warn("Profile not found", { userId: user.id });
      return createErrorResponse(ApiErrorCode.NOT_FOUND, "Profile not found", "PROFILE_NOT_FOUND");
    }

    logger.info("Successfully fetched profile", { userId: user.id });
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Error fetching profile", { userId: user.id, error });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "An unexpected error occurred while fetching your profile",
      "INTERNAL_SERVER_ERROR"
    );
  }
};

/**
 * PATCH /api/profiles/me
 * Updates the current user's profile
 */
export const PATCH: APIRoute = async ({ request, locals }) => {
  const { supabase, user } = locals;

  logger.info("PATCH /api/profiles/me", { method: request.method });

  // Validate authentication
  if (!user) {
    logger.warn("Unauthorized access attempt");
    return createErrorResponse(ApiErrorCode.UNAUTHORIZED, "Authentication required", "UNAUTHORIZED");
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateProfileUpdate(body);

    // Initialize service and update profile
    const profileService = new ProfileService(supabase);
    const updatedProfile = await profileService.updateUserProfile(user.id, validatedData);

    logger.info("Successfully updated profile", { userId: user.id });
    return new Response(JSON.stringify(updatedProfile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // Handle validation errors
    if (error instanceof Error && error.name === "ZodError") {
      logger.warn("Validation error", { userId: user.id, error });
      return createErrorResponse(ApiErrorCode.VALIDATION_ERROR, "Invalid request data", "VALIDATION_ERROR");
    }

    // Handle database errors - error is from Supabase
    if (typeof error === "object" && error !== null && "code" in error) {
      const { code } = error as { code: string };
      if (code === "PGRST301") {
        logger.warn("Profile not found", { userId: user.id });
        return createErrorResponse(ApiErrorCode.NOT_FOUND, "Profile not found", "PROFILE_NOT_FOUND");
      }
    }

    logger.error("Error updating profile", { userId: user.id, error });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "An unexpected error occurred while updating your profile",
      "INTERNAL_SERVER_ERROR"
    );
  }
};
