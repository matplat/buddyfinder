# API Endpoint Implementation Plan: Update a Sport on User's Profile

## 1. Przegląd punktu końcowego

Ten punkt końcowy pozwala uwierzytelnionemu użytkownikowi na aktualizację parametrów lub niestandardowego zasięgu dla konkretnego sportu, który już istnieje w jego profilu. Identyfikator sportu jest przekazywany jako parametr ścieżki.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PUT`
- **Struktura URL**: `/api/profiles/me/sports/{sport_id}`
- **Parametry**:
  - Wymagane: `sport_id` (w ścieżce URL)
  - Opcjonalne: Brak
- **Request Body**: Ciało żądania zawiera pola do zaktualizowania. Co najmniej jedno pole musi być obecne.

  ```json
  {
    "parameters": { "pace_seconds": 320, "distance_km": 12 },
    "custom_range_km": 20
  }
  ```

## 3. Wykorzystywane typy

- **`UpdateUserSportCommand`**: Nowy schemat Zod w `src/lib/dto/user-sport.dto.ts` do walidacji częściowej aktualizacji.

  ```typescript
  import { z } from 'zod';

  // Re-uses parts of AddUserSportCommand but makes them optional
  export const UpdateUserSportCommand = z.object({
    parameters: z.record(z.any()).refine(val => Object.keys(val).length > 0, {
      message: "Parameters cannot be an empty object",
    }).optional(),
    custom_range_km: z.number().int().min(1).max(100).optional().nullable(),
  }).refine(data => Object.keys(data).length > 0, {
    message: "Request body cannot be empty.",
  });

  export type UpdateUserSportCommand = z.infer<typeof UpdateUserSportCommand>;
  ```

- **`UserSport`**: Istniejący interfejs `UserSport` będzie używany jako typ odpowiedzi.

## 4. Szczegóły odpowiedzi

- **Pomyślna odpowiedź (Success)**:
  - **Kod**: `200 OK`
  - **Payload**: Zaktualizowany obiekt sportu użytkownika (zgodny z `UserSport`).
- **Odpowiedzi błędów (Error)**:
  - **Kod**: `400 Bad Request` - Jeśli walidacja ciała żądania nie powiodła się lub `sport_id` jest nieprawidłowe.
  - **Kod**: `401 Unauthorized` - Jeśli użytkownik nie jest uwierzytelniony.
  - **Kod**: `404 Not Found` - Jeśli użytkownik nie ma tego sportu w swoim profilu.
  - **Kod**: `500 Internal Server Error` - W przypadku nieoczekiwanego błędu serwera.

## 5. Przepływ danych

1. Żądanie `PUT` trafia do punktu końcowego `/api/profiles/me/sports/{sport_id}`.
2. Middleware weryfikuje sesję użytkownika.
3. Punkt końcowy parsuje `sport_id` ze ścieżki URL i waliduje, czy jest to poprawna liczba całkowita.
4. Punkt końcowy parsuje i waliduje ciało żądania przy użyciu schematu Zod `UpdateUserSportCommand`.
5. Punkt końcowy wywołuje metodę `updateUserSport(userId, sportId, command)` w `UserSportService`.
6. Metoda `updateUserSport` wykonuje następujące operacje:
   a. Konstruuje obiekt aktualizacji na podstawie pól dostarczonych w `command`.
   b. Wykonuje zapytanie `UPDATE` w tabeli `user_sports`, aktualizując wiersz, w którym `user_id` i `sport_id` pasują.
   c. Sprawdza liczbę zaktualizowanych wierszy. Jeśli wynosi 0, oznacza to, że nie znaleziono pasującego rekordu, więc zgłasza błąd "Not Found".
   d. Jeśli aktualizacja się powiodła, pobiera zaktualizowany wiersz (wraz z nazwą sportu) i zwraca go.
7. Punkt końcowy otrzymuje zaktualizowany obiekt, serializuje go do formatu JSON i wysyła jako odpowiedź z kodem `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Obowiązkowe.
- **Autoryzacja**: Klauzula `WHERE` w zapytaniu `UPDATE` musi zawierać zarówno `user_id` (z sesji), jak i `sport_id` (z URL). Jest to kluczowe, aby uniemożliwić jednemu użytkownikowi modyfikację danych innego użytkownika.
- **Walidacja danych wejściowych**: `sport_id` musi być poprawną liczbą. Ciało żądania musi być zwalidowane za pomocą Zod, aby zapewnić, że `custom_range_km` mieści się w dozwolonym zakresie, a `parameters` są prawidłowym obiektem.

## 7. Obsługa błędów

- Błędy walidacji Zod lub nieprawidłowe `sport_id` zwracają `400 Bad Request`.
- Jeśli usługa nie znajdzie rekordu do aktualizacji (ponieważ sport nie należy do użytkownika), zgłasza błąd, który jest mapowany na `404 Not Found`.
- Błędy bazy danych podczas operacji `UPDATE` są przechwytywane i zwracane jako `500 Internal Server Error`.

## 8. Rozważania dotyczące wydajności

- Operacja `UPDATE` jest ukierunkowana na konkretny wiersz przy użyciu klucza podstawowego (`user_id`, `sport_id`), co powinno być bardzo wydajne.
- Po aktualizacji wymagane jest dodatkowe zapytanie `SELECT`, aby pobrać pełny obiekt (z nazwą sportu). Można to połączyć w jedno zapytanie za pomocą klauzuli `RETURNING` w PostgreSQL, co jest obsługiwane przez Supabase.

## 9. Etapy wdrożenia

1. **DTO/Command**: Zaktualizuj `src/lib/dto/user-sport.dto.ts`, dodając schemat Zod `UpdateUserSportCommand`.
2. **Usługa**: W `src/lib/services/user-sport.service.ts` dodaj nową metodę `updateUserSport(userId: string, sportId: number, command: UpdateUserSportCommand, supabase: SupabaseClient)`.
3. **Implementacja usługi**:
   - Zaimplementuj logikę aktualizacji rekordu w tabeli `user_sports` za pomocą `supabase.from('user_sports').update(...).match(...)`.
   - Sprawdź, czy aktualizacja się powiodła. Jeśli nie, zgłoś błąd `NotFoundError`.
   - Użyj `.select()` z `single()` po aktualizacji, aby pobrać i zwrócić zaktualizowany obiekt.
4. **Punkt końcowy**: Utwórz plik `src/pages/api/profiles/me/sports/[sport_id].ts`.
5. **Logika punktu końcowego**:
   - Zaimplementuj funkcję `PUT` (lub `PATCH`).
   - Wyodrębnij `sport_id` z `Astro.params`.
   - Zwaliduj `sport_id` i ciało żądania.
   - Wywołaj `userSportService.updateUserSport()`.
   - Obsłuż błędy (np. `NotFoundError` z usługi) i mapuj je na kody statusu HTTP.
   - Zwróć odpowiedź `200 OK` ze zaktualizowanym obiektem.
