# Plan wdrożenia testów End-to-End
## Historyjki użytkownika: US-004, US-009, US-010

### 1. Cel testów E2E

Testy End-to-End mają na celu weryfikację trzech kluczowych funkcjonalności aplikacji FITLink w rzeczywistym środowisku działania aplikacji, z perspektywy użytkownika końcowego:

- **US-004**: Zarządzanie sportami w profilu (dodawanie, edycja, usuwanie)
- **US-009**: Przeglądanie listy dopasowanych partnerów na podstawie lokalizacji i zasięgu
- **US-010**: Wyświetlanie szczegółowych informacji o dopasowanych użytkownikach

Testy będą realizowane z użyciem **Playwright** w przeglądarce **Chromium/Desktop Chrome**, zgodnie z wytycznymi projektu.

---

### 2. Analiza technologii testowej - Playwright

#### 2.1. Podstawowe wymagania

- **Framework**: Playwright (najnowsza wersja stabilna)
- **Przeglądarka**: Chromium (Desktop Chrome)
- **Język**: TypeScript
- **Test Runner**: Playwright Test Runner

#### 2.2. Instalacja i inicjalizacja

```bash
npm install -D @playwright/test
npx playwright install chromium
```

#### 2.3. Struktura testów

```
test/
  e2e/
    fixtures/
      test-users.fixture.ts        # Dane testowe użytkowników
      auth.fixture.ts               # Fixture do autentykacji
    helpers/
      database.helper.ts            # Pomocniki do operacji na bazie danych
      auth.helper.ts                # Pomocniki do logowania
    specs/
      profile-sports.spec.ts        # Testy US-004
      matches-list.spec.ts          # Testy US-009 i US-010
    playwright.config.ts            # Konfiguracja Playwright
```

#### 2.4. Konfiguracja Playwright

Plik `playwright.config.ts` w głównym katalogu projektu:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e/specs',
  fullyParallel: false, // Sekwencyjne wykonywanie ze względu na współdzielenie danych
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html'],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev:e2e',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

### 3. Przygotowanie środowiska testowego

#### 3.1. Środowisko testowe

- **Aplikacja**: Uruchomiona lokalnie w trybie `dev:e2e` lub na dedykowanym środowisku staging
- **Baza danych**: Osobna instancja Supabase testowego projektu
- **URL**: `http://localhost:4321` (lokalnie) lub URL środowiska staging

#### 3.2. Zmienne środowiskowe

Plik `.env.test`:

```env
PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
PLAYWRIGHT_BASE_URL=http://localhost:4321
```

#### 3.3. Przygotowanie bazy danych testowej

**Wymagane dane**:
1. Lista sportów (już dostępna w migracji `20251030000002_seed_sports.sql`)
2. Użytkownicy testowi z różnymi konfiguracjami profili
3. Dane lokalizacyjne i zasięgi

**Skrypt inicjalizujący dane testowe** (`test/e2e/fixtures/seed-test-data.sql`):

```sql
-- Użytkownik 1: Pełny profil z lokalizacją i sportami
-- Location: Warszawa centrum (52.2297, 21.0122)
-- Default range: 10 km
-- Sports: Bieganie, Rower szosowy

-- Użytkownik 2: Pełny profil, blisko użytkownika 1
-- Location: Warszawa Mokotów (52.1951, 21.0244)
-- Default range: 15 km
-- Sports: Bieganie, Pływanie w basenie

-- Użytkownik 3: Pełny profil, poza zasięgiem użytkownika 1
-- Location: Kraków (50.0647, 19.9450)
-- Default range: 20 km
-- Sports: Tenis, Rolki

-- Użytkownik 4: Bez lokalizacji
-- Sports: Bieganie

-- Użytkownik 5: Lokalizacja ustawiona, brak sportów
-- Location: Warszawa Praga (52.2492, 21.0443)
-- Default range: 10 km
```

