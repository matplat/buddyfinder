# Plan implementacji mechanizmu cache'owania z TanStack Query

## 1. Cel i kontekst

### Problem do rozwiązania

Obecnie aplikacja BuddyFinder wykonuje zbędne zapytania do API przy każdym rozwinięciu panelu profilu (`ProfilePanel`), mimo że dane nie mogły się zmienić bez działania użytkownika. To powoduje:

- Niepotrzebne obciążenie bazy danych i API
- Gorsze doświadczenie użytkownika (opóźnienia, migotanie UI)
- Nieefektywne wykorzystanie zasobów sieciowych

### Rozwiązanie

Implementacja **TanStack Query v5** jako warstwy cache'ującej i zarządzającej stanem serwera w aplikacji React. TanStack Query zapewni:

- Automatyczne cache'owanie odpowiedzi z API
- Inteligentne odświeżanie danych w tle
- Deduplication zapytań (wiele komponentów = jedno zapytanie)
- Optymistyczne aktualizacje UI
- Automatyczną invalidację cache'u po mutacjach
- Lepsze zarządzanie stanami ładowania i błędów

## 2. Strategia cache'owania

### 2.1. Dane profilu użytkownika (`/api/profiles/me`)

**Charakterystyka:** Dane zmieniają się tylko przez akcje użytkownika w UI aplikacji.

**Konfiguracja cache:**

```typescript
{
  staleTime: Infinity,           // Dane nie starzeją się - zmieniamy je tylko przez UI
  gcTime: Infinity,              // Zachowaj w cache przez cały czas trwania sesji
  refetchOnMount: false,         // Nie pobieraj przy montowaniu komponentu
  refetchOnWindowFocus: false,   // Nie pobieraj gdy użytkownik wraca do zakładki
  refetchOnReconnect: true       // Odśwież po reconnect (failed mutations, sync)
}
```

**Uzasadnienie:** Dane profilu pobieramy raz przy ładowaniu strony głównej i korzystamy z cache'u aż do przeładowania okna przeglądarki. Wszystkie zmiany są inicjowane przez użytkownika i natychmiast aktualizują cache. Po reconnect odświeżamy dane dla bezpieczeństwa - mogły być nieudane mutacje podczas offline lub zmiany na serwerze.

### 2.2. Lista wszystkich sportów (`/api/sports`)

**Charakterystyka:** Statyczna, predefiniowana lista. Nie zmienia się podczas życia aplikacji.

**Konfiguracja cache:**

```typescript
{
  staleTime: Infinity,           // Dane statyczne, nigdy się nie starzeją
  gcTime: Infinity,              // Zachowaj przez cały czas trwania sesji
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false      // Nie trzeba - dane statyczne, nie zmieniają się
}
```

**Uzasadnienie:** Dane referencyjne pobierane raz przy ładowaniu sesji i cache'owane na zawsze. Nie potrzebują refetch po reconnect bo są statyczne.

### 2.3. Sporty użytkownika (`/api/profiles/me/sports`)

**Charakterystyka:** Zmienia się przez akcje użytkownika (dodaj/edytuj/usuń sport).

**Konfiguracja cache:**

```typescript
{
  staleTime: Infinity,           // Zmieniamy tylko przez UI
  gcTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true       // Odśwież po reconnect (jak profil)
}
```

**Uzasadnienie:** Analogicznie do profilu - zmiany tylko przez UI użytkownika. Po reconnect odświeżamy dla bezpieczeństwa (failed mutations).

### 2.4. Lista dopasowań (`/api/matches`)

**Charakterystyka:** Zależna od profilu użytkownika i profili innych użytkowników. Może się zmieniać w czasie.

**Konfiguracja cache:**

```typescript
{
  staleTime: 2 * 60 * 1000,      // 2 minuty - dane mogą się zmienić (nowi użytkownicy)
  gcTime: 30 * 60 * 1000,        // 30 minut
  refetchOnMount: false,
  refetchOnWindowFocus: true,     // Odśwież gdy użytkownik wraca do zakładki
  refetchOnReconnect: true        // Odśwież po reconnect
}
```

**Uzasadnienie:** Inne profile mogą się zmieniać, więc stosujemy umiarkowany `staleTime`. Automatyczne odświeżanie przy powrocie do zakładki zapewnia świeże wyniki. Cache jest invalidowany automatycznie po zmianach wpływających na matching (lokalizacja, zasięg, sporty).

## 3. Strategia mutacji

### 3.1. Optymistyczne aktualizacje

**Zastosowanie:** Dane, które NIE wpływają na mechanizm matchowania.

**Przykłady:**

- Zmiana `display_name`
- Edycja linków do social media
- Przyszłe: zmiana zdjęcia profilowego

**Implementacja:**

```typescript
useMutation({
  mutationFn: updateDisplayName,
  onMutate: async (newName) => {
    // Anuluj outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["profile", "me"] });

    // Zapisz poprzedni stan (rollback)
    const previousProfile = queryClient.getQueryData(["profile", "me"]);

    // Optymistycznie zaktualizuj cache
    queryClient.setQueryData(["profile", "me"], (old) => ({
      ...old,
      display_name: newName,
    }));

    return { previousProfile };
  },
  onError: (err, newName, context) => {
    // Rollback w przypadku błędu
    queryClient.setQueryData(["profile", "me"], context.previousProfile);
  },
  onSettled: () => {
    // Zawsze refetch po zakończeniu (success lub error)
    queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
  },
});
```

### 3.2. Pesymistyczne aktualizacje

**Zastosowanie:** Dane wpływające na mechanizm matchowania.

**Przykłady:**

- Dodawanie/usuwanie/edycja sportów użytkownika
- Zmiana lokalizacji (`location`)
- Zmiana zasięgu (`default_range_km`)

**Implementacja:**

