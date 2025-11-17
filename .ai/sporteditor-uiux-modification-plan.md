# Plan modyfikacji komponentu SportEditorDialog

## Przegląd rozwiązania

### Obecne podejście

Komponent `SportEditorDialog` obecnie wykorzystuje proste inputy tekstowe i numeryczne do wprowadzania parametrów sportowych. Każdy parametr jest reprezentowany jako pojedyncza wartość liczbowa przechowywana w formacie `jsonb` w kolumnie `user_sports.parameters`:

```json
{
  "dystans": 10,
  "tempo": 330
}
```

**Ograniczenia obecnego rozwiązania:**

- Brak możliwości określenia zakresu wartości (np. "biegam 10-20km")
- Słaba użyteczność na urządzeniach mobilnych (małe pole input)
- Brak wizualizacji dopuszczalnych wartości
- Konieczność znajomości dokładnych wartości parametrów
- Trudność w szybkiej korekcie wartości (konieczność usunięcia i przepisania)

### Poglądowy plan nowego podejścia

Nowy interfejs wprowadza trzy różne tryby wprowadzania danych w zależności od semantyki parametru:

1. **Single Value Mode** (np. tempo, prędkość - parametry określające poziom)
   - Slider + Input + Step buttons (± z predefiniowanym krokiem)
   - Reprezentacja w bazie: `{"tempo": 330}`
   - Use case: Parametry określające poziom zaawansowania, gdzie zakres nie ma sensu

2. **Range Mode** (np. dystans, czas treningu)
   - Dual-slider + 2× Input (min/max)
   - Reprezentacja w bazie: `{"dystans": {"min": 10, "max": 20}}`
   - Use case: Parametry, gdzie użytkownik jest elastyczny w zakresie

3. **Max-Only Mode** (np. maksymalna głębokość nurkowania)
   - Single slider + Input z etykietą "do"
   - Reprezentacja w bazie: `{"głębokość": {"max": 30}}`
   - Use case: Parametry określające maksymalną możliwą wartość/kompetencję

**Kluczowe usprawnienia UI/UX:**

- Wizualizacja dopuszczalnego zakresu wartości
- Synchronizacja slider ↔ input (dwukierunkowa)
- Step buttons dla szybkiej korekty na mobile
- Hinty z poradami ("Najczęściej wybierane: 5-15 km")
- Real-time walidacja (min < max, wartości w dopuszczalnym zakresie)
- Responsywność - większe obszary dotyku dla mobile

**Format danych w bazie:**

```json
{
  "dystans": {"min": 10, "max": 20},
  "tempo": 330,
  "głębokość": {"max": 30}
}
```

System musi zachować **backward compatibility** - obsługiwać zarówno stary format (pojedyncze wartości), jak i nowy (zakresy).

---

## Walidacja danych

### Walidacja na poziomie frontendu (TypeScript + Zod)

```typescript
// Schemat Zod dla pojedynczego parametru
const parameterValueSchema = z.union([
  z.number(), // Stary format lub single value
  z.object({
    min: z.number(),
    max: z.number(),
  }).refine(data => data.min < data.max, {
    message: "Wartość minimalna musi być mniejsza od maksymalnej",
  }), // Range format
  z.object({
    max: z.number(),
  }), // Max-only format
]);

const formSchema = z.object({
  sport_id: z.number().int().positive(),
  custom_range_km: z.number().min(1).max(100).optional(),
  parameters: z.record(z.string(), parameterValueSchema).optional(),
});
```

### Walidacja specyficzna dla typu parametru

Każdy parametr musi być walidowany zgodnie z definicją w `SPORT_PARAMETERS_CONFIG`:

1. **Zakres wartości:** Sprawdzenie czy wartość (lub min/max) mieści się w `config.min` - `config.max`
2. **Minimalny rozsądny zakres:** W trybie range, różnica (max - min) powinna być sensowna (np. dystans 9.9-10.0 km jest bezużyteczny)
3. **Konwersja jednostek:** Parametry typu `pace` i `time` wymagają konwersji przed zapisem:
   - `pace`: "5:30" → 330 sekund
   - `time`: "1:30h" → 90 minut
4. **Step validation:** Wartości powinny być wielokrotnością `config.step` (jeśli zdefiniowany)

### Automatyczna konwersja starych danych

Podczas pierwszego wczytania danych użytkownika w nowym interfejsie:

