import { z } from "zod";

/**
 * Zod schema for validating profile update requests.
 * All fields are optional as this is used for PATCH operations.
 */
export const UpdateProfileDtoSchema = z
  .object({
    display_name: z
      .string()
      .min(3, "Display name must be at least 3 characters long")
      .max(50, "Display name cannot exceed 50 characters")
      .optional(),

    location: z
      .object({
        type: z.literal("Point"),
        coordinates: z.tuple([
          z.number().min(-180).max(180), // longitude
          z.number().min(-90).max(90), // latitude
        ]),
      })
      .optional(),

    default_range_km: z
      .number()
      .int("Range must be a whole number")
      .min(1, "Range must be at least 1 km")
      .max(100, "Range cannot exceed 100 km")
      .optional(),

    social_links: z
      .record(
        z.string(), // key: social platform name
        z.string().url("Invalid URL format for social link")
      )
      .optional(),
  })
  .strict(); // Prevent additional properties

/**
 * Type representing the validated profile update data.
 * This is what we get after successful validation.
 */
export type ValidatedUpdateProfileDto = z.infer<typeof UpdateProfileDtoSchema>;

/**
 * Function to validate profile update requests.
 * Returns the validated data or throws a ZodError.
 */
export function validateProfileUpdate(data: unknown): ValidatedUpdateProfileDto {
  return UpdateProfileDtoSchema.parse(data);
}