**Helper do zarządzania danymi testowymi** (`test/e2e/helpers/database.helper.ts`):

```typescript
import { createClient } from '@supabase/supabase-js';

export class DatabaseHelper {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async seedTestUsers() {
    // Implementacja tworzenia użytkowników testowych
  }

  async cleanupTestData() {
    // Czyszczenie danych po testach
  }

  async getUserSports(userId: string) {
    // Pobieranie sportów użytkownika
  }

  async getMatches(userId: string) {
    // Pobieranie dopasowań użytkownika
  }
}
```

---

### 4. Konfiguracja użytkowników testowych

#### 4.1. Główny użytkownik testowy (Test User 1)

**Dane logowania**:
- Email: `testuser1@buddyfinder.test`
- Password: `TestPass123!`
- Username: `testuser1`
- Display name: `Jan Kowalski`

**Profil początkowy**:
- Location: Warszawa centrum (52.2297, 21.0122)
- Default range: 10 km
- Sports: Bieganie (dystans: 10km, tempo: 5:30 min/km)
- Social links: Strava

#### 4.2. Użytkownicy do testowania dopasowań

**Test User 2** (w zasięgu, wspólne sporty):
- Email: `testuser2@buddyfinder.test`
- Username: `testuser2`
- Display name: `Anna Nowak`
- Location: Warszawa Mokotów (52.1951, 21.0244) - ~4.5 km od User 1
- Default range: 15 km
- Sports: Bieganie (dystans: 5km, tempo: 6:00 min/km), Pływanie w basenie (dystans: 2km)
- Social links: Facebook, Instagram

**Test User 3** (w zasięgu, brak wspólnych sportów):
- Email: `testuser3@buddyfinder.test`
- Username: `testuser3`
- Display name: `Piotr Wiśniewski`
- Location: Warszawa Wilanów (52.1652, 21.0892) - ~8.2 km od User 1
- Default range: 12 km
- Sports: Tenis, Rolki
- Social links: brak

**Test User 4** (poza zasięgiem):
- Email: `testuser4@buddyfinder.test`
- Username: `testuser4`
- Display name: `Ewa Zielińska`
- Location: Kraków (50.0647, 19.9450) - ~252 km od User 1
- Default range: 20 km
- Sports: Bieganie, Rower MTB
- Social links: Strava

**Test User 5** (bez lokalizacji):
- Email: `testuser5@buddyfinder.test`
- Username: `testuser5`
- Display name: `Tomasz Kamiński`
- Location: NULL
- Sports: Bieganie

**Test User 6** (bez sportów):
- Email: `testuser6@buddyfinder.test`
- Username: `testuser6`
- Display name: `Maria Lewandowska`
- Location: Warszawa Śródmieście (52.2319, 21.0067) - ~1.5 km od User 1
- Default range: 5 km
- Sports: brak

---

### 5. Przypadki testowe - US-004: Wybór uprawianych sportów

#### TC-E2E-004-001: Dodanie nowego sportu do profilu

**Priorytet**: Krytyczny

**Warunki wstępne**:
- Użytkownik zalogowany jako Test User 1
- Nawigacja do panelu profilu

**Kroki testowe**:
1. Kliknij przycisk "Dodaj sport"
2. Z listy rozwijanej wybierz sport "Rower MTB"
3. Uzupełnij parametry:
   - Dystans: 30 km
   - Średnia prędkość: 25 km/h
4. Opcjonalnie: ustaw custom range 15 km
5. Kliknij "Zapisz"

**Oczekiwany rezultat**:
- Dialog zamyka się
- "Rower MTB" pojawia się na liście sportów użytkownika
- Parametry są widoczne przy sporcie
- Toast z komunikatem sukcesu
- W bazie danych pojawia się nowy rekord w `user_sports`

**Elementy do weryfikacji**:
- Widoczność przycisku "Dodaj sport"
- Działanie dialogu `SportEditorDialog`
- Lista dostępnych sportów (z wykluczeniem już dodanych)
- Walidacja formularza (pola wymagane)
- Zapis do bazy danych
- Odświeżenie widoku profilu