```typescript
function migrateParameterToNewFormat(
  paramName: string,
  value: number | { min: number; max?: number } | { max: number },
  config: ParameterConfig
): number | { min: number; max?: number } | { max: number } {
  // Jeśli wartość to już obiekt, zwróć bez zmian
  if (typeof value !== 'number') {
    return value;
  }
  
  // Konwersja pojedynczej wartości na nowy format
  switch (config.inputMode) {
    case 'single':
      return value; // Pozostaje jako liczba
    case 'range':
      // Konwertuj na zakres z tolerancją ±10%
      const tolerance = Math.max(config.step || 1, value * 0.1);
      return {
        min: Math.max(config.min || 0, value - tolerance),
        max: Math.min(config.max || Infinity, value + tolerance),
      };
    case 'max-only':
      return { max: value };
    default:
      return value;
  }
}
```

**Kiedy następuje migracja:**

- Przy wczytaniu sportu do edycji w `SportEditorDialog`
- Automatyczne zapisanie zmigrowanych danych do bazy przy pierwszym edytowaniu przez użytkownika
- Brak komunikatu dla użytkownika (transparentna migracja)

### Walidacja na poziomie backendu

Endpoint `PUT /api/profiles/me/sports/[sport_id]` już wykorzystuje Zod do walidacji `UpdateUserSportCommand`. Schemat musi zostać rozszerzony:

```typescript
export const UpdateUserSportCommand = z.object({
  custom_range_km: z.number().min(1).max(100).optional(),
  parameters: z.record(z.string(), parameterValueSchema).optional(),
});
```

Dodatkowa walidacja w `UserSportService`:

- Sprawdzenie czy struktura parametrów odpowiada konfiguracji sportu
- Walidacja zakresów wartości zgodnie z `SPORT_PARAMETERS_CONFIG`
- Sanityzacja danych przed zapisem do bazy

---

## Użyte komponenty

### Istniejące komponenty Shadcn/ui

1. **`<Slider />` (`src/components/ui/slider.tsx`)**
   - Single value slider dla trybu `single` i `max-only`
   - Dual-thumb slider dla trybu `range` (z `minStepsBetweenThumbs`)
   - Właściwości: `min`, `max`, `step`, `value`, `onValueChange`
   - A11y: Wbudowana obsługa klawiatury, ARIA labels

2. **`<Input />` (`src/components/ui/input.tsx`)**
   - Pola tekstowe/numeryczne zsynchronizowane ze sliderem
   - Obsługa różnych typów: `number`, `text` (dla pace/time)
   - Walidacja w czasie rzeczywistym

3. **`<Button />` (`src/components/ui/button.tsx`)**
   - Step buttons (± na końcach inputa)
   - Variant: `outline`, Size: `icon`

4. **`<Label />` (`src/components/ui/label.tsx`)**
   - Etykiety dla kontrolek formularza
   - Powiązanie z inputami przez `htmlFor`

5. **`<Form />`, `<FormField />`, `<FormItem />`, etc. (`src/components/ui/form.tsx`)**
   - React Hook Form integration
   - Automatyczna walidacja i wyświetlanie błędów

6. **`<Dialog />` (`src/components/ui/dialog.tsx`)**
   - Istniejący kontener dla `SportEditorDialog`

### Nowe komponenty do stworzenia

#### 1. `ParameterInput.tsx`

Uniwersalny komponent obsługujący wszystkie tryby wprowadzania parametrów.

**Lokalizacja:** `src/components/profile/ParameterInput.tsx`

**Props:**

```typescript
interface ParameterInputProps {
  config: ParameterConfig; // Z sport-parameters.config.ts
  value: number | { min: number; max?: number } | { max: number };
  onChange: (value: ParameterInputProps["value"]) => void;
  error?: string; // Komunikat błędu walidacji
}
```

**Odpowiedzialności:**

- Renderowanie odpowiedniego UI w zależności od `config.inputMode`
- Synchronizacja slider ↔ input
- Konwersja wartości dla typów `pace` i `time`
- Walidacja w czasie rzeczywistym
- Wyświetlanie hintów (`config.hint`)
- Accessibility (ARIA labels, keyboard navigation)

**Wewnętrzne komponenty pomocnicze:**

