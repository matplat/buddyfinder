# API Endpoint Implementation Plan: Add a Sport to User's Profile

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionemu użytkownikowi dodanie nowego sportu do swojego profilu. Wymaga podania ID sportu, specyficznych parametrów dla tego sportu oraz opcjonalnego niestandardowego zasięgu. Po pomyślnym dodaniu zwraca nowo utworzony obiekt sportu użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/profiles/me/sports`
- **Parametry**:
  - Wymagane: Brak (w URL)
  - Opcjonalne: Brak
- **Request Body**:

  ```json
  {
    "sport_id": 2,
    "parameters": { "speed_km_h": 30, "distance_km": 60 },
    "custom_range_km": 40
  }
  ```

## 3. Wykorzystywane typy

- **`AddUserSportCommand`**: Nowy schemat Zod do zdefiniowania w `src/lib/dto/user-sport.dto.ts` w celu walidacji ciała żądania.

  ```typescript
  import { z } from 'zod';

  export const AddUserSportCommand = z.object({
    sport_id: z.number().int().positive(),
    parameters: z.record(z.any()).refine(val => Object.keys(val).length > 0, {
      message: "Parameters cannot be an empty object",
    }),
    custom_range_km: z.number().int().min(1).max(100).optional().nullable(),
  });

  export type AddUserSportCommand = z.infer<typeof AddUserSportCommand>;
  ```

- **`UserSport`**: Interfejs zdefiniowany w `types.ts` będzie używany jako typ odpowiedzi.

## 4. Szczegóły odpowiedzi

- **Pomyślna odpowiedź (Success)**:
  - **Kod**: `201 Created`
  - **Payload**: Nowo utworzony obiekt sportu użytkownika (zgodny z `UserSport`).
- **Odpowiedzi błędów (Error)**:
  - **Kod**: `400 Bad Request` - Jeśli walidacja ciała żądania nie powiodła się lub `sport_id` nie istnieje.
  - **Kod**: `401 Unauthorized` - Jeśli użytkownik nie jest uwierzytelniony.
  - **Kod**: `409 Conflict` - Jeśli użytkownik już ma ten sport w swoim profilu.
  - **Kod**: `500 Internal Server Error` - W przypadku nieoczekiwanego błędu serwera.

## 5. Przepływ danych

1. Żądanie `POST` z ciałem trafia do punktu końcowego `/api/profiles/me/sports`.
2. Middleware weryfikuje sesję użytkownika. Jeśli jest nieprawidłowa, zwraca `401 Unauthorized`.
3. Funkcja obsługi punktu końcowego parsuje i waliduje ciało żądania przy użyciu schematu Zod `AddUserSportCommand`. W przypadku niepowodzenia walidacji zwraca `400 Bad Request` ze szczegółami błędu.
4. Punkt końcowy wywołuje metodę `addUserSport(userId, command)` w `UserSportService`.
5. Metoda `addUserSport` wykonuje następujące operacje:
   a. Sprawdza, czy sport o podanym `sport_id` istnieje w tabeli `sports`. Jeśli nie, zgłasza błąd (przechwytywany przez obsługę punktu końcowego i zwracany jako `400 Bad Request`).
   b. Sprawdza, czy w tabeli `user_sports` istnieje już wpis dla `user_id` i `sport_id`. Jeśli tak, zgłasza błąd konfliktu (zwracany jako `409 Conflict`).
   c. Wstawia nowy wiersz do tabeli `user_sports` z `user_id`, `sport_id`, `parameters` i `custom_range_km`.
   d. Pobiera nowo utworzony wiersz (wraz z nazwą sportu z tabeli `sports`) i zwraca go.
6. Punkt końcowy otrzymuje zwrócony obiekt z usługi, serializuje go do formatu JSON i wysyła jako odpowiedź z kodem statusu `201 Created`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Obowiązkowe, obsługiwane przez middleware.
- **Autoryzacja**: Logika biznesowa musi zapewnić, że sport jest dodawany do profilu aktualnie zalogowanego użytkownika (`user_id` z sesji).
- **Walidacja danych wejściowych**: Rygorystyczna walidacja za pomocą Zod jest kluczowa, aby zapobiec wstrzykiwaniu nieprawidłowych danych. Sprawdzenie `CHECK` w bazie danych dla `custom_range_km` zapewnia dodatkową warstwę ochrony.
- **Zapobieganie konfliktom**: Sprawdzenie istnienia sportu u użytkownika przed wstawieniem zapobiega duplikatom i błędom bazy danych.

## 7. Obsługa błędów

- Błędy walidacji Zod są przechwytywane i zwracane jako `400 Bad Request`.
- Jeśli `sport_id` nie zostanie znaleziony w tabeli `sports`, usługa powinna zgłosić błąd, który zostanie zmapowany na `400 Bad Request`.
- Jeśli sport już istnieje dla użytkownika, usługa powinna zgłosić błąd, który zostanie zmapowany na `409 Conflict`.
- Błędy bazy danych podczas operacji `INSERT` lub `SELECT` powinny być przechwytywane i zwracane jako `500 Internal Server Error`.

## 8. Rozważania dotyczące wydajności

- Operacje składają się z kilku zapytań (`SELECT` w `sports`, `SELECT` w `user_sports`, `INSERT` w `user_sports`). Można je zoptymalizować, potencjalnie łącząc je w transakcję, aby zapewnić spójność danych.
- Indeksy na `user_sports(user_id, sport_id)` i `sports(id)` są kluczowe dla wydajności zapytań sprawdzających.

## 9. Etapy wdrożenia

1. **DTO/Command**: Zaktualizuj plik `src/lib/dto/user-sport.dto.ts`, dodając schemat Zod `AddUserSportCommand`.
2. **Usługa**: W `src/lib/services/user-sport.service.ts` dodaj nową metodę `addUserSport(userId: string, command: AddUserSportCommand, supabase: SupabaseClient)`.
3. **Implementacja usługi**:
   - Zaimplementuj logikę sprawdzania istnienia sportu.
   - Zaimplementuj logikę sprawdzania konfliktu (czy użytkownik już ma ten sport).
   - Zaimplementuj operację wstawiania do tabeli `user_sports`.
   - Zaimplementuj pobranie i zwrócenie nowo utworzonego obiektu.
4. **Punkt końcowy**: W `src/pages/api/profiles/me/sports/index.ts` dodaj funkcję obsługi `POST`.
5. **Logika punktu końcowego**:
   - Dodaj logikę do obsługi żądań `POST`.
   - Przeanalizuj i zwaliduj ciało żądania za pomocą `AddUserSportCommand.safeParse()`.
   - Wywołaj `userSportService.addUserSport()`.
   - Obsłuż błędy z usługi i mapuj je na odpowiednie kody statusu HTTP.
   - Zwróć odpowiedź `201 Created` z nowym obiektem.