```typescript
useMutation({
  mutationFn: addUserSport,
  onSuccess: (data) => {
    // Zaktualizuj cache po otrzymaniu odpowiedzi z serwera
    queryClient.setQueryData(["profile", "me", "sports"], (old) => [...old, data]);

    // WAŻNE: Invaliduj cache dopasowań (wpływa na matching)
    queryClient.invalidateQueries({ queryKey: ["matches"] });

    toast.success("Sport został dodany");
  },
  onError: (error) => {
    toast.error("Nie udało się dodać sportu");
  },
});
```

## 4. Invalidacja cache'u

### 4.1. Automatyczna invalidacja

Cache dopasowań (`/api/matches`) jest automatycznie invalidowany po mutacjach wpływających na matching:

```typescript
// Po dodaniu/edycji/usunięciu sportu
queryClient.invalidateQueries({ queryKey: ["matches"] });

// Po zmianie lokalizacji lub zasięgu
queryClient.invalidateQueries({ queryKey: ["matches"] });
```

### 4.2. Ręczne odświeżanie

Użytkownik może ręcznie odświeżić dopasowania:

- Pull-to-refresh na mobile (jeśli zostanie zaimplementowany w przyszłości)
- Przycisk "Odśwież" w interfejsie
- Automatyczne odświeżenie przy powrocie do zakładki (`refetchOnWindowFocus: true`)

## 5. Zarządzanie stanami ładowania

### 5.1. Initial load (pierwsze załadowanie)

**UI:** Pełny skeleton loader

```typescript
const { data, isLoading } = useQuery(...)

if (isLoading) {
  return <ProfileViewSkeleton />
}
```

### 5.2. Background refetch (odświeżanie w tle)

**UI:** Subtelny indicator dla matches, brak dla profilu

```typescript
const { data, isFetching, isLoading } = useQuery(...)

// isLoading = true tylko przy pierwszym załadowaniu
// isFetching = true przy każdym fetch (również background)

{isFetching && !isLoading && <Badge>Aktualizacja...</Badge>}
```

### 5.3. Mutation loading (zapisywanie zmian)

**UI:** Toast notification + disabled buttons

```typescript
const { mutate, isPending } = useMutation(...)

<Button onClick={() => mutate(data)} disabled={isPending}>
  {isPending ? 'Zapisywanie...' : 'Zapisz'}
</Button>

// W onMutate/onSuccess:
toast.loading('Zapisywanie...', { id: 'save-profile' })
toast.success('Zapisano', { id: 'save-profile' })
```

### 5.4. Matches - wywołanie przez użytkownika vs automatyczne

```typescript
const { data, isLoading, isRefetching } = useQuery(...)

// Przez użytkownika (np. kliknięcie zakładki):
if (isLoading) {
  return <MatchesSkeleton />
}

// Automatyczne (np. po zmianie sportu):
if (isRefetching && !isLoading) {
  toast.info('Aktualizowanie dopasowań...', { id: 'refresh-matches' })
}
```

## 6. Error handling i retry logic

### 6.1. Zapytania GET

```typescript
{
  retry: 2,                                                    // 2 próby ponowienia
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)  // Exponential backoff
}
```

### 6.2. Mutacje (POST, PUT, PATCH, DELETE)

```typescript
{
  retry: 0,  // Nie ponawiaj automatycznie - pokaż błąd użytkownikowi
}
```

### 6.3. Pokazywanie stale danych podczas błędu

```typescript
const { data, error, isError } = useQuery(...)

// Jeśli background refetch się nie udał, nadal pokazuj stare dane z cache
if (data) {
  return <ProfileView data={data} />
}

// Błąd tylko gdy nie ma żadnych danych
if (isError) {
  return <ErrorState error={error} />
}
```

## 7. Persistence cache'u

**Decyzja:** Cache NIE jest persystowany między sesjami (brak localStorage/sessionStorage).

**Uzasadnienie:**

- Dane profilu zawierają wrażliwe informacje (email, lokalizacja)
- Dane dopasowań szybko stają się nieaktualne
- Cache w pamięci RAM podczas jednej sesji jest wystarczający
- Po ponownym zalogowaniu użytkownik pobiera świeże dane

## 8. Strategie refetch po reconnect

### 8.1. Dlaczego refetchOnReconnect jestważny?

Gdy użytkownik traci połączenie z internetem i następnie je odzyskuje, mogą wystąpić problemy synchronizacji:

**Scenariusz problemu:**

1. Użytkownik ma profil z 3 sportami w cache
2. Traci połączenie (offline)
3. Próbuje dodać 4. sport - **mutacja failuje** (może niezauważone przez użytkownika)
4. Połączenie wraca (online)
5. Bez `refetchOnReconnect` - użytkownik nadal widzi tylko 3 sporty (stare dane)
6. Cache jest niezsynchronizowany z rzeczywistym stanem serwera

**Rozwiązanie:** `refetchOnReconnect: true` dla danych, które mogą się zmieniać przez mutacje.

### 8.2. Zasady dla różnych typów danych

**Dane użytkownika (profil, user sports):** `refetchOnReconnect: true`

- Mogły być nieudane mutacje podczas offline
- Zapewnia synchronizację po przywróceniu połączenia
- Koszt: 1 dodatkowy request przy reconnect (rzadkie zdarzenie)

**Dane statyczne (lista sportów):** `refetchOnReconnect: false`

- Dane nie zmieniają się, więc refetch jest zbędny
- Oszczędność niepotrzebnych requestów

**Dane dynamiczne (matches):** `refetchOnReconnect: true` (już domyślnie)

- Inne profile mogły się zmienić podczas downtime
- Nowi użytkownicy mogli dołączyć

## 9. Deduplication zapytań

TanStack Query automatycznie deduplikuje zapytania z tym samym `queryKey`.

**Przykład:** `ProfilePanel`, `MapView` i inne komponenty mogą jednocześnie potrzebować danych profilu:

```typescript
// W ProfileView:
const { data: profile } = useQuery({ queryKey: ["profile", "me"], queryFn: fetchProfile });

// W MapView:
const { data: profile } = useQuery({ queryKey: ["profile", "me"], queryFn: fetchProfile });

// TanStack Query wykona tylko JEDEN request, wyniki będą współdzielone
```

## 10. Plan migracji (inkrementalny)

Migracja wykonywana krok po kroku w ramach jednego PR. **Kluczowe:** Po każdym kroku aplikacja musi działać poprawnie.

### Krok 1: Setup TanStack Query (Foundation)

**Cel:** Zainstalować bibliotekę i skonfigurować QueryClient na poziomie aplikacji.

**Zadania:**

1. Instalacja dependencies:

   ```bash
   npm install @tanstack/react-query
   npm install -D @tanstack/react-query-devtools
   ```

2. Utworzenie konfiguracji QueryClient w `src/lib/query-client.ts`:

   ```typescript
   import { QueryClient } from "@tanstack/react-query";

   export const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         retry: 2,
         retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
         refetchOnWindowFocus: false,
         refetchOnReconnect: true,  // Default true - odśwież po reconnect dla bezpieczeństwa
         staleTime: Infinity,
       },
       mutations: {
         retry: 0,
       },
     },
   });
   ```

3. Utworzenie wrapper komponentu z QueryClientProvider w `src/components/QueryProvider.tsx`:

   ```typescript
   import { QueryClientProvider } from '@tanstack/react-query'
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
   import { queryClient } from '@/lib/query-client'

   export function QueryProvider({ children }: { children: React.ReactNode }) {
     return (
       <QueryClientProvider client={queryClient}>
         {children}
         <ReactQueryDevtools initialIsOpen={false} />
       </QueryClientProvider>
     )
   }
   ```

4. Owinięcie MainView w QueryProvider w `src/pages/index.astro`:

   ```astro
   <body class="overflow-hidden">
     <QueryProvider client:only="react">
       <MainView client:only="react" />
     </QueryProvider>
   </body>
   ```

**Weryfikacja:**

- Aplikacja uruchamia się bez błędów
- React Query Devtools są dostępne (domyślnie w dolnym rogu ekranu)
- Nie ma błędów w konsoli przeglądarki

---

### Krok 2: Utworzenie API query functions i mutation functions

**Cel:** Wydzielić logikę komunikacji z API do reużywalnych funkcji.

**Zadania:**

1. Utworzenie struktury katalogów:

   ```text
   src/lib/api/
   ├── queries/
   │   ├── profile.queries.ts
   │   ├── sports.queries.ts
   │   ├── user-sports.queries.ts
   │   └── matches.queries.ts
   ├── mutations/
   │   ├── profile.mutations.ts
   │   └── user-sports.mutations.ts
   └── keys.ts  # Query keys centralized
   ```

2. Utworzenie `src/lib/api/keys.ts` (centralizacja query keys):

   ```typescript
   export const queryKeys = {
     profile: {
       me: ["profile", "me"] as const,
     },
     sports: {
       all: ["sports"] as const,
     },
     userSports: {
       all: ["profile", "me", "sports"] as const,
     },
     matches: {
       list: (offset: number, limit: number) => ["matches", { offset, limit }] as const,
     },
   } as const;
   ```

3. Utworzenie `src/lib/api/queries/profile.queries.ts`:

   ```typescript
   import type { ProfileDto } from "@/types";
   import { queryKeys } from "../keys";

   export async function fetchProfile(): Promise<ProfileDto> {
     const response = await fetch("/api/profiles/me");
     if (!response.ok) {
       throw new Error("Failed to fetch profile");
     }
     return response.json();
   }

   export const profileQueries = {
     me: () => ({
       queryKey: queryKeys.profile.me,
       queryFn: fetchProfile,
       staleTime: Infinity,
       gcTime: Infinity,
     }),
   };
   ```

4. Utworzenie `src/lib/api/queries/sports.queries.ts`:

   ```typescript
   import type { SportDto } from "@/types";
   import { queryKeys } from "../keys";

   export async function fetchAllSports(): Promise<SportDto[]> {
     const response = await fetch("/api/sports");
     if (!response.ok) {
       throw new Error("Failed to fetch sports");
     }
     return response.json();
   }

   export const sportsQueries = {
     all: () => ({
       queryKey: queryKeys.sports.all,
       queryFn: fetchAllSports,
       staleTime: Infinity,
       gcTime: Infinity,
       refetchOnReconnect: false,  // Override default - dane statyczne, nie potrzeba refetch
     }),
   };
   ```

5. Utworzenie `src/lib/api/queries/user-sports.queries.ts`:

   ```typescript
   import type { UserSportDto } from "@/types";
   import { queryKeys } from "../keys";

   export async function fetchUserSports(): Promise<UserSportDto[]> {
     const response = await fetch("/api/profiles/me/sports");
     if (!response.ok) {
       throw new Error("Failed to fetch user sports");
     }
     return response.json();
   }

   export const userSportsQueries = {
     all: () => ({
       queryKey: queryKeys.userSports.all,
       queryFn: fetchUserSports,
       staleTime: Infinity,
       gcTime: Infinity,
     }),
   };
   ```

6. Utworzenie `src/lib/api/queries/matches.queries.ts`:

   ```typescript
   import type { GetMatchesResponseDto } from "@/types";
   import { queryKeys } from "../keys";

   export async function fetchMatches(offset = 0, limit = 20): Promise<GetMatchesResponseDto> {
     const url = `/api/matches?limit=${limit}&offset=${offset}`;
     const response = await fetch(url);
     if (!response.ok) {
       if (response.status === 400) {
         throw new Error("NO_LOCATION");
       }
       throw new Error("Failed to fetch matches");
     }
     return response.json();
   }

   export const matchesQueries = {
     list: (offset = 0, limit = 20) => ({
       queryKey: queryKeys.matches.list(offset, limit),
       queryFn: () => fetchMatches(offset, limit),
       staleTime: 2 * 60 * 1000, // 2 minuty
       gcTime: 30 * 60 * 1000, // 30 minut
       refetchOnWindowFocus: true, // Odśwież przy powrocie do zakładki
       refetchOnReconnect: true,
     }),
   };
   ```

