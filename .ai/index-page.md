# Plan implementacji strony głównej (/)

## 1. Przegląd

# Strona główna (/) w aplikacji FITLink

Strona główna (`/`) aplikacji FITLink jest kluczowym interfejsem, który integruje trzy główne funkcjonalności aplikacji w jeden spójny widok:
- **MapView** - interaktywną mapę do zarządzania lokalizacją i zasięgiem wyszukiwania
- **ProfileView** - panel zarządzania profilem użytkownika
- **MatchesView** - listę dopasowanych partnerów treningowych

Głównym elementem interfejsu jest mapa, która zajmuje centrum ekranu i jest zawsze widoczna (minimum 30% szerokości ekranu). Dwa pozostałe widoki (ProfileView i MatchesView) są dostępne jako rozwijane panele boczne na urządzeniach mobilnych, implementowane za pomocą komponentu Sheet z shadcn/ui. Na małych ekranach tylko jeden panel może być otwarty jednocześnie, dostępne przez przyciski nawigacyjne w dolnej części ekranu.

Widoki są ze sobą zsynchronizowane - zmiany w profilu (lokalizacja, zasięg, sporty) natychmiast aktualizują mapę i odświeżają listę dopasowań, zapewniając płynne i responsywne doświadczenie użytkownika.

## 2. Routing widoku

Widok będzie dostępny pod główną ścieżką aplikacji, po zalogowaniu użytkownika:

- **Ścieżka**: `/`

## 3. Struktura komponentów

Hierarchia komponentów została zaprojektowana w celu integracji trzech istniejących widoków w responsywny interfejs:

```
HomePage (Astro page: /src/pages/index.astro)
└── MainView (komponent React, client:only="react")
    ├── MapView (istniejący komponent, warstwa bazowa z-0)
    │   ├── AddressSearch (floating na górze mapy, z-1000)
    │   ├── InteractiveMap
    │   └── RangeInputPopover
    ├── ProfilePanel (nowy komponent adaptacyjny, z-10)
    │   ├── [Mobile < 768px] Sheet (shadcn/ui)
    │   │   └── SheetContent
    │   │       └── ProfileView (istniejący komponent)
    │   └── [Desktop ≥ 768px] Side Panel (fixed left-0)
    │       ├── ChevronTrigger (przycisk z ChevronRight/Left icon)
    │       ├── CollapsedBar (wąski pasek 48px z vertical text)
    │       └── ExpandedContent (320-384px szerokości)
    │           └── ProfileView (istniejący komponent)
    ├── MatchesPanel (nowy komponent adaptacyjny, z-10)
    │   ├── [Mobile < 768px] Sheet (shadcn/ui)
    │   │   └── SheetContent
    │   │       └── MatchesView (istniejący komponent)
    │   └── [Desktop ≥ 768px] Side Panel (fixed right-0)
    │       ├── ChevronTrigger (przycisk z ChevronLeft/Right icon)
    │       ├── CollapsedBar (wąski pasek 48px z vertical text)
    │       └── ExpandedContent (320-384px szerokości)
    │           └── MatchesView (istniejący komponent)
    └── BottomNavigation (nowy komponent, z-20, tylko mobile)
        ├── Button (otwórz profil) - z ikoną User
        ├── Button (centruj mapę) - z ikoną MapPin
        └── Button (otwórz dopasowania) - z ikoną Users
```

## 4. Szczegóły komponentów

### `MainView`

- **Opis komponentu**: Główny kontener orkiestrujący całą stronę. Zarządza stanem paneli bocznych (otwarte/zamknięte/zwinięte), synchronizacją danych między komponentami oraz implementuje layout responsywny z różnymi interfejsami dla mobile i desktop.
- **Główne elementy**: `MapView` jako warstwa bazowa, dwa komponenty adaptacyjne (`ProfilePanel`, `MatchesPanel`), `BottomNavigation` dla kontroli mobilnej.
- **Obsługiwane interakcje**:
  - **Mobile**: Otwieranie/zamykanie Sheet przez BottomNavigation (tylko jeden otwarty na raz)
  - **Desktop**: Toggle collapse/expand paneli bocznych przez chevron (oba mogą być rozwinięte jednocześnie z limitami szerokości)
  - Wykrywanie zmiany rozmiaru okna i adaptacja layoutu
  - Przekazywanie eventów zmiany danych między komponentami
  - Zarządzanie konfliktami szerokości paneli na desktop
