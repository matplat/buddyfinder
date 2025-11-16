# Plan migracji zmiennych Supabase na server-side

## 1. Executive Summary

### Cel

Przenieść zmienne środowiskowe [`SUPABASE_URL`](../astro.config.mjs) i [`SUPABASE_KEY`](../astro.config.mjs) z `context: "client"` na `context: "server"`, eliminując dostęp do Supabase Client z poziomu przeglądarki. Wszystkie operacje na bazie danych będą wykonywane wyłącznie przez API endpoints (Pure API Architecture).

### Rekomendowany moment wdrożenia

**PRZED** implementacją cache'owania z TanStack Query.

**Uzasadnienie:**

- ✅ Cache'owanie zakłada komunikację przez `/api/*` endpoints (zgodnie z `cache-introduction.md`)
- ✅ Zmniejsza scope zmian - tylko 2 komponenty auth wymagają modyfikacji
- ✅ Unika przyszłego refactoringu po wdrożeniu cache
- ✅ Ustala bezpieczną architekturę przed dodaniem nowych funkcji

### Skala zmian

- **Plików do modyfikacji**: 6
- **Nowych endpointów**: 2 (register, reset-password)
- **Komponentów React**: 2 (RegisterForm, ForgotPasswordForm)
- **Czas wdrożenia**: ~2-3 godziny
- **Ryzyko**: Niskie (izolowane zmiany, dobrze przetestowalne)

---

## 2. Analiza obecnego stanu

### 2.1. Obecna konfiguracja (❌ NIEBEZPIECZNA)

**Plik: [`astro.config.mjs`](../astro.config.mjs)**

```typescript
env: {
  schema: {
    SUPABASE_URL: envField.string({
      context: "client",    // ❌ Dostępny w przeglądarce
      access: "public",     // ❌ Wbudowany w bundle JS
    }),
    SUPABASE_KEY: envField.string({
      context: "client",    // ❌ Dostępny w przeglądarce
      access: "public",     // ❌ Wbudowany w bundle JS
    }),
  },
}
```

**Konsekwencje:**

- ❌ Klucz Supabase jest widoczny w DevTools przeglądarki
- ❌ Możliwość użycia Supabase Client bezpośrednio w kodzie client-side
- ❌ Omijanie logiki biznesowej w API endpoints
- ❌ Omijanie walidacji (zod schemas)
- ❌ Niezgodność z dokumentacją projektu (Pure API Architecture)

### 2.2. Obecne użycie Supabase Client (client-side)

| Plik | Użycie | Funkcja | Status |
| ---- | ------ | ------- | ------ |
| `src/components/auth/RegisterForm.tsx` | ❌ Client-side | `supabaseClient.auth.signUp()` | **DO ZMIANY** |
| `src/components/auth/ForgotPasswordForm.tsx` | ❌ Client-side | `supabaseClient.auth.resetPasswordForEmail()` | **DO ZMIANY** |
| `src/components/auth/LoginForm.tsx` | ✅ API endpoint | `fetch('/api/auth/login')` | **OK** |

**Wniosek:** Tylko 2 komponenty wymagają zmiany.

### 2.3. Obecne użycie Supabase Server (server-side)

| Plik | Typ | Status |
| ---- | --- | ------ |
| `src/db/supabase.server.ts` | Server module | ✅ OK (ale importuje z `astro:env/client` ❌) |
| `src/middleware/index.ts` | Middleware | ✅ OK |
| `src/pages/api/auth/login.ts` | API endpoint | ✅ OK |
| `src/pages/api/auth/logout.ts` | API endpoint | ✅ OK |
| `src/pages/api/auth/callback.ts` | API endpoint | ✅ OK |

**Wniosek:** Server-side kod jest dobrze zorganizowany, wymaga tylko drobnej zmiany importu.

---

## 3. Docelowa architektura (✅ BEZPIECZNA)

### 3.1. Nowa konfiguracja

**Plik: [`astro.config.mjs`](../astro.config.mjs)**

```typescript
env: {
  schema: {
    SUPABASE_URL: envField.string({
      context: "server",    // ✅ Tylko server-side
      access: "secret",     // ✅ Nie w bundle
    }),
    SUPABASE_KEY: envField.string({
      context: "server",    // ✅ Tylko server-side
      access: "secret",     // ✅ Nie w bundle
    }),
  },
}
```

### 3.2. Przepływ danych (Pure API Architecture)