7. Utworzenie `src/lib/api/mutations/profile.mutations.ts`:

   ```typescript
   import type { UpdateProfileCommand, ProfileDto } from "@/types";

   export async function updateProfile(data: UpdateProfileCommand): Promise<ProfileDto> {
     const response = await fetch("/api/profiles/me", {
       method: "PATCH",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(data),
     });
     if (!response.ok) {
       throw new Error("Failed to update profile");
     }
     return response.json();
   }

   export const profileMutations = {
     update: updateProfile,
   };
   ```

8. Utworzenie `src/lib/api/mutations/user-sports.mutations.ts`:

   ```typescript
   import type { AddUserSportCommand, UpdateUserSportCommand, UserSportDto } from "@/types";

   export async function addUserSport(data: AddUserSportCommand): Promise<UserSportDto> {
     const response = await fetch("/api/profiles/me/sports", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(data),
     });
     if (!response.ok) {
       throw new Error("Failed to add sport");
     }
     return response.json();
   }

   export async function updateUserSport(sportId: number, data: UpdateUserSportCommand): Promise<UserSportDto> {
     const response = await fetch(`/api/profiles/me/sports/${sportId}`, {
       method: "PUT",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(data),
     });
     if (!response.ok) {
       throw new Error("Failed to update sport");
     }
     return response.json();
   }

   export async function deleteUserSport(sportId: number): Promise<void> {
     const response = await fetch(`/api/profiles/me/sports/${sportId}`, {
       method: "DELETE",
     });
     if (!response.ok) {
       throw new Error("Failed to delete sport");
     }
   }

   export const userSportsMutations = {
     add: addUserSport,
     update: updateUserSport,
     delete: deleteUserSport,
   };
   ```

**Weryfikacja:**

- Wszystkie pliki kompilują się bez błędów TypeScript
- Import funkcji w innych miejscach działa poprawnie
- Aplikacja nadal działa (nie używamy jeszcze tych funkcji, tylko je tworzymy)

---

### Krok 3: Migracja useProfileView na TanStack Query

**Cel:** Zastąpić ręczne zarządzanie stanem w `useProfileView` przez TanStack Query.

**Zadania:**

1. Backup oryginalnego pliku:

   ```bash
   cp src/components/profile/hooks/useProfileView.ts src/components/profile/hooks/useProfileView.backup.ts
   ```

2. Przepisanie `useProfileView.ts` z wykorzystaniem TanStack Query:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { profileQueries, sportsQueries, userSportsQueries } from "@/lib/api/queries/profile.queries";
import { profileMutations } from "@/lib/api/mutations/profile.mutations";
import { userSportsMutations } from "@/lib/api/mutations/user-sports.mutations";
import { queryKeys } from "@/lib/api/keys";
import type {
  ProfileDto,
  SportDto,
  UserSportDto,
  UpdateProfileCommand,
  AddUserSportCommand,
  UpdateUserSportCommand,
} from "@/types";
import type { SocialLinks } from "../types";
import type { UserSportViewModel as UserSportVM } from "@/components/shared/types/sport";
import type { ProfileDataUpdates } from "@/components/main/types";

export interface ProfileViewModel extends Omit<ProfileDto, "social_links"> {
  social_links: SocialLinks;
}

const mapProfileDtoToViewModel = (dto: ProfileDto): ProfileViewModel => ({
  ...dto,
  social_links: (dto.social_links as SocialLinks) || {},
});

const mapUserSportDtoToViewModel = (dto: UserSportDto): UserSportVM => ({
  sport_id: dto.sport_id,
  sport_name: dto.name,
  custom_range_km: dto.custom_range_km,
  params: dto.parameters as Record<string, string | number>,
});

export interface UseProfileViewProps {
  onDataChange?: (updates: ProfileDataUpdates) => void;
}