- **Obsługiwana walidacja**: Brak bezpośredniej. Delegowana do komponentów podrzędnych.
- **Typy**: `MainViewState`, `PanelType`.
- **Propsy**: Brak.

### `BottomNavigation`

- **Opis komponentu**: Dolny pasek nawigacyjny z trzema przyciskami do kontroli interfejsu. Widoczny TYLKO na urządzeniach mobilnych (< 768px). Ukryty na desktopie przez klasę `md:hidden`.
- **Główne elementy**: Trzy komponenty `Button` z ikonami (User, MapPin, Users z lucide-react).
- **Obsługiwane interakcje**:
  - Kliknięcie przycisku profilu: otwiera Sheet profilu, zamyka Sheet dopasowań
  - Kliknięcie przycisku mapy: zamyka wszystkie Sheet (focus na mapie)
  - Kliknięcie przycisku dopasowań: otwiera Sheet dopasowań, zamyka Sheet profilu
- **Obsługiwana walidacja**: Brak.
- **Responsive behavior**: `className="md:hidden"` - automatyczne ukrycie na ≥ 768px
- **Typy**: -
- **Propsy**:

    ```typescript
    interface BottomNavigationProps {
      activePanel: 'profile' | 'map' | 'matches';
      onPanelChange: (panel: 'profile' | 'map' | 'matches') => void;
    }
    ```

### `ProfilePanel` (wrapper dla ProfileView)

- **Opis komponentu**: Komponent adaptacyjny zawierający ProfileView. Na mobile renderuje się jako `Sheet` (bottom sheet), na desktop jako boczny panel z chevron trigger.
- **Główne elementy**: 
  - **Mobile**: `Sheet`, `SheetContent` z `ProfileView` wewnątrz
  - **Desktop**: `div` z fixed positioning, chevron button, collapsible content area z `ProfileView`
- **Obsługiwane interakcje**:
  - **Mobile**: Otwarcie/zamknięcie Sheet przez BottomNavigation
  - **Desktop**: Toggle collapse/expand przez kliknięcie chevron lub wąskiego paska
  - Przechwytywanie eventów aktualizacji profilu i propagowanie ich do MainView
- **Responsive behavior**: Media query do przełączania między Sheet a side panel
- **Obsługiwana walidacja**: Brak. Delegowana do ProfileView.
- **Typy**: Typy z ProfileView.
- **Propsy**:

    ```typescript
    interface ProfilePanelProps {
      isOpen: boolean;
      onOpenChange: (open: boolean) => void;
      onProfileUpdate: (updates: ProfileUpdates) => void;
      // Desktop specific
      isCollapsed?: boolean; // tylko desktop
      onToggleCollapse?: () => void; // tylko desktop
    }
    ```

### `MatchesPanel` (wrapper dla MatchesView)

- **Opis komponentu**: Komponent adaptacyjny zawierający MatchesView. Na mobile renderuje się jako `Sheet` (bottom sheet), na desktop jako boczny panel z chevron trigger. Podobny do ProfilePanel, ale dla widoku dopasowań i umieszczony po prawej stronie (desktop).
- **Główne elementy**: 
  - **Mobile**: `Sheet`, `SheetContent` z `MatchesView` wewnątrz
  - **Desktop**: `div` z fixed positioning (right-0), chevron button, collapsible content area z `MatchesView`
