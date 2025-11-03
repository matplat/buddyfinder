# API Endpoint Implementation Plan: Get Matched Users

## 1. Przegląd punktu końcowego

Ten punkt końcowy (`GET /api/matches`) jest odpowiedzialny za pobieranie listy potencjalnych dopasowań dla aktualnie uwierzytelnionego użytkownika. Mechanizm dopasowania opiera się na analizie geoprzestrzennej, porównując lokalizacje i zadeklarowane zasięgi podróży użytkowników. Wyniki są sortowane, aby na pierwszym miejscu znalazły się osoby najbliżej, a następnie te, z którymi użytkownik dzieli najwięcej wspólnych sportów. Endpoint obsługuje paginację w celu efektywnego zarządzania dużymi zbiorami wyników.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/matches`
- **Parametry**:
  - **Wymagane**: Brak
  - **Opcjonalne**:
    - `limit` (integer): Liczba wyników do zwrócenia. Domyślnie `20`. Musi być liczbą dodatnią.
    - `offset` (integer): Przesunięcie wyników dla paginacji. Domyślnie `0`. Musi być liczbą nieujemną.
- **Request Body**: Brak

## 3. Wykorzystywane typy

Do implementacji zostaną wykorzystane istniejące typy zdefiniowane w `src/types.ts`:

- **`GetMatchesResponseDto`**: Główny kontener odpowiedzi.
  - `data: MatchedUserDto[]`
  - `pagination: PaginationDto`
- **`MatchedUserDto`**: Reprezentuje pojedyncze dopasowanie.
  - `id: string` (UUID)
  - `username: string`
  - `display_name: string`
  - `email: string`
  - `distance_km: number`
  - `social_links: jsonb`
  - `sports: UserSportDto[]`
- **`UserSportDto`**: Reprezentuje sport w profilu użytkownika.
- **`PaginationDto`**: Zawiera metadane paginacji (`total`, `limit`, `offset`).

## 4. Przepływ danych

Logika zostanie zaimplementowana jako funkcja PostgreSQL (RPC) w Supabase, aby zmaksymalizować wydajność i uprościć kod po stronie aplikacji.

1. **Handler API (Astro)**:
    - Odbiera żądanie `GET /api/matches`.
    - Weryfikuje sesję użytkownika za pomocą wbudowanego mechanizmu Supabase.
    - Waliduje i parsuje parametry `limit` i `offset`.
    - Pobiera ID uwierzytelnionego użytkownika.
    - Wywołuje funkcję RPC w Supabase (`get_matches_for_user`), przekazując `user_id`, `limit` i `offset` jako argumenty.
    - Otrzymuje dane z funkcji RPC i formatuje je zgodnie ze strukturą `GetMatchesResponseDto`.
    - Zwraca odpowiedź JSON.

2. **Funkcja RPC w PostgreSQL (`get_matches_for_user`)**:
    - **Argumenty**: `current_user_id uuid`, `page_limit int`, `page_offset int`.
    - **Krok 1: Pobranie danych bieżącego użytkownika**: Pobiera `location` i `default_range_km` z tabeli `profiles` dla `current_user_id`. Jeśli brakuje tych danych, funkcja rzuca błąd, który zostanie przechwycony przez handler API.
    - **Krok 2: Znalezienie potencjalnych dopasowań**: Skanuje tabelę `profiles`, aby znaleźć innych użytkowników (`p2`), którzy spełniają następujące warunki:
        - Nie są bieżącym użytkownikiem (`p2.id != current_user_id`).
        - Mają zdefiniowaną lokalizację.
        - Znajdują się w swoich domyślnych zasięgach podróży. Warunek ten jest sprawdzany za pomocą funkcji PostGIS: `ST_DWithin(p1.location, p2.location, p1.default_range_km + p2.default_range_km)`.
    - **Krok 3: Obliczenie danych i agregacja**: Dla każdego dopasowania:
        - Oblicza odległość w kilometrach: `ST_Distance(p1.location, p2.location) AS distance_km`.
        - Zlicza liczbę wspólnych sportów poprzez `JOIN` z `user_sports` i agregację.
        - Agreguje informacje o sportach dopasowanego użytkownika do formatu JSON.
    - **Krok 4: Sortowanie i paginacja**:
        - Sortuje wyniki rosnąco po `distance_km`, a następnie malejąco po liczbie wspólnych sportów.
        - Stosuje `LIMIT` i `OFFSET` na podstawie przekazanych parametrów.
    - **Krok 5: Zwrócenie wyników**: Zwraca całkowitą liczbę znalezionych dopasowań (przed paginacją) oraz listę spaginowanych wyników w formacie, który można łatwo zmapować na `MatchedUserDto`.

## 5. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do punktu końcowego musi być chroniony i wymagać aktywnej sesji użytkownika. Zostanie to zrealizowane za pomocą middleware Supabase w Astro.
- **Autoryzacja**: Cała logika jest wykonywana w kontekście ID uwierzytelnionego użytkownika, co zapobiega możliwości odpytywania o dopasowania w imieniu innych osób. Funkcja RPC będzie operować na ID użytkownika przekazanym z zaufanego środowiska serwerowego.
- **Walidacja danych wejściowych**: Parametry `limit` i `offset` będą rygorystycznie parsowane do liczb całkowitych, aby zapobiec potencjalnym atakom (np. SQL Injection, chociaż użycie RPC je minimalizuje).
- **Ujawnienie danych**: Endpoint zwraca adres e-mail użytkowników. Jest to informacja wrażliwa i należy rozważyć, czy jest to absolutnie konieczne dla funkcjonalności MVP. W przyszłości można wprowadzić mechanizm zgody na udostępnianie e-maila.

## 6. Obsługa błędów

- **`400 Bad Request`**:
  - Zwracany, gdy profil uwierzytelnionego użytkownika nie ma ustawionej lokalizacji (`location`) lub domyślnego zasięgu (`default_range_km`).
  - Zwracany, gdy parametry `limit` lub `offset` są nieprawidłowe (np. ujemne, nie są liczbą).
- **`401 Unauthorized`**:
  - Zwracany przez middleware, gdy użytkownik nie jest zalogowany.
- **`500 Internal Server Error`**:
  - Zwracany w przypadku nieoczekiwanego błędu po stronie serwera, np. gdy funkcja RPC w bazie danych zakończy się niepowodzeniem. Błąd powinien być logowany po stronie serwera w celu dalszej analizy.

## 7. Rozważania dotyczące wydajności

- **Indeksy geoprzestrzenne**: Kluczowe dla wydajności jest istnienie indeksu `GIST` na kolumnie `location` w tabeli `profiles`. Zapewni to szybkie działanie funkcji `ST_DWithin` i `ST_Distance`.
- **Logika w bazie danych (RPC)**: Przeniesienie złożonej logiki dopasowania do funkcji PostgreSQL jest znacznie bardziej wydajne niż pobieranie dużej ilości danych i przetwarzanie ich w aplikacji Node.js.
- **Paginacja**: Ograniczenie liczby zwracanych wyników za pomocą `limit` i `offset` jest kluczowe dla utrzymania niskiego czasu odpowiedzi i zmniejszenia obciążenia zarówno serwera, jak i klienta. Należy rozważyć wprowadzenie maksymalnej wartości dla `limit` (np. 100).

## 8. Etapy wdrożenia

1. **Definicja funkcji RPC**:
    - Stworzyć nowy plik migracji Supabase (`supabase/migrations/YYYYMMDDHHMMSS_create_get_matches_function.sql`).
    - W pliku zdefiniować funkcję `get_matches_for_user(current_user_id uuid, page_limit int, page_offset int)` zawierającą logikę opisaną w sekcji "Przepływ danych".

2. **Stworzenie serwisu**:
    - Utworzyć plik `src/services/matchesService.ts`.
    - Zaimplementować w nim funkcję `getMatches(userId, limit, offset)`, która będzie wywoływać RPC `get_matches_for_user` za pomocą klienta Supabase (`supabase.rpc(...)`).
    - Dodać obsługę błędów i mapowanie wyników.

3. **Implementacja API Route**:
    - Utworzyć plik `src/pages/api/matches/index.ts`.
    - Dodać logikę pobierania sesji użytkownika w celu uzyskania `userId`.
    - Dodać walidację parametrów `limit` i `offset`.
    - Wywołać metodę z `matchesService`.
    - Zaimplementować obsługę błędów zgodnie z sekcją "Obsługa błędów" (np. sprawdzanie, czy profil użytkownika jest kompletny).
    - Sformatować pomyślną odpowiedź jako `GetMatchesResponseDto` i zwrócić ją z kodem `200 OK`.

4. **Testowanie**:
    - Przygotować dane testowe do bazy danych, w tym kilku użytkowników z różnymi lokalizacjami i sportami, w formie pliku migracji.