export const useProfileView = (props?: UseProfileViewProps) => {
  const { onDataChange } = props || {};
  const queryClient = useQueryClient();

  // Queries
  const { data: profileData, isLoading: isLoadingProfile } = useQuery(profileQueries.me());
  const { data: allSportsData = [], isLoading: isLoadingSports } = useQuery(sportsQueries.all());
  const { data: userSportsData = [], isLoading: isLoadingUserSports } = useQuery(userSportsQueries.all());

  const profile = profileData ? mapProfileDtoToViewModel(profileData) : null;
  const userSports = userSportsData.map(mapUserSportDtoToViewModel);
  const allSports = allSportsData;
  const loading = isLoadingProfile || isLoadingSports || isLoadingUserSports;

  // Mutation: Update display name (OPTYMISTYCZNA)
  const updateDisplayNameMutation = useMutation({
    mutationFn: (newName: string) => profileMutations.update({ display_name: newName }),
    onMutate: async (newName) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.profile.me });
      const previous = queryClient.getQueryData<ProfileDto>(queryKeys.profile.me);

      queryClient.setQueryData<ProfileDto>(queryKeys.profile.me, (old) =>
        old ? { ...old, display_name: newName } : old
      );

      return { previous };
    },
    onError: (err, newName, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.profile.me, context.previous);
      }
      toast.error("Nie udało się zaktualizować nazwy");
    },
    onSuccess: () => {
      toast.success("Nazwa została zaktualizowana");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
  });

  // Mutation: Add social link (OPTYMISTYCZNA)
  const addSocialLinkMutation = useMutation({
    mutationFn: ({ platform, url }: { platform: string; url: string }) =>
      profileMutations.update({
        social_links: {
          ...((profileData?.social_links as Record<string, string>) || {}),
          [platform]: url,
        },
      }),
    onMutate: async ({ platform, url }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.profile.me });
      const previous = queryClient.getQueryData<ProfileDto>(queryKeys.profile.me);

      queryClient.setQueryData<ProfileDto>(queryKeys.profile.me, (old) =>
        old
          ? {
              ...old,
              social_links: {
                ...((old.social_links as Record<string, string>) || {}),
                [platform]: url,
              },
            }
          : old
      );

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.profile.me, context.previous);
      }
      toast.error("Nie udało się dodać linku");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
  });

  // Mutation: Edit social link (OPTYMISTYCZNA)
  const editSocialLinkMutation = useMutation({
    mutationFn: ({ platform, url }: { platform: string; url: string }) =>
      profileMutations.update({
        social_links: {
          ...((profileData?.social_links as Record<string, string>) || {}),
          [platform]: url,
        },
      }),
    onMutate: async ({ platform, url }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.profile.me });
      const previous = queryClient.getQueryData<ProfileDto>(queryKeys.profile.me);

      queryClient.setQueryData<ProfileDto>(queryKeys.profile.me, (old) =>
        old
          ? {
              ...old,
              social_links: {
                ...((old.social_links as Record<string, string>) || {}),
                [platform]: url,
              },
            }
          : old
      );

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.profile.me, context.previous);
      }
      toast.error("Nie udało się edytować linku");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
  });

  // Mutation: Delete social link (OPTYMISTYCZNA)
  const deleteSocialLinkMutation = useMutation({
    mutationFn: (platform: string) => {
      const { [platform]: removed, ...remaining } = (profileData?.social_links as Record<string, string>) || {};
      return profileMutations.update({ social_links: remaining });
    },
    onMutate: async (platform) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.profile.me });
      const previous = queryClient.getQueryData<ProfileDto>(queryKeys.profile.me);

      queryClient.setQueryData<ProfileDto>(queryKeys.profile.me, (old) => {
        if (!old) return old;
        const { [platform]: removed, ...remaining } = (old.social_links as Record<string, string>) || {};
        return { ...old, social_links: remaining };
      });

      return { previous };
    },
    onError: (err, platform, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.profile.me, context.previous);
      }
      toast.error("Nie udało się usunąć linku");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
  });

  // Mutation: Add sport (PESYMISTYCZNA - wpływa na matching)
  const addSportMutation = useMutation({
    mutationFn: userSportsMutations.add,
    onSuccess: (data) => {
      queryClient.setQueryData<UserSportDto[]>(queryKeys.userSports.all, (old) => (old ? [...old, data] : [data]));
      // WAŻNE: Invaliduj cache dopasowań
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      toast.success("Sport został dodany do Twojego profilu");
      onDataChange?.({ sportsChanged: true });
    },
    onError: () => {
      toast.error("Nie udało się dodać sportu");
    },
  });

  // Mutation: Edit sport (PESYMISTYCZNA - wpływa na matching)
  const editSportMutation = useMutation({
    mutationFn: ({ sportId, data }: { sportId: number; data: UpdateUserSportCommand }) =>
      userSportsMutations.update(sportId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData<UserSportDto[]>(queryKeys.userSports.all, (old) =>
        old ? old.map((sport) => (sport.sport_id === variables.sportId ? data : sport)) : [data]
      );
      // WAŻNE: Invaliduj cache dopasowań
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      toast.success("Sport został zaktualizowany");
      onDataChange?.({ sportsChanged: true });
    },
    onError: () => {
      toast.error("Nie udało się zaktualizować sportu");
    },
  });

  // Mutation: Delete sport (PESYMISTYCZNA - wpływa na matching)
  const deleteSportMutation = useMutation({
    mutationFn: userSportsMutations.delete,
    onSuccess: (data, sportId) => {
      queryClient.setQueryData<UserSportDto[]>(queryKeys.userSports.all, (old) =>
        old ? old.filter((sport) => sport.sport_id !== sportId) : []
      );
      // WAŻNE: Invaliduj cache dopasowań
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      toast.success("Sport został usunięty z Twojego profilu");
      onDataChange?.({ sportsChanged: true });
    },
    onError: () => {
      toast.error("Nie udało się usunąć sportu");
    },
  });

  return {
    profile,
    userSports,
    allSports,
    loading,
    updateDisplayName: (newName: string) => updateDisplayNameMutation.mutate(newName),
    addSocialLink: (platform: string, url: string) => addSocialLinkMutation.mutate({ platform, url }),
    editSocialLink: (platform: string, url: string) => editSocialLinkMutation.mutate({ platform, url }),
    deleteSocialLink: (platform: string) => deleteSocialLinkMutation.mutate(platform),
    addSport: (data: AddUserSportCommand) => addSportMutation.mutate(data),
    editSport: (sportId: number, data: UpdateUserSportCommand) => editSportMutation.mutate({ sportId, data }),
    deleteSport: (sportId: number) => deleteSportMutation.mutate(sportId),
  };
};
```

**Weryfikacja:**

- Aplikacja uruchamia się bez błędów
- ProfileView działa poprawnie (wyświetlanie, edycja, dodawanie/usuwanie sportów)
- W React Query Devtools widać queries: `['profile', 'me']`, `['sports']`, `['profile', 'me', 'sports']`
- Po zamknięciu i ponownym otwarciu ProfilePanel dane są pobierane z cache'u (nie ma nowego requesta w Network tab)
- Po edycji profilu cache jest poprawnie aktualizowany
- Po dodaniu/usunięciu sportu matches są invalidowane

---

### Krok 4: Migracja useMapView na TanStack Query

**Cel:** Zastąpić ręczne zarządzanie stanem w `useMapView` przez TanStack Query. MapView współdzieli cache profilu z ProfileView.

**Zadania:**

1. Backup oryginalnego pliku:

   ```bash
   cp src/components/map/hooks/useMapView.ts src/components/map/hooks/useMapView.backup.ts
   ```

2. Przepisanie `useMapView.ts`:

```typescript
import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GeoJsonPoint, ProfileDto, UpdateProfileCommand } from "@/types";
import type { MapViewViewModel } from "../types";
import { profileQueries } from "@/lib/api/queries/profile.queries";
import { profileMutations } from "@/lib/api/mutations/profile.mutations";
import { queryKeys } from "@/lib/api/keys";