- **Obsługiwane interakcje**:
  - **Mobile**: Otwarcie/zamknięcie Sheet przez BottomNavigation
  - **Desktop**: Toggle collapse/expand przez kliknięcie chevron lub wąskiego paska
  - Odświeżanie listy dopasowań przy zmianie profilu
- **Responsive behavior**: Media query do przełączania między Sheet a side panel
- **Obsługiwana walidacja**: Brak. Delegowana do MatchesView.
- **Typy**: Typy z MatchesView.
- **Propsy**:

    ```typescript
    interface MatchesPanelProps {
      isOpen: boolean;
      onOpenChange: (open: boolean) => void;
      shouldRefresh: boolean; // trigger dla odświeżenia listy
      onRefreshed: () => void;
      // Desktop specific
      isCollapsed?: boolean; // tylko desktop
      onToggleCollapse?: () => void; // tylko desktop
    }
    ```

### Modyfikacje istniejących komponentów

#### `MapView`

- **Wymagane zmiany**: 
  - Dodanie propsa `onLocationUpdate` do propagowania zmian lokalizacji/zasięgu do MainView
  - AddressSearch pozostaje jako floating element na górze mapy (z-index: 1000)
- **Nowy props**:

    ```typescript
    interface MapViewProps {
      onLocationUpdate?: (location: GeoJsonPoint, rangeKm: number) => void;
    }
    ```

#### `ProfileView`

- **Wymagane zmiany**:
  - Dodanie propsa `onDataChange` do notyfikacji o zmianach w profilu (lokalizacja, zasięg, sporty)
  - Dostosowanie layoutu do wyświetlania w Sheet (usunięcie zewnętrznego Card, jeśli nie jest potrzebny)
- **Nowy props**:

    ```typescript
    interface ProfileViewProps {
      onDataChange?: (updates: ProfileDataUpdates) => void;
    }
    ```

#### `MatchesView`

- **Wymagane zmiany**:
  - Dodanie propsa `refreshTrigger` do wymuszenia ponownego pobrania dopasowań
  - Optymalizacja hooka useMatchesView do obsługi zewnętrznego triggera odświeżania
- **Nowy props**:

    ```typescript
    interface MatchesViewProps {
      refreshTrigger?: number; // timestamp lub counter
      onRefreshComplete?: () => void;
    }
    ```

## 5. Typy

Do implementacji widoku potrzebne będą następujące nowe typy:

- **`MainViewState`**: Stan całego widoku głównego.

    ```typescript
    interface MainViewState {
      // Stan paneli - Mobile
      activePanel: 'profile' | 'map' | 'matches'; // dla mobile Sheet
      isProfileOpen: boolean; // Sheet otwarty (mobile) lub visible (desktop)
      isMatchesOpen: boolean; // Sheet otwarty (mobile) lub visible (desktop)
      
      // Stan paneli - Desktop
      isProfileCollapsed: boolean; // czy panel profilu jest zwinięty (desktop only)
      isMatchesCollapsed: boolean; // czy panel dopasowań jest zwinięty (desktop only)
      
      // Responsywność
      isMobile: boolean; // wykrywane przez media query
      
      // Trigger dla synchronizacji
      profileUpdateTrigger: number;
      matchesRefreshTrigger: number;
      
      // Dane do synchronizacji
      currentLocation: GeoJsonPoint | null;
      currentRangeKm: number;
    }
    ```

- **`ProfileDataUpdates`**: Typ dla zmian w danych profilu.

    ```typescript
    interface ProfileDataUpdates {
      location?: GeoJsonPoint;
      rangeKm?: number;
      sports?: number[]; // IDs zmienionych sportów
      timestamp: number;
    }
    ```

- **`PanelType`**: Enum dla typów paneli.

    ```typescript
    type PanelType = 'profile' | 'map' | 'matches';
    ```

## 6. Zarządzanie stanem

Logika zarządzania stanem zostanie zamknięta w niestandardowym hooku `useMainView`.

