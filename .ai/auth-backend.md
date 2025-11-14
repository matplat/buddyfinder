# Instrukcje Implementacji Backendu Autentykacji - FITLink

 Ten dokument zawiera krok po kroku instrukcje implementacji pełnego systemu autentykacji dla aplikacji FITLink. Wykonaj kroki w podanej kolejności.

---

## PRZED ROZPOCZĘCIEM - Weryfikacja Wymagań

### ✅ Checklist Wymagań Wstępnych

Przed rozpoczęciem implementacji upewnij się, że:

- [ ] Node.js i npm są zainstalowane
- [ ] Projekt używa Astro 5 w trybie `output: "server"` (sprawdź `astro.config.mjs`)
- [ ] `@supabase/supabase-js@^2.78.0` jest zainstalowane
- [ ] Plik `/supabase/config.toml` istnieje
- [ ] Plik `/src/db/database.types.ts` istnieje i zawiera typy bazy danych
- [ ] Zmienne środowiskowe `SUPABASE_URL` i `SUPABASE_KEY` są ustawione w `.env`
- [ ] Lokalna instancja Supabase działa ALBO masz dostęp do zdalnej instancji

**Jeśli którykolwiek punkt nie jest spełniony - zatrzymaj się i rozwiąż problem przed kontynuowaniem.**

---

## KROK 1: Instalacja Zależności

### 1.1. Zainstaluj @supabase/ssr

```bash
npm install @supabase/ssr
```

### 1.2. Weryfikacja

Sprawdź, czy zależność została dodana do `package.json`:

```bash
grep "@supabase/ssr" package.json
```

Oczekiwany output: `"@supabase/ssr": "^x.x.x"`

---

## KROK 2: Migracja Bazy Danych - Trigger Username Sync

### 2.1. Utwórz Plik Migracji

Stwórz nowy plik:

**Ścieżka:** `/home/matplat/buddyfinder/supabase/migrations/20251106000001_add_username_sync_trigger.sql`

**Zawartość:**

```sql
-- Migration: Add Username Synchronization Trigger
-- Description: Synchronizes username from auth.users.raw_user_meta_data to profiles.username
-- Author: FITLink Team
-- Date: 2025-11-06

-- Create trigger function to sync username from auth metadata to profile
CREATE OR REPLACE FUNCTION public.handle_new_user_username()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profile with username from metadata
  -- Only if username exists in metadata
  UPDATE public.profiles
  SET username = LOWER(NEW.raw_user_meta_data->>'username')
  WHERE id = NEW.id
  AND (NEW.raw_user_meta_data->>'username') IS NOT NULL
  AND (NEW.raw_user_meta_data->>'username') != '';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
-- Fires AFTER INSERT to ensure profile is created first by handle_new_user()
CREATE TRIGGER on_auth_user_username_sync
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user_username();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user_username() IS 
  'Synchronizes username from user metadata to profile table after user creation';
```


### 2.3. Weryfikacja Triggera

Wykonaj te kroki na koniec implementacji

```sql
-- Sprawdź czy funkcja istnieje
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user_username';

-- Sprawdź czy trigger istnieje
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_username_sync';
```

---

## KROK 3: Serwer Supabase Client (@supabase/ssr)

### 3.1. Utwórz Plik supabase.server.ts

**Ścieżka:** `/home/matplat/buddyfinder/src/db/supabase.server.ts`

**Zawartość:**

```typescript
import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import type { Database } from './database.types';

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
  return createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookies: {
        get(name: string) {
          return cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookies.delete(name, options);
        },
      },
    }
  );
}

/**
 * Pomocnicza funkcja do pobierania sesji użytkownika
 * 
 * @returns Session object lub null jeśli użytkownik niezalogowany
 */
export async function getSession(cookies: AstroCookies) {
  const supabase = createServerSupabaseClient(cookies);
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
```

### 3.2. Weryfikacja

Plik powinien być w lokalizacji: `/home/matplat/buddyfinder/src/db/supabase.server.ts`

---

## KROK 4: Middleware - Route Guarding i Session Management

### 4.1. Zaktualizuj Middleware

**Ścieżka:** `/home/matplat/buddyfinder/src/middleware/index.ts`

**ZASTĄP całą zawartość pliku:**