- `SingleValueInput` - dla trybu single
- `RangeValueInput` - dla trybu range
- `MaxOnlyInput` - dla trybu max-only
- `TimeSlider` - dedykowany slider dla parametrów typu `time` (wyświetlanie w formacie Xh:Ymin)
- `PaceInput` - input dla tempa z walidacją formatu mm:ss

#### 2. `ParameterMigrator.tsx` (utility hook)

**Lokalizacja:** `src/components/profile/hooks/useParameterMigration.ts`

**Funkcjonalność:**

```typescript
export function useParameterMigration(
  sportId: number,
  parameters: Record<string, any>
): {
  migratedParameters: Record<string, any>;
  needsMigration: boolean;
  migrate: () => Promise<void>;
}
```

- Wykrywa stare formaty danych
- Konwertuje je na nowy format zgodnie z `inputMode`
- Automatycznie zapisuje zmigrowane dane do bazy przy pierwszej edycji

---

## Pliki poddawane zmianie

### Konieczność utworzenia nowych plików

1. **`.ai/sporteditor-uiux-modification-plan.md`** ✅
   - Niniejszy dokument planistyczny

2. **`src/components/profile/ParameterInput.tsx`**
   - Nowy główny komponent do wprowadzania parametrów
   - Obsługa trzech trybów: single, range, max-only

3. **`src/components/profile/hooks/useParameterMigration.ts`**
   - Hook do automatycznej migracji starych danych
   - Logika wykrywania i konwersji formatów

4. **`src/components/profile/ParameterInput.test.tsx`**
   - Testy jednostkowe komponentu `ParameterInput`
   - Pokrycie wszystkich trybów i edge cases

5. **`src/lib/config/__tests__/sport-parameters.config.test.ts`**
   - Testy funkcji konwersji (pace, time)
   - Walidacja konfiguracji parametrów

6. **`supabase/migrations/YYYYMMDD_add_parameters_match_function.sql`**
   - Nowa funkcja SQL `parameters_match()` obsługująca zakresy
   - Modyfikacja `get_matches_for_user` z użyciem nowej funkcji

### Istniejące pliki wymagające modyfikacji

#### 1. **`src/lib/config/sport-parameters.config.ts`**

**Zmiany:**

- Rozszerzenie `ParameterType`: dodanie `"range"` i `"max-value"`
- Dodanie nowego pola `inputMode: "single" | "range" | "max-only"` do `ParameterConfig`
- Dodanie pól: `step?: number`, `defaultValue?: number | { min: number; max: number }`, `hint?: string`
- Aktualizacja `SPORT_PARAMETERS_CONFIG` dla wszystkich sportów z określeniem `inputMode`

**Przykład:**

```typescript
export interface ParameterConfig {
  name: string;
  label: string;
  type: ParameterType;
  inputMode: "single" | "range" | "max-only"; // NOWE
  unit?: string;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number; // NOWE
  defaultValue?: number | { min: number; max: number }; // NOWE
  hint?: string; // NOWE
}
```

#### 2. **`src/components/profile/SportEditorDialog.tsx`**

**Zmiany:**

- Zastąpienie obecnych inputów numerycznych komponentem `<ParameterInput />`
- Integracja z `useParameterMigration` hook
- Aktualizacja logiki `onSubmit` do obsługi nowych formatów danych
- Rozszerzenie schematu Zod walidacji formularza
- Dodanie obsługi błędów walidacji dla zakresów

**Przed:**

```tsx
<Input
  type="number"
  {...form.register(`parameters.${param.name}`)}
/>
```

**Po:**

```tsx
<ParameterInput
  config={param}
  value={form.watch(`parameters.${param.name}`)}
  onChange={(val) => form.setValue(`parameters.${param.name}`, val)}
  error={form.formState.errors.parameters?.[param.name]?.message}
/>
```

#### 3. **`src/lib/dto/user-sport.dto.ts`**

**Zmiany:**

- Aktualizacja schematu Zod dla `parameters` w `AddUserSportCommand` i `UpdateUserSportCommand`
- Dodanie walidacji dla różnych formatów wartości parametrów

**Przed:**

```typescript
export const AddUserSportCommand = z.object({
  sport_id: z.number().int().positive(),
  custom_range_km: z.number().min(1).max(100).optional(),
  parameters: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});
```

**Po:**

