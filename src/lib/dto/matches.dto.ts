import { z } from "zod";

/**
 * Schema for validating query parameters in matches endpoint
 */
export const matchesQuerySchema = z.object({
  limit: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      if (!val) return 20;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 20 : parsed;
    })
    .pipe(z.number().min(1, "Limit must be a positive number").max(100, "Maximum limit is 100 items per page")),
  offset: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      if (!val) return 0;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 0 : parsed;
    })
    .pipe(z.number().min(0, "Offset cannot be negative")),
});

/**
 * Validates the query parameters for the matches endpoint
 * @throws {ZodError} If validation fails
 */
export function validateMatchesQuery(query: URLSearchParams): z.infer<typeof matchesQuerySchema> {
  return matchesQuerySchema.parse({
    limit: query.get("limit"),
    offset: query.get("offset"),
  });
}