#### TC-E2E-004-002: Edycja istniejącego sportu

**Priorytet**: Wysoki

**Warunki wstępne**:
- Użytkownik zalogowany jako Test User 1
- Sport "Bieganie" już dodany do profilu

**Kroki testowe**:
1. Na karcie sportu "Bieganie" kliknij ikonę edycji
2. Zmień tempo z 5:30 na 5:00 min/km
3. Zmień dystans z 10 na 15 km
4. Kliknij "Zapisz"

**Oczekiwany rezultat**:
- Dialog zamyka się
- Zaktualizowane parametry są widoczne przy sporcie "Bieganie"
- Toast z komunikatem sukcesu
- Dane w bazie są zaktualizowane

**Elementy do weryfikacji**:
- Działanie przycisku edycji na `SportBadge`
- Pre-wypełnienie formularza aktualnymi wartościami
- Walidacja zmian
- Zapis do bazy danych
- Odświeżenie widoku

#### TC-E2E-004-003: Usunięcie sportu z profilu

**Priorytet**: Wysoki

**Warunki wstępne**:
- Użytkownik zalogowany jako Test User 1
- Sport "Rower szosowy" dodany do profilu

**Kroki testowe**:
1. Na karcie sportu "Rower szosowy" kliknij ikonę usunięcia
2. W dialogu potwierdzenia kliknij "Potwierdź"

**Oczekiwany rezultat**:
- Dialog potwierdzenia zamyka się
- Sport "Rower szosowy" znika z listy
- Toast z komunikatem sukcesu
- Rekord usunięty z bazy danych

**Elementy do weryfikacji**:
- Działanie przycisku usunięcia
- Wyświetlenie dialogu `ConfirmationDialog`
- Usunięcie z bazy danych
- Odświeżenie widoku profilu

#### TC-E2E-004-004: Dodanie wielu sportów

**Priorytet**: Średni

**Warunki wstępne**:
- Użytkownik zalogowany, profil bez sportów

**Kroki testowe**:
1. Dodaj sport "Bieganie" z parametrami
2. Dodaj sport "Pływanie w basenie" z parametrami
3. Dodaj sport "Tenis" z parametrami

**Oczekiwany rezultat**:
- Wszystkie 3 sporty widoczne na liście
- Każdy sport z właściwymi parametrami
- Lista dostępnych sportów zmniejsza się po każdym dodaniu

#### TC-E2E-004-005: Walidacja - próba dodania sportu bez parametrów

**Priorytet**: Średni

**Warunki wstępne**:
- Użytkownik zalogowany, dialog dodawania sportu otwarty

**Kroki testowe**:
1. Wybierz sport "Bieganie"
2. Nie uzupełniaj żadnych parametrów
3. Kliknij "Zapisz"

**Oczekiwany rezultat**:
- Formularz pokazuje błędy walidacji
- Dialog nie zamyka się
- Dane nie zostają zapisane

---

### 6. Przypadki testowe - US-009: Przeglądanie listy partnerów

#### TC-E2E-009-001: Wyświetlenie listy dopasowań dla użytkownika z lokalizacją

**Priorytet**: Krytyczny

**Warunki wstępne**:
- Użytkownik zalogowany jako Test User 1 (lokalizacja ustawiona)
- Minimum 2 innych użytkowników w zasięgu

**Kroki testowe**:
1. Zaloguj się jako Test User 1
2. Przejdź do strony głównej (/)
3. Przejdź do zakładki "Dopasowania" (MatchesPanel)

**Oczekiwany rezultat**:
- Lista dopasowań jest widoczna
- Widoczni są Test User 2 i Test User 3 (w zasięgu)
- Test User 4 NIE jest widoczny (poza zasięgiem)
- Test User 5 NIE jest widoczny (brak lokalizacji)

