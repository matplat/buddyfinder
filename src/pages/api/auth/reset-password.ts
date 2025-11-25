import type { APIRoute } from "astro";
import { createServerSupabaseClient } from "@/db/supabase.server";
import { validateResetPassword } from "@/lib/dto/auth.dto";
import { createErrorResponse, createValidationErrorResponse } from "@/lib/api/errors";
import { createLogger } from "@/lib/logger";
import type { ZodError } from "zod";

export const prerender = false;

const logger = createLogger("API:auth/reset-password");

/**
 * POST /api/auth/reset-password
 * Wysyła link resetujący hasło na podany adres email
 *
 * Security by obscurity: Zawsze zwraca sukces, nawet jeśli email nie istnieje,
 * aby nie ujawniać informacji o istnieniu konta.
 *
 * Request body:
 * {
 *   "email": string (format email)
 * }
 *
 * Response:
 * - 200: Link resetujący został wysłany (lub email nie istnieje, ale odpowiedź jest taka sama)
 * - 400: Błąd walidacji danych wejściowych
 * - 500: Błąd serwera
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  logger.info("POST /api/auth/reset-password");

  try {
    // 1. Parse i walidacja request body
    const body = await request.json();
    const { email } = validateResetPassword(body);

    const supabase = createServerSupabaseClient(cookies);

    // 2. Wysłanie linku resetującego hasło
    logger.info("Attempting password reset", { email });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/api/auth/callback`,
    });

    // 3. Obsługa błędów - ale nie ujawniamy czy email istnieje
    if (error) {
      logger.error("Password reset request failed", { error: error.message, email });

      // Nawet w przypadku błędu zwracamy ogólną wiadomość sukcesu
      // aby nie ujawniać informacji o istnieniu konta (security by obscurity)
    } else {
      logger.info("Password reset email sent successfully", { email });
    }

    // 4. Zawsze zwracamy ten sam komunikat sukcesu
    // Security by obscurity: nie ujawniamy czy email istnieje w systemie
    return new Response(
      JSON.stringify({
        message:
          "Jeśli konto o podanym adresie email istnieje, otrzymasz wiadomość z linkiem do resetowania hasła. Sprawdź swoją skrzynkę pocztową.",
      }),
      {
        status: 200,
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

    // W przypadku nieoczekiwanego błędu również zwracamy ogólną wiadomość sukcesu
    // aby nie ujawniać informacji o problemach systemowych (security by obscurity)
    logger.error("Unexpected error during password reset", { error });
    return new Response(
      JSON.stringify({
        message:
          "Jeśli konto o podanym adresie email istnieje, otrzymasz wiadomość z linkiem do resetowania hasła. Sprawdź swoją skrzynkę pocztową.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
