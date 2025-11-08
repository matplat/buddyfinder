# Matches Components

Ten folder zawiera komponenty związane z wyświetlaniem dopasowanych użytkowników.

## Struktura komponentów

### `MatchesView.tsx`
Główny komponent orkiestrujący. Zarządza stanem za pomocą hooka `useMatchesView` i warunkowo renderuje odpowiedni widok (loading, error, empty state, lub lista dopasowań).

### `UserMatchCard.tsx`
Komponent karty pojedynczego dopasowanego użytkownika. Wykorzystuje `Accordion` z shadcn/ui do rozwijania szczegółów. W stanie zwiniętym pokazuje nazwę i dystans, w rozwiniętym - email, sporty i linki do mediów społecznościowych.

### `MatchesSkeleton.tsx`
Komponent szkieletu wyświetlany podczas ładowania danych. Zawiera placeholder'y z animacją pulse.

### `MatchesEmptyState.tsx`
Komponent wyświetlany gdy brak dopasowań lub wystąpił błąd. Obsługuje różne scenariusze:
- Brak ustawionej lokalizacji (`no-location`)
- Brak dopasowań (`no-matches`)
- Błąd serwera (`error`)

### `hooks/useMatchesView.ts`
Custom hook zarządzający stanem i komunikacją z API:
- Pobieranie dopasowań z `/api/matches`
- Obsługa paginacji
- Zarządzanie stanami ładowania i błędów
- Transformacja DTO na ViewModel

### `types.ts`
Definicje typów ViewModeli:
- `UserMatchViewModel` - reprezentuje dopasowanego użytkownika
- `UserSportViewModel` - reprezentuje sport użytkownika
- `Pagination` - informacje o paginacji

### Konfiguracje współdzielone
Komponenty wykorzystują centralną konfigurację platform społecznościowych z `src/lib/config/social-platforms.config.ts`.

## Użycie

Komponent jest zintegrowany ze stroną Astro `src/pages/matches.astro`:

```astro
<MatchesView client:load />
```

## API Integration

Hook `useMatchesView` komunikuje się z endpointem:
- `GET /api/matches?limit=20&offset=0`

Obsługuje odpowiedzi:
- `200 OK` - zwraca dane dopasowań
- `400 Bad Request` - brak lokalizacji użytkownika
- `5xx` - błąd serwera

## Stylowanie

Komponenty wykorzystują:
- shadcn/ui components (Accordion, Card, Button, Badge, Skeleton)
- Tailwind CSS do customowych stylów
- Lucide React do ikon
