# Dokument wymagań produktu (PRD) - FITLink

## 1. Przegląd produktu

FITLink to aplikacja internetowa zaprojektowana w celu rozwiązania problemu braku platformy społecznościowej dla sportowców-amatorów, umożliwiającej nawiązywanie kontaktów na podstawie wspólnych aktywności sportowych. Aplikacja pozwoli użytkownikom na stworzenie prostego profilu, w którym zdefiniują uprawiane sporty, określą swój poziom zaawansowania poprzez specyficzne parametry oraz wskażą swoją lokalizację i zasięg, w jakim są skłonni podróżować. Główną funkcją produktu jest prezentowanie listy innych użytkowników o pasujących preferencjach i zazębiających się lokalizacjach, ułatwiając w ten sposób znalezienie partnerów treningowych. Wersja MVP skupia się na podstawowej funkcjonalności dopasowania i umożliwieniu kontaktu poprzez udostępnienie adresu e-mail.

## 2. Problem użytkownika

Na rynku brakuje aplikacji i platform socjalnych, które pozwalałyby sportowcom-amatorom w prosty i skuteczny sposób odnaleźć partnerów treningowych. Osoby aktywne fizycznie często mają trudności ze znalezieniem osób o podobnym poziomie zaawansowania, uprawiających te same dyscypliny i mieszkających w bliskiej okolicy. Istniejące ogólne platformy społecznościowe nie są do tego przystosowane, a grupy tematyczne często są zbyt szerokie, co utrudnia efektywne dopasowanie. FITLink ma na celu wypełnienie tej luki, tworząc narzędzie skoncentrowane wyłącznie na łączeniu ludzi poprzez sport.

## 3. Wymagania funkcjonalne

1. Zarządzanie kontem użytkownika:
    * Użytkownicy mogą zarejestrować nowe konto za pomocą nazwy użytkownika, adresu e-mail i hasła.
    * Użytkownicy mogą logować się i wylogowywać ze swojego konta.
2. Zarządzanie profilem użytkownika:
    * Możliwość wyboru jednego lub więcej sportów z predefiniowanej, zamkniętej listy: bieganie, rower szosowy, rower MTB, pływanie w basenie, pływanie na wodach otwartych, rolki, nurkowanie, tenis.
    * Możliwość zdefiniowania kluczowych, mierzalnych parametrów dla każdego wybranego sportu (np. dla biegania: preferowany dystans w km, średnie tempo w min/km).
    * Możliwość ustawienia jednej, głównej lokalizacji poprzez wskazanie punktu na mapie (dostawca: OpenStreetMap).
    * Możliwość zdefiniowania domyślnego zasięgu dojazdu (w km).
    * Możliwość zdefiniowania niestandardowego zasięgu dojazdu dla poszczególnych, wybranych sportów, który nadpisuje zasięg domyślny.
    * Możliwość opcjonalnego dodania linków do zewnętrznych profili społecznościowych (np. Strava, Facebook).
3. Wyszukiwanie i dopasowywanie partnerów:
    * Aplikacja wyświetla zalogowanemu użytkownikowi listę innych użytkowników, których zdefiniowany zasięg dojazdu przecina się z jego zasięgiem.
    * Prezentowana lista jest w formie tekstowej.
    * Każdy wpis na liście zawiera: nazwę użytkownika, adres e-mail, listę sportów wraz z zadeklarowanymi parametrami oraz opcjonalne linki do profili społecznościowych.
    * Lista wyników jest domyślnie sortowana według odległości od zalogowanego użytkownika (rosnąco), a w drugiej kolejności według liczby wspólnych dyscyplin sportowych (malejąco).

## 4. Granice produktu

Poniższe funkcjonalności i elementy celowo nie wchodzą w zakres wersji MVP (Minimum Viable Product):

