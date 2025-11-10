import { defineMiddleware } from "astro:middleware";
import { createServerSupabaseClient, getUser } from "@/db/supabase.server";

// Ścieżki wymagające autentykacji
const PROTECTED_ROUTES = ["/", "/profile"];

// Ścieżki dostępne tylko dla niezalogowanych (auth pages)
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, url, redirect } = context;

  // 1. Utwórz SSR-aware klienta Supabase
  const supabase = createServerSupabaseClient(cookies);

  // 2. Pobierz zautentykowanego użytkownika (BEZPIECZNE - weryfikuje token z serwerem)
  const user = await getUser(cookies);

  // 3. Pobierz sesję (zawiera dodatkowe informacje: access_token, expires_at, etc.)
  // Używamy getSession() tylko PO weryfikacji użytkownika przez getUser()
  const {
    data: { session },
  } = user ? await supabase.auth.getSession() : { data: { session: null } };

  // 4. Udostępnij supabase, user i session w context.locals
  context.locals.supabase = supabase;
  context.locals.user = user;
  context.locals.session = session;

  // 5. Route guarding - używamy user (zweryfikowany) nie session
  const pathname = url.pathname;

  // Jeśli użytkownik JEST zalogowany i próbuje wejść na stronę auth
  // → przekieruj na stronę główną
  if (user && AUTH_ROUTES.includes(pathname)) {
    return redirect("/");
  }

  // Jeśli użytkownik NIE JEST zalogowany i próbuje wejść na chronioną stronę
  // → przekieruj na logowanie
  if (!user && PROTECTED_ROUTES.includes(pathname)) {
    return redirect("/login");
  }

  // 6. Kontynuuj do następnego handlera
  return next();
});