```typescript
import { defineMiddleware } from 'astro:middleware';
import { createServerSupabaseClient, getSession } from '@/db/supabase.server';

// Ścieżki wymagające autentykacji
const PROTECTED_ROUTES = ['/', '/profile', '/matches'];

// Ścieżki dostępne tylko dla niezalogowanych (auth pages)
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, url, redirect } = context;
  
  // 1. Utwórz SSR-aware klienta Supabase
  const supabase = createServerSupabaseClient(cookies);
  
  // 2. Pobierz aktualną sesję
  const session = await getSession(cookies);
  
  // 3. Udostępnij supabase i session w context.locals
  context.locals.supabase = supabase;
  context.locals.session = session;
  
  // 4. Route guarding
  const pathname = url.pathname;
  
  // Jeśli użytkownik JEST zalogowany i próbuje wejść na stronę auth
  // → przekieruj na stronę główną
  if (session && AUTH_ROUTES.includes(pathname)) {
    return redirect('/');
  }
  
  // Jeśli użytkownik NIE JEST zalogowany i próbuje wejść na chronioną stronę
  // → przekieruj na logowanie
  if (!session && PROTECTED_ROUTES.includes(pathname)) {
    return redirect('/login');
  }
  
  // 5. Kontynuuj do następnego handlera
  return next();
});
```

### 4.2. Weryfikacja Typów

Sprawdź, czy `src/env.d.ts` zawiera:

```typescript
declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      session: Session | null;
    }
  }
}
```

**Uwaga:** Ten plik już powinien być poprawnie skonfigurowany. Jeśli nie - dodaj brakujące typy.

---

## KROK 5: DTOs dla Autentykacji (Zod Schemas)

### 5.1. Utwórz Plik auth.dto.ts

**Ścieżka:** `/home/matplat/buddyfinder/src/lib/dto/auth.dto.ts`

**Zawartość:**

```typescript
import { z } from 'zod';

/**
 * Schema walidacji dla logowania
 * Akceptuje email lub username
 */
export const loginSchema = z.object({
  login: z.string()
    .min(1, 'Podaj email lub nazwę użytkownika')
    .trim(),
  password: z.string()
    .min(1, 'Podaj hasło'),
});

export type LoginCommand = z.infer<typeof loginSchema>;

/**
 * Schema walidacji dla rejestracji
 */
export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Nazwa użytkownika musi mieć co najmniej 3 znaki')
    .max(30, 'Nazwa użytkownika nie może przekraczać 30 znaków')
    .regex(/^[a-z0-9_]+$/, 'Nazwa użytkownika może zawierać tylko małe litery, cyfry i podkreślenia')
    .trim()
    .toLowerCase(),
  email: z.string()
    .min(1, 'Podaj adres email')
    .email('Nieprawidłowy format adresu email')
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .regex(/[A-Z]/, 'Hasło musi zawierać co najmniej jedną wielką literę')
    .regex(/[a-z]/, 'Hasło musi zawierać co najmniej jedną małą literę')
    .regex(/[0-9]/, 'Hasło musi zawierać co najmniej jedną cyfrę'),
});

export type RegisterCommand = z.infer<typeof registerSchema>;

/**
 * Schema walidacji dla reset hasła
 */
export const resetPasswordSchema = z.object({
  email: z.string()
    .min(1, 'Podaj adres email')
    .email('Nieprawidłowy format adresu email')
    .trim()
    .toLowerCase(),
});

export type ResetPasswordCommand = z.infer<typeof resetPasswordSchema>;

/**
 * Helper do walidacji login schema
 */
export function validateLogin(data: unknown): LoginCommand {
  return loginSchema.parse(data);
}

/**
 * Helper do walidacji register schema
 */
export function validateRegister(data: unknown): RegisterCommand {
  return registerSchema.parse(data);
}

/**
 * Helper do walidacji reset password schema
 */
export function validateResetPassword(data: unknown): ResetPasswordCommand {
  return resetPasswordSchema.parse(data);
}
```

---

## KROK 6: API Endpoints - Authentication

### 6.1. Utwórz Endpoint Login

**Ścieżka:** `/home/matplat/buddyfinder/src/pages/api/auth/login.ts`

**Zawartość:**

