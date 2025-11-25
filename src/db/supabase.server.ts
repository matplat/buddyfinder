import { createServerClient } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/server";
import type { Database } from "./database.types";

type AstroCookieOptions = Parameters<AstroCookies["set"]>[2];

/**
 * Tworzy instancję klienta Supabase dla kontekstu serwerowego (SSR)
 * z zarządzaniem cookies przez @supabase/ssr
 *
 * UŻYCIE:
 * - W middleware: createServerSupabaseClient(Astro.cookies)
 * - W API routes: createServerSupabaseClient(Astro.cookies)
 * - W stronach .astro: createServerSupabaseClient(Astro.cookies)
 *
 * NIE UŻYWAĆ w komponentach React - tam użyj supabaseClient
 */
export function createServerSupabaseClient(cookies: AstroCookies) {
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      get(name: string) {
        return cookies.get(name)?.value;
      },
      set(name: string, value: string, options: AstroCookieOptions) {
        cookies.set(name, value, options);
      },
      remove(name: string, options: AstroCookieOptions) {
        cookies.delete(name, options);
      },
    },
  });
}

/**
 * Bezpieczna funkcja do pobierania zautentykowanego użytkownika
 * Używa getUser() zamiast getSession() dla bezpieczeństwa
 *
 * getUser() weryfikuje token z serwerem Supabase Auth, więc dane są autentyczne
 * getSession() tylko czyta z cookies, które mogą być zmanipulowane
 *
 * @returns User object lub null jeśli użytkownik niezalogowany lub token nieprawidłowy
 */
export async function getUser(cookies: AstroCookies) {
  const supabase = createServerSupabaseClient(cookies);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * @deprecated Używaj getUser() zamiast getSession() dla bezpieczeństwa
 * Funkcja pozostawiona dla kompatybilności wstecznej
 */
export async function getSession(cookies: AstroCookies) {
  const supabase = createServerSupabaseClient(cookies);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * TypeScript type export for convenience
 */
export type SupabaseClient = ReturnType<typeof createServerSupabaseClient>;