```typescript
const parameterValueSchema = z.union([
  z.number(),
  z.object({ min: z.number(), max: z.number() })
    .refine(data => data.min < data.max, { message: "min must be < max" }),
  z.object({ max: z.number() }),
]);

export const AddUserSportCommand = z.object({
  sport_id: z.number().int().positive(),
  custom_range_km: z.number().min(1).max(100).optional(),
  parameters: z.record(z.string(), parameterValueSchema).optional(),
});
```

#### 4. **`src/lib/services/user-sport.service.ts`**

**Zmiany:**

- Dodanie logiki walidacji parametrów zgodnie z `SPORT_PARAMETERS_CONFIG`
- Sprawdzanie czy format parametrów odpowiada `inputMode` z konfiguracji
- Sanityzacja danych przed zapisem (zaokrąglanie do `step`)

**Nowa metoda:**

```typescript
private validateParameters(
  sportId: number,
  parameters: Record<string, any>
): void {
  const sport = await this.getSportById(sportId);
  const config = getSportParametersConfig(sport.name);
  
  for (const [key, value] of Object.entries(parameters)) {
    const paramConfig = config.find(c => c.name === key);
    if (!paramConfig) {
      throw new Error(`Unknown parameter: ${key}`);
    }
    
    // Walidacja zgodnie z inputMode i zakresami min/max
    // ...
  }
}
```

#### 5. **`src/pages/api/profiles/me/sports/[sport_id].ts`**

**Zmiany:**

- Endpoint już wykorzystuje Zod validation, więc zmiany w DTO automatycznie się zaaplikują
- Potencjalnie dodanie bardziej szczegółowych komunikatów błędów dla walidacji parametrów

#### 6. **`supabase/migrations/20251103000001_create_get_matches_function.sql`**

**Zmiany:**

- Modyfikacja funkcji `get_matches_for_user` do użycia nowej funkcji `parameters_match()`
- Dodanie filtru porównującego parametry sportowe z obsługą zakresów

**Obecne podejście:**
Funkcja nie porównuje parametrów - matchuje tylko na podstawie lokalizacji i obecności wspólnych sportów.

**Nowe podejście:**

```sql
-- Dodanie warunku w sekcji JOIN
LEFT JOIN user_sports us ON us.user_id = p2.id
LEFT JOIN user_sports current_us ON current_us.user_id = current_user_id 
  AND current_us.sport_id = us.sport_id
WHERE 
  -- ... istniejące warunki ...
  AND (
    current_us.parameters IS NULL -- Brak parametrów = match z każdym
    OR us.parameters IS NULL 
    OR parameters_match(current_us.parameters, us.parameters)
  )
```

#### 7. **`src/lib/services/matches.service.ts`**

**Zmiany:**

- Obecnie serwis tylko wywołuje RPC funkcję - brak bezpośrednich zmian
- Ewentualnie dodanie logowania informacji o matchowaniu z uwzględnieniem parametrów

---

## Etapy wdrożenia

### Etap 1: Przygotowanie infrastruktury backend (Priorytet: WYSOKI)

**Cel:** Umożliwienie backendu obsługi nowych formatów danych oraz algorytmu matchowania z zakresami.

**Zadania:**

1. Utworzenie migracji SQL z funkcją `parameters_match()`
   - Implementacja logiki porównywania pojedynczych wartości
   - Implementacja logiki porównywania zakresów (overlap detection)
   - Obsługa backward compatibility (stary format jako pojedyncza wartość)
   - Testy jednostkowe funkcji SQL

2. Modyfikacja funkcji `get_matches_for_user`
   - Dodanie warunku wykorzystującego `parameters_match()`
   - Przetestowanie wydajności na danych produkcyjnych (EXPLAIN ANALYZE)
   - Rozważenie indexów jeśli performance jest problematyczny

3. Aktualizacja `user-sport.dto.ts`
   - Rozszerzenie schematu Zod dla `parameters`
   - Testy jednostkowe walidacji

**Kryteria akceptacji:**

- [ ] Funkcja SQL `parameters_match()` prawidłowo porównuje wszystkie formaty
- [ ] `get_matches_for_user` zwraca poprawne wyniki z nowymi parametrami
- [ ] Backward compatibility: stare dane nadal działają
- [ ] Performance: query time < 500ms dla 1000 użytkowników

**Szacowany czas:** 3-4 dni

---

### Etap 2: Rozbudowa konfiguracji parametrów (Priorytet: WYSOKI)

**Cel:** Definicja `inputMode` i innych metadanych dla wszystkich parametrów sportowych.