- **`useMainView()`**:
  - Będzie używał `useState` do przechowywania stanu `MainViewState`.
  - Wykorzysta `useEffect` z media query listener do wykrywania `isMobile` (window.matchMedia('(max-width: 768px)')).
  - Zawierać będzie funkcje do obsługi zdarzeń:
    - **Mobile**:
      - `handlePanelChange(panel: PanelType)`: Zmienia aktywny panel Sheet, zamyka pozostałe (tylko jeden otwarty).
    - **Desktop**:
      - `handleToggleProfileCollapse()`: Toggle stanu zwinięcia/rozwinięcia panelu profilu.
      - `handleToggleMatchesCollapse()`: Toggle stanu zwinięcia/rozwinięcia panelu dopasowań.
      - `handlePanelWidthConflict()`: Logika zarządzania konfliktami szerokości - jeśli oba panele próbują się rozwinąć i przekraczają limit, automatycznie zwija jeden.
    - **Synchronizacja danych** (niezależnie od platformy):
      - `handleProfileUpdate(updates: ProfileDataUpdates)`: Odbiera zmiany z ProfileView i propaguje je do MapView oraz triggeruje odświeżenie MatchesView.
      - `handleMapLocationUpdate(location: GeoJsonPoint, rangeKm: number)`: Odbiera zmiany z MapView i zapisuje je w stanie (bez propagowania zwrotnie do ProfileView, aby uniknąć cykli).
      - `handleMatchesRefreshComplete()`: Resetuje trigger odświeżania po zakończeniu.
  - Implementuje logikę synchronizacji:
    - Gdy profil zmienia lokalizację/zasięg → MapView aktualizuje wizualizację + MatchesView odświeża listę
    - Gdy profil zmienia sporty → MatchesView odświeża listę
    - Gdy MapView zmienia lokalizację → MatchesView odświeża listę (po zapisie)
  - Implementuje logikę responsywną:
    - Przy zmianie `isMobile` z true na false: zamyka wszystkie Sheet, ustawia domyślny stan desktop (oba panele zwinięte)
    - Przy zmianie `isMobile` z false na true: zamyka wszystkie panele desktop, ustawia domyślny stan mobile (profil otwarty)

## 7. Integracja API

Integracja API pozostaje niezmienna - każdy komponent (ProfileView, MapView, MatchesView) zarządza swoimi wywołaniami API przez swoje hooki. MainView nie wykonuje bezpośrednich wywołań API, a jedynie koordynuje komunikację między komponentami.

## 8. Interakcje użytkownika

### Scenariusze podstawowe:

#### 1. **Użytkownik wchodzi na stronę (`/`)**:
   - Aplikacja ładuje dane dla wszystkich trzech komponentów równolegle (każdy przez swój hook)
   - Wyświetlane są skeletony per-komponent
   - Mapa pojawia się jako pierwsza (bazowa warstwa)
   
   **Urządzenia mobilne (< 768px)**:
   - Domyślnie panel profilu jest otwarty jako Sheet od dołu ekranu
   - BottomNavigation jest widoczny na dole z podświetlonym przyciskiem profilu
   - Panel dopasowań jest zamknięty
   
   **Desktop (≥ 768px)**:
   - Oba panele są otwarte i widoczne jako boczne panele
   - Panel profilu po lewej stronie (zwinięty do wąskiego paska z chevron i vertical text)
   - Panel dopasowań po prawej stronie (zwinięty do wąskiego paska z chevron i vertical text)
   - BottomNavigation NIE jest widoczny
   - Użytkownik może rozwinąć dowolny panel klikając na wąski pasek lub chevron

#### 2. **Użytkownik klika chevron na zwiniętym panelu profilu (desktop)**:
   - Panel profilu rozwija się z animacją slide-in (duration-300)
   - Mapa automatycznie zmniejsza szerokość, zachowując minimum 30%
   - Chevron obraca się wskazując kierunek zwinięcia (np. ChevronLeft → ChevronRight)
   - Jeśli panel dopasowań był rozwinięty i suma szerokości przekracza limit:
     - Panel dopasowań automatycznie zwija się do wąskiego paska
     - Animacja zwinięcia jest płynna i zsynchronizowana

