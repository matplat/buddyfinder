/**
 * Komponent formularza logowania
 *
 * Odpowiada za:
 * - Walidację danych logowania (email/username i hasło)
 * - Obsługę submisji formularza (placeholder dla przyszłej integracji z API)
 * - Wyświetlanie błędów walidacji i błędów z API
 * - Linki do rejestracji i odzyskiwania hasła
 *
 * @example
 * ```tsx
 * <LoginForm />
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

const loginSchema = z.object({
  login: z.string().min(1, "Podaj email lub nazwę użytkownika"),
  password: z.string().min(1, "Podaj hasło"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Nieprawidłowe dane logowania");
      }

      // Redirect do strony głównej po udanym logowaniu
      window.location.href = "/";
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Wystąpił błąd podczas logowania");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Zaloguj się</CardTitle>
          <CardDescription>Wprowadź swój email lub nazwę użytkownika i hasło</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {apiError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" role="alert">
                {apiError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login">Email lub nazwa użytkownika</Label>
              <Input
                id="login"
                type="text"
                placeholder="jan.kowalski lub jan@example.com"
                autoComplete="username"
                aria-invalid={!!errors.login}
                aria-describedby={errors.login ? "login-error" : undefined}
                data-testid="login-form--login-input"
                {...register("login")}
              />
              {errors.login && (
                <p id="login-error" className="text-sm text-destructive" role="alert">
                  {errors.login.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Hasło</Label>
                <a
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  Zapomniałeś hasła?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                data-testid="login-form--password-input"
                {...register("password")}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="login-button">
              {isSubmitting ? "Logowanie..." : "Zaloguj się"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Nie masz konta?{" "}
              <a href="/register" className="font-medium text-foreground hover:underline">
                Zarejestruj się
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
