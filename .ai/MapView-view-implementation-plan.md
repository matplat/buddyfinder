# Plan implementacji widoku MapView

## 1. Przegląd

Widok `MapView` jest głównym interfejsem dla użytkownika do zarządzania swoją lokalizacją geograficzną oraz domyślnym zasięgiem poszukiwań partnerów treningowych. Składa się z interaktywnej mapy OpenStreetMap, na której użytkownik może jednym kliknięciem ustawić swoją pozycję, a następnie w prostym formularzu zdefiniować promień (w km), w jakim chce szukać innych sportowców. Widok ten jest kluczowy dla podstawowej funkcjonalności aplikacji, ponieważ dane te są fundamentem algorytmu dopasowującego.

## 2. Routing widoku

Widok będzie dostępny pod główną ścieżką aplikacji, po zalogowaniu użytkownika:

- **Ścieżka**: `/`

## 3. Struktura komponentów

Hierarchia komponentów React, renderowana wewnątrz strony Astro (`/src/pages/index.astro`), będzie wyglądać następująco:

```
MapView (komponent-kontener)
├── InteractiveMap (komponent prezentacyjny)
└── RangeInputPopover (komponent prezentacyjny)
```

- **`MapView`**: Główny komponent zarządzający stanem, logiką biznesową oraz komunikacją z API.
- **`InteractiveMap`**: Komponent-wrapper dla biblioteki `react-leaflet`, odpowiedzialny za renderowanie mapy, znacznika lokalizacji oraz dynamicznie aktualizowanego okręgu zasięgu.
- **`RangeInputPopover`**: Komponent z `shadcn/ui` (`Popover`, `Input`, `Button`), który pojawia się po kliknięciu na mapę i umożliwia wprowadzenie oraz zapisanie zasięgu.

## 4. Szczegóły komponentów

### `MapView`

- **Opis komponentu**: Kontener orkiestrujący pracę pozostałych komponentów. Odpowiada za pobieranie danych profilu użytkownika, zarządzanie stanem (lokalizacja, zasięg, stany ładowania i błędu) oraz wysyłanie zaktualizowanych danych do API.
- **Główne elementy**: Wykorzystuje niestandardowy hook `useMapView` do zarządzania logiką. Renderuje komponenty `InteractiveMap` i `RangeInputPopover`, przekazując im odpowiednie propsy i obsługując ich zdarzenia.
- **Obsługiwane interakcje**:
  - `onLoad`: Pobranie danych profilu z `/api/profiles/me`.
  - `onLocationChange` (z `InteractiveMap`): Aktualizacja roboczej lokalizacji w stanie.
  - `onRangeChange` (z `RangeInputPopover`): Aktualizacja roboczego zasięgu w stanie.
  - `onSave` (z `RangeInputPopover`): Uruchomienie procesu zapisu danych przez API.
- **Obsługiwana walidacja**: Delegowana do `RangeInputPopover`.
- **Typy**: `ProfileDto`, `UpdateProfileCommand`, `MapViewViewModel`.
- **Propsy**: Brak.

### `InteractiveMap`

- **Opis komponentu**: Wrapper na `react-leaflet` odpowiedzialny za wizualizację. Wyświetla kafelki mapy OpenStreetMap, pojedynczy znacznik (`Marker`) oraz okrąg (`Circle`) reprezentujący zasięg. Mapa jest domyślnie wycentrowana na Warszawie z zoomem pozwalającym objąć większość kraju.
- **Główne elementy**: `MapContainer`, `TileLayer`, `Marker`, `Circle` z `react-leaflet`.
- **Obsługiwane interakcje**:
  - `click` na mapie: wywołanie `onLocationChange` z nowymi współrzędnymi (zdarzenie nie jest wywoływane podczas przesuwania mapy).
- **Obsługiwana walidacja**: Brak.
- **Typy**: `GeoJsonPoint`.
- **Propsy**:

    ```typescript
    interface InteractiveMapProps {
      location: GeoJsonPoint | null;
      rangeKm: number;
      onLocationChange: (newLocation: GeoJsonPoint) => void;
    }
    ```

### `RangeInputPopover`

- **Opis komponentu**: Komponent UI zbudowany z `Popover`, `Input` i `Button` z `shadcn/ui`. Jest kontrolowany przez `MapView` i pojawia się po kliknięciu na mapę. Pozwala na edycję zasięgu, a okrąg na mapie dynamicznie reaguje na zmiany w polu.
- **Główne elementy**: `Popover`, `PopoverTrigger`, `PopoverContent`, `Input` typu `number`, `Button`.
- **Obsługiwane interakcje**:
  - `onChange` na polu `Input`: Wywołanie `onRangeChange` z nową wartością.
  - `onClick` na przycisku "Zapisz": Wywołanie `onSave`.