#### 3. **Użytkownik klika chevron na rozwiniętym panelu profilu (desktop)**:
   - Panel profilu zwija się do wąskiego paska z animacją slide-out (duration-300)
   - Wąski pasek (48px width) pozostaje widoczny z vertical text "Profil" i chevron
   - Mapa automatycznie rozszerza się zajmując zwolnioną przestrzeń
   - Chevron zmienia kierunek (np. ChevronLeft → ChevronRight)

#### 4. **Użytkownik klika przycisk "Mapa" w BottomNavigation (mobile)**:
   - Wszystkie otwarte panele (Sheet) zamykają się z animacją slide-out (duration-300)
   - Mapa zajmuje całą dostępną przestrzeń ekranu
   - Przycisk mapy w nawigacji jest podświetlony

#### 5. **Użytkownik klika przycisk "Dopasowania" w BottomNavigation (mobile)**:
   - Jeśli otwarty był panel profilu, zamyka się z animacją slide-out
   - Panel dopasowań otwiera się jako Sheet od dołu z animacją slide-in (duration-300)
   - Mapa pozostaje widoczna w tle (min. 30% wysokości ekranu)
   - Przycisk dopasowań w nawigacji jest podświetlony

#### 6. **Użytkownik klika przycisk "Profil" w BottomNavigation (mobile)**:
   - Jeśli otwarty był panel dopasowań, zamyka się z animacją slide-out
   - Panel profilu otwiera się jako Sheet od dołu z animacją slide-in (duration-300)
   - Mapa pozostaje widoczna w tle
   - Przycisk profilu w nawigacji jest podświetlony

#### 7. **Użytkownik zmienia lokalizację w MapView**:
   - Znacznik i okrąg natychmiast przenoszą się w nowe miejsce
   - Po zapisie zmiany: MainView otrzymuje notyfikację przez `onLocationUpdate`
   - MatchesView automatycznie odświeża listę dopasowań (niezależnie czy jest widoczny)
   - Toast informuje: "Lokalizacja zaktualizowana. Odświeżanie dopasowań..."

#### 8. **Użytkownik edytuje profil (lokalizacja/zasięg/sporty)**:
   - Zmiany są zapisywane przez ProfileView
   - MainView otrzymuje notyfikację przez `onDataChange`
   - MapView aktualizuje wizualizację (jeśli zmiana dotyczy lokalizacji/zasięgu)
   - MatchesView odświeża listę dopasowań
   - Toast informuje o sukcesie operacji

#### 9. **Użytkownik rozwija oba panele na desktopie**:
   - Kliknięcie chevron na pierwszym panelu → panel rozwija się
   - Kliknięcie chevron na drugim panelu:
     - Drugi panel próbuje się rozwinąć
     - Jeśli suma szerokości przekracza dozwolone 40% (każdy panel):
       - Pierwszy panel automatycznie zwija się do minimum
       - Drugi panel rozwija się w pełni
       - Animacje są płynne i zsynchronizowane

### Scenariusze brzegowe:

#### 10. **Brak lokalizacji w profilu**:
   - MapView wyświetla domyślną lokalizację (Warszawa)
   - MatchesView pokazuje EmptyState "no_location"
   
   **Mobile**: Panel profilu jest domyślnie otwarty jako Sheet z zachętą do uzupełnienia lokalizacji
   
   **Desktop**: Panel profilu jest rozwinięty z podświetloną sekcją lokalizacji

#### 11. **Błąd ładowania jednego z komponentów**:
   - Komponent z błędem wyświetla swój error state wewnątrz swojego panelu/obszaru
   - Pozostałe komponenty działają normalnie i są dostępne
   - Nie blokuje to dostępu do innych funkcjonalności
   
   **Mobile**: Użytkownik może przełączać się między panelami przez BottomNavigation
   
   **Desktop**: Użytkownik widzi stan błędu w jednym panelu, ale może korzystać z pozostałych

