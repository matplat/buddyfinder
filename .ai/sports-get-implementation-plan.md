# API Endpoint Implementation Plan: Get List of All Sports

## 1. Przegląd punktu końcowego

Ten punkt końcowy `GET /api/sports` jest przeznaczony do pobierania pełnej, predefiniowanej listy dyscyplin sportowych dostępnych w aplikacji. Jest to publicznie dostępny, ale wymagający uwierzytelnienia, zasób przeznaczony tylko do odczytu. Służy do dostarczania klientom (np. interfejsowi użytkownika) opcji wyboru sportów podczas konfiguracji profilu lub wyszukiwania.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/sports`
- **Parametry**:
  - **Wymagane**: Brak
  - **Opcjonalne**: Brak
- **Request Body**: Brak

## 3. Wykorzystywane typy

W celu zapewnienia spójności i bezpieczeństwa typów, zostaną wykorzystane następujące definicje.

- **`Sport` DTO (Data Transfer Object)**: Reprezentuje pojedynczy sport w odpowiedzi API.

  ```typescript
  // src/types.ts
  export interface Sport {
    id: number;
    name: string;
  }
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`200 OK`)**:
  - **Struktura**: Tablica obiektów `Sport`.
  - **Przykład**:

    ```json
    [
      { "id": 1, "name": "Running" },
      { "id": 2, "name": "Road Cycling" },
      { "id": 3, "name": "MTB" }
    ]
    ```

- **Odpowiedzi błędów**:
  - `401 Unauthorized`: Zwracane, gdy użytkownik nie jest uwierzytelniony.
  - `500 Internal Server Error`: Zwracane w przypadku nieoczekiwanego błędu serwera.

## 5. Przepływ danych

1. Klient wysyła żądanie `GET` na adres `/api/sports`.
2. Oprogramowanie pośredniczące (middleware) Astro (`src/middleware/index.ts`) przechwytuje żądanie. Sprawdza, czy użytkownik jest uwierzytelniony, weryfikując sesję Supabase. Jeśli nie, zwraca `401 Unauthorized`.
3. Jeśli uwierzytelnianie się powiedzie, żądanie jest przekazywane do handlera API w `src/pages/api/sports/index.ts`.
4. Handler API wywołuje metodę `getAllSports()` z nowo utworzonego serwisu `SportService` (`src/lib/services/sport.service.ts`).
5. Metoda `getAllSports()` używa klienta Supabase do wykonania zapytania do bazy danych: `supabase.from('sports').select('id, name')`.
6. Baza danych zwraca listę wszystkich rekordów z tabeli `sports`.
7. `SportService` zwraca dane do handlera API.
8. Handler API serializuje dane do formatu JSON i wysyła odpowiedź `200 OK` z listą sportów w ciele odpowiedzi.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do punktu końcowego musi być chroniony i dostępny wyłącznie dla uwierzytelnionych użytkowników. Zostanie to zaimplementowane w oprogramowaniu pośredniczącym Astro, które będzie weryfikować tokeny sesji Supabase.

## 7. Obsługa błędów

- **Brak uwierzytelnienia**: Middleware Astro automatycznie obsłuży ten przypadek, zwracając kod stanu `401` i odpowiedni komunikat, zanim żądanie dotrze do logiki biznesowej.
- **Błąd bazy danych**: Wszelkie błędy zgłoszone przez klienta Supabase podczas pobierania danych (np. problem z połączeniem, brak tabeli) zostaną przechwycone w bloku `try...catch` w `SportService` lub w handlerze API. W takim przypadku serwer zarejestruje szczegółowy błąd i zwróci ogólną odpowiedź `500 Internal Server Error` do klienta.

## 8. Rozważania dotyczące wydajności

- **Buforowanie (Caching)**: Lista sportów jest statyczna i rzadko się zmienia. Aby zoptymalizować wydajność i zmniejszyć obciążenie bazy danych, można zaimplementować strategię buforowania po stronie serwera (np. w pamięci podręcznej) lub po stronie klienta za pomocą odpowiednich nagłówków HTTP (`Cache-Control`).

## 9. Etapy wdrożenia

1. **Aktualizacja typów**:
   - W pliku `src/types.ts` zdefiniuj lub upewnij się, że istnieje interfejs `Sport` lub analogiczny.

     ```typescript
     export interface Sport {
       id: number;
       name: string;
     }
     ```

2. **Utworzenie serwisu (`SportService`)**:
   - Utwórz nowy plik `src/lib/services/sport.service.ts`.
   - Zaimplementuj w nim klasę `SportService` z metodą `getAllSports`, która pobiera dane z tabeli `sports` przy użyciu klienta Supabase.

     ```typescript
     import { supabase } from '@/db/supabase.client';
     import type { Sport } from '@/types';

     export class SportService {
       public static async getAllSports(): Promise<Sport[]> {
         const { data, error } = await supabase
           .from('sports')
           .select('id, name');

         if (error) {
           // Log the error for debugging purposes
           console.error('Error fetching sports:', error);
           throw new Error('Failed to fetch sports from the database.');
         }

         return data || [];
       }
     }
     ```

3. **Utworzenie punktu końcowego API**:
   - Utwórz plik `src/pages/api/sports/index.ts`.
   - Zaimplementuj handler `GET`, który wykorzystuje `SportService` do pobierania danych i zwraca je jako odpowiedź JSON.

     ```typescript
     import type { APIRoute } from 'astro';
     import { SportService } from '@/lib/services/sport.service';

     export const GET: APIRoute = async ({ locals }) => {
       // Authentication is handled by middleware, but we can double-check
       if (!locals.session) {
         return new Response(
           JSON.stringify({ message: 'Unauthorized' }),
           { status: 401, headers: { 'Content-Type': 'application/json' } }
         );
       }

       try {
         const sports = await SportService.getAllSports();
         return new Response(
           JSON.stringify(sports),
           { status: 200, headers: { 'Content-Type': 'application/json' } }
         );
       } catch (error) {
         console.error(error);
         return new Response(
           JSON.stringify({ message: 'Internal Server Error' }),
           { status: 500, headers: { 'Content-Type': 'application/json' } }
         );
       }
     };
     ```

4. **Weryfikacja middleware**:
   - Upewnij się, że plik `src/middleware/index.ts` poprawnie obsługuje uwierzytelnianie dla ścieżek API, w tym `/api/sports`.

5. **Testowanie**:
   - Utwórz test jednostkowy dla `SportService`, aby zweryfikować poprawność interakcji z bazą danych (można użyć mocków).
