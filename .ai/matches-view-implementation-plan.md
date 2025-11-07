# Plan implementacji widoku MatchesView

## 1. Przegląd

Widok `MatchesView` jest głównym interfejsem aplikacji po zalogowaniu, dostępnym na stronie głównej (`/`). Jego celem jest prezentacja listy użytkowników, którzy zostali dopasowani do bieżącego użytkownika na podstawie ich lokalizacji i zadeklarowanego zasięgu podróży. Widok umożliwia szybkie przeglądanie podstawowych informacji o dopasowanych osobach oraz dostęp do szczegółowych danych po rozwinięciu karty użytkownika. Implementacja obejmuje obsługę ładowania danych, paginację "load more", stany pusty/błędów oraz szkielet interfejsu (skeleton).

## 2. Routing widoku

- **Ścieżka**: `/`
- **Plik**: `src/pages/index.astro`
- **Uwagi**: Widok `MatchesView` będzie renderowany jako komponent React (`client:load`) wewnątrz strony Astro. Zapewni to interaktywność po stronie klienta.

## 3. Struktura komponentów

Hierarchia komponentów zostanie zorganizowana w następujący sposób, aby zapewnić reużywalność i czytelność kodu:

```
- MatchesView.tsx (Komponent główny, zarządzający stanem)
  - MatchesSkeleton.tsx (Wyświetlany podczas ładowania danych)
  - MatchesEmptyState.tsx (Wyświetlany w przypadku braku lokalizacji, braku dopasowań lub błędu)
  - Accordion (z shadcn/ui, kontener dla listy)
    - UserMatchCard.tsx[] (Lista komponentów dla każdego dopasowania)
      - AccordionItem (z shadcn/ui)
        - AccordionTrigger (Nagłówek karty z nazwą i dystansem)
        - AccordionContent (Treść karty z e-mailem, sportami i linkami)
          - SportBadge.tsx (Istniejący komponent)
          - SocialLinkBadge.tsx (Istniejący komponent)
  - Button (z shadcn/ui, przycisk "Załaduj więcej")
```

## 4. Szczegóły komponentów

### `MatchesView.tsx`

- **Opis komponentu**: Główny kontener widoku. Odpowiada za orkiestrację pobierania danych za pomocą hooka `useMatchesView` i renderowanie odpowiedniego stanu UI (ładowanie, błąd, pusty stan, lista dopasowań).
- **Główne elementy**: Wykorzystuje `MatchesSkeleton`, `MatchesEmptyState` oraz `Accordion` do wyświetlania `UserMatchCard`. Zawiera przycisk "Załaduj więcej".
- **Obsługiwane interakcje**: Kliknięcie przycisku "Załaduj więcej".
- **Obsługiwana walidacja**: Brak bezpośredniej walidacji; reaguje na stany (`isLoading`, `error`) dostarczone przez hook `useMatchesView`.
- **Typy**: `UserMatchViewModel`, `Pagination`
- **Propsy**: Brak.

### `UserMatchCard.tsx`

- **Opis komponentu**: Prezentuje dane pojedynczego dopasowanego użytkownika w formie rozwijanego elementu akordeonu. W stanie zwiniętym pokazuje nazwę i dystans, a w rozwiniętym e-mail, listę sportów i linki do mediów społecznościowych.
- **Główne elementy**: `AccordionItem`, `AccordionTrigger`, `AccordionContent` z `shadcn/ui`. Wykorzystuje istniejące komponenty `SportBadge` i `SocialLinkBadge` do wyświetlania szczegółów.
- **Obsługiwane interakcje**: Rozwijanie i zwijanie karty. Kliknięcie linku do social media (otwarcie w nowej karcie).
- **Obsługiwana walidacja**: Brak.
- **Typy**: `UserMatchViewModel`.
- **Propsy**:
  - `match: UserMatchViewModel`: Obiekt zawierający wszystkie dane dopasowanego użytkownika.

### `MatchesSkeleton.tsx`

- **Opis komponentu**: Wyświetla uproszczoną, szarą wersję listy dopasowań, sygnalizując użytkownikowi, że dane są w trakcie ładowania. Żeby mocniej sugerować ładowanie, komponenty mogą na zmianę bardzo delikatnie "migać" przez zmianę jasności (efekt shimmer).
- **Główne elementy**: Kilka komponentów `Skeleton` z `shadcn/ui` ułożonych w strukturę przypominającą `UserMatchCard`.
- **Obsługiwane interakcje**: Brak.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak.
- **Propsy**: Brak.