- **Obsługiwana walidacja**:
  - Pole `Input` typu `number` posiada natywne strzałki do inkrementacji/dekrementacji wartości.
  - Wartości `min` i `max` w inpucie są ustawione na `1` i `100`, uniemożliwiając wprowadzenie wartości spoza zakresu.
- **Typy**: -
- **Propsy**:

    ```typescript
    interface RangeInputPopoverProps {
      isOpen: boolean;
      onOpenChange: (isOpen: boolean) => void;
      rangeKm: number;
      onRangeChange: (newRange: number) => void;
      onSave: () => void;
      isSaving: boolean;
      isDirty: boolean; // Określa, czy są niezapisane zmiany
    }
    ```

## 5. Typy

Do implementacji widoku, oprócz istniejących typów DTO, potrzebny będzie jeden główny typ ViewModel do zarządzania stanem.

- **`ProfileDto` (z `types.ts`)**: Używany do odbioru danych z API.
- **`UpdateProfileCommand` (z `types.ts`)**: Używany do wysłania danych do API.
- **`MapViewViewModel` (nowy typ)**: Reprezentuje kompletny stan widoku.

    ```typescript
    interface MapViewViewModel {
      // Dane z serwera, do porównywania zmian
      profile: ProfileDto | null;
      
      // Roboczy stan formularza
      draftLocation: GeoJsonPoint | null;
      draftRangeKm: number;

      // Stan UI
      isLoading: boolean; // Ładowanie początkowych danych
      isSaving: boolean;  // Zapisywanie zmian
      error: string | null; // Komunikat o błędzie
      isPopoverOpen: boolean; // Czy popover jest widoczny
    }
    ```

## 6. Zarządzanie stanem

Logika zarządzania stanem zostanie zamknięta w niestandardowym hooku `useMapView`.

- **`useMapView()`**:
  - Będzie używał `useState` do przechowywania stanu opisanego przez `MapViewViewModel`.
  - Wykorzysta `useEffect` do pobrania danych profilu przy pierwszym renderowaniu komponentu.
  - Zawierać będzie funkcje do obsługi zdarzeń:
    - `handleLocationChange(newLocation: GeoJsonPoint)`: Aktualizuje `draftLocation` i otwiera `Popover`.
    - `handleRangeChange(newRange: number)`: Aktualizuje `draftRangeKm`. Zmiana ta jest natychmiast widoczna na mapie.
    - `handleSave()`: Tworzy obiekt `UpdateProfileCommand` na podstawie `draftLocation` i `draftRangeKm`, wysyła żądanie `PATCH /api/profiles/me`, a następnie obsługuje odpowiedź.
  - Udostępni memoizowaną wartość `isDirty`, która będzie `true`, jeśli `draftLocation` lub `draftRangeKm` różnią się od wartości początkowych z `profile`. Wartość ta będzie kontrolować stan aktywności przycisku "Zapisz".

## 7. Integracja API

Integracja będzie opierać się na dwóch endpointach:

1. **Pobieranie danych:**
    - **Akcja:** Montowanie komponentu `MapView`.
    - **Endpoint:** `GET /api/profiles/me`
    - **Typ odpowiedzi:** `ProfileDto`
    - **Obsługa:** Odpowiedź zostanie użyta do ustawienia początkowego stanu `profile`, `draftLocation` i `draftRangeKm`.

2. **Aktualizacja danych:**
    - **Akcja:** Kliknięcie przycisku "Zapisz" w `RangeInputPopover`.
    - **Endpoint:** `PATCH /api/profiles/me`
    - **Typ żądania:** `UpdateProfileCommand`

        ```json
        {
          "location": { "type": "Point", "coordinates": [longitude, latitude] },
          "default_range_km": 30
        }
        ```

    - **Typ odpowiedzi:** `ProfileDto` (zaktualizowany profil)
    - **Obsługa:** Po pomyślnym zapisie, stan `profile` zostanie zaktualizowany nowymi danymi, a stany robocze (`draft*`) zresetowane.

## 8. Interakcje użytkownika

1. **Użytkownik wchodzi na stronę (`/`)**: Aplikacja wyświetla stan ładowania.
2. **Dane załadowane**: Mapa centruje się na Warszawie (lub zapisanej lokalizacji użytkownika) i wyświetla znacznik oraz okrąg zasięgu.
3. **Użytkownik klika w inne miejsce na mapie**:
    - Znacznik i okrąg natychmiast przenoszą się w nowe miejsce.
    - Obok kursora otwiera się `RangeInputPopover` z aktualną wartością zasięgu.