**Elementy do weryfikacji**:
- Komponent `MatchesView` renderuje się poprawnie
- API endpoint `/api/matches` zwraca poprawne dane
- Funkcja `get_matches_for_user` działa zgodnie z logiką zasięgów
- Sortowanie według odległości (rosnąco)

#### TC-E2E-009-002: Komunikat dla użytkownika bez lokalizacji

**Priorytet**: Krytyczny

**Warunki wstępne**:
- Użytkownik zalogowany jako Test User 5 (brak lokalizacji)

**Kroki testowe**:
1. Zaloguj się jako Test User 5
2. Przejdź do strony głównej
3. Przejdź do zakładki "Dopasowania"

**Oczekiwany rezultat**:
- Wyświetlany jest `MatchesEmptyState` z wariantem "no-location"
- Widoczny komunikat: "Brak ustawionej lokalizacji"
- Przycisk CTA "Uzupełnij profil" prowadzi do `/profile`

**Elementy do weryfikacji**:
- Obsługa błędu "no_location" w `useMatchesView`
- Wyświetlenie właściwego stanu pustego
- Działanie przycisku przekierowania

#### TC-E2E-009-003: Sortowanie listy według odległości i wspólnych sportów

**Priorytet**: Wysoki

**Warunki wstępne**:
- Użytkownik zalogowany jako Test User 1
- Test User 2: ~4.5 km, 1 wspólny sport (Bieganie)
- Test User 3: ~8.2 km, 0 wspólnych sportów

**Kroki testowe**:
1. Zaloguj się jako Test User 1
2. Otwórz listę dopasowań

**Oczekiwany rezultat**:
- Test User 2 jest na 1. pozycji (mniejsza odległość)
- Test User 3 jest na 2. pozycji (większa odległość)
- Przy równej odległości użytkownicy z większą liczbą wspólnych sportów są wyżej

**Elementy do weryfikacji**:
- Logika sortowania w funkcji `get_matches_for_user`
- Poprawna kolejność w `MatchesView`

#### TC-E2E-009-004: Pusty wynik - brak dopasowań

**Priorytet**: Średni

**Warunki wstępne**:
- Użytkownik zalogowany z lokalizacją
- Brak innych użytkowników w zasięgu

**Kroki testowe**:
1. Utwórz nowego użytkownika z lokalizacją na uboczu
2. Zaloguj się
3. Sprawdź listę dopasowań

**Oczekiwany rezultat**:
- Wyświetlany jest `MatchesEmptyState` z wariantem "no-matches"
- Komunikat informujący o braku dopasowań

---

### 7. Przypadki testowe - US-010: Widok informacji o użytkowniku

#### TC-E2E-010-001: Wyświetlenie pełnych informacji o dopasowanym użytkowniku

**Priorytet**: Krytyczny

**Warunki wstępne**:
- Użytkownik zalogowany jako Test User 1
- Test User 2 widoczny na liście dopasowań

**Kroki testowe**:
1. Na liście dopasowań znajdź Test User 2 (Anna Nowak)
2. Rozwiń accordion klikając na kartę użytkownika

**Oczekiwany rezultat**:
- Widoczna nazwa użytkownika: "Anna Nowak"
- Widoczny email: testuser2@buddyfinder.test
- Widoczna odległość: ~4.5 km
- Sekcja "Sporty" zawiera:
  - Bieganie (dystans: 5km, tempo: 6:00 min/km)
  - Pływanie w basenie (dystans: 2km)
- Sekcja "Media społecznościowe" zawiera:
  - Link do Facebook
  - Link do Instagram

**Elementy do weryfikacji**:
- Komponent `UserMatchCard` wyświetla wszystkie dane
- `AccordionItem` działa poprawnie
- Ikony sportów z `SportBadge`
- Ikony platform społecznościowych z konfiguracji
- Linki otwierają się w nowej karcie

#### TC-E2E-010-002: Wyświetlenie użytkownika bez social media

**Priorytet**: Średni

