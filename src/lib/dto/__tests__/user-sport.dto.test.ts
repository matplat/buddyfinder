/**
 * Unit tests for user-sport.dto.ts
 * Tests Zod schema validation with extensive edge cases
 */

import { describe, it, expect } from "vitest";
import { AddUserSportCommand, UpdateUserSportCommand, SportIdParam } from "@/lib/dto/user-sport.dto";

describe("user-sport.dto", () => {
  describe("AddUserSportCommand", () => {
    describe("valid inputs", () => {
      it("should validate correct add command with all fields", () => {
        const validCommand = {
          sport_id: 1,
          parameters: { dystans: 10, tempo: 330 },
          custom_range_km: 15,
        };

        const result = AddUserSportCommand.safeParse(validCommand);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validCommand);
        }
      });

      it("should validate command without custom_range_km", () => {
        const validCommand = {
          sport_id: 1,
          parameters: { dystans: 10 },
          custom_range_km: null,
        };

        const result = AddUserSportCommand.safeParse(validCommand);
        expect(result.success).toBe(true);
      });

      it("should validate command with various parameter types", () => {
        const validCommand = {
          sport_id: 2,
          parameters: {
            dystans: 50,
            prędkość: 30,
            level: "advanced",
            completed: true,
          },
          custom_range_km: null,
        };

        const result = AddUserSportCommand.safeParse(validCommand);
        expect(result.success).toBe(true);
      });

      it("should validate command with array parameters", () => {
        const validCommand = {
          sport_id: 3,
          parameters: {
            tags: ["outdoor", "endurance"],
            distances: [5, 10, 15],
          },
          custom_range_km: null,
        };

        const result = AddUserSportCommand.safeParse(validCommand);
        expect(result.success).toBe(true);
      });

      it("should validate custom_range_km at boundaries", () => {
        const commandMin = {
          sport_id: 1,
          parameters: { dystans: 10 },
          custom_range_km: 1,
        };
        const commandMax = {
          sport_id: 1,
          parameters: { dystans: 10 },
          custom_range_km: 100,
        };

        expect(AddUserSportCommand.safeParse(commandMin).success).toBe(true);
        expect(AddUserSportCommand.safeParse(commandMax).success).toBe(true);
      });
    });

    describe("invalid inputs - sport_id", () => {
      it("should reject missing sport_id", () => {
        const invalidCommand = {
          parameters: { dystans: 10 },
          custom_range_km: null,
        };

        const result = AddUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });

      it("should reject negative sport_id", () => {
        const invalidCommand = {
          sport_id: -1,
          parameters: { dystans: 10 },
          custom_range_km: null,
        };

        const result = AddUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });

      it("should reject zero sport_id", () => {
        const invalidCommand = {
          sport_id: 0,
          parameters: { dystans: 10 },
          custom_range_km: null,
        };

        const result = AddUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });

      it("should reject float sport_id", () => {
        const invalidCommand = {
          sport_id: 1.5,
          parameters: { dystans: 10 },
          custom_range_km: null,
        };

        const result = AddUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });

      it("should reject string sport_id", () => {
        const invalidCommand = {
          sport_id: "1",
          parameters: { dystans: 10 },
          custom_range_km: null,
        };

        const result = AddUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });
    });

    describe("invalid inputs - parameters", () => {
      it("should reject missing parameters", () => {
        const invalidCommand = {
          sport_id: 1,
          custom_range_km: null,
        };

        const result = AddUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });

      it("should reject empty parameters object", () => {
        const invalidCommand = {
          sport_id: 1,
          parameters: {},
          custom_range_km: null,
        };

        const result = AddUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });

      it("should reject null parameters", () => {
        const invalidCommand = {
          sport_id: 1,
          parameters: null,
          custom_range_km: null,
        };

        const result = AddUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });

      it("should reject parameters with nested objects", () => {
        const invalidCommand = {
          sport_id: 1,
          parameters: {
            dystans: 10,
            nested: { value: 20 },
          },
          custom_range_km: null,
        };

        const result = AddUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });
    });

    describe("invalid inputs - custom_range_km", () => {
      it("should reject custom_range_km below minimum", () => {
        const invalidCommand = {
          sport_id: 1,
          parameters: { dystans: 10 },
          custom_range_km: 0,
        };

        const result = AddUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });

      it("should reject custom_range_km above maximum", () => {
        const invalidCommand = {
          sport_id: 1,
          parameters: { dystans: 10 },
          custom_range_km: 101,
        };

        const result = AddUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });

      it("should reject float custom_range_km", () => {
        const invalidCommand = {
          sport_id: 1,
          parameters: { dystans: 10 },
          custom_range_km: 15.5,
        };

        const result = AddUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });

      it("should reject string custom_range_km", () => {
        const invalidCommand = {
          sport_id: 1,
          parameters: { dystans: 10 },
          custom_range_km: "15",
        };

        const result = AddUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("UpdateUserSportCommand", () => {
    describe("valid inputs", () => {
      it("should validate update with only parameters", () => {
        const validCommand = {
          parameters: { dystans: 15, tempo: 300 },
        };

        const result = UpdateUserSportCommand.safeParse(validCommand);
        expect(result.success).toBe(true);
      });

      it("should validate update with only custom_range_km", () => {
        const validCommand = {
          custom_range_km: 20,
        };

        const result = UpdateUserSportCommand.safeParse(validCommand);
        expect(result.success).toBe(true);
      });

      it("should validate update with both fields", () => {
        const validCommand = {
          parameters: { dystans: 15 },
          custom_range_km: 20,
        };

        const result = UpdateUserSportCommand.safeParse(validCommand);
        expect(result.success).toBe(true);
      });

      it("should validate setting custom_range_km to null", () => {
        const validCommand = {
          custom_range_km: null,
        };

        const result = UpdateUserSportCommand.safeParse(validCommand);
        expect(result.success).toBe(true);
      });

      it("should validate parameters at boundaries", () => {
        const commandMin = {
          custom_range_km: 1,
        };
        const commandMax = {
          custom_range_km: 100,
        };

        expect(UpdateUserSportCommand.safeParse(commandMin).success).toBe(true);
        expect(UpdateUserSportCommand.safeParse(commandMax).success).toBe(true);
      });
    });

    describe("invalid inputs", () => {
      it("should reject empty object", () => {
        const invalidCommand = {};

        const result = UpdateUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });

      it("should reject empty parameters object", () => {
        const invalidCommand = {
          parameters: {},
        };

        const result = UpdateUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });

      it("should reject null parameters", () => {
        const invalidCommand = {
          parameters: null,
        };

        const result = UpdateUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });

      it("should reject invalid custom_range_km values", () => {
        const testCases = [
          { custom_range_km: 0 },
          { custom_range_km: -5 },
          { custom_range_km: 101 },
          { custom_range_km: 15.5 },
          { custom_range_km: "20" },
        ];

        testCases.forEach((invalidCommand) => {
          const result = UpdateUserSportCommand.safeParse(invalidCommand);
          expect(result.success).toBe(false);
        });
      });

      it("should reject parameters with nested objects", () => {
        const invalidCommand = {
          parameters: {
            dystans: 10,
            nested: { value: 20 },
          },
        };

        const result = UpdateUserSportCommand.safeParse(invalidCommand);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("SportIdParam", () => {
    describe("valid inputs", () => {
      it("should parse and transform valid numeric string", () => {
        const validParam = { sport_id: "1" };

        const result = SportIdParam.safeParse(validParam);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sport_id).toBe(1);
          expect(typeof result.data.sport_id).toBe("number");
        }
      });

      it("should parse large sport IDs", () => {
        const validParam = { sport_id: "999" };

        const result = SportIdParam.safeParse(validParam);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sport_id).toBe(999);
        }
      });

      it("should parse sport ID with leading zeros", () => {
        const validParam = { sport_id: "001" };

        const result = SportIdParam.safeParse(validParam);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sport_id).toBe(1);
        }
      });
    });

    describe("invalid inputs", () => {
      it("should reject missing sport_id", () => {
        const invalidParam = {};

        const result = SportIdParam.safeParse(invalidParam);
        expect(result.success).toBe(false);
      });

      it("should reject zero sport_id", () => {
        const invalidParam = { sport_id: "0" };

        const result = SportIdParam.safeParse(invalidParam);
        expect(result.success).toBe(false);
      });

      it("should reject negative sport_id", () => {
        const invalidParam = { sport_id: "-1" };

        const result = SportIdParam.safeParse(invalidParam);
        expect(result.success).toBe(false);
      });

      it("should parse float sport_id as integer (JavaScript behavior)", () => {
        const param = { sport_id: "1.5" };

        const result = SportIdParam.safeParse(param);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sport_id).toBe(1); // parseInt truncates decimal part
        }
      });

      it("should reject non-numeric strings", () => {
        const testCases = [
          { sport_id: "abc" },
          { sport_id: "one" },
          { sport_id: "" },
          { sport_id: " " },
          { sport_id: "null" },
          { sport_id: "undefined" },
        ];

        testCases.forEach((invalidParam) => {
          const result = SportIdParam.safeParse(invalidParam);
          expect(result.success).toBe(false);
        });
      });

      it("should reject numeric type instead of string", () => {
        const invalidParam = { sport_id: 1 };

        const result = SportIdParam.safeParse(invalidParam);
        expect(result.success).toBe(false);
      });

      it("should reject null sport_id", () => {
        const invalidParam = { sport_id: null };

        const result = SportIdParam.safeParse(invalidParam);
        expect(result.success).toBe(false);
      });
    });
  });
});
