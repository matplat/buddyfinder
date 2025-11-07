import { z } from 'zod';

/**
 * Schema walidacji dla logowania
 * Akceptuje email lub username
 */
export const loginSchema = z.object({
  login: z.string()
    .min(1, 'Podaj email lub nazwę użytkownika')
    .trim(),
  password: z.string()
    .min(1, 'Podaj hasło'),
});

export type LoginCommand = z.infer<typeof loginSchema>;

/**
 * Schema walidacji dla rejestracji
 */
export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Nazwa użytkownika musi mieć co najmniej 3 znaki')
    .max(30, 'Nazwa użytkownika może mieć maksymalnie 30 znaków')
    .regex(/^[a-z0-9_]+$/, 'Nazwa użytkownika może zawierać tylko małe litery, cyfry i podkreślenia')
    .trim()
    .toLowerCase(),
  email: z.string()
    .min(1, 'Podaj adres email')
    .email('Podaj prawidłowy adres email')
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .regex(/[A-Z]/, 'Hasło musi zawierać co najmniej jedną wielką literę')
    .regex(/[a-z]/, 'Hasło musi zawierać co najmniej jedną małą literę')
    .regex(/[0-9]/, 'Hasło musi zawierać co najmniej jedną cyfrę'),
});

export type RegisterCommand = z.infer<typeof registerSchema>;

/**
 * Schema walidacji dla reset hasła
 */
export const resetPasswordSchema = z.object({
  email: z.string()
    .min(1, 'Podaj adres email')
    .email('Podaj prawidłowy adres email')
    .trim()
    .toLowerCase(),
});

export type ResetPasswordCommand = z.infer<typeof resetPasswordSchema>;

/**
 * Helper do walidacji login schema
 */
export function validateLogin(data: unknown): LoginCommand {
  return loginSchema.parse(data);
}

/**
 * Helper do walidacji register schema
 */
export function validateRegister(data: unknown): RegisterCommand {
  return registerSchema.parse(data);
}

/**
 * Helper do walidacji reset password schema
 */
export function validateResetPassword(data: unknown): ResetPasswordCommand {
  return resetPasswordSchema.parse(data);
}
