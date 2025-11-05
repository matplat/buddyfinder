# Specyfikacja Techniczna: Moduł Autentykacji Użytkowników

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i plan implementacji funkcjonalności rejestracji, logowania, wylogowywania oraz odzyskiwania hasła w aplikacji BuddyFinder.

Kluczowym założeniem jest wykorzystanie **Supabase Auth** jako dostawcy usług autentykacji oraz integracja z frameworkiem **Astro** działającym w trybie `output: "server"`.

## 2. Architektura Interfejsu Użytkownika (Frontend)

### 2.1. Nowe Strony (Pages)

W katalogu `src/pages/` zostaną utworzone następujące strony Astro, które będą renderować interaktywne formularze React:

- **`src/pages/login.astro`**
    - **Cel:** Strona logowania dla istniejących użytkowników.
    - **Zawartość:** Będzie renderować komponent `<LoginForm client:load />`.
    - **Logika serwerowa:** Jeśli użytkownik posiada już aktywną sesję (sprawdzenie w middleware), zostanie automatycznie przekierowany na stronę główną (`/`).

- **`src/pages/register.astro`**
    - **Cel:** Strona rejestracji dla nowych użytkowników.
    - **Zawartość:** Będzie renderować komponent `<RegisterForm client:load />`.
    - **Logika serwerowa:** Podobnie jak na stronie logowania, zalogowany użytkownik zostanie przekierowany na stronę główną.

- **`src/pages/forgot-password.astro`**
    - **Cel:** Strona umożliwiająca zainicjowanie procesu odzyskiwania hasła.
    - **Zawartość:** Będzie renderować komponent `<ForgotPasswordForm client:load />`.

- **`src/pages/api/auth/callback.ts`**
    - **Cel:** Endpoint API (Astro API Route) do obsługi przekierowań zwrotnych z Supabase, np. po potwierdzeniu adresu e-mail.
    - **Logika:** Wymieni otrzymany kod autoryzacyjny na sesję użytkownika i zapisze ją w ciasteczkach, a następnie przekieruje użytkownika na odpowiednią stronę (np. edycję profilu po pierwszej rejestracji).

### 2.2. Modyfikacja Istniejących Elementów

- **`src/layouts/Layout.astro`**
    - **Cel:** Dynamiczne wyświetlanie elementów nawigacji w zależności od stanu zalogowania.
    - **Zmiany:**
        1. W sekcji frontmatter (`---`) layout odczyta informację o sesji użytkownika z `Astro.locals.session`.
        2. W części renderującej (HTML) zostanie dodana logika warunkowa:
            - **Jeśli użytkownik jest zalogowany:** Wyświetli link do profilu (`/profile/me`) oraz przycisk/link "Wyloguj".
            - **Jeśli użytkownik nie jest zalogowany:** Wyświetli przyciski/linki "Zaloguj się" (`/login`) i "Zarejestruj się" (`/register`).

### 2.3. Nowe Komponenty (React)

W katalogu `src/components/auth/` zostaną utworzone nowe, interaktywne komponenty React, które obsłużą logikę formularzy po stronie klienta. Komponenty będą wykorzystywać `shadcn/ui` (dla `Input`, `Button`, `Form`, `Label`) oraz `zod` i `react-hook-form` do walidacji.

- **`src/components/auth/LoginForm.tsx`**
    - **Odpowiedzialność:** Obsługa formularza logowania.
    - **Pola:** Login (e-mail lub nazwa użytkownika), Hasło.
    - **Logika:**
        - Walidacja client-side (np. czy pola nie są puste).
        - Po submisji, formularz wywołuje dedykowany endpoint API (`POST /api/auth/login`), przesyłając dane logowania.
        - Komponent obsługuje błędy zwrócone przez API (np. "Nieprawidłowe dane logowania") i wyświetla komunikat użytkownikowi.
        - Po pomyślnym zalogowaniu, komponent przekierowuje na stronę główną (`/`) za pomocą `window.location.href`.

- **`src/components/auth/RegisterForm.tsx`**
    - **Odpowiedzialność:** Obsługa formularza rejestracji.
    - **Pola:** Nazwa użytkownika, E-mail, Hasło, Potwierdzenie hasła.
    - **Logika:**
        - Walidacja client-side (zgodność haseł, minimalna długość hasła, format e-mail).
        - Po submisji, wywołanie funkcji `supabase.auth.signUp()`.
        - Obsługa błędów (np. "User already registered").
        - Po sukcesie, Supabase wyśle e-mail weryfikacyjny. Komponent poinformuje użytkownika o konieczności sprawdzenia skrzynki mailowej. Zgodnie z US-001, po kliknięciu w link użytkownik zostanie zalogowany (obsłużone przez `callback`) i przekierowany do edycji profilu.

- **`src/components/auth/ForgotPasswordForm.tsx`**
    - **Odpowiedzialność:** Formularz do wysyłania linku resetującego hasło.
    - **Pola:** E-mail.
    - **Logika:**
        - Po submisji, wywołanie `supabase.auth.resetPasswordForEmail()`.
        - Wyświetlenie komunikatu o wysłaniu instrukcji na podany adres e-mail.

## 3. Logika Backendowa

Dzięki trybowi `output: "server"` w Astro, cała logika związana z sesją będzie zarządzana po stronie serwera.

### 3.1. Middleware

Plik `src/middleware/index.ts` będzie centralnym punktem kontroli dostępu.