**Warunki wstępne**:
- Użytkownik zalogowany jako Test User 1
- Test User 3 widoczny na liście (brak social links)

**Kroki testowe**:
1. Rozwiń kartę Test User 3

**Oczekiwany rezultat**:
- Nazwa użytkownika, email i odległość widoczne
- Lista sportów widoczna
- Sekcja "Media społecznościowe" NIE jest wyświetlana

**Elementy do weryfikacji**:
- Warunkowe renderowanie sekcji social media
- Brak błędów gdy `social_links` jest pusty

#### TC-E2E-010-003: Wyświetlenie użytkownika bez sportów

**Priorytet**: Średni

**Warunki wstępne**:
- Użytkownik zalogowany jako Test User 1
- Test User 6 widoczny na liście (brak sportów)

**Kroki testowe**:
1. Rozwiń kartę Test User 6

**Oczekiwany rezultat**:
- Nazwa użytkownika, email i odległość widoczne
- Sekcja "Sporty" NIE jest wyświetlana lub pokazuje komunikat "Brak sportów"

**Elementy do weryfikacji**:
- Warunkowe renderowanie sekcji sportów
- Obsługa pustej listy sportów

#### TC-E2E-010-004: Kliknięcie w email otwiera klienta poczty

**Priorytet**: Niski

**Warunki wstępne**:
- Użytkownik zalogowany, lista dopasowań widoczna

**Kroki testowe**:
1. Rozwiń kartę dowolnego użytkownika
2. Kliknij na email

**Oczekiwany rezultat**:
- Link `mailto:` jest poprawnie sformatowany
- Próba otwarcia domyślnego klienta poczty

---

### 8. Analiza edge case'ów i pokrycie testami

#### 8.1. Edge case'y pokryte w testach

| Edge case | Czy pokryty? | Test case |
|-----------|--------------|-----------|
| Użytkownik bez lokalizacji próbuje zobaczyć dopasowania | ✅ TAK | TC-E2E-009-002 |
| Użytkownik bez sportów na liście dopasowań | ✅ TAK | TC-E2E-010-003 |
| Brak dopasowań w zasięgu | ✅ TAK | TC-E2E-009-004 |
| Dodanie sportu bez wypełnienia parametrów | ✅ TAK | TC-E2E-004-005 |
| Dodanie wszystkich dostępnych sportów | ⚠️ CZĘŚCIOWO | TC-E2E-004-004 (3 z 8) |
| Użytkownik z lokalizacją ale poza zasięgiem wszystkich | ✅ TAK | TC-E2E-009-004 |
| Równa odległość, różna liczba wspólnych sportów | ✅ TAK | TC-E2E-009-003 |

#### 8.2. Edge case'y wymagające dodatkowych testów

| Edge case | Priorytet | Powód |
|-----------|-----------|-------|
| Zmiana lokalizacji i natychmiastowe odświeżenie dopasowań | Wysoki | Wymaga testu integracyjnego między MapView a MatchesView |
| Custom range dla sportu wpływający na dopasowania | Wysoki | Logika biznesowa kluczowa dla US-007 |
| Usunięcie wszystkich sportów z profilu | Średni | Sprawdzenie stanu pustego |
| Przekroczenie maksymalnego zasięgu (100 km) | Średni | Walidacja granic |
| Próba dodania duplikatu sportu (mimo filtrowania) | Niski | Backend powinien obsłużyć, ale warto zweryfikować |
| Bardzo długie nazwy w parametrach sportowych | Niski | Walidacja UI/UX |
| Lokalizacja na krańcach świata (np. bieguny) | Niski | PostGIS może mieć problemy z niektórymi lokalizacjami |

#### 8.3. Scenariusze graniczne nie pokryte w MVP

- **Równoczesna edycja profilu przez dwóch użytkowników**: Poza zakresem testów E2E, wymaga testów współbieżności
- **Duża liczba dopasowań (>1000)**: Testy wydajnościowe, nie E2E
- **Błędy sieci podczas zapisywania danych**: Testy jednostkowe/integracyjne z mockowanymi błędami

