# API Endpoint Implementation Plan: Remove a Sport from User's Profile

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionemu użytkownikowi usunięcie jednego ze swoich sportów z profilu. Identyfikator sportu do usunięcia jest określany za pomocą parametru w ścieżce URL.

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/profiles/me/sports/{sport_id}`
- **Parametry**:
  - Wymagane: `sport_id` (w ścieżce URL)
  - Opcjonalne: Brak
- **Request Body**: Brak

## 3. Wykorzystywane typy

- Brak nowych DTO lub modeli Command.

## 4. Szczegóły odpowiedzi

- **Pomyślna odpowiedź (Success)**:
  - **Kod**: `204 No Content`
  - **Payload**: Brak
- **Odpowiedzi błędów (Error)**:
  - **Kod**: `400 Bad Request` - Jeśli `sport_id` jest nieprawidłowe.
  - **Kod**: `401 Unauthorized` - Jeśli użytkownik nie jest uwierzytelniony.
  - **Kod**: `404 Not Found` - Jeśli użytkownik nie ma tego sportu w swoim profilu.
  - **Kod**: `500 Internal Server Error` - W przypadku nieoczekiwanego błędu serwera.

## 5. Przepływ danych

1. Żądanie `DELETE` trafia do punktu końcowego `/api/profiles/me/sports/{sport_id}`.
2. Middleware weryfikuje sesję użytkownika.
3. Punkt końcowy parsuje `sport_id` ze ścieżki URL i waliduje, czy jest to poprawna liczba całkowita.
4. Punkt końcowy wywołuje metodę `deleteUserSport(userId, sportId)` w `UserSportService`.
5. Metoda `deleteUserSport` wykonuje zapytanie `DELETE` w tabeli `user_sports`, używając klauzuli `WHERE` dopasowującej zarówno `user_id`, jak i `sport_id`.
6. Usługa sprawdza wynik operacji usunięcia. Klient Supabase zwraca dane (lub błąd) i `count`. Jeśli `count` wynosi 0, oznacza to, że żaden wiersz nie został usunięty, więc usługa zgłasza błąd `NotFoundError`.
7. Jeśli usunięcie się powiodło (count > 0), usługa kończy działanie pomyślnie.
8. Punkt końcowy, po pomyślnym wykonaniu usługi, zwraca odpowiedź z kodem statusu `204 No Content`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Obowiązkowe, obsługiwane przez middleware.
- **Autoryzacja**: Zapytanie `DELETE` musi być ściśle ograniczone warunkami `user_id = {session.user.id}` ORAZ `sport_id = {params.sport_id}`. Zapobiega to usunięciu danych należących do innego użytkownika.
- **Walidacja danych wejściowych**: `sport_id` musi być poprawnie sparsowane i zwalidowane jako liczba całkowita, aby uniknąć błędów w zapytaniach do bazy danych.

## 7. Obsługa błędów

- Jeśli `sport_id` jest nieprawidłowe (np. nie jest liczbą), punkt końcowy zwraca `400 Bad Request`.
- Jeśli usługa nie znajdzie rekordu do usunięcia, zgłasza błąd `NotFoundError`, który punkt końcowy mapuje na odpowiedź `404 Not Found`.
- Wszelkie inne błędy bazy danych podczas operacji `DELETE` są przechwytywane i zwracana jest ogólna odpowiedź `500 Internal Server Error`.

## 8. Rozważania dotyczące wydajności

- Operacja `DELETE` jest ukierunkowana na klucz podstawowy tabeli `user_sports`, co jest wysoce wydajne. Nie przewiduje się problemów z wydajnością.

## 9. Etapy wdrożenia

1. **Usługa**: W `src/lib/services/user-sport.service.ts` dodaj nową metodę `deleteUserSport(userId: string, sportId: number, supabase: SupabaseClient)`.
2. **Implementacja usługi**:
   - Zaimplementuj logikę usuwania rekordu z tabeli `user_sports` za pomocą `supabase.from('user_sports').delete().match(...)`.
   - Sprawdź `count` zwrócony przez Supabase. Jeśli `count` jest 0 lub `null`, zgłoś `NotFoundError`.
3. **Punkt końcowy**: W `src/pages/api/profiles/me/sports/[sport_id].ts` zaimplementuj funkcję obsługi `DELETE`.
4. **Logika punktu końcowego**:
   - Wyodrębnij i zwaliduj `sport_id` z `Astro.params`.
   - Wywołaj `userSportService.deleteUserSport()`.
   - W przypadku błędu `NotFoundError` z usługi, zwróć `404 Not Found`.
   - W przypadku powodzenia, zwróć `204 No Content`.
5. **Testy**: Dodaj testy dla punktu końcowego `DELETE`, w tym pomyślne usunięcie, próbę usunięcia nieistniejącego sportu oraz sprawdzenie, czy użytkownik nie może usunąć sportu innego użytkownika.