#### 12. **Zmiana rozmiaru okna z mobile na desktop**:
   - Aplikacja wykrywa zmianę przez media query
   - BottomNavigation ukrywa się z fade-out
   - Sheet components transformują się w boczne panele z chevron
   - Layout płynnie przechodzi w tryb desktop
   - Zachowany zostaje stan danych (nie ma przeładowania)

#### 13. **Zmiana rozmiaru okna z desktop na mobile**:
   - Aplikacja wykrywa zmianę przez media query
   - Panele boczne z chevron transformują się w Sheet components
   - BottomNavigation pojawia się z fade-in
   - Otwarte panele zostają zamknięte, użytkownik widzi tylko mapę
   - Zachowany zostaje stan danych

## 9. Layout i responsywność

### Struktura CSS/Tailwind:

- **MainView container**:
  - `relative h-screen w-full overflow-hidden`
  
- **MapView layer (bazowa)**:
  - `absolute inset-0 z-0`
  
- **Sheet components (mobile, < 768px)**:
  - Customowe style dla bottom sheet pattern
  - `z-10` dla paneli
  - `max-h-[70vh]` - maksymalna wysokość Sheet (mapa min. 30%)
  
- **Side panels (desktop, ≥ 768px)**:
  - Panel profilu (lewy): `absolute left-0 top-0 bottom-0 z-10`
  - Panel dopasowań (prawy): `absolute right-0 top-0 bottom-0 z-10`
  - Wąski pasek zwinięty: `w-12` (48px)
  - Panel rozwinięty: `w-80 md:w-96` (320px/384px), `max-w-[40vw]`
  
- **Chevron trigger (desktop only)**:
  - `absolute top-1/2 -translate-y-1/2`
  - Panel lewy: chevron po prawej stronie paska (`right-0`)
  - Panel prawy: chevron po lewej stronie paska (`left-0`)
  - `w-12 h-12 flex items-center justify-center`
  - `bg-background/80 backdrop-blur-sm border rounded-full`
  - `hover:bg-accent transition-colors cursor-pointer`
  
- **Vertical text (w zwiniętym panelu)**:
  - `writing-mode: vertical-rl` lub `transform: rotate(-90deg)` dla tekstu
  - `text-sm font-medium text-muted-foreground`
  
- **BottomNavigation (mobile only, < 768px)**:
  - `md:hidden` - ukryty na desktopie
  - `fixed bottom-0 left-0 right-0 z-20`
  - `h-16 bg-background border-t`
  - `flex items-center justify-around`
  
- **AddressSearch (w MapView)**:
  - `absolute top-4 left-1/2 -translate-x-1/2 z-[1000]`
  - Desktop: `md:top-4` (może wymagać adjustmentu jeśli koliduje z panelami)

### Reguły szerokości/wysokości paneli:

**Mobile (< 768px)**:
- Sheet maksymalna wysokość: `max-h-[70vh]` (mapa minimum 30% wysokości)
- Sheet szerokość: `w-full` (pełna szerokość ekranu)

**Desktop (≥ 768px)**:
- Panel zwinięty: `w-12` (48px)
- Panel rozwinięty: `w-80` (320px) lub `w-96` (384px), ale `max-w-[40vw]`
- Mapa zawsze widoczna: `min-w-[30vw]`
- Maksymalnie jeden panel rozwinięty na raz, aby zachować min. 30% dla mapy
- Suma szerokości obu paneli (jeśli oba rozwinięte): nie więcej niż 70% ekranu

### Animacje (Tailwind + CSS):

```css
/* Transition dla Sheet */
.sheet-enter {
  transition: transform 300ms ease-in-out;
}

.sheet-exit {
  transition: transform 300ms ease-in-out;
}
```

W Tailwind:
- `transition-transform duration-300 ease-in-out`

## 10. Warunki i walidacja

