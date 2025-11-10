import type { APIRoute } from "astro";
import { createServerSupabaseClient } from "@/db/supabase.server";
import { createLogger } from "@/lib/logger";

export const prerender = false;

const logger = createLogger("API:auth/callback");

/**
 * GET /api/auth/callback
 *
 * Obsługuje redirect z Supabase Auth po kliknięciu w link weryfikacyjny w emailu.
 *
 * Supabase wysyła użytkownika na ten endpoint gdy:
 * 1. Użytkownik klika link weryfikacyjny po rejestracji
 * 2. Użytkownik klika link do resetowania hasła
 * 3. Użytkownik zmienia adres email (wymaga potwierdzenia)
 *
 * URL zawiera parametry:
 * - code: Jednorazowy kod autoryzacyjny od Supabase
 * - type: Typ akcji (signup, recovery, email_change, etc.)
 *
 * Ten endpoint wymienia kod na sesję użytkownika poprzez exchangeCodeForSession(),
 * co automatycznie ustawia cookies sesji przez createServerSupabaseClient.
 */
export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  logger.info("GET /api/auth/callback", { searchParams: url.searchParams.toString() });

  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type");

  if (!code) {
    logger.warn("No code provided in callback");
    return redirect("/login?error=no_code");
  }

  try {
    const supabase = createServerSupabaseClient(cookies);

    // Wymień kod na sesję - cookies są automatycznie ustawiane przez createServerSupabaseClient
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logger.error("Failed to exchange code for session", { error: error.message, type });
      return redirect("/login?error=auth_failed");
    }

    logger.info("Successfully exchanged code for session", { type });

    // Dla różnych typów akcji możemy przekierować w różne miejsca
    if (type === "recovery") {
      // Reset hasła - przekieruj do strony zmiany hasła
      return redirect("/reset-password");
    }

    // Domyślnie przekieruj na stronę główną
    return redirect("/");
  } catch (error) {
    logger.error("Unexpected error in callback", { error });
    return redirect("/login?error=unexpected");
  }
};
