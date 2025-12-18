# Implementation plan of Sport Parameters Range

## 1. Przegląd obecnego rozwiązania

Obecnie parametry sportowe (np. dystans, tempo) są przechowywane w bazie danych (kolumna `jsonb`) jako proste wartości liczbowe (`number`) lub tekstowe (`string`). Interfejs użytkownika (`SportEditorDialog`) generuje pojedyncze pola input dla każdego parametru.
To rozwiązanie jest proste, ale nie pozwala użytkownikom na określenie elastyczności swoich preferencji (np. "biegam tempem od 5:00 do 5:30").

## 2. Szczegóły nowego podejścia

### Idea zmian

Wprowadzenie hybrydowego modelu danych. Parametry liczbowe będą mogły być definiowane jako:

- **Wartość dokładna (Exact):** np. 10 km.
- **Zakres (Range):** np. 10-15 km.

Użytkownik decyduje o trybie za pomocą przełącznika (Switch). W trybie zakresu interfejs prezentuje podwójny suwak (Dual Slider) oraz dwa pola liczbowe.

### Główne zalety

- **Lepsze dopasowanie:** Odzwierciedla rzeczywiste nawyki treningowe (rzadko kto trenuje z jedną sztywną wartością).
- **Elastyczność:** Użytkownik może zadeklarować otwartość na szerszą grupę partnerów.
- **Spójność danych:** Migracja wszystkich wartości liczbowych do struktury obiektowej ułatwi przyszłe zapytania SQL.

### Główne wady

- **Złożoność UI:** Formularz edycji staje się bardziej skomplikowany.
- **Złożoność typowania:** Konieczność obsługi unii typów (`number | object`) w okresie przejściowym.

### Problemy do rozwiązania

- **Migracja danych:** Istniejące rekordy muszą zostać przekonwertowane do nowej struktury bez przerywania działania aplikacji.
- **Logika "Pace":** Tempo (min/km) działa odwrotnie (mniejsza wartość = szybciej), co trzeba uwzględnić w logice suwaków.

## 3. Wykorzystywane typy

### Nowy typ wartości parametru

```typescript
export type SportParameterValue = {
  min: number;
  max: number;
  mode: 'exact' | 'range';
};
```

### Zaktualizowany typ w `SportBadgeData`

```typescript
params?: Record<string, string | number | SportParameterValue>;
```

### Schemat ZOD (w `SportEditorDialog`)

```typescript
z.record(
  z.string(),
  z.union([
    z.string(), // dla enum
    z.number(), // wsparcie legacy (opcjonalne, ale bezpieczne)
    z.object({  // nowa struktura
      min: z.number(),
      max: z.number(),
      mode: z.enum(["exact", "range"]),
    }),
  ])
)
```

## 4. Komponenty UI

1. **`Slider` (`src/components/ui/slider.tsx`)**:
    - Nowy komponent oparty na `@radix-ui/react-slider`.
    - Musi obsługiwać tablicę wartości `[min, max]` (dual thumb).
2. **`Switch` (`src/components/ui/switch.tsx`)**:
    - Nowy komponent oparty na `shadcn-ui/switch`.
    - Służy do przełączania trybu Exact/Range.
3. **`SportEditorDialog`**:
    - Modyfikacja renderowania pól formularza.
    - Logika synchronizacji Slider <-> Input.
4. **`SportBadge`**:
    - Modyfikacja funkcji formatującej tekst, aby wyświetlała zakresy (np. "5:00 - 5:30 min/km").

## 5. Etapy wdrożenia

### Krok 1: Fundamenty UI

Dodanie brakujących komponentów bazowych do systemu designu.

- Utworzenie `src/components/ui/slider.tsx`.
- Utworzenie `src/components/ui/switch.tsx`.
*Cel: Aplikacja działa bez zmian, ale mamy gotowe klocki do budowy nowego formularza.*

### Krok 2: Konfiguracja i Typy

Rozszerzenie konfiguracji sportów o parametr `step` (krok suwaka) oraz aktualizacja definicji typów.

- Edycja `src/lib/config/sport-parameters.config.ts`: dodanie pola `step` do `ParameterConfig`.
- Aktualizacja interfejsów w `src/components/shared/types/sport.ts`.
*Cel: Backend logiczny jest gotowy na przyjęcie nowych danych.*

### Krok 3: Warstwa Prezentacji (Read-only)

Dostosowanie komponentów wyświetlających dane (`SportBadge`) do obsługi nowej struktury obiektowej `{min, max, mode}`, przy zachowaniu wstecznej kompatybilności dla prostych liczb (`number`).

- Edycja `src/components/shared/SportBadge.tsx`.
- Funkcja formatująca musi sprawdzać `typeof value`:
  - Jeśli `number` -> formatuj jak dawniej.
  - Jeśli `object` -> formatuj jako zakres "min - max".
*Cel: Aplikacja potrafi wyświetlić nowe dane, jeśli się pojawią, i nadal poprawnie wyświetla stare.*

### Krok 4: Edytor (Write)

Przebudowa formularza edycji sportu.

- Edycja `src/components/profile/SportEditorDialog.tsx`.
- Aktualizacja schematu Zod.
- Implementacja logiki Switcha (przełączanie trybów).
- Implementacja Slidera.
- Obsługa wczytywania danych: jeśli formularz otrzyma `number` (stare dane), traktuje to jako `mode: 'exact'` z `min=max`.
*Cel: Użytkownicy mogą zapisywać parametry jako zakresy. Stare dane są automatycznie konwertowane do nowej struktury przy edycji.*

### Krok 5: Migracja Bazy Danych

Ujednolicenie danych w bazie.

- Utworzenie i uruchomienie migracji SQL, która zamieni wszystkie wartości numeryczne w kolumnach JSONB na obiekty `{min, max, mode: 'exact'}`.
*Cel: Pełna spójność danych w bazie. Ułatwienie przyszłego indeksowania i wyszukiwania.*

### Krok 6: Weryfikacja i Czyszczenie

- Sprawdzenie poprawności wyświetlania na liście dopasowań (`UserMatchCard`).
- (Opcjonalnie) Usunięcie obsługi typu `number` z kodu frontendu, jeśli migracja powiodła się w 100%.