**Mobile (< 768px)**:
- **Otwarcie panelu**: Maksymalnie jeden panel (Sheet) może być otwarty w tym samym czasie
- **Wysokość panelu**: Sheet nie może przekroczyć 70% wysokości ekranu, zapewniając minimum 30% dla mapy
- **BottomNavigation**: Zawsze widoczny i dostępny

**Desktop (≥ 768px)**:
- **Otwarcie panelu**: Oba panele mogą być jednocześnie rozwinięte, o ile nie przekraczają limitów szerokości
- **Szerokość paneli**: Pojedynczy panel max 40% szerokości ekranu, suma obu max 70%, mapa minimum 30%
- **Chevron control**: Zawsze dostępny, nawet gdy panel jest rozwinięty
- **BottomNavigation**: Ukryty (display: none na ≥ md breakpoint)

**Ogólne**:
- **Synchronizacja danych**: Zmiany w ProfileView są propagowane tylko po udanym zapisie do API
- **Odświeżanie MatchesView**: Odświeżenie następuje tylko przy zmianach wpływających na algorytm dopasowania (lokalizacja, zasięg, sporty)
- **Responsywne media queries**: Breakpoint mobile/desktop: 768px (md w Tailwind)

## 11. Obsługa błędów

- **Błąd ładowania MapView**: Wyświetlenie error state w warstwie mapy. Panele boczne działają normalnie.
- **Błąd ładowania ProfileView**: Wyświetlenie error state w Sheet. Przycisk "Spróbuj ponownie" wewnątrz panelu.
- **Błąd ładowania MatchesView**: Wyświetlenie error state w Sheet. Pozostałe funkcjonalności nienaruszone.
- **Błąd synchronizacji**: Jeśli propagacja zmian się nie powiedzie, wyświetlenie Toast z informacją. Użytkownik może ręcznie odświeżyć stronę.
- **Brak autoryzacji (401)**: Globalny handler przekierowuje na `/login`.

## 12. Z-index hierarchy

Zgodnie z rekomendacją:

- Mapa (MapView): `z-0` (base layer)
- Panele Sheet: `z-10`
- BottomNavigation: `z-20`
- AddressSearch: `z-[1000]`
- Shadcn Dialogs (w ProfileView): `z-50` (default)
- Toast notifications: `z-[100]` (highest)

Konfiguracja w `tailwind.config`:

```javascript
theme: {
  extend: {
    zIndex: {
      'map': '0',
      'panels': '10',
      'navigation': '20',
      'search': '1000',
      'toast': '100',
    }
  }
}
```

## 13. Instalacja dodatkowych komponentów shadcn/ui

Przed implementacją należy zainstalować komponent Sheet:

```bash
npx shadcn@latest add sheet
```

## 14. Kroki implementacji

1. **Instalacja komponentu Sheet**:
   - Uruchomić `npx shadcn@latest add sheet`
   - Zweryfikować poprawność instalacji w `/src/components/ui/sheet.tsx`

2. **Utworzenie typu `MainViewState` i pozostałych typów**:
   - Stworzyć plik `/src/components/main/types.ts` z definicjami typów
   - Wyeksportować typy dla użycia w hookach i komponentach

3. **Implementacja hooka `useMainView`**:
   - Stworzyć plik `/src/components/main/hooks/useMainView.ts`
   - Zaimplementować logikę zarządzania stanem paneli
   - Zaimplementować funkcje synchronizacji między komponentami
   - Dodać logikę obsługi reguły "tylko jeden panel otwarty"

4. **Utworzenie komponentu `BottomNavigation`**:
   - Stworzyć plik `/src/components/main/BottomNavigation.tsx`
   - Zaimplementować layout z trzema przyciskami
   - Dodać ikony z lucide-react (User, MapPin, Users)
   - Implementować visual feedback dla aktywnego panelu
   - Zastosować odpowiednie style (fixed position, z-index)

