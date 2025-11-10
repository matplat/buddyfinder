/**
 * Komponent formularza odzyskiwania hasła
 *
 * Odpowiada za:
 * - Walidację adresu email
 * - Obsługę wysyłki linku resetującego hasło (placeholder dla przyszłej integracji z Supabase)
 * - Wyświetlanie błędów walidacji i błędów z API
 * - Informowanie użytkownika o wysłaniu linku
 * - Link powrotny do logowania
 *
 * @example
 * ```tsx
 * <ForgotPasswordForm />
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

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Podaj adres email").email("Nieprawidłowy format adresu email"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordForm: FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      });

      if (error) {
        throw new Error(error.message);
      }

      setIsSuccess(true);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Wystąpił błąd podczas wysyłania linku resetującego");
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
            <CardDescription>Instrukcje resetowania hasła zostały wysłane</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-primary/10 p-4 text-sm">
              <p className="mb-2">
                Jeśli konto o podanym adresie email istnieje w naszym systemie, otrzymasz wiadomość z linkiem do
                resetowania hasła.
              </p>
              <p className="text-muted-foreground">Jeśli nie widzisz wiadomości, sprawdź folder ze spamem.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/login")}>
              Powrót do logowania
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
          <CardTitle className="text-2xl font-bold">Zresetuj hasło</CardTitle>
          <CardDescription>Wprowadź swój adres email, a wyślemy Ci link do resetowania hasła</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {apiError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" role="alert">
                {apiError}
              </div>
            )}

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
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Pamiętasz hasło?{" "}
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
