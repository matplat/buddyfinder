-- Seed test data for E2E tests
-- This script creates 6 test users with various profile configurations
-- WARNING: This is for TEST environment only!

-- Test User 1: Main test user
-- Email: testuser1@buddyfinder.test
-- Password: TestPass123!
-- Location: Warszawa centrum (52.2297, 21.0122)
-- Default range: 10 km
-- Sports: Bieganie

-- Note: User creation happens via Supabase Auth API in DatabaseHelper
-- This script only contains additional setup if needed

-- Verify sports exist
SELECT id, name FROM sports ORDER BY id;

-- Expected sports:
-- 1: Bieganie
-- 2: Rower szosowy  
-- 3: Rower MTB
-- 4: Pływanie w basenie
-- 5: Pływanie na wodach otwartych
-- 6: Rolki
-- 7: Nurkowanie
-- 8: Tenis

-- Test data is created programmatically via DatabaseHelper.seedAllTestUsers()
-- See: test/e2e/helpers/database.helper.ts

-- To seed test users, run the E2E test setup or use:
-- npm run test:e2e -- --grep "@setup"