5. **Modyfikacja `MapView`**:
   - Dodać props `onLocationUpdate` do interfejsu
   - Wywołać callback po udanym zapisie zmian w lokalizacji/zasięgu
   - Upewnić się, że AddressSearch ma prawidłowy z-index (1000)

6. **Modyfikacja `ProfileView`**:
   - Dodać props `onDataChange` do interfejsu
   - Wywołać callback po każdej udanej zmianie w profilu
   - Dostosować layout do wyświetlania w Sheet (usunąć zewnętrzny padding jeśli potrzeba)
   - Dodać hook do hooka `useProfileView` do propagowania zmian

7. **Modyfikacja `MatchesView`**:
   - Dodać props `refreshTrigger` i `onRefreshComplete` do interfejsu
   - Zmodyfikować hook `useMatchesView` do nasłuchiwania na `refreshTrigger`
   - Zaimplementować logikę automatycznego odświeżania przy zmianie triggera
   - Wywołać `onRefreshComplete` po zakończeniu ładowania

8. **Utworzenie komponentu `MainView`**:
   - Stworzyć plik `/src/components/main/MainView.tsx`
   - Użyć hooka `useMainView` do zarządzania stanem
   - Zaimplementować layout z MapView jako warstwą bazową
   - Dodać dwa komponenty Sheet (ProfileSheet i MatchesSheet)
   - Osadzić ProfileView i MatchesView wewnątrz odpowiednich Sheet
   - Dodać BottomNavigation z podpiętymi handlerami
   - Zaimplementować propagację eventów między komponentami

9. **Modyfikacja strony Astro `/src/pages/index.astro`**:
   - Zaimportować komponent `MainView`
   - Wyrenderować z dyrektywą `client:only="react"`
   - Upewnić się, że Layout zawiera `<Toaster />` dla powiadomień

10. **Implementacja animacji i transitions**:
    - Dodać odpowiednie klasy Tailwind do Sheet components
    - Skonfigurować `transition-transform duration-300 ease-in-out`
    - Przetestować płynność animacji otwarcia/zamknięcia paneli
    - Upewnić się, że animacje nie konfliktują między sobą

11. **Konfiguracja z-index w Tailwind**:
    - Dodać custom z-index values do `tailwind.config.js`
    - Zastosować odpowiednie z-index do wszystkich warstw
    - Zweryfikować hierarchię wizualną

12. **Implementacja reguł szerokości**:
    - Dodać logikę CSS/Tailwind dla minimalnej szerokości mapy (30%)
    - Dodać maksymalną szerokość paneli (40%)
    - Przetestować na różnych rozdzielczościach

13. **Testowanie synchronizacji**:
    - Przetestować propagację zmian lokalizacji z MapView
    - Przetestować propagację zmian profilu (lokalizacja, zasięg, sporty)
    - Zweryfikować automatyczne odświeżanie MatchesView
    - Upewnić się, że nie ma cykli w propagacji eventów

14. **Testowanie responsywności i interakcji**:
    - Przetestować na różnych rozdzielczościach ekranu
    - Zweryfikować działanie na urządzeniach dotykowych
    - Przetestować wszystkie ścieżki nawigacji przez BottomNavigation
    - Zweryfikować reguły otwarcia paneli

15. **Testowanie obsługi błędów**:
    - Symulować błędy ładowania dla każdego komponentu osobno
    - Zweryfikować izolację błędów
    - Przetestować scenariusze brzegowe (brak lokalizacji, brak dopasowań)

16. **Optymalizacja wydajności**:
    - Dodać React.memo dla komponentów, które tego wymagają
    - Zoptymalizować re-rendery przy zmianach stanu
    - Zweryfikować, że zmiany w jednym panelu nie powodują niepotrzebnych re-renderów innych

17. **Finalizacja i dokumentacja**:
    - Dodać komentarze JSDoc do kluczowych funkcji
    - Utworzyć README w `/src/components/main/` z opisem architektury
    - Dodać przykłady użycia dla przyszłych modyfikacji