**Zadania:**

1. Aktualizacja interfejsu `ParameterConfig`
   - Dodanie pól: `inputMode`, `step`, `defaultValue`, `hint`
   - Aktualizacja typu `ParameterType`

2. Przegląd i kategoryzacja wszystkich parametrów w `SPORT_PARAMETERS_CONFIG`
   - Określenie `inputMode` dla każdego parametru (single/range/max-only)
   - Definicja sensownych wartości `step` (np. 10s dla tempa, 1km dla dystansu)
   - Dodanie `hint` z praktycznymi poradami
   - Ustawienie `defaultValue` bazując na typowych wartościach

3. Testy jednostkowe funkcji konwersji
   - `paceToSeconds` / `secondsToPace`
   - `timeToMinutes` / `minutesToTime`
   - Edge cases (niepoprawne formaty, wartości graniczne)

**Kryteria akceptacji:**

- [ ] Wszystkie parametry mają zdefiniowany `inputMode`
- [ ] Wartości `step` są praktyczne i użyteczne
- [ ] Hinty są pomocne i zwięzłe
- [ ] 100% pokrycie testami funkcji konwersji

**Szacowany czas:** 2 dni

---

### Etap 3: Implementacja komponentu ParameterInput (Priorytet: WYSOKI)

**Cel:** Stworzenie uniwersalnego komponentu UI do wprowadzania parametrów sportowych.

**Zadania:**

1. Implementacja `ParameterInput.tsx`
   - Tryb `single`: slider + input + step buttons
   - Tryb `range`: dual-slider + 2× input
   - Tryb `max-only`: single slider + input z etykietą "do"
   - Dedykowany `TimeSlider` z wyświetlaniem w formacie Xh:Ymin (step 10min)
   - Synchronizacja dwukierunkowa slider ↔ input
   - Obsługa konwersji dla `pace` i `time`
   - Wyświetlanie hintów i błędów walidacji
   - Accessibility: ARIA labels, keyboard navigation

2. Style i responsywność
   - Mobile-first design
   - Większe obszary dotyku dla sliderów (min 44px)
   - Adaptive layout dla małych ekranów

3. Testy komponentu
   - Testy renderowania dla wszystkich trybów
   - Testy synchronizacji slider ↔ input
   - Testy konwersji jednostek
   - Testy walidacji
   - Testy accessibility (keyboard, screen readers)

**Kryteria akceptacji:**

- [ ] Komponent renderuje się poprawnie we wszystkich trybach
- [ ] Slider i input są zsynchronizowane w obu kierunkach
- [ ] Konwersje jednostek działają prawidłowo
- [ ] Component spełnia wymogi WCAG 2.1 AA
- [ ] 80%+ pokrycie testami

**Szacowany czas:** 5-6 dni

---

### Etap 4: Integracja z SportEditorDialog (Priorytet: WYSOKI)

**Cel:** Zamiana starych inputów na nowy komponent `ParameterInput` w dialogu edycji sportów.

**Zadania:**

1. Implementacja hook `useParameterMigration`
   - Wykrywanie starych formatów danych
   - Konwersja do nowego formatu zgodnie z `inputMode`
   - Automatyczny zapis zmigrowanych danych przy edycji

2. Refaktoryzacja `SportEditorDialog.tsx`
   - Zastąpienie starych inputów komponentem `<ParameterInput />`
   - Integracja z `useParameterMigration`
   - Aktualizacja schematu walidacji formularza (Zod)
   - Obsługa błędów walidacji dla zakresów

3. Aktualizacja `UserSportService`
   - Dodanie walidacji parametrów zgodnie z konfiguracją
   - Sanityzacja danych (zaokrąglanie do `step`)

4. Testy end-to-end
   - Dodawanie nowego sportu z parametrami
   - Edycja istniejącego sportu (stare dane)
   - Edycja istniejącego sportu (nowe dane)
   - Walidacja błędnych danych

**Kryteria akceptacji:**

- [ ] Dialog poprawnie renderuje `ParameterInput` dla wszystkich parametrów
- [ ] Stare dane są automatycznie migrowane przy pierwszej edycji
- [ ] Walidacja działa poprawnie dla wszystkich formatów
- [ ] Zapisywanie danych kończy się sukcesem
- [ ] Testy E2E przechodzą

**Szacowany czas:** 4-5 dni

---