export function useMapView() {
  const queryClient = useQueryClient();

  // Query: Profile data (współdzielony cache z ProfileView)
  const { data: profile, isLoading, error: queryError } = useQuery(profileQueries.me());

  // Local draft state (nie synchronizujemy z cache aż do zapisu)
  const [draftLocation, setDraftLocation] = useState<GeoJsonPoint | null>(profile?.location || null);
  const [draftRangeKm, setDraftRangeKm] = useState<number>(profile?.default_range_km || 10);

  // Update draft state when profile loads
  useEffect(() => {
    if (profile) {
      setDraftLocation(profile.location);
      setDraftRangeKm(profile.default_range_km || 10);
    }
  }, [profile]);

  // Calculate if data has been modified
  const isDirty = useMemo(() => {
    if (!profile) return false;
    const locationChanged = JSON.stringify(draftLocation) !== JSON.stringify(profile.location);
    const rangeChanged = draftRangeKm !== profile.default_range_km;
    return locationChanged || rangeChanged;
  }, [profile, draftLocation, draftRangeKm]);

  // Mutation: Update location/range (PESYMISTYCZNA - wpływa na matching)
  const updateLocationMutation = useMutation({
    mutationFn: (data: UpdateProfileCommand) => profileMutations.update(data),
    onSuccess: (updatedProfile) => {
      // Zaktualizuj cache profilu
      queryClient.setQueryData<ProfileDto>(queryKeys.profile.me, updatedProfile);

      // Zaktualizuj draft state
      setDraftLocation(updatedProfile.location);
      setDraftRangeKm(updatedProfile.default_range_km || 10);

      // WAŻNE: Invaliduj cache dopasowań (wpływa na matching)
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
    onError: (error) => {
      throw error; // Re-throw dla Toast
    },
  });

  const saveChanges = useCallback(async () => {
    if (!isDirty || updateLocationMutation.isPending) return;

    const updateData: UpdateProfileCommand = {
      location: draftLocation,
      default_range_km: draftRangeKm,
    };

    await updateLocationMutation.mutateAsync(updateData);
    return true;
  }, [isDirty, draftLocation, draftRangeKm, updateLocationMutation]);

  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
  }, [queryClient]);

  return {
    profile,
    draftLocation,
    draftRangeKm,
    isLoading,
    isSaving: updateLocationMutation.isPending,
    error: queryError ? (queryError as Error).message : null,
    isDirty,
    setDraftLocation,
    setDraftRangeKm,
    saveChanges,
    retry,
  };
}
```

**Weryfikacja:**

- MapView wyświetla się poprawnie
- Zmiana lokalizacji/zasięgu działa
- Po zapisie zmian cache profilu jest aktualizowany
- Po zapisie cache matches jest invalidowany
- ProfileView automatycznie widzi nową lokalizację (współdzielony cache)
- W React Query Devtools widać że MapView i ProfileView używają tego samego query `['profile', 'me']`

---

### Krok 5: Migracja useMatchesView na TanStack Query

**Cel:** Zastąpić ręczne zarządzanie stanem w `useMatchesView` przez TanStack Query z invalidacją po zmianach profilu.

**Zadania:**

1. Backup oryginalnego pliku:

   ```bash
   cp src/components/matches/hooks/useMatchesView.ts src/components/matches/hooks/useMatchesView.backup.ts
   ```

2. Przepisanie `useMatchesView.ts`:

```typescript
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { matchesQueries } from "@/lib/api/queries/matches.queries";
import type { UserMatchViewModel, Pagination } from "../types";
import type { GetMatchesResponseDto } from "@/types";

export type MatchesError = "no_location" | "generic" | null;

interface UseMatchesViewReturn {
  matches: UserMatchViewModel[];
  isLoading: boolean;
  error: MatchesError;
  pagination: Pagination | null;
  hasNextPage: boolean;
  loadMore: () => Promise<void>;
}

export interface UseMatchesViewProps {
  refreshTrigger?: number;
}

