# Komponenty w BuddyFinder

## Komponenty Profile View

### ProfileView
**Ścieżka:** `/src/components/profile/ProfileView.tsx`

Główny komponent widoku profilu użytkownika. Zarządza stanem dialogów i wyświetla sekcje danych profilu oraz sportów.

**Funkcje:**
- Wyświetlanie danych profilu i sportów w zakładkach
- Zarządzanie stanem wszystkich dialogów (edycja, potwierdzenia)
- Obsługa powiadomień o sukcesie/błędach

**Zależności:**
- ProfileDataSection
- ProfileSportsSection
- SocialMediaEditorDialog
- SocialLinkEditorDialog
- SportEditorDialog
- ConfirmationDialog

### ProfileDataSection
**Ścieżka:** `/src/components/profile/ProfileDataSection.tsx`

Komponent odpowiedzialny za wyświetlanie i edycję podstawowych danych profilu.

**Funkcje:**
- Edycja nazwy wyświetlanej
- Zarządzanie linkami do mediów społecznościowych
- Wyświetlanie listy SocialLinkBadge

### ProfileSportsSection
**Ścieżka:** `/src/components/profile/ProfileSportsSection.tsx`

Komponent zarządzający listą sportów użytkownika.

**Funkcje:**
- Wyświetlanie listy sportów
- Dodawanie nowych sportów
- Stan pusty gdy brak sportów

### SocialLinkBadge
**Ścieżka:** `/src/components/profile/SocialLinkBadge.tsx`

Komponent reprezentujący pojedynczy link do mediów społecznościowych.

**Funkcje:**
- Wyświetlanie ikony platformy
- Wyświetlanie linku
- Przyciski akcji (edycja, usunięcie)
- Obsługa różnych platform (Instagram, Facebook, Strava, Garmin)

### SportBadge
**Ścieżka:** `/src/components/profile/SportBadge.tsx`

Komponent reprezentujący pojedynczy sport użytkownika.

**Funkcje:**
- Wyświetlanie nazwy sportu
- Wyświetlanie niestandardowego zasięgu
- Wyświetlanie parametrów sportu
- Przyciski akcji (edycja, usunięcie)

### Dialogi

#### SocialMediaEditorDialog
**Ścieżka:** `/src/components/profile/SocialMediaEditorDialog.tsx`

Dialog do dodawania nowych linków social media.

**Funkcje:**
- Wybór platformy
- Walidacja URL
- Obsługa formularza z react-hook-form i zod

#### SocialLinkEditorDialog
**Ścieżka:** `/src/components/profile/SocialLinkEditorDialog.tsx`

Dialog do edycji istniejących linków social media.

**Funkcje:**
- Edycja URL dla wybranej platformy
- Walidacja URL
- Obsługa formularza z react-hook-form i zod

#### SportEditorDialog
**Ścieżka:** `/src/components/profile/SportEditorDialog.tsx`

Dialog do dodawania i edycji sportów.

**Funkcje:**
- Wybór sportu (w trybie dodawania)
- Ustawianie niestandardowego zasięgu
- Dynamiczne pola parametrów
- Walidacja wszystkich pól

#### ConfirmationDialog
**Ścieżka:** `/src/components/profile/ConfirmationDialog.tsx`

Generyczny dialog potwierdzenia dla akcji destrukcyjnych.

**Funkcje:**
- Wyświetlanie tytułu i opisu
- Przyciski potwierdzenia i anulowania
- Możliwość dostosowania komunikatów

### Hooki

#### useProfileView
**Ścieżka:** `/src/components/profile/hooks/useProfileView.ts`

Hook zarządzający stanem i logiką biznesową widoku profilu.

**Funkcje:**
- Pobieranie danych profilu i sportów
- Zarządzanie stanem ładowania
- Operacje CRUD na danych profilu
- Obsługa błędów i powiadomień

## Wzorce i konwencje

### Zarządzanie stanem
- Lokalny stan komponentów dla UI
- Hook useProfileView dla logiki biznesowej
- Potwierdzenia akcji przez ConfirmationDialog

### Obsługa błędów
- Toast notifications dla informacji zwrotnej
- Obsługa błędów API w hooku useProfileView
- Walidacja formularzy przez zod

### Dostępność
- ARIA labels dla przycisków akcji
- Dostępna nawigacja klawiaturą
- Komunikaty o błędach dla czytników ekranu

### Stylowanie
- Wykorzystanie komponentów shadcn/ui
- Tailwind CSS dla customowych styli
- Responsywny design (mobile-first)