* Wbudowany komunikator (czat) do wiadomości między użytkownikami.
* Rozbudowane profile użytkowników (poza nazwą, e-mailem, sportami, lokalizacją i linkami social media).
* Integracje z innymi platformami w celu automatycznego pobierania danych.
* Dedykowana aplikacja mobilna (produkt będzie dostępny jako aplikacja internetowa).
* Funkcjonalność tworzenia lub sugerowania planów treningowych z użyciem AI.
* Formalny, wieloetapowy proces onboardingu użytkownika.
* Mechanizm pozwalający użytkownikom na proponowanie i dodawanie nowych dyscyplin sportowych do listy.
* Wizualizacja zasięgów użytkowników na mapie w widoku wyników.
* System powiadomień (e-mail, push).
* Możliwość posiadania więcej niż jednego centrum lokalizacyjnego.

## 5. Historyjki użytkowników

| ID | Tytuł | Opis | Kryteria akceptacji |
| :--- | :--- | :--- | :--- |
| US-001 | Rejestracja nowego konta | Jako nowy gość, chcę móc założyć konto za pomocą nazwy użytkownika, e-maila i hasła, aby uzyskać dostęp do aplikacji. | 1. Formularz rejestracji zawiera pola: nazwa użytkownika, e-mail, hasło, potwierdzenie hasła. <br> 2. System waliduje, czy adres e-mail i nazwa użytkownika nie są już zajęte. <br> 3. Hasło musi spełniać minimalne wymogi bezpieczeństwa (np. 8 znaków). <br> 4. Po pomyślnej rejestracji jestem automatycznie zalogowany i przekierowany do edycji mojego profilu. |
| US-002 | Logowanie do aplikacji | Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto przy użyciu adresu e-mail (lub nazwy użytkownika) i hasła, aby korzystać z funkcji aplikacji. | 1. Strona logowania zawiera pola na e-mail (lub nazwę użytkownika) i hasło. <br> 2. W przypadku podania błędnych danych wyświetlany jest stosowny komunikat. <br> 3. Po pomyślnym zalogowaniu jestem przekierowany na stronę główną (widok mapy, po lewej panel profilu i sportów, po prawej lista innych użytkowników). |
| US-003 | Wylogowanie z aplikacji | Jako zalogowany użytkownik, chcę móc się wylogować, aby bezpiecznie zakończyć moją sesję. | 1. W interfejsie aplikacji znajduje się widoczny przycisk/link "Wyloguj". <br> 2. Po jego kliknięciu moja sesja zostaje zakończona i jestem przekierowany na stronę logowania. |
| US-004 | Wybór uprawianych sportów | Jako użytkownik, chcę móc wybrać z predefiniowanej listy sporty, które uprawiam, i dodać je do mojego profilu. | 1. W ustawieniach profilu widzę listę dostępnych sportów (Bieganie, rower szosowy, itd.). <br> 2. Mogę zaznaczyć i zapisać wiele dyscyplin. <br> 3. W dowolnym momencie mogę edytować listę, dodając nowe lub usuwając istniejące sporty z mojego profilu. |
| US-005 | Definiowanie parametrów dla sportu | Jako użytkownik, dla każdego dodanego sportu chcę zdefiniować kluczowe parametry (np. tempo, dystans), aby znaleźć partnerów o podobnych umiejętnościach. | 1. Po dodaniu sportu do profilu, pojawiają się dedykowane pola do uzupełnienia parametrów (np. dla biegania: dystans w km, tempo w min/km). <br> 2. Wprowadzone wartości są zapisywane i widoczne w moim profilu oraz dla innych użytkowników. <br> 3. Mogę w każdej chwili edytować te parametry. |
| US-006 | Ustawienie lokalizacji i zasięgu | Jako użytkownik, chcę ustawić moją lokalizację oraz domyślny zasięg dojazdu (w km), aby otrzymywać propozycje z mojej okolicy. | 1. Na ekranie głównym znajduje się interaktywna mapa OpenStreetMap. <br> 2. Mogę ustawić moją lokalizację przez kliknięcie jednego punktu na mapie. <br> 3. po kliknięciu pojawia się pole do wpisania domyślnego zasięgu w kilometrach. <br> 4. Zmiany są zapisywane po kliknięciu przycisku "Zapisz". <br> 5. Na mapie pojawia się okrąg z zaznaczonym zasięgiem. |
| US-007 | Dostosowanie zasięgu dla sportu | Jako użytkownik, chcę mieć możliwość ustawienia innego zasięgu dojazdu dla konkretnego sportu, aby lepiej dopasować kryteria wyszukiwania. | 1. W sekcji edycji sportów, przy każdej dodanej dyscyplinie, znajduje się opcjonalne pole "Zasięg dla tego sportu (km)". <br> 2. Jeśli pole jest puste, system używa zasięgu domyślnego. <br> 3. Jeśli wartość jest wpisana, nadpisuje ona zasięg domyślny tylko dla tej konkretnej dyscypliny w procesie dopasowywania. |
| US-008 | Dodawanie linków social media | Jako użytkownik, chcę móc opcjonalnie dodać do profilu linki do moich kont społecznościowych, aby ułatwić innym kontakt i weryfikację. | 1. W edycji profilu dostępne są opcjonalne pola tekstowe na linki. <br> 2. Wprowadzone i zapisane linki są widoczne na moim profilu publicznym na liście wyników. |
| US-009 | Przeglądanie listy partnerów | Jako zalogowany użytkownik z uzupełnionym profilem (lokalizacja), chcę widzieć listę innych użytkowników, których zasięg przecina się z moim. | 1. Na stronie głównej wyświetlana jest lista użytkowników. <br> 2. Lista zawiera tylko te osoby, dla których (odległość między nami) <= (mój zasięg + ich zasięg). <br> 3. Jeśli nie mam ustawionej lokalizacji, widzę komunikat zachęcający do jej uzupełnienia. |
| US-010 | Widok informacji o użytkowniku | Przeglądając listę, chcę widzieć kluczowe informacje o każdej osobie, aby móc zdecydować, czy chcę nawiązać kontakt. | 1. Każdy element na liście zawiera: nazwę użytkownika i adres e-mail. <br> 2. Pod danymi kontaktowymi znajduje się lista sportów uprawianych przez daną osobę wraz z zadeklarowanymi parametrami. <br> 3. Widoczne są również opcjonalne linki do mediów społecznościowych. |
| US-011 | Sortowanie listy wyników | Jako użytkownik, chcę, aby lista dopasowanych osób była posortowana w logiczny sposób, abym najpierw widział najbardziej relevantne wyniki. | 1. Domyślnie lista jest posortowana rosnąco według odległości geometrycznej od mojej lokalizacji. <br> 2. Jeśli odległość dla dwóch lub więcej użytkowników jest taka sama, są oni sortowani malejąco według liczby wspólnych sportów ze mną. |

## 6. Metryki sukcesu

Sukces wersji MVP będzie mierzony na podstawie następujących kluczowych wskaźników, które odzwierciedlają zaangażowanie użytkowników i przyjęcie podstawowych funkcji produktu.

Kluczowe wskaźniki produktu (KPIs):

* Wskaźnik adopcji profilu sportowego: 75% wszystkich zarejestrowanych użytkowników uzupełniło swój profil o co najmniej jedną dyscyplinę sportową.
* Wskaźnik adopcji lokalizacji: 50% wszystkich zarejestrowanych użytkowników podało swoją lokalizację i zdefiniowało zasięg dojazdu.

Metryka pomocnicza (wewnętrzna):

* Data ostatniego logowania: Będzie śledzona dla każdego użytkownika w celach analitycznych, aby monitorować retencję i poziom zaangażowania w czasie. Metryka ta nie będzie widoczna publicznie.