---

### 9. Lista elementów do testowania

#### 9.1. Komponenty frontendowe

| Komponent | Cel testu | Typ weryfikacji |
|-----------|-----------|-----------------|
| `ProfileView` | Renderowanie i nawigacja w profilu | Wizualna, interakcja |
| `ProfileSportsSection` | Wyświetlanie listy sportów | Wizualna |
| `SportEditorDialog` | Dodawanie/edycja sportu | Formularz, walidacja |
| `MatchesView` | Wyświetlanie dopasowań | Wizualna, dane |
| `UserMatchCard` | Szczegóły dopasowanego użytkownika | Wizualna, linki |
| `MatchesEmptyState` | Stany puste (brak lokalizacji, brak dopasowań) | Wizualna, komunikaty |
| `SportBadge` | Wyświetlanie sportu z parametrami | Wizualna |
| `ConfirmationDialog` | Dialog potwierdzenia usunięcia | Interakcja |

#### 9.2. Endpointy API

| Endpoint | Metoda | Cel testu |
|----------|--------|-----------|
| `/api/user-sports` | POST | Dodanie nowego sportu |
| `/api/user-sports` | PUT | Edycja sportu |
| `/api/user-sports/:id` | DELETE | Usunięcie sportu |
| `/api/matches` | GET | Pobranie listy dopasowań |
| `/api/profile` | GET | Pobranie danych profilu |

#### 9.3. Funkcje bazodanowe

| Funkcja/Tabela | Cel testu |
|----------------|-----------|
| `get_matches_for_user` | Logika dopasowywania na podstawie lokalizacji i zasięgu |
| `user_sports` (RLS) | Polityki dostępu - użytkownik może edytować tylko swoje sporty |
| `profiles` (RLS) | Polityki dostępu - użytkownik może czytać profile innych |

#### 9.4. Logika biznesowa

| Funkcjonalność | Element do weryfikacji |
|----------------|------------------------|
| Zasięg dopasowania | (odległość) <= (mój zasięg + ich zasięg) |
| Sortowanie dopasowań | 1. Odległość (rosnąco), 2. Wspólne sporty (malejąco) |
| Custom range per sport | Nadpisanie default_range_km dla konkretnego sportu |
| Walidacja parametrów sportowych | Zgodność z konfiguracją w `sport-parameters.config.ts` |

---

### 10. Elementy do mockowania

#### 10.1. NIE mockujemy (testy rzeczywiste)

- **Baza danych Supabase**: Używamy dedykowanej instancji testowej z prawdziwymi danymi
- **Autentykacja Supabase**: Prawdziwe logowanie użytkowników testowych
- **API endpoints Astro**: Prawdziwe wywołania do backendu aplikacji
- **Funkcje PostGIS**: Rzeczywiste obliczenia odległości w PostgreSQL

**Uzasadnienie**: Testy E2E mają weryfikować całą ścieżkę aplikacji, od UI przez backend do bazy danych. Mockowanie tych elementów zamieniłoby test E2E w test integracyjny.

#### 10.2. Mockujemy (opcjonalnie)

| Element | Czy mockować? | Uzasadnienie |
|---------|---------------|--------------|
| Zewnętrzne API (np. mapy OSM) | ⚠️ OPCJONALNIE | Tylko jeśli powodują niestabilność testów lub są kosztowne. W MVP prawdopodobnie nie jest to problem. |
| Emaile (np. odzyskiwanie hasła) | ✅ TAK | Używamy narzędzi typu MailHog lub MockSMTP w środowisku testowym |
| Webhooks Supabase | ✅ TAK | Jeśli aplikacja używa webhooków, mockujemy je aby nie wysyłać prawdziwych żądań |
| Geolokalizacja przeglądarki | ✅ TAK | Playwright pozwala na mockowanie `navigator.geolocation` |