### `MatchesEmptyState.tsx`

- **Opis komponentu**: Komponent do wyświetlania informacji w sytuacjach, gdy lista jest pusta. Obsługuje różne scenariusze, takie jak brak ustawionej lokalizacji, brak dopasowań lub błąd serwera.
- **Główne elementy**: `Card` z `shadcn/ui`, zawierający tytuł, opis i opcjonalnie przycisk `Button` z wezwaniem do działania (np. "Uzupełnij profil").
- **Obsługiwane interakcje**: Kliknięcie przycisku CTA (jeśli jest obecny).
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak.
- **Propsy**:
  - `title: string`: Tytuł komunikatu.
  - `description: string`: Opis problemu lub sugestia dla użytkownika.
  - `cta?: { text: string; onClick: () => void; }`: Opcjonalny przycisk akcji.

## 5. Typy

Do implementacji widoku potrzebne będą następujące typy, bazujące na DTO z API, ale zdefiniowane jako ViewModels dla przejrzystości w kodzie frontendu.

- **`UserMatchViewModel`**: Reprezentuje dane jednego dopasowanego użytkownika.
  - `user_id: string`: ID użytkownika.
  - `display_name: string`: Nazwa wyświetlana użytkownika.
  - `email: string`: Adres e-mail.
  - `distance_km: number`: Dystans w kilometrach od bieżącego użytkownika.
  - `social_links: Record<string, string>`: Obiekt z linkami do mediów społecznościowych (np. `{ "strava": "url" }`).
  - `sports: UserSportViewModel[]`: Lista sportów uprawianych przez użytkownika.

- **`UserSportViewModel`**: Reprezentuje dane pojedynczego sportu użytkownika.
  - `sport_id: number`: ID sportu.
  - `name: string`: Nazwa sportu.
  - `parameters: Record<string, any>`: Obiekt z zadeklarowanymi parametrami dla danego sportu.

- **`Pagination`**: Obiekt przechowujący stan paginacji zwrócony przez API.
  - `total: number`: Całkowita liczba dopasowań.
  - `limit: number`: Liczba wyników na stronę.
  - `offset: number`: Aktualne przesunięcie.

## 6. Zarządzanie stanem

Logika biznesowa, stan i komunikacja z API zostaną zamknięte w dedykowanym custom hooku `useMatchesView`.

- **`useMatchesView.ts`**:
  - **Cel**: Abstrakcja logiki pobierania dopasowań, zarządzania stanem ładowania, błędów i paginacji.
  - **Zarządzany stan**:
    - `matches: UserMatchViewModel[]`: Lista załadowanych dopasowań.
    - `pagination: Pagination | null`: Aktualny stan paginacji.
    - `isLoading: boolean`: `true` podczas początkowego ładowania.
    - `isFetchingNextPage: boolean`: `true` podczas doładowywania kolejnej strony.
    - `error: 'no_location' | 'generic' | null`: Przechowuje stan błędu.
    - `hasNextPage: boolean`: Wartość logiczna wskazująca, czy można załadować więcej wyników.
  - **Udostępniane funkcje**:
    - `loadMore()`: Funkcja do pobierania i dołączania kolejnej strony wyników.

## 7. Integracja API

- **Endpoint**: `GET /api/matches`
- **Pobieranie danych**: Hook `useMatchesView` będzie odpowiedzialny za wywołania `fetch` do tego endpointu.
- **Paginacja**: Parametry `limit` i `offset` będą przekazywane w URL-u. Domyślnie `limit=20`, `offset=0`. Funkcja `loadMore` będzie inkrementować `offset`.
- **Typy**:
  - **Żądanie**: `GET /api/matches?limit={number}&offset={number}`
  - **Odpowiedź (sukces)**: `GetMatchesResponseDto` (zgodnie z `matches.dto.ts`), zawierający `data: MatchDto[]` i `pagination`.
  - **Odpowiedź (błąd)**:
    - `400 Bad Request`: Gdy użytkownik nie ma ustawionej lokalizacji.
    - `401 Unauthorized`: Gdy użytkownik nie jest zalogowany (obsługiwane globalnie przez middleware).