### Etap 5: Testowanie i optymalizacja (Priorytet: ŚREDNI)

**Cel:** Zapewnienie stabilności, wydajności i dostępności rozwiązania.

**Zadania:**

1. Testy manualne na urządzeniach
   - Desktop (Chrome, Firefox, Safari, Edge)
   - Mobile (iOS Safari, Android Chrome)
   - Tablet (iPad, Android)
   - Testy dotykowe (touch targets, gestures)

2. Accessibility audit
   - Testy z screen readerem (NVDA, VoiceOver)
   - Testy nawigacji klawiaturowej
   - Walidacja kontrastu kolorów
   - Sprawdzenie ARIA labels

3. Performance testing
   - Monitoring query time `get_matches_for_user`
   - Sprawdzenie renderowania komponentu (React DevTools Profiler)
   - Optymalizacja re-renderów (React.memo, useMemo)

4. Bug fixing i polish
   - Naprawa znalezionych problemów
   - Udoskonalenie komunikatów błędów
   - Dopracowanie animacji i transitions

**Kryteria akceptacji:**

- [ ] Aplikacja działa płynnie na wszystkich urządzeniach
- [ ] Spełnia wymogi WCAG 2.1 AA
- [ ] Query time < 500ms dla typowych przypadków
- [ ] Brak critical/high severity bugs

**Szacowany czas:** 3-4 dni

---

### Harmonogram (łącznie: ~3 tygodnie)

| Etap | Czas | Tydzień |
|------|------|---------|
| 1. Backend infrastructure | 3-4 dni | Tydzień 1 |
| 2. Konfiguracja parametrów | 2 dni | Tydzień 1 |
| 3. Komponent ParameterInput | 5-6 dni | Tydzień 2 |
| 4. Integracja z dialogiem | 4-5 dni | Tydzień 2-3 |
| 5. Testowanie i optymalizacja | 3-4 dni | Tydzień 3 |

**Łącznie:** 17-21 dni roboczych (1 developer full-time)

---

## Nierozwiązane tematy

### 1. Strategia rollback w przypadku problemów

**Problem:** Jeśli po wdrożeniu pojawią się krytyczne błędy, jak przywrócić poprzednią wersję bez utraty danych?

**Do rozważenia:**

- Czy stworzyć feature flag do przełączania między starym a nowym UI?
- Czy przygotować migrację odwrotną konwertującą zakresy z powrotem na pojedyncze wartości?
- Jak komunikować użytkownikom tymczasowe wyłączenie funkcji?

**Rekomendacja:**

- Wdrożenie feature flaga `ENABLE_RANGE_PARAMETERS` w environment variables
- Warunkowe renderowanie UI na podstawie flagi
- Przygotowanie migracji odwrotnej na wypadek konieczności rollbacku

---

### 2. Monitoring i analytics po wdrożeniu

**Problem:** Jak mierzyć sukces wdrożenia i zbierać feedback użytkowników?

**Metryki do śledzenia:**

- Procent użytkowników korzystających z zakresów vs pojedynczych wartości
- Czas wypełniania formularza (przed vs po)
- Liczba błędów walidacji
- Bounce rate na stronie edycji sportu
- Liczba matchów per user (czy zakresy poprawiają matching?)

**Do rozważenia:**

- Integracja z Mixpanel/GA4 dla śledzenia eventów
- A/B testing: 50% użytkowników nowy UI, 50% stary UI
- Feedback widget w dialogu "Czy nowy interfejs jest lepszy?"

**Rekomendacja:**

- Dodanie event tracking do kluczowych akcji (edycja parametru, submit formularza)
- Monitoring query performance w Supabase Dashboard
- Survey po 2 tygodniach od wdrożenia

---

### 3. Optymalizacja algorytmu matchowania dla dużej skali

**Problem:** Funkcja `parameters_match()` może być wąskim gardłem przy dużej liczbie użytkowników.

**Obecne podejście:** O(n²) - porównanie każdego użytkownika z każdym w zakresie lokalizacji.

**Potencjalne problemy:**

- 1000 użytkowników = ~500k porównań parametrów
- JSONB operations w PostgreSQL mogą być kosztowne
- Brak możliwości indeksowania dynamicznych struktur JSONB

**Możliwe optymalizacje (long-term):**

1. **Materialized views**
   - Pre-compute matches co X minut
   - Trade-off: świeżość danych vs performance

