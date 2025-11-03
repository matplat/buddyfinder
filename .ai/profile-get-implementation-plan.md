# API Endpoint Implementation Plan: Get Current User's Profile

## 1. Przegląd punktu końcowego

Ten punkt końcowy (`GET /api/profiles/me`) jest przeznaczony do pobierania pełnych informacji o profilu aktualnie uwierzytelnionego użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/profiles/me`
- **Parametry**:
  - **Wymagane**: Brak.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.
- **Nagłówki**:
  - `Authorization`: `Bearer <SUPABASE_JWT>` (Wymagany, weryfikowany przez middleware).

## 3. Wykorzystywane typy

Do implementacji tego punktu końcowego konieczne jest wykorzystanie typu DTO `ProfileDTO` z pliku `src/types.ts`.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`200 OK`)**:
  - **Payload**: Obiekt JSON zgodny z typem `ProfileDto`.

    ```json
    {
      "id": "a1b2c3d4-...",
      "username": "john_doe",
      "display_name": "John Doe",
      "location": { "type": "Point", "coordinates": [-74.0060, 40.7128] },
      "default_range_km": 25,
      "social_links": {
        "strava": "https://strava.com/users/12345"
      },
      "created_at": "2025-10-31T10:00:00Z",
      "updated_at": "2025-10-31T12:00:00Z"
    }
    ```

- **Odpowiedzi błędów**:
  - `401 Unauthorized`: Jeśli uwierzytelnienie nie powiedzie się.
  - `404 Not Found`: Jeśli profil dla uwierzytelnionego użytkownika nie istnieje.
  - `500 Internal Server Error`: W przypadku nieoczekiwanych błędów serwera.

## 5. Przepływ danych

1. Żądanie `GET` trafia na serwer Astro pod adresem `/api/profiles/me`.
2. Middleware Supabase (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje token JWT z nagłówka `Authorization` i pobiera sesję użytkownika.
3. Jeśli sesja jest prawidłowa, zostaje dołączona do `Astro.locals.session`. W przeciwnym razie middleware zwraca odpowiedź `401 Unauthorized`.
4. Sterowanie przechodzi do handlera API w `src/pages/api/profiles/me.ts`.
5. Handler sprawdza, czy `Astro.locals.session.user` istnieje.
6. ID użytkownika (`Astro.locals.session.user.id`) jest przekazywane do metody `ProfileService.getCurrentUserProfile(userId)`.
7. `ProfileService` wykonuje zapytanie `SELECT` do tabeli `profiles` w bazie danych Supabase, szukając rekordu o pasującym `id`.
8. Jeśli rekord zostanie znaleziony, serwis mapuje go na obiekt `ProfileDto` i zwraca do handlera.
9. Jeśli rekord nie zostanie znaleziony, serwis zwraca `null`.
10. Handler na podstawie wyniku z serwisu:
    - Jeśli otrzymał `ProfileDto`, zwraca odpowiedź `200 OK` z obiektem w ciele.
    - Jeśli otrzymał `null`, zwraca odpowiedź `404 Not Found`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp jest ściśle ograniczony do uwierzytelnionych użytkowników. Middleware Supabase jest jedynym punktem wejścia dla weryfikacji tożsamości.
- **Autoryzacja**: Należy wdrożyć politykę bezpieczeństwa na poziomie wiersza (RLS) w Supabase dla tabeli `profiles`, aby zapewnić, że użytkownicy mogą odczytywać (`SELECT`) wyłącznie własne dane.

  ```sql
  CREATE POLICY "Enable read access for users on their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
  ```

- **Walidacja danych**: Ponieważ ten punkt końcowy nie przyjmuje żadnych danych wejściowych od użytkownika (poza tokenem), ryzyko związane z walidacją jest minimalne. Kluczowe jest poleganie na `id` użytkownika z zaufanego źródła, jakim jest sesja Supabase.

## 7. Obsługa błędów

- **`401 Unauthorized`**: Obsługiwane automatycznie przez middleware Supabase, gdy token jest nieprawidłowy, wygasł lub go brakuje.
- **`404 Not Found`**: Implementowane w handlerze API. Zwracane, gdy `ProfileService` nie znajdzie profilu dla prawidłowo uwierzytelnionego użytkownika.
- **`500 Internal Server Error`**: Obsługiwane za pomocą bloku `try...catch` w handlerze API. Wszelkie nieoczekiwane błędy (np. błąd połączenia z bazą) powinny być logowane, a klient powinien otrzymać generyczną odpowiedź o błędzie serwera.

## 8. Rozważania dotyczące wydajności

- **Indeksowanie bazy danych**: Zapytanie o profil opiera się na kluczu głównym (`id`), który jest domyślnie indeksowany. Zapewnia to bardzo wysoką wydajność wyszukiwania (`O(log n)` lub `O(1)` w zależności od implementacji indeksu).
- **Wielkość ładunku**: Ładunek odpowiedzi jest stosunkowo mały. Nie przewiduje się problemów z wydajnością związanych z transferem danych.

## 9. Etapy wdrożenia

1. **Utworzenie serwisu**: Stwórz plik `src/lib/services/profile.service.ts` (jeśli nie istnieje).
2. **Implementacja logiki serwisu**: W `profile.service.ts` zaimplementuj metodę `getCurrentUserProfile(userId: string)`, która będzie komunikować się z Supabase, pobierać dane i mapować je na `ProfileDto`.
3. **Utworzenie pliku trasy API**: Stwórz plik `src/pages/api/profiles/me.ts`.
4. **Implementacja handlera API**: W `me.ts` zaimplementuj logikę handlera, która:
    - Pobiera sesję z `Astro.locals`.
    - Wywołuje `ProfileService`.
    - Obsługuje przypadki sukcesu (`200 OK`) i braku profilu (`404 Not Found`).
    - Implementuje blok `try...catch` do obsługi błędów serwera (`500 Internal Server Error`).
5. **Konfiguracja RLS**: Upewnij się, że w bazie danych Supabase istnieje odpowiednia polityka RLS dla tabeli `profiles`, ograniczająca dostęp do odczytu tylko dla właściciela profilu.
6. **Testowanie**:
    - Napisz testy jednostkowe dla `ProfileService`.
