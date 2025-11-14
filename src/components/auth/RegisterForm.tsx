/**
 * Komponent formularza rejestracji
 *
 * Odpowiada za:
 * - Walidację danych rejestracji (username, email, hasło, potwierdzenie hasła)
 * - Obsługę submisji formularza (placeholder dla przyszłej integracji z Supabase)
 * - Wyświetlanie błędów walidacji i błędów z API
 * - Informowanie użytkownika o konieczności weryfikacji emaila
 * - Link do logowania
 *
 * @example
 * ```tsx
 * <RegisterForm />
 * ```
 */

import { type FC, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseClient } from "@/db/supabase.client";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Nazwa użytkownika musi mieć co najmniej 3 znaki")
      .max(30, "Nazwa użytkownika nie może przekraczać 30 znaków")
      .regex(/^[a-zA-Z0-9_-]+$/, "Nazwa użytkownika może zawierać tylko litery, cyfry, myślniki i podkreślenia"),
    email: z.string().min(1, "Podaj adres email").email("Nieprawidłowy format adresu email"),
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
      .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
      .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę"),
    confirmPassword: z.string().min(1, "Potwierdź hasło"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm: FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const { error } = await supabaseClient.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username.toLowerCase(),
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("User already registered")) {
          throw new Error("Użytkownik o podanym adresie email już istnieje");
        }
        throw new Error(error.message);
      }

      setIsSuccess(true);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Wystąpił błąd podczas rejestracji");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sprawdź swoją skrzynkę email</CardTitle>
            <CardDescription>Wysłaliśmy link weryfikacyjny na podany adres email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-primary/10 p-4 text-sm">
              <p className="mb-2">
                Aby dokończyć rejestrację, kliknij w link weryfikacyjny, który wysłaliśmy na Twój adres email.
              </p>
              <p className="text-muted-foreground">Jeśli nie widzisz wiadomości, sprawdź folder ze spamem.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/login")}>
              Przejdź do logowania
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Utwórz konto</CardTitle>
          <CardDescription>Wypełnij poniższy formularz, aby dołączyć do FITLink</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {apiError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" role="alert">
                {apiError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Nazwa użytkownika</Label>
              <Input
                id="username"
                type="text"
                placeholder="jan_kowalski"
                autoComplete="username"
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? "username-error" : undefined}
                {...register("username")}
              />
              {errors.username && (
                <p id="username-error" className="text-sm text-destructive" role="alert">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jan@example.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : "password-requirements"}
                {...register("password")}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
              {!errors.password && (
                <p id="password-requirements" className="text-xs text-muted-foreground">
                  Minimum 8 znaków, jedna wielka litera, jedna mała litera i jedna cyfra
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potwierdzenie hasła</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p id="confirm-password-error" className="text-sm text-destructive" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Rejestrowanie..." : "Zarejestruj się"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Masz już konto?{" "}
              <a href="/login" className="font-medium text-foreground hover:underline">
                Zaloguj się
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