export function useMatchesView(props?: UseMatchesViewProps): UseMatchesViewReturn {
  const { refreshTrigger } = props || {};
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Query: Matches list
  const {
    data,
    isLoading,
    error: queryError,
    isFetching,
  } = useQuery({
    ...matchesQueries.list(offset, limit),
    // Klucz zależy również od refreshTrigger (wymusza refetch po zmianach)
    queryKey: ["matches", { offset, limit, trigger: refreshTrigger }],
  });

  // Transform data
  const matches = useMemo(() => {
    if (!data) return [];

    return data.data.map((match) => ({
      user_id: match.id,
      username: match.username || "",
      display_name: match.display_name || match.username || "Unnamed User",
      email: match.email,
      distance_km: match.distance_km,
      social_links:
        match.social_links && typeof match.social_links === "object" && !Array.isArray(match.social_links)
          ? (match.social_links as Record<string, string>)
          : {},
      sports: match.sports.map((sport) => ({
        sport_id: sport.sport_id,
        name: sport.name,
        parameters:
          sport.parameters && typeof sport.parameters === "object" && !Array.isArray(sport.parameters)
            ? (sport.parameters as Record<string, any>)
            : {},
      })),
    }));
  }, [data]);

  // Error handling
  const error: MatchesError = useMemo(() => {
    if (!queryError) return null;
    const errorMessage = (queryError as Error).message;
    if (errorMessage === "NO_LOCATION") return "no_location";
    return "generic";
  }, [queryError]);

  const pagination = data?.pagination || null;
  const hasNextPage = pagination ? pagination.offset + pagination.limit < pagination.total : false;

  const loadMore = async () => {
    if (!pagination || isFetching) return;
    const nextOffset = pagination.offset + pagination.limit;
    if (nextOffset >= pagination.total) return;
    setOffset(nextOffset);
  };

  return {
    matches,
    isLoading,
    error,
    pagination,
    hasNextPage,
    loadMore,
  };
}
```

**Uwaga o paginacji:** Powyższa implementacja jest uproszczona i pokazuje podstawowe podejście. Dla bardziej zaawansowanej paginacji z kumulowaniem wyników (infinite scroll) rozważ użycie `useInfiniteQuery` z TanStack Query w przyszłości.

**Weryfikacja:**

- MatchesView wyświetla listę dopasowań
- Po dodaniu/usunięciu sportu lista dopasowań jest automatycznie odświeżana
- Po zmianie lokalizacji/zasięgu lista dopasowań jest automatycznie odświeżana
- Paginacja ("Załaduj więcej") działa poprawnie
- Stany błędów (no_location, generic) są poprawnie obsługiwane
- W React Query Devtools widać query `['matches', {...}]`

---

### Krok 6: Refactoring i cleanup

**Cel:** Uporządkowanie kodu, usunięcie martwego kodu, dodanie dokumentacji.

**Zadania:**

1. Usunięcie backup plików (po potwierdzeniu że wszystko działa):

   ```bash
   rm src/components/profile/hooks/useProfileView.backup.ts
   rm src/components/map/hooks/useMapView.backup.ts
   rm src/components/matches/hooks/useMatchesView.backup.ts
   ```

2. Aktualizacja dokumentacji w plikach `.md` w `.ai/`:
   - Dodaj informację o użyciu TanStack Query do `index-page.md`
   - Zaktualizuj dokumentację komponentów jeśli potrzeba

3. Sprawdzenie czy wszystkie testy jednostkowe i E2E przechodzą:

   ```bash
   npm run test:unit
   npm run test:e2e
   ```

4. Aktualizacja testów jeśli potrzeba (dodanie mock'ów dla TanStack Query).

5. Code review i refactoring:
   - Sprawdzenie czy wszystkie komponenty używają spójnych nazw
   - Usunięcie nieużywanych importów
   - Dodanie JSDoc komentarzy do nowych funkcji

**Weryfikacja:**

- Wszystkie testy przechodzą
- Brak błędów TypeScript
- Brak błędów ESLint
- Aplikacja działa płynnie we wszystkich scenariuszach

---

### Krok 7: Testy manualne i final verification

**Cel:** Kompleksowe przetestowanie wszystkich scenariuszy użycia.

**Scenariusze do przetestowania:**

1. **Cache profilu:**
   - [ ] Otwórz ProfilePanel → zamknij → otwórz ponownie
   - [ ] Weryfikacja: Dane powinny być pokazane natychmiast bez nowego requesta

2. **Optymistyczne aktualizacje:**
   - [ ] Zmień `display_name`
   - [ ] Weryfikacja: UI aktualizuje się natychmiast, toast "Zapisywanie..." → "Zapisano"
   - [ ] Symuluj błąd (np. wyłącz internet) i sprawdź rollback

3. **Pesymistyczne aktualizacje + invalidacja matches:**
   - [ ] Dodaj nowy sport
   - [ ] Weryfikacja: Lista sportów aktualizuje się po otrzymaniu odpowiedzi
   - [ ] Weryfikacja: Lista matches jest automatycznie odświeżana
   - [ ] Zmień lokalizację na mapie
   - [ ] Weryfikacja: Lista matches jest automatycznie odświeżana

4. **Współdzielenie cache między komponentami:**
   - [ ] Otwórz ProfilePanel i MapView jednocześnie (desktop)
   - [ ] Weryfikacja w Network tab: tylko JEDEN request do `/api/profiles/me`
   - [ ] Zmień lokalizację w MapView
   - [ ] Weryfikacja: ProfilePanel automatycznie widzi nową lokalizację

5. **Background refetch:**
   - [ ] Otwórz zakładkę Matches
   - [ ] Przełącz się na inną zakładkę przeglądarki
   - [ ] Poczekaj 3 minuty (staleTime dla matches)
   - [ ] Wróć do zakładki
   - [ ] Weryfikacja: Matches są automatycznie odświeżane w tle

6. **Error handling:**
   - [ ] Symuluj błąd sieciowy (wyłącz internet)
   - [ ] Spróbuj dodać sport
   - [ ] Weryfikacja: Toast error, retry logic działa (2 próby)
   - [ ] Weryfikacja: Stale dane z cache nadal są widoczne

7. **React Query Devtools:**
   - [ ] Otwórz React Query Devtools (dolny róg ekranu)
   - [ ] Weryfikacja: Widoczne queries: `['profile', 'me']`, `['sports']`, `['profile', 'me', 'sports']`, `['matches', {...}]`
   - [ ] Weryfikacja: Status queries: fresh/stale/fetching
   - [ ] Kliknij "Invalidate" na profilu → sprawdź czy dane są odświeżane

**Final checklist:**

- [ ] Aplikacja nie wykonuje zbędnych requestów (sprawdź Network tab)
- [ ] Wszystkie funkcjonalności działają zgodnie z PRD
- [ ] UI jest responsywny i nie ma migotania
- [ ] Toast notifications działają poprawnie
- [ ] Error handling działa we wszystkich scenariuszach
- [ ] Testy jednostkowe przechodzą
- [ ] Testy E2E przechodzą
- [ ] Brak błędów w konsoli przeglądarki
- [ ] Kod jest czytelny i dobrze udokumentowany

---

## 11. Potencjalne problemy i rozwiązania

### Problem 1: Race conditions przy szybkich mutacjach

**Symptom:** Użytkownik szybko klika wielokrotnie "Zapisz" i dane się gubią.

**Rozwiązanie:** TanStack Query automatycznie kolejkuje mutacje. Dodatkowo można:

```typescript
const { mutate, isPending } = useMutation(...)
<Button disabled={isPending}>Zapisz</Button>  // Disable podczas mutacji
```

### Problem 2: Stale cache po wylogowaniu

**Symptom:** Po wylogowaniu i zalogowaniu jako inny użytkownik, widoczne są dane poprzedniego użytkownika.

**Rozwiązanie:** Wyczyść cache przy wylogowaniu:

```typescript
// W logout handler:
queryClient.clear(); // Usuń wszystkie dane z cache
```

### Problem 3: Infinite loop przy invalidacji

**Symptom:** Dodanie sportu powoduje nieskończoną pętlę refetch'y.

**Rozwiązanie:** Nie używaj `refetchOnMount: true` razem z `invalidateQueries` w `onSuccess`. TanStack Query automatycznie refetch'uje invalidated queries gdy są aktywne.

### Problem 4: TypeScript errors z QueryClient

**Symptom:** `queryClient.setQueryData` nie akceptuje generics.

**Rozwiązanie:** Użyj type assertion lub zdefiniuj typy w `queryKeys`:

```typescript
queryClient.setQueryData<ProfileDto>(queryKeys.profile.me, newData);
```

### Problem 5: Matches nie odświeżają się mimo invalidacji

**Symptom:** Po dodaniu sportu matches cache jest invalidowany ale lista się nie aktualizuje.

**Rozwiązanie:** Sprawdź czy queryKey w `useMatchesView` jest identyczny z tym używanym w invalidacji:

```typescript
// Invalidacja:
queryClient.invalidateQueries({ queryKey: ["matches"] });

