# Plan Testów Aplikacji FITLink

## 1. Wprowadzenie i cele testowania

### 1.1. Wprowadzenie

Niniejszy dokument opisuje plan testów dla aplikacji internetowej FITLink w wersji MVP. Plan ten ma na celu zapewnienie, że aplikacja spełnia wymagania funkcjonalne i niefunkcjonalne określone w dokumencie wymagań produktu (PRD), a także gwarantuje wysoką jakość, stabilność i bezpieczeństwo przed wdrożeniem produkcyjnym.

### 1.2. Cele testowania

Główne cele procesu testowania to:

* **Weryfikacja funkcjonalności:** Upewnienie się, że wszystkie historyjki użytkownika (US-001 do US-011) zostały zaimplementowane poprawnie i działają zgodnie z kryteriami akceptacji.
* **Zapewnienie jakości:** Identyfikacja i eliminacja błędów w celu dostarczenia użytkownikom stabilnego i niezawodnego produktu.
* **Ocena użyteczności:** Sprawdzenie, czy interfejs użytkownika jest intuicyjny, responsywny i zapewnia pozytywne doświadczenia na różnych urządzeniach.
* **Weryfikacja integracji:** Potwierdzenie, że wszystkie komponenty systemu (frontend, backend API, baza danych Supabase) poprawnie ze sobą współpracują.
* **Ocena wydajności:** Zapewnienie, że kluczowe operacje, takie jak wyszukiwanie dopasowań, są wykonywane w akceptowalnym czasie.

## 2. Zakres testów

### 2.1. Funkcjonalności objęte testami

* Zarządzanie kontem użytkownika (rejestracja, logowanie, wylogowanie, odzyskiwanie hasła).
* Zarządzanie profilem użytkownika (edycja danych, dodawanie/usuwanie sportów, definiowanie parametrów sportowych, dodawanie linków social media).
* Ustawianie i aktualizacja lokalizacji oraz zasięgu (domyślnego i per sport).
* Mechanizm dopasowywania użytkowników na podstawie lokalizacji, zasięgu i wspólnych sportów.
* Wyświetlanie i sortowanie listy dopasowanych partnerów.
* Responsywność interfejsu użytkownika na urządzeniach mobilnych i desktopowych.

### 2.2. Funkcjonalności wyłączone z testów

Zgodnie z dokumentem PRD, następujące elementy nie wchodzą w zakres testów dla wersji MVP:

* Wbudowany komunikator (czat).
* Integracje z zewnętrznymi platformami w celu automatycznego pobierania danych.
* System powiadomień (e-mail, push).
* Możliwość dodawania nowych dyscyplin sportowych przez użytkowników.

## 3. Typy testów do przeprowadzenia

Proces testowania zostanie podzielony na kilka poziomów, aby zapewnić kompleksowe pokrycie.

| Typ testu | Opis | Narzędzia | Odpowiedzialność |
| :--- | :--- | :--- | :--- |
| **Testy jednostkowe (Unit Tests)** | Weryfikacja pojedynczych komponentów React, customowych hooków, funkcji pomocniczych (utils.ts) oraz logiki usług backendowych (services). | Vitest, React Testing Library | Deweloperzy |
| **Testy integracyjne (Integration Tests)** | Testowanie współpracy między komponentami (np. formularz i wywołanie API), a także integracji z Supabase (np. poprawność zapytań RLS). | Vitest, React Testing Library, Mock Service Worker | Deweloperzy |
| **Testy End-to-End (E2E)** | Symulacja rzeczywistych scenariuszy użytkowania w przeglądarce, weryfikująca całe przepływy, np. od rejestracji po znalezienie dopasowania. | Playwright | Inżynier QA, Deweloperzy |
| **Testy manualne (Manual Testing)** | Ręczne przeprowadzanie scenariuszy testowych w celu weryfikacji użyteczności, responsywności (UI/UX) i znalezienia błędów trudnych do zautomatyzowania. | - | Inżynier QA |
| **Testy wydajnościowe (Performance Tests)** | Podstawowa ocena czasu ładowania strony oraz wydajności kluczowych operacji, w szczególności funkcji `get_matches` w PostgreSQL. | Lighthouse, `EXPLAIN ANALYZE` w Supabase | Inżynier QA, Deweloperzy |
| **Testy bezpieczeństwa (Security Tests)** | Weryfikacja podstawowych aspektów bezpieczeństwa, takich jak ochrona endpointów API, polityki RLS w Supabase i walidacja danych wejściowych. | Manualna inspekcja, ZAP (opcjonalnie) | Inżynier QA |

## 4. Scenariusze testowe dla kluczowych funkcjonalności

Poniżej przedstawiono przykładowe, wysokopoziomowe scenariusze testowe. Szczegółowe przypadki testowe zostaną opracowane w osobnym dokumencie.