```typescript
import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@/db/supabase.server';
import { validateLogin } from '@/lib/dto/auth.dto';
import { createErrorResponse, createValidationErrorResponse, ApiErrorCode } from '@/lib/api/errors';
import { createLogger } from '@/lib/logger';

export const prerender = false;

const logger = createLogger('API:auth/login');

/**
 * POST /api/auth/login
 * Logowanie użytkownika za pomocą email/username i hasła
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  logger.info('POST /api/auth/login');

  try {
    // 1. Parse i walidacja request body
    const body = await request.json();
    const { login, password } = validateLogin(body);

    // 2. Utwórz SSR-aware klienta
    const supabase = createServerSupabaseClient(cookies);

    // 3. Określ czy login to email czy username
    let email = login;
    
    // Jeśli login nie wygląda jak email, szukamy w bazie profiles
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login);
    
    if (!isEmail) {
      logger.info('Login is username, fetching email from profiles', { username: login });
      
      // Szukamy email dla podanego username
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', login.toLowerCase())
        .single();

      if (profileError || !profile) {
        logger.warn('Username not found', { username: login });
        return createErrorResponse(
          ApiErrorCode.UNAUTHORIZED,
          'Nieprawidłowe dane logowania',
          'INVALID_CREDENTIALS'
        );
      }

      // Pobieramy email z auth.users
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(profile.id);
      
      if (userError || !user?.email) {
        logger.error('Failed to fetch user email', { profileId: profile.id, error: userError });
        return createErrorResponse(
          ApiErrorCode.INTERNAL_ERROR,
          'Wystąpił błąd podczas logowania',
          'INTERNAL_ERROR'
        );
      }

      email = user.email;
    }

    // 4. Zaloguj użytkownika
    logger.info('Attempting sign in', { email });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn('Sign in failed', { email, error: error.message });
      return createErrorResponse(
        ApiErrorCode.UNAUTHORIZED,
        'Nieprawidłowe dane logowania',
        'INVALID_CREDENTIALS'
      );
    }

    if (!data.session) {
      logger.warn('Sign in succeeded but no session returned', { email });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        'Wystąpił błąd podczas logowania',
        'NO_SESSION'
      );
    }

    logger.info('Sign in successful', { userId: data.user.id });

    // 5. Zwróć sukces (cookies są ustawione automatycznie przez @supabase/ssr)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Zod validation error
    if (error && typeof error === 'object' && 'issues' in error) {
      return createValidationErrorResponse(error as any);
    }

    logger.error('Unexpected error during login', { error });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      'Wystąpił nieoczekiwany błąd',
      'INTERNAL_ERROR'
    );
  }
};
```

### 6.2. Utwórz Endpoint Logout

**Ścieżka:** `/home/matplat/buddyfinder/src/pages/api/auth/logout.ts`

**Zawartość:**

```typescript
import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@/db/supabase.server';
import { createErrorResponse, ApiErrorCode } from '@/lib/api/errors';
import { createLogger } from '@/lib/logger';

export const prerender = false;

const logger = createLogger('API:auth/logout');

/**
 * POST /api/auth/logout
 * Wylogowanie użytkownika
 */
export const POST: APIRoute = async ({ cookies }) => {
  logger.info('POST /api/auth/logout');

  try {
    const supabase = createServerSupabaseClient(cookies);

    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Sign out failed', { error: error.message });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        'Wystąpił błąd podczas wylogowania',
        'SIGNOUT_ERROR'
      );
    }

    logger.info('Sign out successful');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('Unexpected error during logout', { error });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      'Wystąpił nieoczekiwany błąd',
      'INTERNAL_ERROR'
    );
  }
};
```

### 6.3. Utwórz Endpoint Callback

**Ścieżka:** `/home/matplat/buddyfinder/src/pages/api/auth/callback.ts`

**Zawartość:**

```typescript
import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@/db/supabase.server';
import { createLogger } from '@/lib/logger';

export const prerender = false;

const logger = createLogger('API:auth/callback');

/**
 * GET /api/auth/callback
 * Obsługuje redirect z Supabase Auth (email verification, password reset)
 */
export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  logger.info('GET /api/auth/callback', { searchParams: url.searchParams.toString() });

  const code = url.searchParams.get('code');
  const type = url.searchParams.get('type');

  if (!code) {
    logger.warn('No code provided in callback');
    return redirect('/login?error=no_code');
  }

  try {
    const supabase = createServerSupabaseClient(cookies);

    // Wymień code na session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logger.error('Failed to exchange code for session', { error: error.message });
      return redirect('/login?error=auth_failed');
    }

    logger.info('Code exchange successful', { type });

    // Przekieruj w zależności od typu
    if (type === 'recovery') {
      // Password reset - przekieruj do strony ustawiania nowego hasła
      // TODO: Stworzyć stronę /update-password
      return redirect('/update-password');
    }

    // Email verification lub inne - przekieruj na stronę główną
    return redirect('/');

  } catch (error) {
    logger.error('Unexpected error in callback', { error });
    return redirect('/login?error=unexpected');
  }
};
```