- **Odpowiedzialność:**
    1. **Zarządzanie sesją:** Na każde żądanie, middleware użyje biblioteki `@supabase/ssr` do odczytania ciasteczka sesji i zweryfikowania jego poprawności po stronie serwera.
    2. **Udostępnianie sesji:** Zweryfikowana sesja (lub `null`) zostanie umieszczona w `Astro.locals.session`, dzięki czemu będzie dostępna we wszystkich stronach `.astro` i endpointach API.
    3. **Ochrona ścieżek (Route Guarding):** Middleware będzie chronić strony wymagające zalogowania (np. `/profile`, `/matches`). Jeśli niezalogowany użytkownik spróbuje uzyskać do nich dostęp, zostanie przekierowany na stronę logowania (`/login`).

### 3.2. Endpointy API

- **`src/pages/api/auth/login.ts`**
    - **Metoda:** `POST`
    - **Logika:** Endpoint pośredniczący w procesie logowania. Odbiera login (e-mail lub nazwę użytkownika) i hasło. Najpierw sprawdza, czy login jest adresem e-mail. Jeśli nie, wyszukuje użytkownika po nazwie w tabeli `profiles`, aby uzyskać jego e-mail. Następnie wywołuje serwerową funkcję `supabase.auth.signInWithPassword()` z uzyskanym adresem e-mail i hasłem. W przypadku sukcesu, Supabase (poprzez bibliotekę `@supabase/ssr`) automatycznie zarządza sesją i ustawia odpowiednie ciasteczka.

- **`src/pages/api/auth/logout.ts`**
    - **Metoda:** `POST`
    - **Logika:** Wywoła serwerową funkcję `supabase.auth.signOut()`, która unieważni token i usunie ciasteczka sesji. Następnie zwróci odpowiedź o pomyślnym wylogowaniu, a klient przekieruje użytkownika na stronę logowania.

### 3.3. Modele Danych

Supabase Auth automatycznie zarządza tabelą `auth.users`. Podczas rejestracji, w polu `raw_user_meta_data` zapiszemy `username`. Będzie to wymagało napisania triggera w bazie danych Supabase, który przy tworzeniu nowego użytkownika w `auth.users` skopiuje `username` do publicznej tabeli `profiles`, aby nazwa użytkownika była łatwo dostępna.

## 4. System Autentykacji (Supabase)

### 4.1. Konfiguracja Klienta Supabase

Plik `src/db/supabase.client.ts` zostanie zmodyfikowany, aby poprawnie obsługiwać tworzenie klienta Supabase zarówno po stronie serwera (w middleware, na stronach Astro), jak i po stronie klienta (w komponentach React). Użyjemy do tego dedykowanej biblioteki `@supabase/ssr`, która zarządza wymianą tokenów i ciasteczkami.

### 4.2. Procesy Autentykacji

- **Rejestracja (US-001):**
    1. Użytkownik wypełnia formularz w `RegisterForm.tsx`.
    2. Komponent wywołuje `supabase.auth.signUp()` z e-mailem, hasłem i opcjonalnymi metadanymi (`username`).
    3. Supabase tworzy użytkownika, ale oznacza go jako niepotwierdzonego i wysyła e-mail weryfikacyjny. Jest to kluczowe, ponieważ podstawową formą kontaktu w MVP jest e-mail, więc jego poprawność musi być zweryfikowana.
    4. Użytkownik klika link w e-mailu, co kieruje go do `GET /api/auth/callback`.
    5. Endpoint `callback` wymienia token na sesję, ustawia ciasteczka. **To jest moment, w którym rejestrację uznaje się za w pełni zakończoną.**
    6. Zgodnie z US-001, po pomyślnej weryfikacji użytkownik jest automatycznie zalogowany i przekierowany do edycji profilu (`/profile/me`).

- **Logowanie (US-002):**
    1. Użytkownik wypełnia formularz w `LoginForm.tsx`, podając e-mail lub nazwę użytkownika oraz hasło.
    2. Komponent wysyła żądanie `POST` do endpointu `/api/auth/login`.
    3. Endpoint serwerowy weryfikuje dane, w razie potrzeby zamieniając nazwę użytkownika na e-mail, i wywołuje `supabase.auth.signInWithPassword()`.
    4. Po pomyślnej weryfikacji, biblioteka `@supabase/ssr` na serwerze ustawia ciasteczka sesji.
    5. Komponent po otrzymaniu pozytywnej odpowiedzi przekierowuje użytkownika na stronę główną.

- **Wylogowanie (US-003):**
    1. Użytkownik klika przycisk "Wyloguj" w `Layout.astro`.
    2. Skrypt po stronie klienta wysyła żądanie `POST` do `/api/auth/logout`.
    3. Endpoint serwerowy wywołuje `supabase.auth.signOut()`.
    4. Po otrzymaniu pozytywnej odpowiedzi, klient przekierowuje na `/login`.

- **Odzyskiwanie hasła:**
    1. Użytkownik podaje e-mail w `ForgotPasswordForm.tsx`.
    2. Komponent wywołuje `supabase.auth.resetPasswordForEmail()`, podając URL do strony resetowania hasła (np. `/update-password`).
    3. Użytkownik otrzymuje e-mail z linkiem. Po kliknięciu jest kierowany na stronę, gdzie może ustawić nowe hasło. Ta strona będzie zawierała komponent React wywołujący `supabase.auth.updateUser()`.