// Query musi zaczynać się od tego samego prefiksu:
queryKey: ["matches", { offset, limit }]; // ✅ Będzie invalidowany
```

## 12. Metryki sukcesu

Po implementacji cache'owania, oczekujemy następujących poprawek:

### Przed cache'owaniem

- **Requests do `/api/profiles/me`**: ~5-10 na sesję (przy każdym otwarciu ProfilePanel)
- **Time to Interactive dla ProfileView**: ~500-800ms (za każdym razem)
- **Liczba requestów podczas jednej sesji**: ~20-30

### Po cache'owaniu

- **Requests do `/api/profiles/me`**: 1 na sesję (tylko przy initial load)
- **Time to Interactive dla ProfileView**: ~0-50ms (z cache)
- **Liczba requestów podczas jednej sesji**: ~5-10 (tylko przy realnych zmianach)

### Dodatkowe korzyści

- Lepsze UX - brak migotania UI przy przełączaniu paneli
- Niższe koszty infrastruktury (mniej DB queries)
- Lepsza responsywność aplikacji
- Automatyczna synchronizacja danych między komponentami

## 13. Dalsze usprawnienia (future work)

Następujące usprawnienia mogą być zaimplementowane w przyszłości:

1. **Infinite scroll dla matches** - użycie `useInfiniteQuery` zamiast ręcznej paginacji
2. **Optimistic updates dla location** - szybsza mapa (ale ryzykowne ze względu na walidację)
3. **Persistence cache w localStorage** - dla mniej wrażliwych danych (np. lista sportów)
4. **Prefetching matches** - pobieranie wyników przed przełączeniem na zakładkę
5. **WebSocket support** - real-time updates dla nowych dopasowań
6. **Service Worker** - offline support i background sync

## 14. Niejasności i otwarte kwestie

### 13.1. Testowanie z TanStack Query

**Kwestia:** Jak testować komponenty używające `useQuery` i `useMutation` w testach jednostkowych?

**Rekomendacja do rozważenia:**

- Użyć `@testing-library/react` z wrapper'em `QueryClientProvider`
- Utworzyć helper `createTestQueryClient()` dla testów
- Mock'ować API responses przez MSW (Mock Service Worker)
- Przykład może być dodany w przyszłości do `test/unit/helpers/query-client.ts`

**Status:** Wymaga dalszej analizy i uzgodnienia z zespołem. Nie blokuje implementacji podstawowej funkcjonalności.

### 13.2. Devtools w produkcji

**Kwestia:** Czy React Query Devtools powinny być dostępne w production build?

**Rekomendacja:**

```typescript
// W QueryProvider.tsx:
{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
```

**Status:** Zalecane wyłączenie w produkcji dla performance i security. Domyślnie Devtools dodają ~50KB do bundle.

### 13.3. Error boundary dla całej aplikacji

**Kwestia:** Czy potrzebujemy globalnego Error Boundary dla obsługi catastroficznych błędów cache?

**Rekomendacja:** Tak, warto dodać:

```typescript
// src/components/ErrorBoundary.tsx
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
```

**Status:** Nice-to-have, ale nie krytyczne dla MVP cache'owania. Można dodać w późniejszym etapie.

### 13.4. Monitoring i analytics

**Kwestia:** Jak monitorować efektywność cache (hit rate, query times)?

**Rekomendacja:** TanStack Query ma wbudowane eventy:

```typescript
queryClient.getQueryCache().subscribe((event) => {
  // Log do analytics
});
```

**Status:** Future work - nie jest częścią obecnego scope'u implementacji.

---

## 15. Podsumowanie

Implementacja TanStack Query rozwiąże główny problem aplikacji - zbędne zapytania do API przy każdym rozwinięciu ProfilePanel. Plan migracji jest podzielony na 7 kroków, gdzie po każdym kroku aplikacja pozostaje w działającym stanie. Strategia cache'owania jest dostosowana do charakterystyki danych:

- Dane profilu i sporty użytkownika: cache na czas sesji (`staleTime: Infinity`)
- Dopasowania: umiarkowany cache z invalidacją po zmianach (`staleTime: 2min`)
- Aktualizacje: optymistyczne dla UI, pesymistyczne dla danych wpływających na matching

Oczekiwany rezultat: ~80-90% redukcja niepotrzebnych requestów do API, lepsze UX, niższe koszty infrastruktury.
