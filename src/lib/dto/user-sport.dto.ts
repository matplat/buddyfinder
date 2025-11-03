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
  parameters: SportParametersBase.refine((val) => Object.keys(val).length > 0, {
    message: "Parameters cannot be an empty object",
  }),
  custom_range_km: z.number().int().min(1).max(100).nullable().optional(),
});

export type AddUserSportCommand = z.infer<typeof AddUserSportCommand>;