---

## KROK 7: Aktualizacja Komponentów React

### 7.1. Zaktualizuj LoginForm.tsx

**Ścieżka:** `/home/matplat/buddyfinder/src/components/auth/LoginForm.tsx`

**ZNAJDŹ:**

```typescript
  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      // TODO: Wywołanie API POST /api/auth/login
      console.log('Login attempt:', data);
      
      // Placeholder - w przyszłości:
      // const response = await fetch('/api/auth/login', {
```

**ZASTĄP NA:**

```typescript
  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Nieprawidłowe dane logowania');
      }

      // Przekieruj na stronę główną
      window.location.href = '/';
```

### 7.2. Zaktualizuj RegisterForm.tsx

**Ścieżka:** `/home/matplat/buddyfinder/src/components/auth/RegisterForm.tsx`

**Na górze pliku dodaj import:**

```typescript
import { supabaseClient } from '@/db/supabase.client';
```

**ZNAJDŹ:**

```typescript
  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      // TODO: Wywołanie supabase.auth.signUp()
      console.log('Registration attempt:', data);
```

**ZASTĄP NA:**

```typescript
  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const { error } = await supabaseClient.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username.toLowerCase(),
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('Użytkownik o podanym adresie email już istnieje');
        }
        if (error.message.includes('username')) {
          throw new Error('Nazwa użytkownika jest już zajęta');
        }
        throw new Error(error.message);
      }

      setIsSuccess(true);
```

### 7.3. Zaktualizuj ForgotPasswordForm.tsx

**Ścieżka:** `/home/matplat/buddyfinder/src/components/auth/ForgotPasswordForm.tsx`

**Na górze pliku dodaj import:**

```typescript
import { supabaseClient } from '@/db/supabase.client';
```

**ZNAJDŹ:**

```typescript
  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      // TODO: Wywołanie supabase.auth.resetPasswordForEmail()
      console.log('Password reset request for:', data.email);
```

**ZASTĄP NA:**

```typescript
  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/api/auth/callback?type=recovery`,
      });

      if (error) {
        throw new Error(error.message);
      }

      setIsSuccess(true);
```

---

## KROK 8: Aktualizacja Layout.astro - Wylogowanie

### 8.1. Zaktualizuj Layout.astro

**Ścieżka:** `/home/matplat/buddyfinder/src/layouts/Layout.astro`

**ZASTĄP całą zawartość:**

```astro
---
import "../styles/global.css";

interface Props {
  title?: string;
}

const { title = "FITLink" } = Astro.props;

// Odczytaj sesję z middleware
const session = Astro.locals.session;
---

<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>
  </head>
  <body>
    <nav class="border-b border-border bg-background">
      <div class="container mx-auto flex items-center justify-between px-4 py-3">
        <a href="/" class="text-xl font-bold hover:text-primary">
          FITLink
        </a>
        
        <div class="flex items-center gap-4">
          {session ? (
            <>
              <a 
                href="/profile" 
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Profil
              </a>
              <a 
                href="/matches" 
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dopasowania
              </a>
              <button
                type="button"
                id="logout-button"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Wyloguj
              </button>
            </>
          ) : (
            <>
              <a 
                href="/login" 
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Zaloguj się
              </a>
              <a 
                href="/register" 
                class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Zarejestruj się
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
    
    <slot />
    
    <script>
      // Obsługa wylogowania
      const logoutButton = document.getElementById('logout-button');
      
      if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
          try {
            const response = await fetch('/api/auth/logout', {
              method: 'POST',
            });

            if (response.ok) {
              window.location.href = '/login';
            } else {
              console.error('Logout failed');
              alert('Wystąpił błąd podczas wylogowania');
            }
          } catch (error) {
            console.error('Logout error:', error);
            alert('Wystąpił błąd podczas wylogowania');
          }
        });
      }
    </script>
  </body>
</html>
```

---

## KROK 9: Aktualizacja Stron Astro - Redirecty

### 9.1. Zaktualizuj login.astro

**Ścieżka:** `/home/matplat/buddyfinder/src/pages/login.astro`

**ZASTĄP:**

```astro
---
import Layout from "../layouts/Layout.astro";
import { LoginForm } from "../components/auth/LoginForm";

// Middleware już obsługuje redirect dla zalogowanych użytkowników
// Nie trzeba dodawać dodatkowej logiki tutaj
---

<Layout title="Logowanie - FITLink">
  <LoginForm client:load />
