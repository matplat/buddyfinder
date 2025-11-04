# Plan implementacji widoku ProfileView

## 1. Przegląd

Widok `ProfileView` jest centralnym miejscem, w którym użytkownik zarządza swoim profilem. Umożliwia edycję podstawowych danych, zarządzanie linkami do mediów społecznościowych oraz, co najważniejsze, dodawanie, edytowanie i usuwanie uprawianych sportów wraz z ich specyficznymi parametrami. Widok jest zaprojektowany w podejściu "mobile-first" i wykorzystuje akordeon do podziału na sekcje "Dane" i "Sporty", co ułatwia nawigację i zarządzanie informacjami.

## 2. Routing widoku

Widok będzie dostępny w głównej zakładce "Profil", co zazwyczaj odpowiada ścieżce głównej aplikacji, gdy ta zakładka jest aktywna. W kontekście Astro, będzie to prawdopodobnie część strony renderowanej warunkowo lub na dedykowanej podstronie profilu, np. `/profile`.

## 3. Struktura komponentów

Hierarchia komponentów została zaprojektowana w celu zapewnienia reużywalności i separacji logiki.

```
ProfileView (Komponent-strona)
├── Skeleton (wyświetlany podczas ładowania danych)
└── Accordion (shadcn/ui, z dwiema sekcjami)
    ├── AccordionItem (dla danych profilowych)
    │   └── ProfileDataSection
    │       ├── Input (dla display_name)
    │       ├── div (lista komponentów SocialLinkBadge)
    │       │   └── SocialLinkBadge
    │       │       ├── Button (Edit) -> otwiera SocialLinkEditorDialog
    │       │       └── Button (Delete) -> otwiera ConfirmationDialog
    │       ├── Button ("Dodaj link") -> otwiera SocialMediaEditorDialog
    │       └── Button ("Zapisz") -> zapisanie zmian z display_name
    └── AccordionItem (dla sportów)
        └── ProfileSportsSection
            ├── Button -> otwiera SportEditorDialog (w trybie dodawania)
            ├── EmptyState (jeśli brak sportów)
            └── SportBadge (dla każdego sportu)
                ├── Button (Edit) -> otwiera SportEditorDialog (w trybie edycji)
                └── Button (Delete) -> otwiera ConfirmationDialog
```

- **Dialogi (renderowane na poziomie `ProfileView`):**
  - `SocialMediaEditorDialog`
  - `SocialLinkEditorDialog`
  - `SportEditorDialog`
  - `ConfirmationDialog`

## 4. Szczegóły komponentów

### `ProfileView`

- **Opis:** Główny kontener widoku. Odpowiada za pobranie wszystkich niezbędnych danych, zarządzanie stanem (za pomocą hooka `useProfileView`) oraz renderowanie głównych sekcji i dialogów.
- **Główne elementy:** `Accordion`, `ProfileDataSection`, `ProfileSportsSection`, `SocialMediaEditorDialog`, `SocialLinkEditorDialog`, `SportEditorDialog`, `ConfirmationDialog`.
- **Obsługiwane interakcje:** Brak bezpośrednich. Zarządza stanem dla komponentów podrzędnych.
- **Typy:** `ProfileViewModel`, `UserSportViewModel`, `SportDto`.
- **Propsy:** Brak.

### `ProfileDataSection`

- **Opis:** Wyświetla podstawowe dane użytkownika (nazwa wyświetlana, nazwa użytkownika) oraz listę linków do mediów społecznościowych w formie komponentów `SocialLinkBadge`. Umożliwia bezpośrednią edycję nazwy wyświetlanej oraz dodawanie nowych linków.
- **Główne elementy:** Elementy tekstowe (`<p>`), `Input` dla `display_name`, lista komponentów `SocialLinkBadge`, `Button` do otwarcia `SocialMediaEditorDialog` (do dodawania nowych linków).
- **Obsługiwane interakcje:** Edycja `display_name`, otwarcie `SocialMediaEditorDialog`, inicjowanie edycji pojedynczego linku, inicjowanie usunięcia pojedynczego linku.
- **Typy:** `ProfileViewModel`.
- **Propsy:** `profile: ProfileViewModel`, `onUpdateDisplayName: (newName: string) => void`, `onAddSocialLink: () => void`, `onEditSocialLink: (platform: string, url: string) => void`, `onDeleteSocialLink: (platform: string) => void`.

### `SocialLinkBadge`

