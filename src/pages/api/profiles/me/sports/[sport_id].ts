import type { APIRoute } from "astro";
import { createErrorResponse, createValidationErrorResponse, ApiErrorCode } from "@/lib/api/errors";
import { UpdateUserSportCommand, SportIdParam } from "@/lib/dto/user-sport.dto";
import { UserSportNotFoundError, UserSportService } from "@/lib/services/user-sport.service";

export const prerender = false;

export const PUT: APIRoute = async ({ request, params, locals: { supabase, session } }) => {
  if (!session) {
    return createErrorResponse(ApiErrorCode.UNAUTHORIZED, "You must be logged in to update a sport");
  }

  // Parse and validate sport_id using Zod schema
  const validationResult = SportIdParam.safeParse(params);
  if (!validationResult.success) {
    return createValidationErrorResponse(validationResult.error);
  }

  try {
    const data = await request.json();
    const commandResult = UpdateUserSportCommand.safeParse(data);
    if (!commandResult.success) {
      return createValidationErrorResponse(commandResult.error);
    }

    const userSportService = new UserSportService(supabase);
    const updatedSport = await userSportService.updateUserSport(
      session.user.id,
      validationResult.data.sport_id,
      commandResult.data
    );

    return new Response(JSON.stringify(updatedSport), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof UserSportNotFoundError) {
      return createErrorResponse(ApiErrorCode.NOT_FOUND, error.message);
    }
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, "An error occurred while updating the sport");
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { session, supabase } = locals;

  // Validate authentication
  if (!session?.user) {
    return createErrorResponse(ApiErrorCode.UNAUTHORIZED, "Authentication required", "UNAUTHORIZED");
  }

  // Parse and validate sport_id using Zod schema
  const validationResult = SportIdParam.safeParse(params);
  if (!validationResult.success) {
    return createValidationErrorResponse(validationResult.error);
  }

  try {
    const userSportService = new UserSportService(supabase);
    await userSportService.deleteUserSport(session.user.id, validationResult.data.sport_id);

    // Return 204 No Content for successful deletion
    return new Response(null, { status: 204 });
  } catch (error) {
    // Handle specific errors
    if (error instanceof UserSportNotFoundError) {
      return createErrorResponse(ApiErrorCode.NOT_FOUND, "Sport not found in user's profile", "SPORT_NOT_FOUND");
    }

    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "An unexpected error occurred while deleting the sport",
      "INTERNAL_SERVER_ERROR"
    );
  }
};
