import type { APIRoute } from "astro";
import { UserSportService, SportNotFoundError, DuplicateSportError } from "@/lib/services/user-sport.service";
import { createErrorResponse, createValidationErrorResponse, ApiErrorCode } from "@/lib/api/errors";
import { AddUserSportCommand } from "@/lib/dto/user-sport.dto";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  // Early return if no session
  if (!locals.session) {
    return createErrorResponse(ApiErrorCode.UNAUTHORIZED, "Authentication required to access this resource");
  }

  try {
    const userId = locals.session.user.id;
    if (!userId) {
      return createErrorResponse(ApiErrorCode.UNAUTHORIZED, "User ID not found in session");
    }

    const userSportService = new UserSportService(locals.supabase);
    const sports = await userSportService.getUserSports(userId);

    return new Response(JSON.stringify(sports), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message === "User ID is required") {
        return createErrorResponse(ApiErrorCode.VALIDATION_ERROR, "Invalid user session");
      }
    }

    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, "An error occurred while fetching user sports");
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  // Early return if no session
  if (!locals.session) {
    return createErrorResponse(ApiErrorCode.UNAUTHORIZED, "Authentication required to access this resource");
  }

  const userId = locals.session.user.id;
  if (!userId) {
    return createErrorResponse(ApiErrorCode.UNAUTHORIZED, "User ID not found in session");
  }

  try {
    const body = await request.json();
    const result = AddUserSportCommand.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const userSportService = new UserSportService(locals.supabase);
    const userSport = await userSportService.addUserSport(userId, result.data);

    return new Response(JSON.stringify(userSport), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof SportNotFoundError) {
      return createErrorResponse(ApiErrorCode.NOT_FOUND, error.message);
    }
    if (error instanceof DuplicateSportError) {
      return createErrorResponse(ApiErrorCode.VALIDATION_ERROR, error.message);
    }
    if (error instanceof Error) {
      return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, error.message);
    }

    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, "An error occurred while adding sport to user profile");
  }
};