- **Opis:** Kompaktowy komponent wyświetlający pojedynczy link do medium społecznościowego, zawierający ikonę platformy, jej nazwę oraz przyciski do edycji i usunięcia.
- **Główne elementy:** Ikona platformy (np. z `lucide-react`), nazwa platformy (`<p>`), `Button` z ikoną ołówka (edycja), `Button` z ikoną kosza (usunięcie) (oba buttony powinny mieć możliwość być wyłączone i niewyświetlane).
- **Obsługiwane interakcje:** Kliknięcie ikony edycji, kliknięcie ikony usunięcia.
- **Propsy:** `platform: string`, `url: string`, `onEdit: (platform: string, url: string) => void`, `onDelete: (platform: string) => void`.

### `SocialLinkEditorDialog`

- **Opis:** Modal z formularzem do edycji *pojedynczego* linku social media.
- **Główne elementy:** `Dialog`, `Form`, `Input` (dla URL linku), `Button` ("Zapisz", "Anuluj").
- **Obsługiwana walidacja:** Wartość w polu linku musi być poprawnym adresem URL.
- **Typy:** `UpdateProfileCommand` (do wysłania zaktualizowanego `social_links`).
- **Propsy:** `isOpen: boolean`, `platform: string`, `url: string`, `onSave: (platform: string, newUrl: string) => void`, `onClose: () => void`.

### `SocialMediaEditorDialog`

- **Opis:** Modal z formularzem do dodawania *nowych* linków social media. (Edycja istniejących linków odbywa się przez `SocialLinkEditorDialog`).
- **Główne elementy:** `Dialog`, `Form`, `Input` (dla nowego linku), `Select` (dla platformy nowego linku), `Button` ("Zapisz", "Anuluj").
- **Obsługiwana walidacja:** Nowy link musi być poprawnym URL i mieć wybraną platformę.
- **Typy:** `UpdateProfileCommand`.
- **Propsy:** `isOpen: boolean`, `onSave: (platform: string, url: string) => void`, `onClose: () => void`.

### `ProfileSportsSection`

- **Opis:** Wyświetla listę sportów dodanych przez użytkownika oraz przycisk do dodawania nowego sportu.
- **Główne elementy:** `Button` ("Dodaj sport"), lista komponentów `SportBadge` lub komponent `EmptyState`.
- **Obsługiwane interakcje:** Dodanie nowego sportu, edycja istniejącego, usunięcie istniejącego.
- **Typy:** `UserSportViewModel`.
- **Propsy:** `userSports: UserSportViewModel[]`, `onAdd: () => void`, `onEdit: (sport: UserSportViewModel) => void`, `onDelete: (sport: UserSportViewModel) => void`.

### `SportBadge`

- **Opis:** Kompaktowy komponent wyświetlający nazwę sportu, jego parametry oraz ikony akcji.
- **Główne elementy:** Nazwa sportu, lista parametrów (klucz-wartość), `Button` z ikoną ołówka, `Button` z ikoną kosza (oba buttony powinny mieć możliwość być wyłączone i niewyświetlane).
- **Obsługiwane interakcje:** Kliknięcie ikony edycji, kliknięcie ikony usunięcia.
- **Propsy:** `sport: UserSportViewModel`, `onEdit: (sport: UserSportViewModel) => void`, `onDelete: (sport: UserSportViewModel) => void`.

### `SportEditorDialog`

- **Opis:** Modal z formularzem do dodawania lub edycji sportu i jego parametrów. Formularz dynamicznie dostosowuje pola do wybranego sportu.
- **Główne elementy:** `Dialog`, `Form`, `Select` (do wyboru sportu w trybie 'add'), dynamicznie generowane `Input` dla parametrów, `Input` dla `custom_range_km`.
- **Obsługiwana walidacja:**
  - `sport_id`: Pole wymagane w trybie dodawania.
  - `parameters`: Wszystkie pola parametrów dla danego sportu są wymagane.
  - `custom_range_km`: Opcjonalna wartość numeryczna, w zakresie 1-100.
- **Typy:** `AddUserSportCommand`, `UpdateUserSportCommand`, `SportDto`.
- **Propsy:** `isOpen: boolean`, `mode: 'add' | 'edit'`, `allSports: SportDto[]`, `sportToEdit?: UserSportViewModel`, `onSave: (data: AddUserSportCommand | UpdateUserSportCommand) => void`, `onClose: () => void`.

### `ConfirmationDialog`

- **Opis:** Generyczny modal do potwierdzania akcji destrukcyjnych (usunięcia sportu lub linku).
- **Główne elementy:** `Dialog` z tytułem, opisem i przyciskami "Potwierdź" i "Anuluj".
- **Propsy:** `isOpen: boolean`, `title: string`, `description: string`, `onConfirm: () => void`, `onClose: () => void`.

## 5. Typy

Do implementacji widoku, oprócz typów DTO zdefiniowanych przez API, potrzebne będą następujące typy i modele widoku:

- **`ProfileViewModel`**: Odzwierciedlenie `ProfileDto` z API.

  ```typescript
  interface ProfileViewModel {
    id: string;
    username: string;
    display_name: string;
    social_links: Record<string, string>;
    // ... inne pola z ProfileDto
  }
  ```

- **`UserSportViewModel`**: Odzwierciedlenie `UserSportDto` z API.

  ```typescript
  interface UserSportViewModel {
    sport_id: number;
    name: string;
    parameters: Record<string, number>;
    custom_range_km: number | null;
  }
  ```

- **`SportEditorFormState`**: Stan formularza w `SportEditorDialog`.

  ```typescript
  interface SportEditorFormState {
    sport_id: number | null;
    parameters: Record<string, string>; // Wartości z inputów są stringami
    custom_range_km: string;
  }
  ```

## 6. Zarządzanie stanem

Cała logika biznesowa, operacje na danych oraz zarządzanie stanem widoku zostaną zamknięte w customowym hooku `useProfileView`.

- **`useProfileView()`**
  - **Zarządzany stan:**
    - `profile: ProfileViewModel | null`
    - `userSports: UserSportViewModel[]`
    - `allSports: SportDto[]` (lista wszystkich dostępnych sportów)
    - `isLoading: boolean` (stan ładowania danych początkowych)
    - `isSubmitting: boolean` (stan podczas wysyłania formularzy)
    - `error: Error | null`
    - `dialogState: { type: 'sport' | 'socialAdd' | 'socialEdit' | 'confirm' | null, data?: any }`
  - **Udostępniane funkcje:**
    - `fetchInitialData()`: Pobiera wszystkie dane z API.
    - `updateProfile(data: UpdateProfileCommand)`: Aktualizuje profil użytkownika (w tym `display_name` i `social_links`).
    - `addSocialLink(platform: string, url: string)`: Dodaje nowy link social media.
    - `updateSocialLink(platform: string, newUrl: string)`: Aktualizuje URL konkretnego linku social media.
    - `deleteSocialLink(platform: string)`: Usuwa pojedynczy link social media.
    - `addSport(data: AddUserSportCommand)`: Dodaje nowy sport.
    - `updateSport(sportId: number, data: UpdateUserSportCommand)`: Aktualizuje istniejący sport.
    - `deleteSport(sportId: number)`: Usuwa sport.
    - `openDialog(type, options)`: Otwiera odpowiedni dialog.
    - `closeDialog()`: Zamyka aktywny dialog.

## 7. Integracja API

Integracja będzie opierać się na wywołaniach `fetch` do wewnętrznych endpointów API Astro. Hook `useProfileView` będzie odpowiedzialny za wszystkie te operacje.

- **Pobieranie danych (GET):**
  - `GET /api/profiles/me` -> `profile`
  - `GET /api/profiles/me/sports` -> `userSports`
  - `GET /api/sports` -> `allSports`
- **Modyfikacja danych:**
  - `PATCH /api/profiles/me` (Request: `UpdateProfileCommand`, Response: `ProfileDto`)
  - `POST /api/profiles/me/sports` (Request: `AddUserSportCommand`, Response: `UserSportDto`)
  - `PUT /api/profiles/me/sports/{sport_id}` (Request: `UpdateUserSportCommand`, Response: `UserSportDto`)
  - `DELETE /api/profiles/me/sports/{sport_id}` (Response: `204 No Content`)

Po każdej udanej operacji modyfikacji danych, odpowiednia część stanu zostanie odświeżona przez ponowne pobranie danych lub optymistyczną aktualizację.

## 8. Interakcje użytkownika

- **Edycja nazwy wyświetlanej:** Użytkownik edytuje `display_name` bezpośrednio w `ProfileDataSection`, a zmiana jest zapisywana po opuszczeniu pola lub kliknięciu przycisku "Zapisz".
- **Dodawanie linku social media:** Użytkownik klika "Dodaj link", co otwiera `SocialMediaEditorDialog`. Po wypełnieniu formularza i zapisaniu, nowy link jest dodawany do profilu, a widok odświeżany.
- **Edycja pojedynczego linku social media:** Użytkownik klika ikonę ołówka na `SocialLinkBadge`, co otwiera `SocialLinkEditorDialog` z predefiniowanym linkiem. Po edycji i zapisaniu, link jest aktualizowany w profilu, a widok odświeżany.
- **Usuwanie linku social media:** Użytkownik klika ikonę kosza na `SocialLinkBadge`, co otwiera `ConfirmationDialog`. Po potwierdzeniu, link jest usuwany z profilu, a widok się odświeża.
- **Dodawanie sportu:** Użytkownik klika "Dodaj sport", co otwiera `SportEditorDialog` w trybie 'add'. Wybiera sport z listy, co dynamicznie generuje pola na parametry. Po wypełnieniu i zapisaniu, dane są wysyłane, a lista sportów się aktualizuje.
- **Edycja sportu:** Użytkownik klika ikonę edycji na `SportBadge`, co otwiera `SportEditorDialog` w trybie 'edit' z wypełnionymi danymi. Proces zapisu jest analogiczny do dodawania.
- **Usuwanie sportu:** Użytkownik klika ikonę kosza na `SportBadge`, co otwiera `ConfirmationDialog`. Po potwierdzeniu, sport jest usuwany, a lista się odświeża.

