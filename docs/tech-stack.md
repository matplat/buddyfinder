# BuddyFinder tech stack

Architektura opiera się na podejściu "full-stack" z wykorzystaniem frameworka Astro oraz platformy Supabase jako Backend-as-a-Service (BaaS).

## Frontend

* **Astro 5**
    Umożliwia budowę szybkich, zorientowanych na treść stron (np. logowanie, rejestracja) dzięki architekturze "wysp" i domyślnemu renderowaniu do statycznego HTML. Jednocześnie pozwala na tworzenie endpointów API po stronie serwera, co eliminuje potrzebę utrzymywania osobnego serwisu backendowego dla logiki biznesowej.

* **React 19**
    Wykorzystywany do tworzenia dynamicznych i interaktywnych komponentów interfejsu użytkownika. Będzie zasilał główny panel aplikacji, w tym interaktywną mapę, formularze edycji profilu oraz dynamicznie aktualizowaną listę dopasowanych użytkowników.

* **TypeScript 5**
    Zapewnia bezpieczeństwo typów w całym kodzie aplikacji, zarówno w komponentach frontentowych, jak i w logice po stronie serwera (endpointy API). Jest to kluczowe dla utrzymania jakości i unikania błędów przy obsłudze złożonych struktur danych, takich jak profile użytkowników i ich parametry sportowe.

* **Tailwind 4**
    Nowoczesny, "utility-first" framework CSS, który pozwala na szybkie i spójne prototypowanie oraz budowanie interfejsu bez konieczności pisania własnych stylów.

* **Shadcn/ui**
    Dostarcza zestaw gotowych, dostępnych i estetycznych komponentów UI zbudowanych na bazie Tailwind CSS. Dostarcza gotowe elementy takie jak formularze, przyciski, dialogi czy karty, niezbędne w procesie rejestracji i zarządzania profilem.

## Backend + Baza danych

* **Supabase**
    Platforma Backend-as-a-Service (BaaS) oparta na PostgreSQL, która dostarcza gotowe rozwiązania dla kluczowych funkcjonalności. Zapewnia system autentykacji użytkowników, bazę danych oraz biblioteki klienckie.

* **PostgreSQL z rozszerzeniem PostGIS**
    PostGIS, działający w ramach bazy danych Supabase, dostarcza wyspecjalizowane funkcje do przechowywania i odpytywania danych geoprzestrzennych.

## Mapy

* **OpenStreetMaps (OSM)**
    Darmowy i otwarty dostawca danych mapowych, który zostanie wykorzystany do implementacji interaktywnej mapy.

* **Leaflet.js**
    Lekka, otwarta biblioteka JavaScript do tworzenia interaktywnych map. Zostanie użyta do renderowania kafelków mapy z OpenStreetMaps i obsługi interakcji użytkownika, takich jak zaznaczanie lokalizacji i wizualizacja zasięgu.
