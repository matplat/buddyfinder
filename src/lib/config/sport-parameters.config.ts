/**
 * Konfiguracja parametrów sportowych.
 * Definiuje pola formularza dla każdego sportu.
 */

export type ParameterType = "number" | "pace" | "time" | "enum";

export interface ParameterConfig {
  name: string;
  label: string;
  type: ParameterType;
  unit?: string;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
}

export type SportParametersConfig = Record<string, ParameterConfig[]>;

/**
 * Konwertuje tempo w formacie "mm:ss" na sekundy
 */
export const paceToSeconds = (pace: string): number | null => {
  const match = pace.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const [, minutes, seconds] = match;
  return parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
};

/**
 * Konwertuje sekundy na tempo w formacie "mm:ss"
 */
export const secondsToPace = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Konwertuje czas w formacie "X:Yh" na minuty (X - godziny, Y - minuty)
 */
export const timeToMinutes = (time: string): number | null => {
  const match = time.match(/^(\d{1,2}):(\d{2})h?$/);
  if (!match) return null;
  const [, hours, minutes] = match;
  const hoursNum = parseInt(hours, 10);
  const minutesNum = parseInt(minutes, 10);

  if (minutesNum >= 60) return null; // Minuty muszą być w zakresie 0-59
  return hoursNum * 60 + minutesNum;
};

/**
 * Konwertuje minuty na format "X:Yh" (X - godziny, Y - minuty)
 */
export const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}h`;
};

export const SPORT_PARAMETERS_CONFIG: SportParametersConfig = {
  bieganie: [
    {
      name: "dystans",
      label: "Dystans",
      type: "number",
      unit: "km",
      placeholder: "10",
      min: 1,
      max: 200,
    },
    {
      name: "tempo",
      label: "Tempo",
      type: "pace",
      unit: "min/km",
      placeholder: "5:30",
    },
  ],
  "rower szosowy": [
    {
      name: "dystans",
      label: "Dystans",
      type: "number",
      unit: "km",
      placeholder: "50",
      min: 1,
      max: 200,
    },
    {
      name: "prędkość",
      label: "Prędkość",
      type: "number",
      unit: "km/h",
      placeholder: "30",
      min: 10,
      max: 60,
    },
  ],
  "rower mtb": [
    {
      name: "dystans",
      label: "Dystans",
      type: "number",
      unit: "km",
      placeholder: "25",
      min: 1,
      max: 200,
    },
    {
      name: "czas",
      label: "Czas",
      type: "time",
      unit: "",
      placeholder: "1:30h",
    },
    {
      name: "przewyższenie",
      label: "Przewyższenie",
      type: "number",
      unit: "m",
      placeholder: "800",
      min: 0,
      max: 5000,
    },
  ],
  "pływanie w basenie": [
    {
      name: "dystans",
      label: "Dystans",
      type: "number",
      unit: "m",
      placeholder: "1500",
      min: 100,
      max: 10000,
    },
    {
      name: "tempo",
      label: "Tempo",
      type: "pace",
      unit: "min/100m",
      placeholder: "2:00",
    },
  ],
  "pływanie na wodach otwartych": [
    {
      name: "dystans",
      label: "Dystans",
      type: "number",
      unit: "m",
      placeholder: "2000",
      min: 100,
      max: 20000,
    },
    {
      name: "tempo",
      label: "Tempo",
      type: "pace",
      unit: "min/100m",
      placeholder: "2:00",
    },
  ],
  rolki: [
    {
      name: "dystans",
      label: "Dystans",
      type: "number",
      unit: "km",
      placeholder: "15",
      min: 1,
      max: 100,
    },
    {
      name: "styl",
      label: "Styl",
      type: "enum",
      placeholder: "Wybierz styl",
      options: ["rekreacyjny", "szybki", "freestyle"],
    },
  ],
  nurkowanie: [
    {
      name: "głębokość",
      label: "Głębokość",
      type: "number",
      unit: "m",
      placeholder: "30",
      min: 5,
      max: 100,
    },
  ],
  tenis: [
    {
      name: "poziom",
      label: "Poziom NTRP",
      type: "enum",
      placeholder: "Wybierz poziom",
      options: ["1.0", "1.5", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "5.5", "6.0+"],
    },
  ],
};

/**
 * Pobiera konfigurację parametrów dla danego sportu
 */
export const getSportParametersConfig = (sportName: string): ParameterConfig[] => {
  return SPORT_PARAMETERS_CONFIG[sportName] || [];
};
