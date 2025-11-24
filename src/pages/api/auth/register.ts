import type { APIRoute } from "astro";
import { createServerSupabaseClient } from "@/db/supabase.server";
import { validateRegister } from "@/lib/dto/auth.dto";
import { createErrorResponse, createValidationErrorResponse } from "@/lib/api/errors";
import { createLogger } from "@/lib/logger";
import type { ZodError } from "zod";

export const prerender = false;

const logger = createLogger("API:auth/register");

/**
 * POST /api/auth/register
 * Rejestracja nowego użytkownika z weryfikacją email
 *
 * Request body:
 * {
 *   "username": string (3-30 znaków, małe litery, cyfry i podkreślenia),
 *   "email": string (format email),
 *   "password": string (min 8 znaków, 1 wielka, 1 mała, 1 cyfra)
 * }
 *
 * Response:
 * - 201: Rejestracja pomyślna, email weryfikacyjny wysłany
 * - 400: Błąd walidacji danych wejściowych
 * - 409: Użytkownik o podanym email już istnieje
 * - 500: Błąd serwera
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  logger.info("POST /api/auth/register");

  try {
    // 1. Parse i walidacja request body
    const body = await request.json();
    const { username, email, password } = validateRegister(body);

    const supabase = createServerSupabaseClient(cookies);

    // 2. Rejestracja użytkownika przez Supabase Auth
    logger.info("Attempting user registration", { email, username });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(), // Normalizacja do małych liter
        },
        emailRedirectTo: `${new URL(request.url).origin}/api/auth/callback`,
      },
    });

    // 3. Obsługa błędów rejestracji
    if (error) {
      logger.error("Registration failed", { error: error.message, email });

      // Obsługa specyficznych błędów Supabase
      if (error.message.includes("already registered") || error.message.includes("User already registered")) {
        return createErrorResponse("CONFLICT", "Użytkownik o podanym adresie email już istnieje");
      }

      if (error.message.includes("email") && error.message.includes("invalid")) {
        return createErrorResponse("BAD_REQUEST", "Nieprawidłowy format adresu email");
      }

      // Ogólny błąd
      return createErrorResponse("INTERNAL_ERROR", "Wystąpił błąd podczas rejestracji. Spróbuj ponownie później.");
    }

    // 4. Sukces - zwróć informację o wysłanym emailu weryfikacyjnym
    logger.info("Registration successful", {
      userId: data.user?.id,
      email,
      emailConfirmed: data.user?.email_confirmed_at ? true : false,
    });

    return new Response(
      JSON.stringify({
        message: "Rejestracja pomyślna. Sprawdź swoją skrzynkę email, aby potwierdzić adres.",
        user: {
          id: data.user?.id,
          email: data.user?.email,
          username: username.toLowerCase(),
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // 5. Obsługa nieoczekiwanych błędów

    // Zod validation error
    if (error && typeof error === "object" && "issues" in error) {
      logger.warn("Validation error", { error });
      return createValidationErrorResponse(error as ZodError);
    }

    // JSON parse error
    if (error instanceof SyntaxError) {
      logger.warn("Invalid JSON format", { error });
      return createErrorResponse("BAD_REQUEST", "Nieprawidłowy format danych. Oczekiwano JSON.");
    }

    logger.error("Unexpected error during registration", { error });
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.");
  }
};
