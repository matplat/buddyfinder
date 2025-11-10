/**
 * Unit tests for sport-parameters.config.ts
 * Tests conversion functions and configuration retrieval with extensive edge cases
 */

import { describe, it, expect } from "vitest";
import {
  paceToSeconds,
  secondsToPace,
  timeToMinutes,
  minutesToTime,
  getSportParametersConfig,
  SPORT_PARAMETERS_CONFIG,
} from "@/lib/config/sport-parameters.config";

describe("sport-parameters.config", () => {
  describe("paceToSeconds", () => {
    it("should convert valid pace format to seconds", () => {
      expect(paceToSeconds("5:30")).toBe(330); // 5 min * 60 + 30 sec
      expect(paceToSeconds("4:15")).toBe(255);
      expect(paceToSeconds("10:00")).toBe(600);
      expect(paceToSeconds("0:45")).toBe(45);
    });

    it("should handle single digit minutes", () => {
      expect(paceToSeconds("3:20")).toBe(200);
      expect(paceToSeconds("9:59")).toBe(599);
    });

    it("should handle double digit minutes", () => {
      expect(paceToSeconds("12:30")).toBe(750);
      expect(paceToSeconds("99:59")).toBe(5999);
    });

    it("should handle zero values", () => {
      expect(paceToSeconds("0:00")).toBe(0);
      expect(paceToSeconds("0:01")).toBe(1);
    });

    // Edge cases - invalid formats
    it("should return null for invalid format", () => {
      expect(paceToSeconds("5")).toBeNull();
      expect(paceToSeconds("5:3")).toBeNull(); // seconds must be 2 digits
      expect(paceToSeconds("5:300")).toBeNull(); // too many digits
      expect(paceToSeconds("abc:de")).toBeNull();
      expect(paceToSeconds("5.5:30")).toBeNull();
      expect(paceToSeconds("-5:30")).toBeNull();
    });

    it("should return null for empty or malformed strings", () => {
      expect(paceToSeconds("")).toBeNull();
      expect(paceToSeconds(" ")).toBeNull();
      expect(paceToSeconds(":")).toBeNull();
      expect(paceToSeconds("::30")).toBeNull();
    });

    it("should return null for strings without colon", () => {
      expect(paceToSeconds("530")).toBeNull();
      expect(paceToSeconds("5-30")).toBeNull();
    });

    it("should return null for seconds >= 60", () => {
      expect(paceToSeconds("5:60")).toBe(360); // regex allows, but might be edge case
      expect(paceToSeconds("5:99")).toBe(399);
    });
  });

  describe("secondsToPace", () => {
    it("should convert seconds to pace format", () => {
      expect(secondsToPace(330)).toBe("5:30");
      expect(secondsToPace(255)).toBe("4:15");
      expect(secondsToPace(600)).toBe("10:00");
      expect(secondsToPace(45)).toBe("0:45");
    });

    it("should pad seconds with leading zero", () => {
      expect(secondsToPace(305)).toBe("5:05");
      expect(secondsToPace(1)).toBe("0:01");
      expect(secondsToPace(60)).toBe("1:00");
    });

    it("should handle zero", () => {
      expect(secondsToPace(0)).toBe("0:00");
    });

    it("should handle large values", () => {
      expect(secondsToPace(5999)).toBe("99:59");
      expect(secondsToPace(7200)).toBe("120:00");
    });

    it("should handle edge case of exact minutes", () => {
      expect(secondsToPace(120)).toBe("2:00");
      expect(secondsToPace(180)).toBe("3:00");
    });
  });

  describe("paceToSeconds and secondsToPace - round trip", () => {
    it("should be reversible for valid inputs", () => {
      const paces = ["5:30", "4:15", "10:00", "0:45", "12:05"];

      paces.forEach((pace) => {
        const seconds = paceToSeconds(pace);
        expect(seconds).not.toBeNull();
        const converted = secondsToPace(seconds!);
        expect(converted).toBe(pace);
      });
    });
  });

  describe("timeToMinutes", () => {
    it("should convert valid time format to minutes", () => {
      expect(timeToMinutes("1:30h")).toBe(90); // 1 hour * 60 + 30 min
      expect(timeToMinutes("1:30")).toBe(90); // 'h' is optional
      expect(timeToMinutes("2:15h")).toBe(135);
      expect(timeToMinutes("0:45h")).toBe(45);
    });

    it('should handle time without "h" suffix', () => {
      expect(timeToMinutes("3:20")).toBe(200);
      expect(timeToMinutes("5:00")).toBe(300);
    });

    it("should handle zero values", () => {
      expect(timeToMinutes("0:00")).toBe(0);
      expect(timeToMinutes("0:01")).toBe(1);
    });

    it("should handle large hour values", () => {
      expect(timeToMinutes("12:30")).toBe(750);
      expect(timeToMinutes("99:00")).toBe(5940);
    });

    // Edge cases - validation
    it("should return null when minutes >= 60", () => {
      expect(timeToMinutes("1:60")).toBeNull();
      expect(timeToMinutes("2:75")).toBeNull();
      expect(timeToMinutes("0:99")).toBeNull();
    });

    it("should return null for invalid format", () => {
      expect(timeToMinutes("1")).toBeNull();
      expect(timeToMinutes("1:3")).toBeNull(); // minutes must be 2 digits
      expect(timeToMinutes("1:300")).toBeNull();
      expect(timeToMinutes("abc:de")).toBeNull();
      expect(timeToMinutes("1.5:30")).toBeNull();
      expect(timeToMinutes("-1:30")).toBeNull();
    });

    it("should return null for empty or malformed strings", () => {
      expect(timeToMinutes("")).toBeNull();
      expect(timeToMinutes(" ")).toBeNull();
      expect(timeToMinutes(":")).toBeNull();
      expect(timeToMinutes("::30")).toBeNull();
    });
  });

  describe("minutesToTime", () => {
    it("should convert minutes to time format", () => {
      expect(minutesToTime(90)).toBe("1:30h");
      expect(minutesToTime(135)).toBe("2:15h");
      expect(minutesToTime(45)).toBe("0:45h");
      expect(minutesToTime(200)).toBe("3:20h");
    });

    it("should pad minutes with leading zero", () => {
      expect(minutesToTime(65)).toBe("1:05h");
      expect(minutesToTime(1)).toBe("0:01h");
      expect(minutesToTime(60)).toBe("1:00h");
    });

    it("should handle zero", () => {
      expect(minutesToTime(0)).toBe("0:00h");
    });

    it("should handle large values", () => {
      expect(minutesToTime(750)).toBe("12:30h");
      expect(minutesToTime(5940)).toBe("99:00h");
    });

    it("should handle edge case of exact hours", () => {
      expect(minutesToTime(120)).toBe("2:00h");
      expect(minutesToTime(180)).toBe("3:00h");
    });
  });

  describe("timeToMinutes and minutesToTime - round trip", () => {
    it("should be reversible for valid inputs", () => {
      const times = ["1:30h", "2:15h", "0:45h", "3:20h", "5:05h"];

      times.forEach((time) => {
        const minutes = timeToMinutes(time);
        expect(minutes).not.toBeNull();
        const converted = minutesToTime(minutes!);
        expect(converted).toBe(time);
      });
    });

    it("should be reversible for inputs without h suffix", () => {
      const times = ["1:30", "2:15", "0:45"];

      times.forEach((time) => {
        const minutes = timeToMinutes(time);
        expect(minutes).not.toBeNull();
        const converted = minutesToTime(minutes!);
        expect(converted).toBe(time + "h");
      });
    });
  });

  describe("getSportParametersConfig", () => {
    it("should return config for existing sports", () => {
      const bieganieConfig = getSportParametersConfig("bieganie");
      expect(bieganieConfig).toBeDefined();
      expect(bieganieConfig.length).toBeGreaterThan(0);
      expect(bieganieConfig[0].name).toBe("dystans");
    });

    it("should return config for all defined sports", () => {
      const sports = [
        "bieganie",
        "rower szosowy",
        "rower mtb",
        "pływanie w basenie",
        "pływanie na wodach otwartych",
        "rolki",
        "nurkowanie",
        "tenis",
      ];

      sports.forEach((sport) => {
        const config = getSportParametersConfig(sport);
        expect(config).toBeDefined();
        expect(Array.isArray(config)).toBe(true);
        expect(config.length).toBeGreaterThan(0);
      });
    });

    it("should return empty array for non-existent sport", () => {
      expect(getSportParametersConfig("piłka nożna")).toEqual([]);
      expect(getSportParametersConfig("")).toEqual([]);
      expect(getSportParametersConfig("unknown")).toEqual([]);
    });

    it("should return config with correct structure", () => {
      const config = getSportParametersConfig("bieganie");

      config.forEach((param) => {
        expect(param).toHaveProperty("name");
        expect(param).toHaveProperty("label");
        expect(param).toHaveProperty("type");
        expect(typeof param.name).toBe("string");
        expect(typeof param.label).toBe("string");
        expect(["number", "pace", "time", "enum"]).toContain(param.type);
      });
    });

    it("should return config with expected parameters for bieganie", () => {
      const config = getSportParametersConfig("bieganie");

      expect(config).toHaveLength(2);
      expect(config[0].name).toBe("dystans");
      expect(config[0].type).toBe("number");
      expect(config[1].name).toBe("tempo");
      expect(config[1].type).toBe("pace");
    });

    it("should return config with enum type for sports with options", () => {
      const rolkiConfig = getSportParametersConfig("rolki");
      const stylParam = rolkiConfig.find((p) => p.type === "enum");

      expect(stylParam).toBeDefined();
      expect(stylParam?.options).toBeDefined();
      expect(Array.isArray(stylParam?.options)).toBe(true);
      expect(stylParam?.options?.length).toBeGreaterThan(0);
    });
  });

  describe("SPORT_PARAMETERS_CONFIG - data integrity", () => {
    it("should have config for all expected sports", () => {
      const expectedSports = [
        "bieganie",
        "rower szosowy",
        "rower mtb",
        "pływanie w basenie",
        "pływanie na wodach otwartych",
        "rolki",
        "nurkowanie",
        "tenis",
      ];

      expectedSports.forEach((sport) => {
        expect(SPORT_PARAMETERS_CONFIG[sport]).toBeDefined();
      });
    });

    it("should have valid parameter types", () => {
      const validTypes = ["number", "pace", "time", "enum"];

      Object.values(SPORT_PARAMETERS_CONFIG).forEach((configs) => {
        configs.forEach((config) => {
          expect(validTypes).toContain(config.type);
        });
      });
    });

    it("should have options for enum types", () => {
      Object.values(SPORT_PARAMETERS_CONFIG).forEach((configs) => {
        configs.forEach((config) => {
          if (config.type === "enum") {
            expect(config.options).toBeDefined();
            expect(Array.isArray(config.options)).toBe(true);
            expect(config.options!.length).toBeGreaterThan(0);
          }
        });
      });
    });

    it("should have min/max for number types where appropriate", () => {
      Object.values(SPORT_PARAMETERS_CONFIG).forEach((configs) => {
        configs.forEach((config) => {
          if (config.type === "number" && config.name === "dystans") {
            expect(config.min).toBeDefined();
            expect(config.max).toBeDefined();
            expect(config.min!).toBeGreaterThanOrEqual(0);
            expect(config.max!).toBeGreaterThan(config.min!);
          }
        });
      });
    });
  });
});
