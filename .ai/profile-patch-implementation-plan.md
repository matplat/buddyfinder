# API Endpoint Implementation Plan: Update Current User's Profile

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionemu użytkownikowi aktualizację wybranych pól w jego profilu. Operacja wykorzystuje metodę `PATCH`, co pozwala na częściową aktualizację zasobu. Wszystkie pola w ciele żądania są opcjonalne.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/profiles/me`
- **Parametry**: Brak parametrów URL.
- **Request Body**: Opcjonalne ciało żądania w formacie JSON.

  ```json
  {
    "display_name": "Johnny Doe",
    "location": { "type": "Point", "coordinates": [-73.9857, 40.7484] },
    "default_range_km": 30,
    "social_links": {
      "strava": "https://strava.com/users/12345",
      "garmin": "https://connect.garmin.com/modern/profile/johndoe"
    }
  }
  ```

  - **Pola opcjonalne**: `display_name`, `location`, `default_range_km`, `social_links`.

## 3. Wykorzystywane typy

- **`UpdateProfileDto` (Zod Schema)**: Schemat do walidacji przychodzących danych.

  ```typescript
  import { z } from 'zod';

  export const UpdateProfileDtoSchema = z.object({
    display_name: z.string().min(3).max(50).optional(),
    location: z.object({
      type: z.literal('Point'),
      coordinates: z.tuple([z.number(), z.number()])
    }).optional(),
    default_range_km: z.number().int().min(1).max(100).optional(),
    social_links: z.record(z.string(), z.string().url()).optional()
  }).partial(); // .partial() makes all fields optional
  ```

- **`UpdateProfileCommand`**: Model polecenia przekazywany do warstwy serwisowej.

  ```typescript
  export type UpdateProfileCommand = z.infer<typeof UpdateProfileDtoSchema>;
  ```

- **`Profile`**: Istniejący typ z `src/types.ts` używany w odpowiedzi.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**: Zwraca pełny, zaktualizowany obiekt profilu użytkownika.

  ```json
  // ... (struktura zgodna z typem Profile z src/types.ts)
  ```

- **Odpowiedzi błędów**:
  - `400 Bad Request`: Błąd walidacji danych wejściowych.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych

1. Żądanie `PATCH` trafia do punktu końcowego Astro `/api/profiles/me`.
2. Middleware (`src/middleware/index.ts`) weryfikuje sesję użytkownika za pomocą Supabase. Jeśli sesja jest nieprawidłowa, zwraca `401 Unauthorized`. ID użytkownika jest dołączane do `Astro.locals`.
3. Handler API (`src/pages/api/profiles/me.ts`) odczytuje ciało żądania.
4. Dane wejściowe są walidowane przy użyciu schematu `UpdateProfileDtoSchema` (Zod). W przypadku błędu walidacji, zwracany jest `400 Bad Request` ze szczegółami.
5. Zweryfikowane dane (DTO) są mapowane na `UpdateProfileCommand`.
6. Wywoływana jest metoda `profileService.updateUserProfile(userId, command)`, gdzie `userId` pochodzi z `Astro.locals.session.user.id`.
7. Metoda serwisowa konstruuje obiekt do aktualizacji i używa klienta Supabase do wykonania operacji `update()` na tabeli `profiles`, gdzie `id` pasuje do `userId`.
8. Serwis zwraca zaktualizowany profil lub rzuca błąd.
9. Handler API przechwytuje wynik z serwisu i wysyła odpowiedź `200 OK` z pełnym obiektem profilu lub `500 Internal Server Error` w przypadku błędu serwisu.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do punktu końcowego jest chroniony przez middleware, które sprawdza ważność sesji Supabase.
- **Autoryzacja**: Kluczowym zabezpieczeniem jest użycie ID użytkownika (`userId`) pochodzącego **wyłącznie z sesji serwerowej** (`Astro.locals.session.user.id`). Zapobiega to próbom modyfikacji cudzych profili (IDOR).
- **Walidacja danych**: Wszystkie dane wejściowe są ściśle walidowane za pomocą Zod, co chroni przed nieprawidłowymi typami danych, przekroczeniem zakresów i atakami typu Mass Assignment.
- **Sanityzacja**: Należy upewnić się, że dane tekstowe (`display_name`, `social_links`) są poprawnie escapowane po stronie klienta podczas renderowania, aby zapobiec XSS.

## 7. Obsługa błędów

- **`400 Bad Request`**: Zwracany, gdy walidacja Zod nie powiedzie się. Odpowiedź powinna zawierać szczegóły błędów walidacji.
- **`401 Unauthorized`**: Zwracany przez middleware, jeśli użytkownik nie ma aktywnej, ważnej sesji.
- **`500 Internal Server Error`**: Zwracany, gdy operacja na bazie danych w `profile.service.ts` zakończy się niepowodzeniem z nieoczekiwanego powodu. Błąd powinien być logowany na serwerze.

## 8. Rozważania dotyczące wydajności

- Operacja `UPDATE` w bazie danych jest wykonywana na kolumnie `id`, która jest kluczem głównym, co zapewnia wysoką wydajność.
- Ładunek (payload) jest mały, więc nie przewiduje się wąskich gardeł związanych z siecią.
- Walidacja po stronie serwera jest szybka i nie powinna stanowić problemu wydajnościowego.

## 9. Etapy wdrożenia

1. **Definicja typów i walidacji**:
    - Utwórz nowy plik `src/lib/dto/profile.dto.ts`.
    - W pliku tym zdefiniuj schemat Zod `UpdateProfileDtoSchema` oraz typ `UpdateProfileCommand`.
2. **Aktualizacja serwisu**:
    - W pliku `src/lib/services/profile.service.ts` dodaj nową metodę asynchroniczną `updateUserProfile(userId: string, command: UpdateProfileCommand): Promise<Profile>`.
    - Wewnątrz metody, zaimplementuj logikę aktualizacji profilu przy użyciu `supabase.client.ts`, wykonując `update()` na tabeli `profiles`.
    - Upewnij się, że metoda zwraca zaktualizowany profil lub obsługuje błędy.
3. **Implementacja handlera API**:
    - W pliku `src/pages/api/profiles/me.ts` dodaj obsługę metody `PATCH`.
    - W handlerze `PATCH`:
        - Pobierz `userId` z `Astro.locals.session.user.id`.
        - Odczytaj i sparsuj ciało żądania.
        - Zwaliduj dane przy użyciu `UpdateProfileDtoSchema.safeParse()`.
        - W przypadku sukcesu walidacji, wywołaj `profileService.updateUserProfile()`.
        - Zwróć odpowiednią odpowiedź (`200 OK` lub `500 Internal Server Error`).
        - W przypadku błędu walidacji, zwróć `400 Bad Request` z informacjami o błędach.
4. **Testowanie**:
    - Dodaj testy jednostkowe dla nowej metody `updateUserProfile` w serwisie, mockując klienta Supabase.