#### 10.3. Przykład mockowania geolokalizacji

```typescript
// W teście E2E
await context.grantPermissions(['geolocation']);
await context.setGeolocation({ latitude: 52.2297, longitude: 21.0122 });
```

---

### 11. Struktura testów E2E

#### 11.1. Fixture autentykacji

Plik: `test/e2e/fixtures/auth.fixture.ts`

```typescript
import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

type AuthenticatedFixture = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthenticatedFixture>({
  authenticatedPage: async ({ page }, use) => {
    // Logowanie użytkownika testowego
    await page.goto('/login');
    await page.fill('input[name="email"]', 'testuser1@buddyfinder.test');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    // Oczekiwanie na przekierowanie po zalogowaniu
    await page.waitForURL('/');
    
    await use(page);
  },
});
```

#### 11.2. Helper do operacji na profilu

Plik: `test/e2e/helpers/profile.helper.ts`

```typescript
import type { Page } from '@playwright/test';

export class ProfileHelper {
  constructor(private page: Page) {}

  async navigateToProfile() {
    await this.page.goto('/');
    // Kliknięcie w zakładkę Profil lub nawigacja
    await this.page.click('text=Profil');
  }

  async addSport(sportName: string, parameters: Record<string, string>) {
    await this.page.click('text=Dodaj sport');
    await this.page.selectOption('select[name="sport_id"]', { label: sportName });
    
    for (const [key, value] of Object.entries(parameters)) {
      await this.page.fill(`input[name="parameters.${key}"]`, value);
    }
    
    await this.page.click('button:has-text("Zapisz")');
    await this.page.waitForSelector('text=Sport został dodany');
  }

  async deleteSport(sportName: string) {
    const sportCard = this.page.locator(`text=${sportName}`).locator('..');
    await sportCard.locator('button[aria-label="Usuń"]').click();
    await this.page.click('text=Potwierdź');
    await this.page.waitForSelector(`text=${sportName}`, { state: 'detached' });
  }
}
```

#### 11.3. Przykładowy test

Plik: `test/e2e/specs/profile-sports.spec.ts`

```typescript
import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { ProfileHelper } from '../helpers/profile.helper';

test.describe('US-004: Wybór uprawianych sportów', () => {
  let profileHelper: ProfileHelper;

  test.beforeEach(async ({ authenticatedPage }) => {
    profileHelper = new ProfileHelper(authenticatedPage);
    await profileHelper.navigateToProfile();
  });

  test('TC-E2E-004-001: Dodanie nowego sportu do profilu', async ({ authenticatedPage }) => {
    await profileHelper.addSport('Rower MTB', {
      distance_km: '30',
      avg_speed_kmh: '25',
    });

    // Weryfikacja
    await expect(authenticatedPage.locator('text=Rower MTB')).toBeVisible();
    await expect(authenticatedPage.locator('text=30 km')).toBeVisible();
    await expect(authenticatedPage.locator('text=25 km/h')).toBeVisible();
  });

  test('TC-E2E-004-003: Usunięcie sportu z profilu', async ({ authenticatedPage }) => {
    // Najpierw dodaj sport
    await profileHelper.addSport('Tenis', {});
    
    // Następnie usuń
    await profileHelper.deleteSport('Tenis');

    // Weryfikacja
    await expect(authenticatedPage.locator('text=Tenis')).not.toBeVisible();
  });
});
```

---

### 12. Uruchamianie testów

#### 12.1. Komendy

```bash
# Uruchomienie wszystkich testów E2E
npx playwright test

# Uruchomienie konkretnego pliku testów
npx playwright test test/e2e/specs/profile-sports.spec.ts

# Uruchomienie w trybie debug
npx playwright test --debug

# Uruchomienie z UI mode
npx playwright test --ui

# Generowanie raportu
npx playwright show-report
```

#### 12.2. Integracja z CI/CD

