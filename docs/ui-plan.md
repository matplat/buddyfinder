# Architektura UI dla BuddyFinder

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla BuddyFinder jest oparta na podejściu "mobile-first", co oznacza, że projekt i układ są zoptymalizowane przede wszystkim dla urządzeń mobilnych. Głównym elementem nawigacyjnym jest dolny pasek z trzema zakładkami, zapewniający stały i łatwy dostęp do kluczowych sekcji aplikacji: "Profil", "Mapa" i "Znajomi".

Aplikacja zostanie zbudowana przy użyciu frameworka Astro z komponentami React. W celu zapewnienia spójności wizualnej, dostępności (a11y) i przyspieszenia rozwoju, interfejs będzie intensywnie korzystał z biblioteki komponentów `shadcn/ui`. Zarządzanie stanem serwera (pobieranie danych, buforowanie, paginacja) będzie obsługiwane przez bibliotekę TanStack Query, a stan sesji użytkownika przez `@supabase/supabase-js`.

Interakcje użytkownika, takie jak edycja danych czy potwierdzanie akcji, będą realizowane głównie poprzez okna modalne i dialogowe, co pozwoli utrzymać główne widoki w czystości. Natychmiastowa informacja zwrotna na akcje użytkownika (np. zapis danych, błędy) będzie komunikowana za pomocą powiadomień typu "toast".

## 2. Lista widoków

### 1. Widok Logowania / Rejestracji

- **Nazwa widoku**: AuthView
- **Ścieżka widoku**: `/login` (lub strona główna dla niezalogowanych)
- **Główny cel**: Umożliwienie użytkownikom zalogowania się na istniejące konto lub zarejestrowania nowego.
- **Kluczowe informacje do wyświetlenia**: Formularz logowania (e-mail/hasło), formularz rejestracji (nazwa użytkownika, e-mail, hasło).
- **Kluczowe komponenty widoku**: `Card`, `Tabs` (do przełączania między logowaniem a rejestracją), `Input`, `Button`, `Label`.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Jasne komunikaty o błędach walidacji (np. "Hasło jest za krótkie", "Użytkownik o tym e-mailu już istnieje"). Automatyczne przekierowanie do widoku profilu po udanej rejestracji.
  - **Dostępność**: Poprawne etykietowanie pól formularza. Obsługa nawigacji klawiaturą.
  - **Bezpieczeństwo**: Komunikacja z API odbywa się przez HTTPS. Hasła nie są przechowywane w stanie aplikacji.

### 2. Widok Profilu

- **Nazwa widoku**: ProfileView
- **Ścieżka widoku**: `/` (w ramach zakładki "Profil")
- **Główny cel**: Zarządzanie danymi osobowymi, linkami do mediów społecznościowych oraz uprawianymi sportami i ich parametrami.
- **Kluczowe informacje do wyświetlenia**: Nazwa użytkownika, e-mail, lista linków social media, lista dodanych sportów wraz z ich parametrami.
- **Kluczowe komponenty widoku**: `Accordion` (dla sekcji "Dane" i "Sporty"), `Button` ("Dodaj sport", "Edytuj dane"), `Dialog` (do edycji/dodawania sportów i linków), `ConfirmationDialog` (do usuwania), `Toast` (do informacji zwrotnej).
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Podział profilu na zwijane sekcje ułatwia zarządzanie. Użycie okien modalnych do edycji zapobiega przeładowaniu interfejsu. Ikony "x" przy każdym sporcie i linku do szybkiego usuwania (z potwierdzeniem).
  - **Dostępność**: `Accordion` i `Dialog` z `shadcn/ui` zapewniają wysoki standard dostępności, w tym zarządzanie focusem.
  - **Bezpieczeństwo**: Użytkownik może modyfikować tylko własne dane, co jest egzekwowane przez API.

### 3. Widok Mapy

- **Nazwa widoku**: MapView
- **Ścieżka widoku**: `/` (w ramach zakładki "Mapa")
- **Główny cel**: Ustawienie lub aktualizacja głównej lokalizacji użytkownika i domyślnego zasięgu poszukiwań.
- **Kluczowe informacje do wyświetlenia**: Interaktywna mapa (OpenStreetMap), znacznik w lokalizacji użytkownika, okrąg wizualizujący zasięg.
- **Kluczowe komponenty widoku**: Komponent-wrapper dla Leaflet.js, `Popover` lub `Dialog` (do wprowadzania wartości zasięgu po kliknięciu na mapę), `Button` ("Zapisz").
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Prosta interakcja: jedno kliknięcie na mapie aktywuje edycję lokalizacji i zasięgu. Mapa domyślnie centruje się na ostatnio zapisanej lokalizacji lub na domyślnej lokalizacji (np. Warszawa), jeśli żadna nie została ustawiona.
  - **Dostępność**: Należy zapewnić alternatywny sposób wprowadzenia lokalizacji dla użytkowników, którzy nie mogą korzystać z interaktywnej mapy (poza MVP).
  - **Bezpieczeństwo**: Dane o lokalizacji są przesyłane do API i traktowane jako dane wrażliwe.

### 4. Widok Znajomych (Dopasowań)

