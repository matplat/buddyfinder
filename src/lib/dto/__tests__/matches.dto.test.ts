/**
 * Unit tests for matches.dto.ts
 * Tests query parameter validation with extensive edge cases
 */

import { describe, it, expect } from "vitest";
import { matchesQuerySchema, validateMatchesQuery } from "@/lib/dto/matches.dto";

describe("matches.dto", () => {
  describe("matchesQuerySchema", () => {
    describe("valid inputs - limit", () => {
      it("should use default limit when not provided", () => {
        const result = matchesQuerySchema.safeParse({});

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(20);
        }
      });

      it("should parse valid limit values", () => {
        const testCases = [
          { limit: "1", expected: 1 },
          { limit: "10", expected: 10 },
          { limit: "50", expected: 50 },
          { limit: "100", expected: 100 },
        ];

        testCases.forEach(({ limit, expected }) => {
          const result = matchesQuerySchema.safeParse({ limit });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.limit).toBe(expected);
          }
        });
      });

      it("should accept limit at boundaries", () => {
        const resultMin = matchesQuerySchema.safeParse({ limit: "1" });
        const resultMax = matchesQuerySchema.safeParse({ limit: "100" });

        expect(resultMin.success).toBe(true);
        expect(resultMax.success).toBe(true);
        if (resultMin.success && resultMax.success) {
          expect(resultMin.data.limit).toBe(1);
          expect(resultMax.data.limit).toBe(100);
        }
      });
    });

    describe("invalid inputs - limit", () => {
      it("should reject limit of 0", () => {
        const result = matchesQuerySchema.safeParse({ limit: "0" });
        expect(result.success).toBe(false);
      });

      it("should reject negative limit", () => {
        const result = matchesQuerySchema.safeParse({ limit: "-5" });
        expect(result.success).toBe(false);
      });

      it("should reject limit above maximum", () => {
        const result = matchesQuerySchema.safeParse({ limit: "101" });
        expect(result.success).toBe(false);
      });

      it("should reject limit far above maximum", () => {
        const result = matchesQuerySchema.safeParse({ limit: "1000" });
        expect(result.success).toBe(false);
      });

      it("should use default limit for non-numeric strings (JavaScript parseInt behavior)", () => {
        const testCases = ["abc", "ten", "", " ", "null", "undefined"];

        testCases.forEach((limit) => {
          const result = matchesQuerySchema.safeParse({ limit });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.limit).toBe(20); // Falls back to default when parseInt returns NaN
          }
        });
      });

      it("should truncate decimal values in limit (JavaScript parseInt behavior)", () => {
        const result = matchesQuerySchema.safeParse({ limit: "10.5" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(10); // parseInt truncates decimal part
        }
      });
    });

    describe("valid inputs - offset", () => {
      it("should use default offset when not provided", () => {
        const result = matchesQuerySchema.safeParse({});

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.offset).toBe(0);
        }
      });

      it("should parse valid offset values", () => {
        const testCases = [
          { offset: "0", expected: 0 },
          { offset: "10", expected: 10 },
          { offset: "100", expected: 100 },
          { offset: "999", expected: 999 },
        ];

        testCases.forEach(({ offset, expected }) => {
          const result = matchesQuerySchema.safeParse({ offset });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.offset).toBe(expected);
          }
        });
      });

      it("should accept large offset values", () => {
        const result = matchesQuerySchema.safeParse({ offset: "10000" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.offset).toBe(10000);
        }
      });
    });

    describe("invalid inputs - offset", () => {
      it("should reject negative offset", () => {
        const testCases = ["-1", "-5", "-100"];

        testCases.forEach((offset) => {
          const result = matchesQuerySchema.safeParse({ offset });
          expect(result.success).toBe(false);
        });
      });

      it("should use default offset for non-numeric strings (JavaScript parseInt behavior)", () => {
        const testCases = ["abc", "zero", "", " ", "null", "undefined"];

        testCases.forEach((offset) => {
          const result = matchesQuerySchema.safeParse({ offset });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.offset).toBe(0); // Falls back to default when parseInt returns NaN
          }
        });
      });

      it("should truncate decimal values in offset (JavaScript parseInt behavior)", () => {
        const result = matchesQuerySchema.safeParse({ offset: "10.5" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.offset).toBe(10); // parseInt truncates decimal part
        }
      });
    });

    describe("combined limit and offset", () => {
      it("should parse both limit and offset correctly", () => {
        const result = matchesQuerySchema.safeParse({
          limit: "50",
          offset: "100",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(50);
          expect(result.data.offset).toBe(100);
        }
      });

      it("should use defaults when both are missing", () => {
        const result = matchesQuerySchema.safeParse({});

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(20);
          expect(result.data.offset).toBe(0);
        }
      });

      it("should mix provided and default values", () => {
        const resultLimit = matchesQuerySchema.safeParse({ limit: "30" });
        const resultOffset = matchesQuerySchema.safeParse({ offset: "50" });

        expect(resultLimit.success).toBe(true);
        expect(resultOffset.success).toBe(true);

        if (resultLimit.success) {
          expect(resultLimit.data.limit).toBe(30);
          expect(resultLimit.data.offset).toBe(0); // default
        }

        if (resultOffset.success) {
          expect(resultOffset.data.limit).toBe(20); // default
          expect(resultOffset.data.offset).toBe(50);
        }
      });
    });

    describe("type transformation", () => {
      it("should transform string limit to number", () => {
        const result = matchesQuerySchema.safeParse({ limit: "25" });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(typeof result.data.limit).toBe("number");
          expect(result.data.limit).toBe(25);
        }
      });

      it("should transform string offset to number", () => {
        const result = matchesQuerySchema.safeParse({ offset: "75" });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(typeof result.data.offset).toBe("number");
          expect(result.data.offset).toBe(75);
        }
      });

      it("should handle string numbers with leading zeros", () => {
        const result = matchesQuerySchema.safeParse({
          limit: "010",
          offset: "005",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(10);
          expect(result.data.offset).toBe(5);
        }
      });
    });
  });

  describe("validateMatchesQuery", () => {
    describe("URLSearchParams integration", () => {
      it("should validate empty URLSearchParams", () => {
        const params = new URLSearchParams();
        const result = validateMatchesQuery(params);

        expect(result.limit).toBe(20);
        expect(result.offset).toBe(0);
      });

      it("should validate URLSearchParams with limit", () => {
        const params = new URLSearchParams("limit=30");
        const result = validateMatchesQuery(params);

        expect(result.limit).toBe(30);
        expect(result.offset).toBe(0);
      });

      it("should validate URLSearchParams with offset", () => {
        const params = new URLSearchParams("offset=40");
        const result = validateMatchesQuery(params);

        expect(result.limit).toBe(20);
        expect(result.offset).toBe(40);
      });

      it("should validate URLSearchParams with both parameters", () => {
        const params = new URLSearchParams("limit=25&offset=50");
        const result = validateMatchesQuery(params);

        expect(result.limit).toBe(25);
        expect(result.offset).toBe(50);
      });

      it("should use default limit for non-numeric strings in URLSearchParams", () => {
        const params = new URLSearchParams("limit=abc");
        const result = validateMatchesQuery(params);

        expect(result.limit).toBe(20); // Falls back to default
      });

      it("should throw ZodError for invalid offset in URLSearchParams", () => {
        const params = new URLSearchParams("offset=-5");

        expect(() => validateMatchesQuery(params)).toThrow();
      });

      it("should throw ZodError for limit above maximum", () => {
        const params = new URLSearchParams("limit=150");

        expect(() => validateMatchesQuery(params)).toThrow();
      });

      it("should ignore extra query parameters", () => {
        const params = new URLSearchParams("limit=30&offset=10&extra=value&foo=bar");
        const result = validateMatchesQuery(params);

        expect(result.limit).toBe(30);
        expect(result.offset).toBe(10);
        expect(result).not.toHaveProperty("extra");
        expect(result).not.toHaveProperty("foo");
      });
    });

    describe("edge cases", () => {
      it("should handle duplicate parameters (URLSearchParams.get uses first value)", () => {
        const params = new URLSearchParams("limit=10&limit=20");
        const result = validateMatchesQuery(params);

        expect(result.limit).toBe(10); // URLSearchParams.get() returns first value
      });

      it("should handle empty string values", () => {
        const params = new URLSearchParams("limit=&offset=");
        const result = validateMatchesQuery(params);

        // Empty strings should use defaults
        expect(result.limit).toBe(20);
        expect(result.offset).toBe(0);
      });

      it("should handle whitespace in values (JavaScript parseInt auto-trims)", () => {
        const params = new URLSearchParams("limit= 30 &offset= 40 ");
        const result = validateMatchesQuery(params);

        // parseInt automatically trims whitespace
        expect(result.limit).toBe(30);
        expect(result.offset).toBe(40);
      });
    });

    describe("realistic pagination scenarios", () => {
      it("should validate first page request", () => {
        const params = new URLSearchParams("limit=20&offset=0");
        const result = validateMatchesQuery(params);

        expect(result.limit).toBe(20);
        expect(result.offset).toBe(0);
      });

      it("should validate second page request", () => {
        const params = new URLSearchParams("limit=20&offset=20");
        const result = validateMatchesQuery(params);

        expect(result.limit).toBe(20);
        expect(result.offset).toBe(20);
      });

      it("should validate custom page size", () => {
        const params = new URLSearchParams("limit=50&offset=0");
        const result = validateMatchesQuery(params);

        expect(result.limit).toBe(50);
        expect(result.offset).toBe(0);
      });

      it("should validate last page request", () => {
        const params = new URLSearchParams("limit=20&offset=980");
        const result = validateMatchesQuery(params);

        expect(result.limit).toBe(20);
        expect(result.offset).toBe(980);
      });
    });
  });
});