| ID | Funkcjonalność | Scenariusz | Oczekiwany rezultat | Priorytet |
| :--- | :--- | :--- | :--- | :--- |
| TC-001 | Rejestracja | Użytkownik wypełnia formularz rejestracyjny poprawnymi danymi. | Konto zostaje utworzone, użytkownik jest automatycznie zalogowany i przekierowany na stronę główną. | Krytyczny |
| TC-002 | Rejestracja | Użytkownik próbuje zarejestrować się z zajętą nazwą użytkownika lub adresem e-mail. | Wyświetlany jest odpowiedni komunikat błędu, rejestracja nie dochodzi do skutku. | Krytyczny |
| TC-003 | Logowanie | Użytkownik loguje się przy użyciu poprawnych danych. | Użytkownik zostaje zalogowany i przekierowany na stronę główną. | Krytyczny |
| TC-004 | Zarządzanie profilem | Użytkownik dodaje nowy sport do swojego profilu i definiuje dla niego parametry. | Sport wraz z parametrami jest widoczny w panelu profilu i zapisany w bazie danych. | Wysoki |
| TC-005 | Ustawienie lokalizacji | Użytkownik klika na mapę, ustawia swoją lokalizację i definiuje zasięg. | Lokalizacja i zasięg zostają zapisane, a na mapie pojawia się okrąg wizualizujący zasięg. | Krytyczny |
| TC-006 | Dopasowywanie | Użytkownik z ustawionym profilem i lokalizacją widzi listę innych użytkowników. | Lista zawiera tylko użytkowników, których zasięgi przecinają się z zasięgiem zalogowanego użytkownika. | Krytyczny |
| TC-007 | Sortowanie wyników | Lista dopasowań jest wyświetlana. | Użytkownicy są posortowani rosnąco wg odległości, a następnie malejąco wg liczby wspólnych sportów. | Wysoki |
| TC-008 | Responsywność | Użytkownik otwiera aplikację na urządzeniu mobilnym. | Interfejs aplikacji (panele, nawigacja) dostosowuje się do małego ekranu, zapewniając pełną funkcjonalność. | Wysoki |
| TC-009 | Ochrona danych | Niezalogowany użytkownik próbuje uzyskać dostęp do strony głównej (`/`). | Użytkownik jest przekierowywany na stronę logowania (`/login`). | Krytyczny |

## 5. Środowisko testowe

* **Środowisko deweloperskie (lokalne):** Używane do testów jednostkowych i integracyjnych podczas developmentu.
* **Środowisko stagingowe (testowe):**
  * Osobna instancja aplikacji wdrożona na platformie hostingowej (np. Vercel, Netlify).
  * Osobny projekt Supabase z dedykowaną bazą danych, odizolowany od danych produkcyjnych.
  * Baza danych na środowisku stagingowym będzie zasilana zestawem predefiniowanych danych testowych, aby umożliwić testowanie różnych scenariuszy dopasowań.
* **Przeglądarki:** Testy będą przeprowadzane na najnowszych wersjach przeglądarek: Chrome, Firefox, Safari, Edge.

## 6. Narzędzia do testowania

* **Framework do testów jednostkowych i integracyjnych:** Vitest
* **Biblioteka do testowania komponentów React:** React Testing Library
* **Framework do testów E2E:** Playwright
* **Narzędzie do audytu wydajności i SEO:** Google Lighthouse
* **System do zarządzania zadaniami i błędami:** GitHub Issues / Jira
* **CI/CD:** GitHub Actions (do automatycznego uruchamiania testów jednostkowych i integracyjnych przy każdym pushu).

## 7. Harmonogram testów

Harmonogram testów będzie zintegrowany z cyklem deweloperskim i realizowany w sposób ciągły.

| Faza | Opis | Czas trwania |
| :--- | :--- | :--- |
| **Testy jednostkowe i integracyjne** | Realizowane na bieżąco przez deweloperów w trakcie implementacji nowych funkcji. | Ciągły |
| **Przygotowanie środowiska i danych testowych** | Konfiguracja środowiska stagingowego i przygotowanie skryptów z danymi testowymi. | 2 dni |
| **Główna faza testów manualnych i E2E** | Wykonanie wszystkich scenariuszy testowych na środowisku stagingowym po zakończeniu developmentu MVP. | 5 dni |
| **Testy regresji** | Ponowne wykonanie kluczowych testów po wprowadzeniu poprawek do znalezionych błędów. | 2 dni |
| **Testy akceptacyjne użytkownika (UAT)** | Opcjonalna faza z udziałem wybranych interesariuszy w celu ostatecznej akceptacji. | 1 dzień |

## 8. Kryteria akceptacji testów

### 8.1. Kryteria wejścia

* Zakończenie implementacji wszystkich funkcjonalności zdefiniowanych dla MVP.
* Wdrożenie aplikacji na środowisku stagingowym.
* Przygotowanie i wgranie danych testowych do bazy danych na środowisku stagingowym.

### 8.2. Kryteria wyjścia (zakończenia)

* Wykonanie 100% zaplanowanych scenariuszy testowych.
* Brak otwartych błędów o priorytecie "Krytyczny".
* Liczba otwartych błędów o priorytecie "Wysoki" nie przekracza 3.
* Pokrycie kodu testami jednostkowymi na poziomie co najmniej 70%.
* Pomyślne przejście wszystkich zautomatyzowanych testów E2E.
