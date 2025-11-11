# Testy End-to-End (E2E)

Testy E2E dla aplikacji BuddyFinder używają **Playwright** do weryfikacji kluczowych funkcjonalności z perspektywy użytkownika końcowego.

## Pokryte historyjki użytkownika

- **US-004**: Zarządzanie sportami w profilu (dodawanie, edycja, usuwanie)
- **US-009**: Przeglądanie listy dopasowanych partnerów
- **US-010**: Wyświetlanie szczegółowych informacji o użytkownikach

## Wymagania

1. **Node.js** (v18+)
2. **Przeglądarka Chromium** (instalowana automatycznie przez Playwright)
3. **Testowa instancja Supabase** - osobna baza danych dla testów
4. **Zmienne środowiskowe** - konfiguracja w pliku `.env.test`

## Instalacja

```bash
# Zainstaluj zależności (jeśli jeszcze nie zrobiono)
npm install

# Zainstaluj przeglądarkę Chromium
npx playwright install chromium
```

## Konfiguracja

### 1. Utwórz plik `.env.test`

Skopiuj `.env.test.example` i uzupełnij danymi testowej instancji Supabase:

```bash
cp .env.test.example .env.test
```

Wymagane zmienne:

```env
# URL testowego projektu Supabase
PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co

# Klucz publiczny (anon key)
PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key

# Klucz serwisowy (service role) - TYLKO dla testów!
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# URL aplikacji
PLAYWRIGHT_BASE_URL=http://localhost:4321
```

**⚠️ WAŻNE:** Nigdy nie commituj pliku `.env.test` do repozytorium! Zawiera on wrażliwe dane.

### 2. Przygotuj dane testowe

Przed uruchomieniem testów, utwórz użytkowników testowych:

```bash
npm run test:e2e:seed
```

To utworzy 6 użytkowników testowych z różnymi konfiguracjami profili.

## Uruchamianie testów

### Tryb standardowy (headless)

```bash
npm run test:e2e
```

### Tryb UI (interfejs graficzny)

```bash
npm run test:e2e:ui
```

Najlepszy tryb do debugowania - pokazuje kroki testów w czasie rzeczywistym.

### Tryb headed (z widoczną przeglądarką)

```bash
npm run test:e2e:headed
```

### Tryb debug

```bash
npm run test:e2e:debug
```

Pozwala na krokowe wykonywanie testów.

### Uruchomienie konkretnego testu

```bash
# Tylko testy profilu sportowego
npx playwright test profile-sports

# Tylko testy dopasowań
npx playwright test matches-list

# Konkretny przypadek testowy
npx playwright test -g "TC-E2E-004-001"
```

## Czyszczenie danych testowych

Po zakończeniu testów, usuń użytkowników testowych:

```bash
npm run test:e2e:cleanup
```

## Struktura testów

```
test/e2e/
├── fixtures/
│   ├── test-users.fixture.ts      # Definicje 6 użytkowników testowych
│   ├── auth.fixture.ts             # Fixtures do uwierzytelniania
│   ├── seed-test-data.sql          # SQL do seedowania (opcjonalny)
│   └── cleanup-test-data.sql       # SQL do czyszczenia (opcjonalny)
├── helpers/
│   ├── database.helper.ts          # Operacje na bazie danych
│   ├── auth.helper.ts              # Funkcje logowania/wylogowania
│   └── manage-test-data.ts         # Skrypt do zarządzania danymi
└── specs/
    ├── profile-sports.spec.ts      # Testy US-004
    └── matches-list.spec.ts        # Testy US-009 i US-010
```

## Użytkownicy testowi

| Email | Username | Lokalizacja | Zasięg | Sporty | Uwagi |
|-------|----------|-------------|--------|--------|-------|
| testuser1@buddyfinder.test | testuser1 | Warszawa centrum | 10 km | Bieganie | Główny użytkownik testowy |
| testuser2@buddyfinder.test | testuser2 | Warszawa Mokotów (~4.5 km) | 15 km | Bieganie, Pływanie | W zasięgu User 1, wspólne sporty |
| testuser3@buddyfinder.test | testuser3 | Warszawa Wilanów (~8.2 km) | 12 km | Tenis, Rolki | W zasięgu User 1, brak wspólnych sportów |
| testuser4@buddyfinder.test | testuser4 | Kraków (~252 km) | 20 km | Bieganie, Rower MTB | Poza zasięgiem User 1 |
| testuser5@buddyfinder.test | testuser5 | Brak lokalizacji | - | Bieganie | Test braku lokalizacji |
| testuser6@buddyfinder.test | testuser6 | Warszawa Śródmieście (~1.5 km) | 5 km | Brak sportów | Test braku sportów |

## Przypadki testowe

### US-004: Zarządzanie sportami

- **TC-E2E-004-001**: Dodanie nowego sportu do profilu
- **TC-E2E-004-002**: Edycja istniejącego sportu
- **TC-E2E-004-003**: Usunięcie sportu z profilu
- **TC-E2E-004-004**: Dodanie wielu sportów
- **TC-E2E-004-005**: Walidacja - nie można zapisać sportu bez wymaganych parametrów

### US-009: Przeglądanie listy partnerów

- **TC-E2E-009-001**: Wyświetlenie listy dopasowań dla użytkownika z lokalizacją
- **TC-E2E-009-002**: Komunikat dla użytkownika bez lokalizacji
- **TC-E2E-009-003**: Sortowanie listy według odległości i wspólnych sportów

### US-010: Widok informacji o użytkowniku

- **TC-E2E-010-001**: Wyświetlenie pełnych informacji o dopasowanym użytkowniku
- **TC-E2E-010-002**: Wyświetlenie użytkownika bez social media

## Troubleshooting

### Błąd: "Missing required environment variables"

Upewnij się, że plik `.env.test` istnieje i zawiera wszystkie wymagane zmienne.

### Błąd: "Failed to create test user"

Sprawdź, czy:
1. Testowa instancja Supabase jest uruchomiona
2. `SUPABASE_SERVICE_ROLE_KEY` jest poprawny
3. Nie ma konfliktów z istniejącymi użytkownikami (uruchom cleanup)

### Testy przechodzą lokalnie, ale nie w CI

Upewnij się, że:
1. Zmienne środowiskowe są ustawione w CI
2. Serwer dev uruchamia się prawidłowo (`dev:e2e`)
3. Port 4321 jest dostępny

### Timeout podczas testów

Zwiększ timeout w `playwright.config.ts`:

```typescript
timeout: 60000, // 60 sekund
```

## Best Practices

1. **Zawsze uruchamiaj cleanup** po zakończeniu testów
2. **Nie używaj produkcyjnej bazy** do testów E2E
3. **Używaj data-testid** dla stabilniejszych selektorów
4. **Testuj z perspektywy użytkownika** - używaj getByRole, getByLabel
5. **Izoluj testy** - każdy test powinien być niezależny

## CI/CD Integration

Przykładowa konfiguracja GitHub Actions:

```yaml
- name: Run E2E tests
  env:
    PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
    PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_KEY }}
  run: |
    npm run test:e2e:seed
    npm run test:e2e
    npm run test:e2e:cleanup
```

## Więcej informacji

- [Dokumentacja Playwright](https://playwright.dev/)
- [Plan testów E2E](../../.ai/e2e-plan.md)
- [PRD projektu](../../docs/prd.md)