4. **Użytkownik zmienia wartość w polu zasięgu (wpisując lub używając strzałek)**:
    - Okrąg na mapie dynamicznie i płynnie zmienia swój promień.
    - Przycisk "Zapisz" staje się aktywny.
5. **Użytkownik klika "Zapisz"**:
    - Przycisk przechodzi w stan `isSaving` (np. pokazuje spinner).
    - Wysyłane jest żądanie `PATCH`.
    - Po sukcesie: `Popover` zamyka się, wyświetlany jest `Toast` z potwierdzeniem ("Lokalizacja zaktualizowana pomyślnie"), a przycisk "Zapisz" staje się nieaktywny.
    - W przypadku błędu: Wyświetlany jest `Toast` z błędem, `Popover` pozostaje otwarty, a użytkownik może ponowić próbę.

## 9. Warunki i walidacja

- **Pole `Input` zasięgu**:
  - Będzie typu `number` z atrybutami `min="1"` i `max="100"`.
  - Przeglądarka natywnie zablokuje wprowadzanie wartości spoza tego zakresu oraz znaków nieliczbowych.
- **Przycisk "Zapisz" w `RangeInputPopover` jest aktywny tylko wtedy, gdy:**
  - `isSaving === false`.
  - `isDirty === true` (czyli nastąpiła zmiana lokalizacji lub zasięgu).

## 10. Obsługa błędów

- **Błąd pobierania danych (`GET /api/profiles/me`)**: Zamiast mapy, na środku ekranu zostanie wyświetlony komunikat o błędzie z przyciskiem "Spróbuj ponownie". Komunikaty będą zróżnicowane:
  - `401 Unauthorized`: "Sesja wygasła. Proszę zalogować się ponownie."
  - `404 Not Found`: "Nie znaleziono Twojego profilu. Skontaktuj się z pomocą techniczną."
  - Inne błędy: "Nie udało się załadować danych profilu. Spróbuj odświeżyć stronę."
- **Błąd zapisu danych (`PATCH /api/profiles/me`)**: Operacja zostanie przerwana, a w prawym górnym rogu ekranu pojawi się komponent `Toast` z informacją:
  - `401 Unauthorized`: "Sesja wygasła. Zaloguj się ponownie, aby zapisać zmiany."
  - `400 Bad Request`: "Wprowadzone dane są nieprawidłowe. Sprawdź i spróbuj jeszcze raz."
  - Inne błędy: "Wystąpił nieoczekiwany błąd podczas zapisu. Spróbuj ponownie."

## 11. Kroki implementacji

1. **Instalacja zależności**: Dodać do projektu `react-leaflet`, `leaflet` oraz ich typy `@types/leaflet`.
2. **Utworzenie komponentu `InteractiveMap`**:
    - Zaimplementować wrapper na `react-leaflet`, renderowany po stronie klienta (`client:only="react"`).
    - Ustawić domyślny `center` i `zoom` na Warszawę.
    - Dodać logikę do wyświetlania `Marker` i `Circle`.
    - Zaimplementować handler `onClick` na `MapContainer`.
3. **Utworzenie komponentu `RangeInputPopover`**:
    - Złożyć komponent z elementów `shadcn/ui`, używając `Input` typu `number`.
    - Przekazać propsy `isSaving` i `isDirty` do kontrolowania stanu przycisku "Zapisz".
4. **Stworzenie hooka `useMapView`**:
    - Zdefiniować typ `MapViewViewModel` i logikę stanu.
    - Zaimplementować pobieranie i wysyłanie danych z mapowaniem kodów błędów na konkretne komunikaty.
    - Dodać logikę obliczania `isDirty`.
5. **Złożenie widoku `MapView`**:
    - Stworzyć główny komponent `MapView.tsx`.
    - Użyć hooka `useMapView` do pobrania stanu i funkcji.
    - Połączyć komponenty `InteractiveMap` i `RangeInputPopover`, przekazując im dane i handlery.
6. **Integracja z Astro**:
    - W pliku `/src/pages/index.astro` zaimportować i wyrenderować komponent `MapView` z dyrektywą `client:only="react"`.
7. **Finalizacja i testowanie**:
    - Dodać globalny dostawca `Toastów` (np. `<Toaster />` z `shadcn/ui`) w głównym layoucie aplikacji.
