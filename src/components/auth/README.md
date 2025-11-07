# Komponenty Autoryzacji

Ten folder zawiera komponenty React odpowiedzialne za obsługę procesów autoryzacji użytkowników (logowanie, rejestracja, odzyskiwanie hasła).

## Struktura

- `LoginForm.tsx` - Formularz logowania
- `RegisterForm.tsx` - Formularz rejestracji  
- `ForgotPasswordForm.tsx` - Formularz odzyskiwania hasła

## Wykorzystywane technologie

- **react-hook-form** - zarządzanie stanem formularzy
- **zod** - walidacja schematów danych
- **shadcn/ui** - komponenty UI (Card, Button, Input, Label)

## Status implementacji

✅ **Gotowe:**
- UI komponentów formularzy
- Walidacja po stronie klienta
- Obsługa błędów walidacji
- Responsywny design
- Accessibility (ARIA attributes)

⏳ **Do implementacji w przyszłości:**
- Integracja z Supabase Auth API
- Obsługa sesji użytkownika
- Przekierowania po pomyślnej autoryzacji
- Callback endpoint dla weryfikacji emaila

## Użycie

Komponenty są renderowane na dedykowanych stronach Astro:
- `/login` → `LoginForm`
- `/register` → `RegisterForm`
- `/forgot-password` → `ForgotPasswordForm`

```tsx
// Przykład użycia w stronie Astro
import { LoginForm } from "../components/auth/LoginForm";

<Layout title="Logowanie">
  <LoginForm client:load />
</Layout>
```
