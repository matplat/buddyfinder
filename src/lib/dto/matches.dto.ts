import { z } from "zod";

/**
 * Schema for validating query parameters in matches endpoint
 */
export const matchesQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1, "Limit must be a positive number").max(100, "Maximum limit is 100 items per page")),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
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