## 8. Interakcje użytkownika

- **Ładowanie strony**: Użytkownik widzi `MatchesSkeleton`. Po załadowaniu danych, widzi listę `UserMatchCard` lub `MatchesEmptyState`.
- **Rozwijanie karty**: Kliknięcie na nagłówek `UserMatchCard` rozwija go, pokazując szczegóły. Akordeon będzie typu `single`, więc rozwinięcie jednej karty zwinie inną.
- **Kliknięcie "Załaduj więcej"**: Wywołuje funkcję `loadMore`, która dołącza nowe wyniki do listy. Przycisk może pokazywać stan ładowania i staje się nieaktywny, gdy `hasNextPage` jest `false`.
- **Kliknięcie linku social media**: Otwiera URL w nowej karcie przeglądarki.

## 9. Warunki i walidacja

- **Warunek wstępny**: Użytkownik musi mieć ustawioną lokalizację w profilu, aby API zwróciło dopasowania.
- **Walidacja po stronie klienta**: Interfejs nie przeprowadza walidacji, lecz reaguje na odpowiedzi API.
  - Jeśli API zwróci `400 Bad Request`, `useMatchesView` ustawi `error: 'no_location'`, co spowoduje wyświetlenie `MatchesEmptyState` z komunikatem i linkiem do strony profilu.
  - Jeśli API zwróci `200 OK` z pustą tablicą `data`, `MatchesView` wyświetli `MatchesEmptyState` z informacją o braku dopasowań.

## 10. Obsługa błędów

- **Brak lokalizacji użytkownika**: API zwraca `400`. UI wyświetla `MatchesEmptyState` z tytułem "Brak ustawionej lokalizacji" i opisem zachęcającym do jej dodania w profilu, wraz z przyciskiem nawigującym do `/profile`.
- **Brak dopasowań**: API zwraca `200 OK` i `data: []`. UI wyświetla `MatchesEmptyState` z tytułem "Brak dopasowań" i opisem sugerującym np. zwiększenie zasięgu w profilu.
- **Błąd serwera/sieci**: W przypadku błędu `5xx` lub problemu z siecią, `useMatchesView` ustawi `error: 'generic'`. UI wyświetli `MatchesEmptyState` z ogólnym komunikatem o błędzie.
- **Brak autoryzacji**: Błąd `401` jest przechwytywany przez middleware, który przekierowuje na stronę logowania.

## 11. Kroki implementacji

1. **Stworzenie struktury plików**: Utworzenie katalogu `src/components/matches` i w nim plików: `MatchesView.tsx`, `UserMatchCard.tsx`, `MatchesSkeleton.tsx`, `MatchesEmptyState.tsx` oraz `useMatchesView.ts`.
2. **Implementacja `useMatchesView.ts`**: Zaimplementowanie hooka z logiką pobierania danych z `/api/matches`, zarządzaniem stanem (`isLoading`, `error`, `matches`, `pagination`) i funkcją `loadMore`.
3. **Implementacja komponentów szkieletu i stanu pustego**: Stworzenie `MatchesSkeleton.tsx` i `MatchesEmptyState.tsx` zgodnie ze specyfikacją.
4. **Implementacja `UserMatchCard.tsx`**: Stworzenie komponentu karty użytkownika, wykorzystując `Accordion` z `shadcn/ui` oraz istniejące komponenty `SportBadge` i `SocialLinkBadge`.
5. **Implementacja `MatchesView.tsx`**: Złożenie wszystkich elementów w całość. Komponent będzie używał hooka `useMatchesView` do pobrania danych i warunkowo renderował `MatchesSkeleton`, `MatchesEmptyState` lub listę `UserMatchCard`.
6. **Integracja ze stroną Astro**: W pliku `src/pages/index.astro` osadzenie komponentu `<MatchesView client:load />`.
7. **Testowanie**: Ręczne przetestowanie wszystkich scenariuszy:
    - Prawidłowe ładowanie i wyświetlanie listy.
    - Działanie paginacji "Załaduj więcej".
    - Wyświetlanie szkieletu podczas ładowania.
    - Poprawne działanie stanu pustego (brak dopasowań).
    - Poprawne działanie stanu błędu (brak lokalizacji).
    - Dostępność (obsługa z klawiatury).
