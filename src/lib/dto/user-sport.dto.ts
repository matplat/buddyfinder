import { z } from "zod";

/**
 * Schema for generic sport parameters.
 * Each sport type can have different parameters,
 * but they must conform to this base schema.
 */
const SportParametersBase = z
  .object({})
  .catchall(z.union([z.number(), z.string(), z.boolean(), z.array(z.string()), z.array(z.number())]));

/**
 * Schema for sport parameters with non-empty validation.
 */
const SportParameters = SportParametersBase.refine((val) => Object.keys(val).length > 0, {
  message: "Parameters cannot be an empty object",
});

/**
 * Schema for custom range validation.
 * Must be a positive integer between 1 and 100 kilometers.
 */
const CustomRange = z.number().int().min(1).max(100).nullable().optional();

/**
 * Schema for validating request body when adding a sport to user's profile.
 *
 * Validates:
 * - sport_id: Must be a positive integer
 * - parameters: Must be an object with at least one property, each property must be
 *              either a number, string, boolean, or array of strings/numbers
 * - custom_range_km: Optional, if provided must be integer between 1-100
 */
export const AddUserSportCommand = z.object({
  sport_id: z.number().int().positive(),
  parameters: SportParameters,
  custom_range_km: CustomRange,
});

/**
 * Schema for validating sport update requests.
 * At least one field must be present.
 */
export const UpdateUserSportCommand = z
  .object({
    parameters: SportParameters.optional(),
    custom_range_km: CustomRange,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Request body cannot be empty",
  });

/**
 * Schema for validating URL parameters in sport operations.
 * Validates that sport_id is a positive integer.
 */
export const SportIdParam = z.object({
  sport_id: z.string().transform((val, ctx) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sport ID must be a valid positive number",
      });
      return z.NEVER;
    }
    return parsed;
  }),
});

export type AddUserSportCommand = z.infer<typeof AddUserSportCommand>;
export type UpdateUserSportCommand = z.infer<typeof UpdateUserSportCommand>;
export type SportIdParam = z.infer<typeof SportIdParam>;