</Layout>
```

### 9.2. Zaktualizuj register.astro

**Ścieżka:** `/home/matplat/buddyfinder/src/pages/register.astro`

**ZASTĄP:**

```astro
---
import Layout from "../layouts/Layout.astro";
import { RegisterForm } from "../components/auth/RegisterForm";

// Middleware już obsługuje redirect dla zalogowanych użytkowników
---

<Layout title="Rejestracja - FITLink">
  <RegisterForm client:load />
</Layout>
```

### 9.3. Zaktualizuj forgot-password.astro

**Ścieżka:** `/home/matplat/buddyfinder/src/pages/forgot-password.astro`

**ZASTĄP:**

```astro
---
import Layout from "../layouts/Layout.astro";
import { ForgotPasswordForm } from "../components/auth/ForgotPasswordForm";

// Middleware już obsługuje redirect dla zalogowanych użytkowników
---

<Layout title="Odzyskiwanie hasła - FITLink">
  <ForgotPasswordForm client:load />
</Layout>
```

### 9.4. Zaktualizuj index.astro

**Ścieżka:** `/home/matplat/buddyfinder/src/pages/index.astro`

**OBECNA zawartość powinna pozostać bez zmian, ponieważ middleware już chroni tę trasę.**

Upewnij się, że plik wygląda tak:

```astro
---
import Welcome from "../components/Welcome.astro";
import Layout from "../layouts/Layout.astro";

// Middleware już wymusza logowanie dla tej strony
---

<Layout>
  <Welcome />
</Layout>
```

---

## KROK 10: Konfiguracja Supabase Dashboard

### 10.1. Email Templates

Przejdź do: **Supabase Dashboard → Authentication → Email Templates**

Sprawdź i upewnij się, że są skonfigurowane:

- **Confirm signup** - Template dla weryfikacji email
- **Reset password** - Template dla reset hasła

Domyślne szablony są OK, ale możesz je dostosować do brandingu FITLink.

### 10.2. URL Configuration

Przejdź do: **Supabase Dashboard → Authentication → URL Configuration**

**Site URL:**
- Development: `http://localhost:3000`
- Production: `https://twoja-domena.com`

**Redirect URLs (dodaj oba):**
- `http://localhost:3000/api/auth/callback`
- `https://twoja-domena.com/api/auth/callback`

### 10.3. Email Auth Settings

Przejdź do: **Supabase Dashboard → Authentication → Providers → Email**

Upewnij się, że:

- ✅ **Enable email provider** - włączone
- ✅ **Confirm email** - włączone (WAŻNE dla bezpieczeństwa)
- ✅ **Secure email change** - włączone (zalecane)

---

## KROK 12: Debugowanie i Troubleshooting

### Problem: "No code provided in callback"

**Rozwiązanie:**
- Sprawdź konfigurację Redirect URLs w Supabase Dashboard
- Upewnij się, że URL callback jest dokładnie taki sam jak skonfigurowany

### Problem: "Username not found" podczas logowania

**Rozwiązanie:**
- Sprawdź czy trigger `on_auth_user_username_sync` zadziałał
- W bazie uruchom: `SELECT id, username FROM profiles WHERE username = 'testuser';`
- Jeśli username jest `NULL`, trigger nie zadziałał - sprawdź logi Postgres

### Problem: Redirect loop (przekierowania w kółko)

**Rozwiązanie:**
- Sprawdź logi konsoli przeglądarki
- Sprawdź czy middleware poprawnie ustawia `session` w `locals`
- Sprawdź logi serwera Astro

### Problem: CORS errors

**Rozwiązanie:**
- Upewnij się, że `SUPABASE_URL` jest poprawny
- W development powinno działać bez dodatkowej konfiguracji CORS

### Problem: Cookies nie są ustawiane

**Rozwiązanie:**
- Sprawdź czy używasz `createServerSupabaseClient` w middleware/API routes
- Sprawdź czy w production używasz HTTPS
- Sprawdź konfigurację SameSite cookies w Supabase



### ✅ Checklist Końcowy

- [ ] `@supabase/ssr` zainstalowane
- [ ] Migracja triggera zastosowana
- [ ] `supabase.server.ts` utworzony
- [ ] Middleware zaktualizowane
- [ ] `auth.dto.ts` utworzony
- [ ] Endpointy `/api/auth/*` utworzone
- [ ] Komponenty React zaktualizowane
- [ ] `Layout.astro` zaktualizowany
- [ ] Strony `.astro` zaktualizowane
- [ ] Supabase Dashboard skonfigurowany
