import type { APIRoute } from "astro";
import { createServerSupabaseClient } from "@/db/supabase.server";
import { validateLogin } from "@/lib/dto/auth.dto";
import { createErrorResponse, createValidationErrorResponse } from "@/lib/api/errors";
import { createLogger } from "@/lib/logger";
import type { ZodError } from "zod";

export const prerender = false;

const logger = createLogger("API:auth/login");

/**
 * POST /api/auth/login
 * Logowanie użytkownika za pomocą email/username i hasła
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  logger.info("POST /api/auth/login");

  try {
    // 1. Parse i walidacja request body
    const body = await request.json();
    const { login, password } = validateLogin(body);

    const supabase = createServerSupabaseClient(cookies);

    // 2. Sprawdź czy login to email czy username
    const isEmail = login.includes("@");

    if (isEmail) {
      // Logowanie przez email
      logger.info("Attempting login with email", { email: login });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: login,
        password,
      });

      if (error) {
        logger.warn("Login failed with email", { error: error.message });
        return createErrorResponse("UNAUTHORIZED", "Nieprawidłowy email lub hasło");
      }

      logger.info("Login successful", { userId: data.user.id });
      return new Response(
        JSON.stringify({
          message: "Zalogowano pomyślnie",
          user: {
            id: data.user.id,
            email: data.user.email,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      // Logowanie przez username - użyj funkcji RPC
      logger.info("Attempting login with username", { username: login });

      // Pobierz email używając funkcji bazy danych
      const { data: email, error: rpcError } = await supabase.rpc("get_email_by_username", { p_username: login });

      if (rpcError || !email) {
        logger.warn("Username not found or not confirmed", {
          username: login,
          error: rpcError?.message,
        });
        return createErrorResponse("UNAUTHORIZED", "Nieprawidłowa nazwa użytkownika lub hasło");
      }

      // Zaloguj używając znalezionego emaila
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password,
      });

      if (error) {
        logger.warn("Login failed with username", { username: login, error: error.message });
        return createErrorResponse("UNAUTHORIZED", "Nieprawidłowa nazwa użytkownika lub hasło");
      }

      logger.info("Login successful", { userId: data.user.id, username: login });
      return new Response(
        JSON.stringify({
          message: "Zalogowano pomyślnie",
          user: {
            id: data.user.id,
            email: data.user.email,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    // Zod validation error
    if (error && typeof error === "object" && "issues" in error) {
      logger.warn("Validation error", { error });
      return createValidationErrorResponse(error as ZodError);
    }

    logger.error("Unexpected error during login", { error });
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił nieoczekiwany błąd");
  }
};