2. **Separate search index (Elasticsearch/Typesense)**
   - Dedykowany search engine dla matchowania
   - Szybkie range queries
   - Trade-off: złożoność infrastruktury

3. **Partitioning użytkowników po lokalizacji**
   - Podział tabeli na regiony geograficzne
   - Zmniejszenie zbioru porównań
   - Trade-off: złożoność query

**Do rozważenia:**

- Przy jakiej liczbie użytkowników obecne rozwiązanie przestanie wystarczać?
- Czy dodać monitoring query performance z alertami?
- Czy przygotować plan skalowania z wyprzedzeniem?

**Rekomendacja:**

- MVP: obecne rozwiązanie wystarczy do 5k użytkowników
- Monitoring query time z alertem > 1s
- Plan skalowania gdy active users > 2k

---

### 4. Edukacja użytkowników o nowych funkcjach

**Problem:** Jak poinformować istniejących użytkowników o możliwości używania zakresów?

**Użytkownicy mogą:**

- Nie zauważyć nowych funkcji
- Nie rozumieć różnicy między single value a range
- Kontynuować używanie tylko inputów bez sliderów

**Możliwe podejścia:**

1. **In-app notifications**
   - Toast przy pierwszym logowaniu po wdrożeniu
   - "Nowość! Teraz możesz określić zakresy parametrów"

2. **Onboarding overlay**
   - Guided tour po nowym interfejsie
   - Highlight sliderów z tooltipami

3. **Help hints w dialogu**
   - Ikonka "?" przy każdym parametrze
   - Tooltip z wyjaśnieniem "Ustaw zakres dla większej elastyczności"

4. **Changelog**
   - Dedykowana strona z opisem zmian
   - Link w navbar "Co nowego?"

**Do rozważenia:**

- Czy wszyscy użytkownicy powinni zobaczyć komunikat?
- Jak często pokazywać pomoc (tylko raz vs za każdym razem)?
- Czy dodać opcję "Nie pokazuj ponownie"?

**Rekomendacja:**

- Toast notification przy pierwszym wejściu w dialog edycji po wdrożeniu
- Persistent help hints przy każdym parametrze (opcjonalnie rozwijane)
- Wpis w dokumentacji/FAQ

---

### 5. Lokalizacja i internacjonalizacja

**Problem:** Aplikacja używa polskich etykiet i komunikatów. Czy przygotować się na wielojęzyczność?

**Obecny stan:**

- Hardcoded polskie teksty w komponentach
- Nazwy parametrów po polsku w konfiguracji
- Komunikaty błędów po polsku

**Jeśli planowana jest internacjonalizacja:**

- Wszystkie teksty muszą przejść przez i18n library (np. `react-i18next`)
- Nazwy parametrów w bazie danych muszą być kluczami, nie wartościami wyświetlanymi
- Komunikaty błędów z backendu też muszą być translatable

**Do rozważenia:**

- Czy MVP zakłada tylko polski rynek?
- Kiedy planowana jest ekspansja międzynarodowa?
- Czy warto już teraz przygotować infrastrukturę i18n?

**Rekomendacja:**

- MVP: zostaw hardcoded polski
- Przygotuj strukturę kodu z myślą o przyszłej internacjonalizacji
  - Wydziel wszystkie teksty do osobnych constów
  - Użyj kluczy zamiast wartości w krytycznych miejscach
- Plan i18n jako osobny projekt po MVP

---

### 6. Wsparcie dla parametrów warunkowych (dependent parameters)

**Problem:** Niektóre parametry mogą być zależne od innych (np. w triathlonie: dystans pływania, dystans roweru, dystans biegu).

**Przykłady zależności:**

1. **Triatlon:** Wybór dystansu (sprint/olympic/ironman) automatycznie ustawia 3 parametry
2. **Wspinaczka:** Typ wspinaczki (indoor/outdoor) zmienia dostępne parametry
3. **Nurkowanie:** Certyfikat nurkowania ogranicza maksymalną głębokość

**Obecna architektura:**

- Wszystkie parametry są niezależne
- Brak mechanizmu warunkowego wyświetlania
- Brak możliwości grupowania parametrów

**Potencjalne rozszerzenia:**

```typescript
export interface ParameterConfig {
  // ... istniejące pola
  dependsOn?: {
    parameterName: string;
    condition: (value: any) => boolean;
  };
  autoSetBy?: {
    parameterName: string;
    transform: (value: any) => any;
  };
}
```

