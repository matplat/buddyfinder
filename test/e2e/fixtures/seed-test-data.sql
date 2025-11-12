-- Seed danych testowych dla US-004 (zarządzanie sportami w profilu)
-- Główny użytkownik: testuser1@buddyfinder.test
-- Zakładamy, że tabela "sports" została już zasilona przez migracje projektu.

-- Usunięcie istniejących rekordów użytkownika testowego
DELETE FROM public.user_sports
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testuser1@buddyfinder.test');

-- Dodanie przykładowego sportu (Bieganie) wraz z parametrami
INSERT INTO public.user_sports (user_id, sport_id, custom_range_km, parameters)
SELECT
  auth_user.id,
  sport.id,
  10,
  jsonb_build_object(
    'dystans', 10,
    'tempo', 330 -- 5:30 min/km w sekundach
  )
FROM auth.users AS auth_user
JOIN public.sports AS sport ON sport.name = 'bieganie'
WHERE auth_user.email = 'testuser1@buddyfinder.test';