- **Nazwa widoku**: MatchesView
- **Ścieżka widoku**: `/` (w ramach zakładki "Znajomi")
- **Główny cel**: Przeglądanie listy użytkowników dopasowanych na podstawie lokalizacji i sportów.
- **Kluczowe informacje do wyświetlenia**: Lista kart użytkowników. Każda karta (w stanie zwiniętym) pokazuje nazwę użytkownika i odległość. Po rozwinięciu widoczny jest e-mail, szczegółowa lista sportów z parametrami i linki do social media.
- **Kluczowe komponenty widoku**: `Collapsible` lub `Accordion` (dla rozwijalnych kart użytkowników), `UserMatchCard` (komponent karty), `Button` ("Załaduj więcej"), `EmptyState` (komponent dla stanów "brak lokalizacji" lub "brak dopasowań"), `Skeleton` (do sygnalizowania ładowania listy).
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Paginacja za pomocą przycisku "Załaduj więcej" jest prosta w obsłudze na urządzeniach mobilnych. Rozwijalne karty pozwalają na szybkie skanowanie listy. Linki do social media otwierają się w nowej karcie.
  - **Dostępność**: Rozwijalne elementy muszą być w pełni obsługiwane z klawiatury i poprawnie komunikować swój stan (rozwinięty/zwinięty) czytnikom ekranu.
  - **Bezpieczeństwo**: Dane użytkowników (w tym e-mail) są wyświetlane tylko zalogowanym użytkownikom, zgodnie z wymaganiami PRD.

## 3. Mapa podróży użytkownika

Główny przepływ dla nowego użytkownika wygląda następująco:

1. **Rejestracja**: Użytkownik trafia na `AuthView`, wypełnia formularz rejestracyjny i tworzy konto.
2. **Przekierowanie i Onboarding**: Po udanej rejestracji zostaje automatycznie zalogowany i przekierowany do aplikacji, z domyślnie aktywną zakładką "Profil" (`ProfileView`).
3. **Konfiguracja profilu**:
    - W `ProfileView`, użytkownik otwiera sekcję "Sporty" i klika "Dodaj sport".
    - W oknie modalnym wybiera sport z listy, wypełnia wymagane parametry (np. tempo, dystans) i zapisuje zmiany.
    - Powtarza proces dla wszystkich uprawianych sportów.
4. **Ustawienie lokalizacji**:
    - Użytkownik przechodzi do zakładki "Mapa" (`MapView`).
    - Klika w wybranym miejscu na mapie, co powoduje wyświetlenie znacznika i okienka do wpisania domyślnego zasięgu w km.
    - Zapisuje lokalizację i zasięg.
5. **Znalezienie partnerów**:
    - Użytkownik przechodzi do zakładki "Znajomi" (`MatchesView`).
    - Aplikacja wysyła zapytanie do `GET /api/matches` i wyświetla listę dopasowanych użytkowników w formie kart.
    - Użytkownik może rozwijać karty, aby zobaczyć szczegóły, lub kliknąć "Załaduj więcej", aby pobrać kolejną stronę wyników.
6. **Nawiązanie kontaktu**: Użytkownik znajduje interesującą osobę, rozwija jej kartę i klika w link do social media lub kopiuje adres e-mail, aby nawiązać kontakt poza aplikacją.
7. **Wylogowanie**: Użytkownik wraca do `ProfileView` i klika przycisk "Wyloguj", co kończy sesję i przekierowuje go z powrotem do `AuthView`.

## 4. Układ i struktura nawigacji

- **Nawigacja główna**: Realizowana przez `BottomNavBar` - komponent paska nawigacyjnego na dole ekranu, widoczny we wszystkich głównych widokach po zalogowaniu. Zawiera trzy linki/ikony:
  - **Profil**: Prowadzi do `ProfileView`.
  - **Mapa**: Prowadzi do `MapView`.
  - **Znajomi**: Prowadzi do `MatchesView`.
- **Nawigacja kontekstowa**:
  - **Okna modalne (`Dialog`)**: Używane do izolowania złożonych akcji, takich jak dodawanie/edycja sportu lub linków social media, bez opuszczania bieżącego widoku.
  - **Potwierdzenia (`ConfirmationDialog`)**: Używane przed wykonaniem destrukcyjnych akcji (np. usunięcie sportu), aby zapobiec przypadkowym błędom.
  - **Powiadomienia (`Toast`)**: Pojawiają się na krótko, aby poinformować o wyniku operacji (sukces, błąd, informacja) i nie wymagają interakcji.
- **Przekierowania**:
  - Dostęp do widoków głównych jest chroniony. Niezalogowany użytkownik jest automatycznie przekierowywany do `AuthView`.
  - Otrzymanie odpowiedzi `401 Unauthorized` z dowolnego endpointu API skutkuje automatycznym wylogowaniem i przekierowaniem do `AuthView`.

## 5. Kluczowe komponenty

Poniżej znajduje się lista reużywalnych komponentów, które będą stanowić podstawę interfejsu użytkownika:

- **`BottomNavBar`**: Główny komponent nawigacyjny aplikacji.
- **`UserMatchCard`**: Rozwijalna karta wyświetlająca informacje o dopasowanym użytkowniku w widoku `MatchesView`.
- **`SportBadge`**: Mały komponent do wyświetlania nazwy sportu i jego kluczowych parametrów. Używany zarówno w `ProfileView`, jak i na kartach w `MatchesView`.
- **`ConfirmationDialog`**: Generyczny modal do potwierdzania akcji, np. "Czy na pewno chcesz usunąć ten sport?".
- **`SportEditor`**: Formularz (wewnątrz modala) do dodawania/edycji sportu i jego parametrów.
- **`SocialMediaEditor`**: Formularz (wewnątrz modala) do dodawania/edycji linków do mediów społecznościowych.
- **`EmptyState`**: Komponent wyświetlany, gdy lista jest pusta (np. brak dopasowań lub brak ustawionej lokalizacji), z odpowiednim komunikatem i ewentualnym wezwaniem do działania.
- **`Toast`**: Komponent do wyświetlania globalnych powiadomień.
- **`Skeleton`**: Komponent "szkieletu" do wyświetlania jako placeholder podczas ładowania danych, np. listy dopasowań.