```text
┌─────────────────────────────────────────────────────────────────┐
│                          BROWSER                                │
│                                                                 │
│  RegisterForm.tsx                                               │
│       │                                                         │
│       └──> fetch('/api/auth/register')                         │
│                   │                                             │
│  ForgotPasswordForm.tsx                                         │
│       │                                                         │
│       └──> fetch('/api/auth/reset-password')                   │
│                   │                                             │
│  LoginForm.tsx                                                  │
│       │                                                         │
│       └──> fetch('/api/auth/login')                            │
└───────────────────┼─────────────────────────────────────────────┘
                    │ HTTP REST API
┌───────────────────▼─────────────────────────────────────────────┐
│                       SERVER (Astro)                            │
│                                                                 │
│  /api/auth/register ──┐                                        │
│  /api/auth/reset-password ──┐                                  │
│  /api/auth/login ──┐         │                                 │
│                    │         │                                 │
│                    └─────────┴──> createServerSupabaseClient   │
│                                          │                      │
│                                          │ SUPABASE_URL        │
│                                          │ SUPABASE_KEY        │
│                                          │ (server-side only)  │
└──────────────────────────────────────────┼──────────────────────┘
                                           │
                                           ▼
                                   ┌──────────────┐
                                   │   Supabase   │
                                   │   Database   │
                                   └──────────────┘
```

**Korzyści:**

- ✅ **Bezpieczeństwo**: Klucze nigdy nie trafiają do przeglądarki
- ✅ **Kontrola**: Wszystkie operacje przez naszą logikę biznesową
- ✅ **Walidacja**: Zod schemas w API endpoints
- ✅ **Monitoring**: Centralizacja requestów
- ✅ **Spójność**: Zgodność z dokumentacją projektu

---

## 4. Plan zmian krok po kroku

### Krok 1: Backup i przygotowanie środowiska

**Czas: 5 minut**

```bash
# 1. Backup konfiguracji
cp astro.config.mjs astro.config.mjs.backup
cp .env .env.backup

# 2. Sprawdź że używasz anon key (NIE service_role)
# W .env powinno być:
# SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# (zaczyna się od eyJ i zawiera "role":"anon")

# 3. Stwórz branch
git checkout -b feature/server-side-supabase
```

**Weryfikacja:**

```powershell
# Sprawdź obecny klucz (nie commituj tego!)
$env:SUPABASE_KEY

# Powinien zaczynać się od: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

---

### Krok 2: Aktualizacja konfiguracji Astro

**Czas: 2 minuty**

**Plik: [`astro.config.mjs`](../astro.config.mjs)**

```diff
  env: {
    schema: {
      SUPABASE_URL: envField.string({
-       context: "client",
-       access: "public",
+       context: "server",
+       access: "secret",
      }),
      SUPABASE_KEY: envField.string({
-       context: "client",
-       access: "public",
+       context: "server",
+       access: "secret",
      }),
    },
  },
```

**Weryfikacja:**

```bash
npm run build
```

**Oczekiwany rezultat:** Build powinien się udać (póki co, będą błędy runtime gdy uruchomimy dev).

---

### Krok 3: Aktualizacja importu w supabase.server.ts

**Czas: 2 minuty**

**Plik: `src/db/supabase.server.ts`**

```diff
  import { createServerClient } from "@supabase/ssr";
  import type { AstroCookies } from "astro";
- import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/client";
+ import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/server";
  import type { Database } from "./database.types";
```

**Uzasadnienie:** Zmienne są teraz server-side, więc import z `astro:env/server`.

**Weryfikacja:**

```bash
npm run build
```

**Oczekiwany rezultat:** Build OK, nadal będą błędy w `supabase.client.ts`.

---

### Krok 4: Usunięcie supabase.client.ts (opcjonalnie) lub pozostawienie jako deprecated

**Czas: 5 minut**

**Opcja A: Usunięcie pliku (ZALECANE)**

```bash
# Usuń plik
rm src/db/supabase.client.ts

# Usuń z testów
# Będą błędy kompilacji w RegisterForm i ForgotPasswordForm - to OK, naprawimy w następnych krokach
```

**Opcja B: Oznaczenie jako deprecated (jeśli chcemy zachować dla referencji)**

**Plik: `src/db/supabase.client.ts`**

```typescript
/**
 * @deprecated
 * ❌ NIE UŻYWAJ TEGO PLIKU!
 *
 * Supabase Client nie powinien być używany client-side.
 * Wszystkie operacje na bazie danych powinny iść przez API endpoints.
 *
 * Zamiast:
 *   import { supabaseClient } from '@/db/supabase.client'
 *   await supabaseClient.auth.signUp(...)
 *
 * Użyj:
 *   await fetch('/api/auth/register', { method: 'POST', body: ... })
 */
throw new Error("supabaseClient is deprecated. Use API endpoints instead.");
```

**Rekomendacja:** Opcja A - pełne usunięcie. Eliminuje pokusę użycia w przyszłości.

---

### Krok 5: Utworzenie nowego API endpoint - POST /api/auth/register

**Czas: 15 minut**

**Plik: `src/pages/api/auth/register.ts` (NOWY)**

```typescript
import type { APIRoute } from "astro";
import { createServerSupabaseClient } from "@/db/supabase.server";
import { z } from "zod";

