# API Endpoint Implementation Plan: Get User's Sports

## 1. Przegląd punktu końcowego

Ten punkt końcowy pobiera listę sportów i powiązanych z nimi parametrów dla aktualnie uwierzytelnionego użytkownika. Zwraca tablicę obiektów, z których każdy reprezentuje sport, który użytkownik dodał do swojego profilu.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/profiles/me/sports`
- **Parametry**:
  - Wymagane: Brak
  - Opcjonalne: Brak
- **Request Body**: Brak

## 3. Wykorzystywane typy

- **`UserSportDto`**: z `src/types.ts`.

## 4. Szczegóły odpowiedzi

- **Pomyślna odpowiedź (Success)**:
  - **Kod**: `200 OK`
  - **Payload**:

    ```json
    [
      {
        "sport_id": 1,
        "name": "Running",
        "parameters": { "pace_seconds": 330, "distance_km": 10 },
        "custom_range_km": 15
      }
    ]
    ```

- **Odpowiedź błędu (Error)**:
  - **Kod**: `401 Unauthorized` - Jeśli użytkownik nie jest uwierzytelniony.
  - **Kod**: `500 Internal Server Error` - W przypadku nieoczekiwanego błędu serwera.

## 5. Przepływ danych

1. Żądanie `GET` trafia do punktu końcowego `/api/profiles/me/sports`.
2. Middleware (`src/middleware/index.ts`) weryfikuje token JWT użytkownika i dołącza sesję do `Astro.locals`. Jeśli sesja jest nieprawidłowa, middleware zwraca `401 Unauthorized`.
3. Funkcja obsługi punktu końcowego wywołuje metodę `getUserSports(userId)` z nowej usługi `UserSportService`. `userId` jest pobierany z `Astro.locals.session.user.id`.
4. Metoda `getUserSports` w `UserSportService` wykonuje zapytanie do bazy danych Supabase:
   - Łączy tabele `user_sports` i `sports`.
   - Filtruje wyniki według `user_id`.
   - Wybiera kolumny: `sport_id`, `name`, `parameters`, `custom_range_km`.
   - Zapytanie SQL (koncepcyjnie):

     ```sql
     SELECT
       us.sport_id,
       s.name,
       us.parameters,
       us.custom_range_km
     FROM
       user_sports us
     JOIN
       sports s ON us.sport_id = s.id
     WHERE
       us.user_id = {current_user_id};
     ```

5. Usługa `UserSportService` mapuje wyniki z bazy danych na tablicę obiektów `UserSportDto`.
6. Punkt końcowy serializuje tablicę DTO do formatu JSON i wysyła ją jako odpowiedź z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do punktu końcowego musi być chroniony. Middleware musi zapewnić, że tylko uwierzytelnieni użytkownicy mogą uzyskać dostęp do tego zasobu.
- **Autoryzacja**: Zapytanie do bazy danych musi być ściśle ograniczone do `user_id` aktualnie zalogowanego użytkownika. Zapobiega to możliwości odczytu danych innych użytkowników.
- **Walidacja danych wejściowych**: Nie ma danych wejściowych od użytkownika do walidacji poza sesją.

## 7. Obsługa błędów

- Jeśli `Astro.locals.session` jest `null`, middleware zwróci odpowiedź `401 Unauthorized`.
- Wszelkie błędy zgłoszone przez klienta Supabase podczas zapytania do bazy danych (np. problemy z połączeniem) powinny zostać przechwycone, zarejestrowane i powinna zostać zwrócona ogólna odpowiedź `500 Internal Server Error`.

## 8. Rozważania dotyczące wydajności

- Zapytanie do bazy danych powinno być wydajne. Należy upewnić się, że istnieją odpowiednie indeksy na kolumnach `user_sports.user_id` i `user_sports.sport_id` (klucz podstawowy już to zapewnia).
- Liczba sportów na użytkownika jest spodziewana jako niewielka, więc paginacja nie jest konieczna w początkowej implementacji.

## 9. Etapy wdrożenia

1. **Usługa**: Utwórz nowy plik `src/lib/services/user-sport.service.ts`.
2. **Implementacja usługi**: W `user-sport.service.ts` zaimplementuj klasę `UserSportService` z metodą `getUserSports(userId: string, supabase: SupabaseClient)`. Ta metoda będzie zawierać logikę zapytania do bazy danych.
3. **Punkt końcowy**: Utwórz plik `src/pages/api/profiles/me/sports/index.ts`.
4. **Logika punktu końcowego**: W `index.ts` zaimplementuj funkcję `GET` (Astro API route).
   - Uzyskaj dostęp do sesji użytkownika z `Astro.locals.session`.
   - Zwróć `401` jeśli nie ma sesji.
   - Utwórz instancję `UserSportService`.
   - Wywołaj `userSportService.getUserSports()` z ID użytkownika i instancją klienta Supabase.
   - Zwróć wyniki jako odpowiedź JSON z kodem `200 OK`.