Plik: `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Setup test database
        run: |
          # Skrypt do inicjalizacji bazy testowej
          npm run db:test:setup
      
      - name: Run E2E tests
        run: npx playwright test
        env:
          PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

### 13. Kryteria akceptacji planu E2E

#### 13.1. Definicja "Done" dla implementacji testów

- [ ] Playwright zainstalowany i skonfigurowany
- [ ] Środowisko testowe przygotowane (baza danych, użytkownicy testowi)
- [ ] Wszystkie przypadki testowe zaimplementowane (minimum 13 testów)
- [ ] Testy przechodzą pomyślnie na lokalnym środowisku
- [ ] Pokrycie wszystkich kryteriów akceptacji US-004, US-009, US-010
- [ ] Dokumentacja uruchamiania testów zaktualizowana
- [ ] Integracja z CI/CD działająca

#### 13.2. Metryki sukcesu

- **Pokrycie funkcjonalności**: 100% kryteriów akceptacji US-004, US-009, US-010
- **Stabilność testów**: <5% flaky tests
- **Czas wykonania**: <5 minut dla pełnego suite'a testów E2E
- **Pass rate**: >95% na środowisku CI/CD

---

### 14. Harmonogram wdrożenia

| Etap | Czas | Odpowiedzialność |
|------|------|------------------|
| Instalacja i konfiguracja Playwright | 2h | QA Engineer |
| Przygotowanie środowiska testowego i danych | 4h | QA Engineer + DevOps |
| Implementacja fixtures i helpers | 4h | QA Engineer |
| Implementacja testów US-004 (5 testów) | 4h | QA Engineer |
| Implementacja testów US-009 (4 testy) | 3h | QA Engineer |
| Implementacja testów US-010 (4 testy) | 3h | QA Engineer |
| Debugging i stabilizacja testów | 4h | QA Engineer |
| Integracja z CI/CD | 2h | DevOps + QA Engineer |
| Dokumentacja | 2h | QA Engineer |
| **Łącznie** | **28h (~3.5 dni)** | |

---

### 15. Ryzyka i mitygacja

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|--------|-------------------|-------|-----------|
| Niestabilność testów (flaky tests) | Średnie | Wysoki | Użycie retry mechanism, odpowiednie waitery, fixtures |
| Zmiany w UI złamią testy | Średnie | Średni | Używanie data-testid, Page Object Model |
| Wolne środowisko testowe | Niskie | Średni | Optymalizacja zapytań, dedykowany hosting |
| Problemy z danymi testowymi | Niskie | Wysoki | Skrypty do reset'u bazy przed każdym testem |
| Brak dostępu do środowiska staging | Niskie | Krytyczny | Przygotowanie lokalnego środowiska testowego |

---

### 16. Uwagi końcowe

1. **Page Object Model**: Rozważ wdrożenie POM dla bardziej złożonych testów w przyszłości, jeśli liczba testów znacznie wzrośnie.

2. **Visual Regression Testing**: Playwright wspiera screenshot testing. Można rozważyć dodanie visual regression testów dla krytycznych widoków (np. `UserMatchCard`, `SportEditorDialog`).

3. **Accessibility Testing**: Playwright ma wbudowane narzędzia do testowania dostępności. Warto rozważyć dodanie podstawowych testów a11y.

4. **Parallel execution**: Na razie ustawione na `workers: 1` ze względu na współdzielone dane. Po implementacji izolacji danych można zwiększyć równoległość.

5. **Test data management**: Kluczowe jest zapewnienie czystego stanu bazy przed każdym testem. Rozważ użycie transakcji lub skryptów cleanup.

6. **Monitoring**: Po wdrożeniu na CI/CD warto monitorować czas wykonania i stabilność testów (np. przez Playwright HTML Reporter lub integrację z narzędziami jak TestRail).

---

**Dokument przygotowany**: 2025-11-11  
**Wersja**: 1.0  
**Autor**: QA Engineer - FITLink Team