export const prerender = false;

const registerRequestSchema = z.object({
  username: z
    .string()
    .min(3, "Nazwa użytkownika musi mieć co najmniej 3 znaki")
    .max(30, "Nazwa użytkownika nie może przekraczać 30 znaków")
    .regex(/^[a-zA-Z0-9_-]+$/, "Nazwa użytkownika może zawierać tylko litery, cyfry, myślniki i podkreślenia"),
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
    .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
    .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Parse i waliduj dane wejściowe
    const body = await request.json();
    const validationResult = registerRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Nieprawidłowe dane wejściowe",
            details: validationResult.error.flatten().fieldErrors,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { username, email, password } = validationResult.data;

    // 2. Utwórz klienta Supabase server-side
    const supabase = createServerSupabaseClient(cookies);

    // 3. Zarejestruj użytkownika
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
        },
        emailRedirectTo: `${new URL(request.url).origin}/api/auth/callback`,
      },
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes("already registered") || error.message.includes("User already registered")) {
        return new Response(
          JSON.stringify({
            error: { message: "Użytkownik o podanym adresie email już istnieje" },
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: { message: error.message } }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Zwróć sukces
    return new Response(
      JSON.stringify({
        message: "Rejestracja pomyślna. Sprawdź swoją skrzynkę email.",
        user: { id: data.user?.id, email: data.user?.email },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({ error: { message: "Wystąpił błąd serwera" } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

**Weryfikacja (ręczna przez curl):**

```bash
# Test sukcesu (użyj prawdziwego emaila dla testu)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test1234"}'

# Oczekiwany output: 201 Created
# {"message":"Rejestracja pomyślna. Sprawdź swoją skrzynkę email.","user":{...}}

# Test walidacji
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"ab","email":"invalid","password":"weak"}'

# Oczekiwany output: 400 Bad Request
# {"error":{"message":"Nieprawidłowe dane wejściowe","details":{...}}}
```

---

### Krok 6: Utworzenie nowego API endpoint - POST /api/auth/reset-password

**Czas: 10 minut**

**Plik: `src/pages/api/auth/reset-password.ts` (NOWY)**

```typescript
import type { APIRoute } from "astro";
import { createServerSupabaseClient } from "@/db/supabase.server";
import { z } from "zod";

export const prerender = false;

const resetPasswordRequestSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Parse i waliduj dane wejściowe
    const body = await request.json();
    const validationResult = resetPasswordRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Nieprawidłowe dane wejściowe",
            details: validationResult.error.flatten().fieldErrors,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email } = validationResult.data;

    // 2. Utwórz klienta Supabase server-side
    const supabase = createServerSupabaseClient(cookies);

    // 3. Wyślij email resetujący hasło
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/api/auth/callback`,
    });

    // UWAGA: Ze względów bezpieczeństwa, ZAWSZE zwracamy sukces,
    // nawet jeśli email nie istnieje (zapobiega enumeracji użytkowników)
    if (error && !error.message.includes("User not found")) {
      console.error("Reset password error:", error);
      // Tylko loguj błędy serwera, nie ujawniaj użytkownikowi
    }

    // 4. Zwróć sukces (zawsze, nawet jeśli email nie istnieje)
    return new Response(
      JSON.stringify({
        message: "Jeśli konto o podanym adresie email istnieje, otrzymasz wiadomość z linkiem do resetowania hasła.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return new Response(
      JSON.stringify({ error: { message: "Wystąpił błąd serwera" } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

**Weryfikacja (ręczna przez curl):**

```bash
# Test (użyj prawdziwego emaila dla testu)
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Oczekiwany output: 200 OK (zawsze, nawet dla nieistniejącego emaila)
# {"message":"Jeśli konto o podanym adresie email istnieje, otrzymasz wiadomość..."}
```

---

### Krok 7: Aktualizacja RegisterForm.tsx

**Czas: 10 minut**

**Plik: `src/components/auth/RegisterForm.tsx`**

```diff
- import { supabaseClient } from "@/db/supabase.client";
  
  // ... existing code ...

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
-     const { error } = await supabaseClient.auth.signUp({
-       email: data.email,
-       password: data.password,
-       options: {
-         data: {
-           username: data.username.toLowerCase(),
-         },
-         emailRedirectTo: `${window.location.origin}/api/auth/callback`,
-       },
-     });
-
-     if (error) {
-       if (error.message.includes("already registered") || error.message.includes("User already registered")) {
-         throw new Error("Użytkownik o podanym adresie email już istnieje");
-       }
-       throw new Error(error.message);
-     }

+     const response = await fetch("/api/auth/register", {
+       method: "POST",
+       headers: { "Content-Type": "application/json" },
+       body: JSON.stringify({
+         username: data.username,
+         email: data.email,
+         password: data.password,
+       }),
+     });
+
+     if (!response.ok) {
+       const errorData = await response.json();
+       throw new Error(errorData.error?.message || "Wystąpił błąd podczas rejestracji");
+     }

      setIsSuccess(true);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Wystąpił błąd podczas rejestracji");
    } finally {
      setIsSubmitting(false);
    }
  };
```

**Weryfikacja:**

1. Uruchom `npm run dev`
2. Otwórz `http://localhost:3000/register`
3. Wypełnij formularz i wyślij
4. Sprawdź że pokazuje się komunikat o wysłaniu emaila weryfikacyjnego
5. Sprawdź DevTools → Network → powinien być POST do `/api/auth/register` (nie bezpośrednio do Supabase)

---

### Krok 8: Aktualizacja ForgotPasswordForm.tsx

**Czas: 10 minut**

**Plik: `src/components/auth/ForgotPasswordForm.tsx`**

```diff
- import { supabaseClient } from "@/db/supabase.client";
  
  // ... existing code ...

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
-     const { error } = await supabaseClient.auth.resetPasswordForEmail(data.email, {
-       redirectTo: `${window.location.origin}/api/auth/callback`,
-     });
-
-     if (error) {
-       throw new Error(error.message);
-     }

+     const response = await fetch("/api/auth/reset-password", {
+       method: "POST",
+       headers: { "Content-Type": "application/json" },
+       body: JSON.stringify({ email: data.email }),
+     });
+
+     if (!response.ok) {
+       const errorData = await response.json();
+       throw new Error(errorData.error?.message || "Wystąpił błąd podczas wysyłania linku resetującego");
+     }

      setIsSuccess(true);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Wystąpił błąd podczas wysyłania linku resetującego");
    } finally {
      setIsSubmitting(false);
    }
  };
```

**Weryfikacja:**

1. Otwórz `http://localhost:3000/forgot-password`
2. Wypełnij formularz z emailem i wyślij
3. Sprawdź że pokazuje się komunikat o wysłaniu linku
4. Sprawdź DevTools → Network → powinien być POST do `/api/auth/reset-password`

---

### Krok 9: Cleanup i finalizacja

**Czas: 5 minut**

```bash
# 1. Usuń backup pliki jeśli wszystko działa
rm astro.config.mjs.backup

# 2. Usuń supabase.client.ts jeśli nie został wcześniej usunięty (Krok 4)
rm src/db/supabase.client.ts

# 3. Sprawdź czy nie ma innych importów supabaseClient
grep -r "supabaseClient" src/components/
# Oczekiwany output: brak wyników (lub tylko w testach)

# 4. Lint i format
npm run lint:fix
npm run format

# 5. Build produkcyjny
npm run build
```

**Weryfikacja:**

- ✅ Build succeeds bez błędów
- ✅ Brak importów `supabaseClient` w komponentach React
- ✅ Brak błędów TypeScript

---

### Krok 10: Testy funkcjonalne (manualne)

**Czas: 15-20 minut**

#### 10.1. Test rejestracji

```bash
# Uruchom dev server
npm run dev
```

**Scenariusz testu:**

1. ✅ Otwórz `http://localhost:3000/register`
2. ✅ Wypełnij formularz z prawidłowymi danymi:
   - Username: `testuser123`
   - Email: `test123@example.com`
   - Password: `Test1234`
   - Confirm Password: `Test1234`
3. ✅ Kliknij "Zarejestruj się"
4. ✅ **Oczekiwany rezultat:**
   - Pokazuje się komunikat "Sprawdź swoją skrzynkę email"
   - W DevTools → Network → jest POST do `/api/auth/register` (status 201)
   - NIE MA requestów bezpośrednio do `*.supabase.co`
5. ✅ Sprawdź email - powinien przyjść link weryfikacyjny

**Testy walidacji:**

1. ✅ Username za krótki (`ab`) → błąd walidacji
2. ✅ Email nieprawidłowy (`invalid`) → błąd walidacji
3. ✅ Hasło za słabe (`weak`) → błąd walidacji
4. ✅ Hasła nie pasują → błąd walidacji
5. ✅ Email już istnieje → błąd 409 "Użytkownik o podanym adresie email już istnieje"

#### 10.2. Test resetowania hasła

**Scenariusz testu:**

1. ✅ Otwórz `http://localhost:3000/forgot-password`
2. ✅ Wypełnij formularz z emailem: `test123@example.com`
3. ✅ Kliknij "Wyślij link resetujący"
4. ✅ **Oczekiwany rezultat:**
   - Pokazuje się komunikat "Sprawdź swoją skrzynkę email"
   - W DevTools → Network → jest POST do `/api/auth/reset-password` (status 200)
   - NIE MA requestów bezpośrednio do `*.supabase.co`
5. ✅ Sprawdź email - powinien przyjść link resetujący hasło

**Testy edge cases:**

1. ✅ Email nieistniejący → NADAL pokazuje sukces (security by obscurity)
2. ✅ Email nieprawidłowy format → błąd walidacji

#### 10.3. Test logowania (bez zmian, ale weryfikacja)

**Scenariusz testu:**

1. ✅ Otwórz `http://localhost:3000/login`
2. ✅ Zaloguj się z danymi z rejestracji
3. ✅ **Oczekiwany rezultat:**
   - Przekierowanie na `/` (strona główna)
   - W DevTools → Network → jest POST do `/api/auth/login`
   - NIE MA requestów bezpośrednio do `*.supabase.co`

#### 10.4. Weryfikacja bezpieczeństwa

**Sprawdź DevTools:**

1. ✅ Otwórz DevTools → Application → Local Storage
   - **Oczekiwany rezultat:** Brak `SUPABASE_URL` i `SUPABASE_KEY`

2. ✅ Otwórz DevTools → Console → wpisz:
   ```javascript
   console.log(import.meta.env.SUPABASE_URL)
   console.log(import.meta.env.SUPABASE_KEY)
   ```
   - **Oczekiwany rezultat:** `undefined` dla obu

3. ✅ Otwórz DevTools → Sources → sprawdź bundle JavaScript
   - **Oczekiwany rezultat:** Brak stringa `SUPABASE_URL` i `SUPABASE_KEY` w kodzie

4. ✅ Otwórz DevTools → Network → sprawdź requesty
   - **Oczekiwany rezultat:**
     - ✅ Wszystkie requesty auth idą do `/api/auth/*`
     - ❌ ZERO requestów bezpośrednio do `https://[project].supabase.co`

---

### Krok 11: Testy automatyczne (jeśli istnieją)

**Czas: 10-15 minut**

```bash
# 1. Testy jednostkowe (jeśli istnieją dla RegisterForm/ForgotPasswordForm)
npm run test:unit

# 2. Testy E2E (jeśli istnieją)
npm run test:e2e

# 3. Jeśli testy failują, zaktualizuj mock'i:
# - W test/unit/mocks/ może być potrzebna aktualizacja fetch mocków
# - W test/e2e/ może być potrzebna aktualizacja asercji
```

**Przykład aktualizacji testu jednostkowego:**

```typescript
// Przed:
import { supabaseClient } from '@/db/supabase.client'
jest.mock('@/db/supabase.client')

// Po:
global.fetch = jest.fn()

// W teście:
(global.fetch as jest.Mock).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ message: 'Success' }),
})
```

---

## 5. Porównanie rozwiązań

### 5.1. Obecne rozwiązanie (Client-side Supabase)

| Aspekt | Ocena | Opis |
|--------|-------|------|
| **Bezpieczeństwo** | ⚠️ **Ryzykowne** | Klucze widoczne w przeglądarce, możliwość omijania RLS |
| **Kontrola** | ❌ **Niska** | Brak warstwy kontroli nad operacjami |
| **Walidacja** | ❌ **Brak** | Brak server-side validation |
| **Monitoring** | ❌ **Trudny** | Requesty rozproszone (client → Supabase) |
| **Koszty** | ⚠️ **Wyższe** | Więcej requestów do Supabase (retry logic client-side) |
| **Spójność** | ❌ **Niska** | Niespójność z resztą API (login używa endpoint) |
| **Prostota kodu** | ✅ **Wysoka** | Mniej kodu (bezpośrednie wywołania) |
| **Performance** | ✅ **Lepsza** | Brak dodatkowego hop przez API layer |

**Wady:**

- ❌ Klucze Supabase widoczne w DevTools
- ❌ Możliwość obejścia logiki biznesowej
- ❌ Trudniejszy debugging (brak centralnego punktu)
- ❌ Niespójność architektury

**Zalety:**

- ✅ Mniej kodu do napisania
- ✅ Szybsza implementacja (brak API endpoints)
- ✅ Nieco lepsza latency (brak pośrednika)

### 5.2. Pure API Architecture (Server-side tylko)

| Aspekt | Ocena | Opis |
|--------|-------|------|
| **Bezpieczeństwo** | ✅ **Maksymalne** | Klucze nigdy nie trafiają do przeglądarki |
| **Kontrola** | ✅ **Pełna** | Wszystkie operacje przez naszą logikę |
| **Walidacja** | ✅ **Server-side** | Zod schemas w API endpoints |
| **Monitoring** | ✅ **Łatwy** | Wszystkie requesty przez jeden punkt |
| **Koszty** | ✅ **Niższe** | Mniej requestów (server-side retry, caching) |
| **Spójność** | ✅ **Wysoka** | Jeden pattern dla wszystkich operacji |
| **Prostota kodu** | ⚠️ **Średnia** | Więcej kodu (API endpoints + client fetch) |
| **Performance** | ⚠️ **Nieco gorsza** | Dodatkowy hop (~10-20ms latency) |

**Wady:**

- ⚠️ Więcej kodu do napisania (API endpoints)
- ⚠️ Dodatkowa latency (~10-20ms per request)
- ⚠️ Niemożliwość użycia Supabase Realtime client-side (ale to nie jest w MVP)

**Zalety:**

- ✅ Bezpieczne - klucze server-side tylko
- ✅ Spójne z cache'owaniem (TanStack Query → API endpoints)
- ✅ Możliwość dodania rate limiting, logging, analytics
- ✅ Łatwy refactoring w przyszłości
- ✅ Zgodność z dokumentacją projektu

---

## 6. Co zyskujemy, co tracimy

### 6.1. Zyski

#### Bezpieczeństwo

- ✅ **Eliminacja ryzyka wycieku kluczy** - `SUPABASE_KEY` nigdy nie trafia do bundle
- ✅ **Ochrona przed manipulacją** - użytkownik nie może ominąć naszej logiki
- ✅ **Defense in depth** - dodatkowa warstwa ochrony poza RLS

#### Kontrola i monitoring

- ✅ **Centralizacja logów** - wszystkie operacje auth w jednym miejscu
- ✅ **Rate limiting** - możliwość dodania w przyszłości (np. max 5 prób logowania/min)
- ✅ **Analytics** - łatwe dodanie śledzenia (rejestracje, logowania)
- ✅ **A/B testing** - możliwość testowania różnych flows

#### Spójność architektury

- ✅ **Jeden pattern** - wszystkie operacje przez `/api/*` (zgodne z cache'owaniem)
- ✅ **Zgodność z dokumentacją** - Pure API Architecture jak opisano w PRD
- ✅ **Łatwy onboarding** - nowi deweloperzy wiedzą gdzie szukać logiki

#### Skalowalność

- ✅ **Możliwość dodania kolejek** - w przyszłości (np. email verification queue)
- ✅ **Możliwość migracji** - łatwa zmiana providera (z Supabase na inny BaaS)
- ✅ **Microservices ready** - API endpoints mogą być wydzielone do osobnych serwisów

### 6.2. Straty (trade-offs)

#### Performance

- ⚠️ **Dodatkowa latency** - ~10-20ms per request (client → API → Supabase zamiast client → Supabase)
  - **Mitigacja:** W praktyce niezauważalne dla użytkownika końcowego
  - **Kontekst:** Auth operacje są rzadkie (rejestracja 1x, login kilka razy dziennie)

#### Złożoność kodu

- ⚠️ **Więcej kodu** - API endpoints + client fetch zamiast bezpośrednich wywołań
  - **Mitigacja:** Kod jest bardziej zorganizowany i testowalny
  - **Benefit:** Łatwiejszy maintenance w długim terminie

#### Ograniczenia funkcjonalne

- ❌ **Brak Supabase Realtime client-side** - nie można użyć subscriptions w React
  - **Kontekst:** Realtime nie jest w MVP BuddyFinder
  - **Future:** Gdy będzie potrzebne, można dodać WebSocket proxy przez API

- ❌ **Brak Supabase Storage client-side** - upload plików przez API endpoint
  - **Kontekst:** Upload zdjęć nie jest w obecnym MVP
  - **Future:** Można dodać signed URLs przez API endpoint

#### Developer experience

- ⚠️ **Więcej kroków** - dodanie nowej operacji wymaga API endpoint + client code
  - **Mitigacja:** Można stworzyć generator/template dla nowych endpoints
  - **Benefit:** Wymusza przemyślenie flow i walidacji

### 6.3. Rzeczy które NIE są utrudnione

Wbrew obawom, następujące rzeczy są ŁATWE w Pure API Architecture:

- ✅ **Session management** - cookies są automatycznie zarządzane przez [`@supabase/ssr`](https://www.npmjs.com/package/@supabase/ssr)
- ✅ **Auth state w React** - można użyć `useEffect` + `fetch('/api/auth/session')`
- ✅ **Protected routes** - middleware już obsługuje (bez zmian)
- ✅ **OAuth providers** - callback endpoint już jest (`/api/auth/callback`)
- ✅ **File uploads** - signed URLs przez API endpoint (gdy będzie potrzebne)

### 6.4. Podsumowanie trade-offs

| Aspekt | Strata | Zysk | Werdykt |
|--------|--------|------|---------|
| Performance | -10-20ms latency | Rate limiting, caching możliwe | ✅ **Worth it** (auth jest rzadkie) |
| Kod | +2 pliki API | Lepsza organizacja, testy | ✅ **Worth it** |
| Funkcjonalność | Brak Realtime | Nie w MVP | ✅ **Worth it** |
| Bezpieczeństwo | - | Klucze server-only | ✅ **Critical** |
| Spójność | - | Jeden pattern | ✅ **Important** |

**Rekomendacja:** Pure API Architecture jest **znacznie lepsza** mimo drobnych trade-offs.

---

## 7. Rollback plan (jeśli coś pójdzie nie tak)

### Szybki rollback (< 2 minuty)

```bash
# 1. Przywróć backup konfiguracji
cp astro.config.mjs.backup astro.config.mjs

# 2. Przywróć backup env
cp .env.backup .env

# 3. Wróć do poprzedniego commita
git reset --hard HEAD~1

# 4. Restart dev server
npm run dev
```

### Rollback selektywny (zachowaj niektóre zmiany)

```bash
# 1. Przywróć tylko astro.config.mjs
git checkout HEAD~1 -- astro.config.mjs

# 2. Przywróć supabase.client.ts jeśli był usunięty
git checkout HEAD~1 -- src/db/supabase.client.ts

# 3. Przywróć komponenty auth
git checkout HEAD~1 -- src/components/auth/RegisterForm.tsx
git checkout HEAD~1 -- src/components/auth/ForgotPasswordForm.tsx

# 4. Restart
npm run dev
```

### Verifikacja po rollback

```bash
# 1. Sprawdź że aplikacja działa
curl http://localhost:3000/register

# 2. Sprawdź że zmienne są dostępne client-side
# DevTools → Console:
# console.log(import.meta.env.SUPABASE_URL) 
# Powinno zwrócić URL (nie undefined)
```

---

## 8. Checklist wdrożenia

### Przed wdrożeniem

- [ ] Backup plików konfiguracji ([`astro.config.mjs`](../astro.config.mjs), [`.env`](.env))
- [ ] Sprawdź że używasz `anon` key (nie `service_role`)
- [ ] Stwórz feature branch (`git checkout -b feature/server-side-supabase`)
- [ ] Upewnij się że testy przechodzą (`npm run test`)

### Podczas wdrożenia

- [ ] Krok 1: Backup i przygotowanie środowiska ✅
- [ ] Krok 2: Aktualizacja [`astro.config.mjs`](../astro.config.mjs) ✅
- [ ] Krok 3: Aktualizacja `src/db/supabase.server.ts` ✅
- [ ] Krok 4: Usunięcie/deprecation `src/db/supabase.client.ts` ✅
- [ ] Krok 5: Utworzenie `/api/auth/register` endpoint ✅
- [ ] Krok 6: Utworzenie `/api/auth/reset-password` endpoint ✅
- [ ] Krok 7: Aktualizacja `RegisterForm.tsx` ✅
- [ ] Krok 8: Aktualizacja `ForgotPasswordForm.tsx` ✅
- [ ] Krok 9: Cleanup i finalizacja ✅
- [ ] Krok 10: Testy funkcjonalne (manualne) ✅
- [ ] Krok 11: Testy automatyczne ✅

### Po wdrożeniu

- [ ] Aplikacja uruchamia się bez błędów (`npm run dev`)
- [ ] Build produkcyjny działa (`npm run build`)
- [ ] Wszystkie testy przechodzą (`npm run test`)
- [ ] Rejestracja działa (sprawdź manualnie)
- [ ] Reset hasła działa (sprawdź manualnie)
- [ ] Logowanie działa (bez zmian, ale weryfikacja)
- [ ] DevTools → Application → brak `SUPABASE_URL`/`SUPABASE_KEY`
- [ ] DevTools → Network → wszystkie auth requesty przez `/api/*`
- [ ] DevTools → Sources → brak kluczy w bundle JS
- [ ] Usuń backup pliki (`rm *.backup`)
- [ ] Commit i push (`git commit -m "feat: migrate to server-side Supabase variables"`)
- [ ] Utwórz PR i request review

### Dokumentacja

- [ ] Zaktualizuj README.md (jeśli opisywał client-side usage)
- [ ] Zaktualizuj [`.ai/auth-backend.md`](.ai/auth-backend.md) (jeśli istnieje)
- [ ] Dodaj notatkę do [`CHANGELOG.md`](CHANGELOG.md) (jeśli istnieje)

---

## 9. FAQ i troubleshooting

### Q: Build failuje z błędem "Cannot find module 'astro:env/server'"

**A:** Upewnij się że:
1. Zaktualizowałeś Astro do wersji 5.0+ (`npm install astro@latest`)
2. Import jest dokładnie: `import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/server";`
3. Restartowałeś dev server po zmianie [`astro.config.mjs`](../astro.config.mjs)

### Q: RegisterForm/ForgotPasswordForm pokazują błąd po wysłaniu

**A:** Sprawdź:
1. DevTools → Network → status code POST do `/api/auth/*`
2. DevTools → Console → czy są błędy JS?
3. Terminal (server) → czy są błędy server-side?
4. Czy endpoint zwraca prawidłowy JSON? (curl test)

### Q: Użytkownik nie otrzymuje emaila weryfikacyjnego/resetującego

**A:** To problem Supabase, nie naszego kodu:
1. Sprawdź Supabase Dashboard → Authentication → Email Templates
2. Sprawdź czy email jest whitelisted (w dev mode Supabase ma limity)
3. Sprawdź spam folder
4. Sprawdź Supabase logs (Dashboard → Logs)

### Q: Czy mogę tymczasowo wrócić do client-side dla debugowania?

**A:** Tak, ale NIE commituj tego:
```typescript
// Tymczasowo w RegisterForm.tsx:
const TEMP_SUPABASE_URL = 'https://[project].supabase.co'
const TEMP_SUPABASE_KEY = 'eyJ...' // anon key
// ... używaj tymczasowo
```

### Q: Jak przetestować przed wdrożeniem na produkcję?

**A:** 
1. Użyj staging environment z osobnym Supabase projektem
2. Uruchom wszystkie testy E2E
3. Manualnie przetestuj wszystkie flow auth
4. Sprawdź monitoring (jeśli masz)

### Q: Co jeśli muszę dodać Supabase Realtime w przyszłości?

**A:** Rozważ hybrydowe podejście:
1. Większość operacji przez API (jak teraz)
2. Tylko Realtime features używają `anon` key client-side
3. Dodaj osobną konfigurację dla Realtime:
```typescript
SUPABASE_ANON_KEY: envField.string({
  context: "client",  // Tylko dla Realtime
  access: "public",
}),
```

---

## 10. Następne kroki po wdrożeniu

### Natychmiastne

1. ✅ Verify deployment na staging/production
2. ✅ Monitor logs przez pierwsze 24h
3. ✅ Sprawdź czy użytkownicy zgłaszają problemy z auth

### Krótkoterminowe (1-2 tygodnie)

1. 📝 Dodaj rate limiting do auth endpoints (np. `express-rate-limit` lub podobne)
2. 📝 Dodaj logging/analytics (ile rejestracji, loginów dziennie)
3. 📝 Dodaj health check endpoint (`/api/health`)
4. 📝 Dodaj CAPTCHA do rejestracji (jeśli spam będzie problemem)

### Średnioterminowe (1-2 miesiące)

1. 🔄 Rozważ dodanie refresh token rotation (Supabase default)
2. 🔄 Dodaj OAuth providers (Google, Facebook) przez API endpoints
3. 🔄 Rozważ dodanie 2FA (Time-based OTP)

### Długoterminowe (3-6 miesięcy)

1. 🚀 Implementacja cache'owania z TanStack Query (zgodnie z `cache-introduction.md`)
2. 🚀 Możliwość migracji z Supabase na inny provider (jeśli potrzeba)
3. 🚀 Microservices - wydzielenie auth do osobnego serwisu

---

## 11. Podsumowanie

### Kluczowe punkty

1. ✅ **Czas wdrożenia:** ~2-3 godziny (z testami)
2. ✅ **Ryzyko:** Niskie (izolowane zmiany, łatwy rollback)
3. ✅ **Zalety:** Bezpieczeństwo, spójność, kontrola
4. ✅ **Wady:** Minimalnie więcej kodu, nieznaczna latency
5. ✅ **Rekomendacja:** **WDRÓŻ PRZED** cache'owaniem

### Checklist finalny

- [ ] Przeczytałem całą instrukcję
- [ ] Zrozumiałem trade-offs
- [ ] Mam backup [`.env`](.env) i [`astro.config.mjs`](../astro.config.mjs)
- [ ] Znam rollback plan
- [ ] Jestem gotowy do wdrożenia

### Kontakt w razie problemów

Jeśli napotkasz problemy podczas wdrożenia:

1. Sprawdź sekcję FAQ (Sekcja 9)
2. Sprawdź Supabase documentation: https://supabase.com/docs/guides/auth
3. Sprawdź Astro documentation: https://docs.astro.build/en/guides/environment-variables/

---

**Autor:** AI Assistant  
**Data:** 2025-11-17  
**Wersja:** 1.0  
**Status:** ✅ Ready for implementation