## 9. Warunki i walidacja

Walidacja będzie przeprowadzana po stronie klienta przed wysłaniem żądania do API, aby zapewnić szybką informację zwrotną.

- **`ProfileDataSection` (dla `display_name`):** `display_name` nie może być pusty.
- **`SocialLinkEditorDialog`:** Pole linku social media będzie walidowane pod kątem formatu URL.
- **`SocialMediaEditorDialog`:** Nowy link musi być poprawnym URL i mieć wybraną platformę.
- **`SportEditorDialog`:**
  - W trybie dodawania, wybór sportu z listy jest wymagany.
  - Wszystkie dynamicznie generowane pola parametrów są wymagane i muszą być liczbami.
  - `custom_range_km` musi być liczbą lub puste.
- Przyciski "Zapisz" w formularzach będą nieaktywne (`disabled`), dopóki wszystkie warunki walidacji nie zostaną spełnione.

## 10. Obsługa błędów

- **Błędy ładowania danych:** W przypadku niepowodzenia pobierania danych początkowych, zostanie wyświetlony komunikat o błędzie z przyciskiem "Spróbuj ponownie".
- **Błędy walidacji (400):** Toast poinformuje o błędzie walidacji, a formularz pozostanie otwarty, aby użytkownik mógł poprawić dane.
- **Konflikt (409):** Przy próbie dodania istniejącego sportu, zostanie wyświetlony toast z informacją "Ten sport jest już na Twojej liście".
- **Błędy serwera (5xx):** Zostanie wyświetlony generyczny toast z informacją o błędzie serwera i prośbą o spróbowanie później.
- **Brak autoryzacji (401):** Globalny mechanizm obsługi błędów aplikacji powinien przekierować użytkownika do strony logowania.

## 11. Kroki implementacji

1. **Utworzenie struktury plików:** Stworzenie plików dla komponentów: `ProfileView.tsx`, `ProfileDataSection.tsx`, `ProfileSportsSection.tsx`, `SportBadge.tsx`, `SocialLinkBadge.tsx`, `SocialLinkEditorDialog.tsx`, `SocialMediaEditorDialog.tsx` oraz `ConfirmationDialog.tsx`.
2. **Implementacja hooka `useProfileView`:** Zdefiniowanie stanu, implementacja funkcji do pobierania danych (`fetchInitialData`) oraz funkcji-handlerów dla akcji CRUD, w tym `updateProfile`, `addSocialLink`, `updateSocialLink`, `deleteSocialLink`, `addSport`, `updateSport`, `deleteSport`.
3. **Budowa `ProfileView` i sekcji:** Stworzenie layoutu z `Accordion` i podpięcie sekcji. Implementacja stanów ładowania (Skeletons) i błędów.
4. **Implementacja `SocialLinkBadge`:** Stworzenie komponentu wraz z mapowaniem ikon dla poszczególnych platform.
5. **Implementacja `SocialLinkEditorDialog`:** Stworzenie formularza do edycji pojedynczego linku social media.
6. **Implementacja `SocialMediaEditorDialog`:** Stworzenie formularza do dodawania nowych linków social media.
7. **Implementacja `SportEditorDialog`:** Stworzenie formularza z dynamicznym renderowaniem pól na podstawie konfiguracji parametrów sportów. Podpięcie logiki dodawania i edycji do hooka.
8. **Implementacja `ConfirmationDialog`:** Stworzenie generycznego komponentu i podpięcie go do akcji usuwania sportu i linku.
9. **Finalizacja logiki w `useProfileView`:** Uzupełnienie funkcji-handlerów o wywołania API, obsługę `isSubmitting`, odświeżanie danych oraz wyświetlanie powiadomień (Toast).
10. **Stylowanie i testowanie:** Dopracowanie wyglądu zgodnie z mobile-first i przetestowanie wszystkich ścieżek interakcji użytkownika, włączając w to przypadki brzegowe i obsługę błędów.