**Do rozważenia:**

- Czy taka funkcjonalność jest potrzebna w MVP?
- Jak skomplikowany staje się UI przy warunkowych parametrach?
- Czy backend jest przygotowany na dynamiczną strukturę parametrów?

**Rekomendacja:**

- MVP: pomiń warunkowe parametry (too complex)
- Dodaj do backlogu jako potential future enhancement
- Najpierw zbierz feedback czy użytkownicy tego potrzebują

---

### 7. Migracja bulk (masowa) dla wszystkich użytkowników

**Problem:** Czy zmigrować wszystkie istniejące dane od razu, czy przy pierwszej edycji przez użytkownika?

**Opcja A: Migracja przy pierwszej edycji (wybrana)**

- ✅ Prosta implementacja
- ✅ Nie dotyka danych nieaktywnych użytkowników
- ❌ Użytkownicy mogą matchować się inaczej przed i po edycji
- ❌ Inconsistency w bazie danych (mix starych i nowych formatów)

**Opcja B: Bulk migration dla wszystkich**

- ✅ Natychmiastowa spójność danych
- ✅ Jednolity format dla algorytmu matchowania
- ❌ Ryzyko przy migracji (co jeśli coś pójdzie nie tak?)
- ❌ Trudność w rollbacku
- ❌ Potencjalnie długi downtime

**Do rozważenia:**

- Jaki procent użytkowników ma obecnie wypełnione parametry?
- Czy różnica w matchingu przed/po migracji będzie zauważalna?
- Jak często użytkownicy edytują parametry (czy szybko zmigru ją się naturalnie)?

**Rekomendacja:**

- MVP: migracja przy pierwszej edycji (mniej ryzykowne)
- Monitoring: track % users on old vs new format
- Jeśli po 3 miesiącach >30% nadal na starym formacie, rozważ bulk migration

---

### 8. Fallback dla przeglądarek bez wsparcia dla nowoczesnychh API

**Problem:** Czy aplikacja musi działać na starych przeglądarkach (IE11, stare Safari)?

**Używane technologie:**

- CSS Grid/Flexbox - OK od 2017+
- Range input type - OK od 2018+
- JSONB w PostgreSQL - server-side, nie ma znaczenia
- React 19 - wymaga nowoczesnych przeglądarek

**Statystyki przeglądarek:**

- Chrome/Edge (Chromium): ~70% rynku
- Safari: ~15%
- Firefox: ~5%
- Inne: ~10%

**Do rozważenia:**

- Jaka jest target audience aplikacji (wiek, tech-savviness)?
- Czy warto wspierać IE11/stare przeglądarki?
- Czy dodać browser detection i komunikat "Zaktualizuj przeglądarkę"?

**Rekomendacja:**

- MVP: wspieraj tylko nowoczesne przeglądarki (last 2 versions)
- Dodaj komunikat dla wykrytych starych przeglądarek
- Monitoring: track browser usage w Analytics

---

## Podsumowanie

Plan modyfikacji komponentu `SportEditorDialog` zakłada kompleksową refaktoryzację UI/UX wprowadzania parametrów sportowych, z naciskiem na elastyczność (zakresy wartości), wygodę użytkowania (slidery + inputy) i responsywność (mobile-first).

**Kluczowe założenia:**

1. Backward compatibility - stare dane nadal działają
2. Automatyczna migracja przy pierwszej edycji
3. Uniwersalny komponent `ParameterInput` obsługujący 3 tryby
4. Rozbudowana walidacja i real-time feedback
5. Accessibility i mobile UX jako priorytet

**Szacowany effort:** 3-4 tygodnie (1 developer full-time)

**Expected outcomes:**

- Lepszy UX wprowadzania parametrów
- Zwiększona elastyczność matchowania (zakresy)
- Wyższy % wypełnionych profili sportowych
- Lepsza responsywność na mobile

**Risk factors:**

- Złożoność migracji danych
- Performance algorytmu matchowania przy skali
- Edukacja użytkowników o nowych funkcjach
- Testing coverage dla wszystkich edge cases

**Next steps:**

1. Review i akceptacja planu przez team
2. Estymacja szczegółowa dla każdego etapu
3. Przygotowanie środowiska testowego
4. Rozpoczęcie implementacji od Etapu 1 (Backend)
