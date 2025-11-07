# Komponenty Map

Ten folder zawiera komponenty odpowiedzialne za wyświetlanie i zarządzanie interaktywną mapą OpenStreetMap w aplikacji BuddyFinder.

## Struktura

```
map/
├── hooks/
│   └── useMapView.ts          # Hook zarządzający stanem mapy i API
├── InteractiveMap.tsx         # Komponent mapy z react-leaflet
├── MapView.tsx                # Główny kontener orkiestrujący
├── RangeInputPopover.tsx      # Card do edycji zasięgu (pojawia się przy markerze)
├── AddressSearch.tsx          # Pasek wyszukiwania adresu (Nominatim API)
└── types.ts                   # Typy TypeScript dla mapy
```

## Komponenty

### `MapView`
Główny komponent-kontener. Orkiestruje `InteractiveMap` i `RangeInputPopover`.

**Funkcjonalność:**
- Pobiera dane profilu z API przy montowaniu
- Zarządza stanem (loading, error, success)
- Obsługuje interakcje użytkownika
- Wyświetla toasty z informacjami o zapisie
- Integruje pasek wyszukiwania adresu w górnej części

**Użycie:**
```tsx
import { MapView } from "@/components/map/MapView";

<MapView client:load />
```

### `InteractiveMap`
Wrapper dla react-leaflet z OpenStreetMap.

**Funkcjonalność:**
- Wyświetla kafelki OSM
- Pokazuje custom marker w kolorze primary z theme
- Rysuje okrąg zasięgu (półprzeźroczysty z wyraźną granicą w kolorze primary)
- Obsługuje kliknięcia na mapie i zwraca współrzędne ekranowe

**Props:**
- `location: GeoJsonPoint | null` - lokalizacja markera
- `rangeKm: number` - zasięg w km (promień okręgu)
- `onLocationChange: (location: GeoJsonPoint, screenX: number, screenY: number) => void` - callback przy kliknięciu
- `isPopoverOpen: boolean` - czy card edycji jest otwarty

### `RangeInputPopover`
Card z formularzem do edycji zasięgu, pozycjonowany przy markerze.

**Funkcjonalność:**
- Input typu number z walidacją (1-100 km)
- Przyciski "Zapisz" i "Anuluj"
- Pozycjonowanie fixed względem współrzędnych ekranowych
- Automatyczne zamykanie po zapisie lub anulowaniu

**Props:**
- `isOpen: boolean` - czy card jest otwarty
- `rangeKm: number` - aktualna wartość zasięgu
- `isDirty: boolean` - czy są niezapisane zmiany
- `posX: number` - pozycja X na ekranie
- `posY: number` - pozycja Y na ekranie
- `onRangeChange: (rangeKm: number) => void` - callback przy zmianie
- `onSave: () => void` - callback przy zapisie
- `onClose: () => void` - callback przy zamknięciu

### `AddressSearch`
Pasek wyszukiwania adresu używający Nominatim API (OpenStreetMap).

**Funkcjonalność:**
- Wyszukiwanie adresów w Polsce przez Nominatim API
- Wyświetlanie listy wyników w dropdown
- Automatyczne ustawienie lokalizacji po wybraniu adresu
- Obsługa Enter do wyszukiwania
- Click outside do zamykania listy wyników

**Props:**
- `onLocationSelect: (location: GeoJsonPoint, address: string) => void` - callback przy wyborze adresu

## Hooks

### `useMapView()`
Custom hook zarządzający stanem mapy i komunikacją z API.

**Zwraca:**
```typescript
{
  profile: ProfileDto | null;
  draftLocation: GeoJsonPoint | null;
  draftRangeKm: number;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isDirty: boolean;
  setDraftLocation: (location: GeoJsonPoint) => void;
  setDraftRangeKm: (rangeKm: number) => void;
  saveChanges: () => Promise<boolean>;
  retry: () => void;
}
```

## Typy

### `MapViewViewModel`
```typescript
interface MapViewViewModel {
  profile: ProfileDto | null;
  draftLocation: GeoJsonPoint | null;
  draftRangeKm: number;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}
```

## Integracja z API

Komponenty komunikują się z dwoma endpointami:

### GET /api/profiles/me
Pobiera profil użytkownika z lokalizacją i domyślnym zasięgiem.

### PATCH /api/profiles/me
Aktualizuje lokalizację i zasięg użytkownika.

**Body:**
```json
{
  "location": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  },
  "default_range_km": 15
}
```

## Flow użytkownika

### Scenariusz 1: Wyszukiwanie adresu
1. Użytkownik wpisuje adres w pasku wyszukiwania
2. Klika "Szukaj" lub Enter
3. Pojawia się lista wyników z Nominatim API
4. Użytkownik wybiera adres z listy
5. Mapa przenosi marker do wybranej lokalizacji
6. Toast potwierdza wybór adresu

### Scenariusz 2: Kliknięcie na mapie
1. Użytkownik otwiera stronę `/map`
2. Komponent pobiera dane profilu z API
3. Mapa wyświetla się wycentrowana na Warszawie (lub zapisanej lokalizacji)
4. Użytkownik klika w wybrane miejsce na mapie:
   - Marker i okrąg przenoszą się w nowe miejsce
   - Card z edycją zasięgu pojawia się przy markerze
5. Użytkownik może zmienić zasięg:
   - Okrąg dynamicznie aktualizuje swój promień
6. Po kliknięciu "Zapisz":
   - Toast "Zapisywanie..."
   - Wysłanie PATCH do API
   - Toast "Ustawienia zostały zapisane" lub błąd
   - Zamknięcie card

## Stylowanie

- Kolory okręgu i markera: `--primary` z theme (oklch(0.6744 0.1785 42.7042))
- Wypełnienie okręgu: 15% opacity
- Granica okręgu: 2px
- Wysokość mapy na stronie: `calc(100vh - 4rem)` (minus navbar)
- Marker: Custom SVG icon w kolorze primary z białym środkiem
- Card edycji: Pozycjonowany przy markerze z offsetem (20px prawo, 150px góra)

## Wymagane zależności

- `react-leaflet` - wrapper React dla Leaflet
- `leaflet` - biblioteka map
- `@types/leaflet` - typy TypeScript
- `@/components/ui/card` - shadcn/ui Card
- `@/components/ui/input` - shadcn/ui Input
- `@/components/ui/button` - shadcn/ui Button
- `@/components/ui/label` - shadcn/ui Label
- `sonner` - biblioteka toastów
- `lucide-react` - ikony (Search, Loader2)

## API zewnętrzne

### Nominatim API (OpenStreetMap)
- **Endpoint:** `https://nominatim.openstreetmap.org/search`
- **Użycie:** Geocoding (wyszukiwanie adresów)
- **Limit:** Bez klucza API, ale z limitem rate (1 request/s)
- **Dokumentacja:** https://nominatim.org/release-docs/latest/api/Search/
- **Polityka użycia:** https://operations.osmfoundation.org/policies/nominatim/

## Zobacz także

- [Dokumentacja konfiguracji OpenStreetMaps](/docs/openstreetmap-config.md)
- [Plan implementacji MapView](/.ai/MapView-view-implementation-plan.md)
