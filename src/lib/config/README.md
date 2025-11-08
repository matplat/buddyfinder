# Configuration Files

Ten folder zawiera centralne pliki konfiguracyjne używane w całej aplikacji.

## Pliki konfiguracyjne

### `social-platforms.config.ts`
Konfiguracja platform mediów społecznościowych (Instagram, Facebook, Strava, Garmin).

**Zawiera:**
- `PLATFORM_CONFIG` - obiekt z definicjami platform (nazwa, ikona, baseUrl)
- `PlatformConfig` - typ definiujący strukturę konfiguracji platformy
- `getPlatformConfig(platform: string)` - funkcja pomocnicza do pobierania konfiguracji

**Używane przez:**
- `SocialLinkBadge.tsx` - wyświetlanie linków z możliwością edycji
- `UserMatchCard.tsx` - wyświetlanie linków w widoku dopasowań
- Inne komponenty wymagające informacji o platformach społecznościowych

### `sport-parameters.config.ts`
Konfiguracja parametrów sportowych definiujących pola formularzy dla każdego sportu.

**Zawiera:**
- `SPORT_PARAMETERS_CONFIG` - obiekt z konfiguracją parametrów dla każdego sportu
- `ParameterConfig` - typ definiujący strukturę parametru (typ, label, walidacja, itp.)
- `ParameterType` - typy parametrów: `'number'`, `'pace'`, `'time'`, `'enum'`
- Funkcje pomocnicze konwersji:
  - `paceToSeconds()` / `secondsToPace()` - konwersja tempo (mm:ss)
  - `timeToMinutes()` / `minutesToTime()` - konwersja czasu (h:mm)
- `getSportParametersConfig(sportName: string)` - funkcja do pobierania konfiguracji

**Używane przez:**
- `SportEditorDialog.tsx` - formularz dodawania/edycji sportu
- `SportBadge.tsx` - wyświetlanie parametrów sportu
- Inne komponenty operujące na parametrach sportowych

## Zasady użycia

### Importowanie konfiguracji

```typescript
// Pojedyncza konfiguracja
import { getPlatformConfig } from "@/lib/config/social-platforms.config";
import { getSportParametersConfig } from "@/lib/config/sport-parameters.config";

// Wszystkie konfiguracje (barrel export)
import { PLATFORM_CONFIG, SPORT_PARAMETERS_CONFIG } from "@/lib/config";
```

### Dodawanie nowej platformy społecznościowej

1. Dodaj definicję do `PLATFORM_CONFIG` w `social-platforms.config.ts`
2. Zaimportuj odpowiednią ikonę z `lucide-react`
3. Wszystkie komponenty automatycznie zobaczą nową platformę

### Dodawanie nowego sportu

1. Dodaj konfigurację parametrów do `SPORT_PARAMETERS_CONFIG` w `sport-parameters.config.ts`
2. Zdefiniuj typy parametrów (number, pace, time, enum)
3. Dodaj odpowiednie walidacje (min, max, opcje)

## Konwencje nazewnictwa

- Pliki konfiguracyjne: `*.config.ts`
- Stałe konfiguracyjne: `UPPER_SNAKE_CASE`
- Funkcje pomocnicze: `camelCase`
- Typy: `PascalCase`
