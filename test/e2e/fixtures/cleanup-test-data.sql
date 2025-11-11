-- Cleanup test data after E2E tests
-- This script removes all test users and their associated data
-- WARNING: This is for TEST environment only!

-- List of test user emails
-- testuser1@buddyfinder.test
-- testuser2@buddyfinder.test
-- testuser3@buddyfinder.test
-- testuser4@buddyfinder.test
-- testuser5@buddyfinder.test
-- testuser6@buddyfinder.test

-- Cleanup is handled programmatically via DatabaseHelper.cleanupTestUsers()
-- See: test/e2e/helpers/database.helper.ts

-- Manual cleanup (if needed):
-- 1. Get user IDs from auth.users where email LIKE '%@buddyfinder.test'
-- 2. Delete from user_sports where user_id IN (...)
-- 3. Delete from profiles where id IN (...)
-- 4. Delete from auth.users where id IN (...)

-- Example manual cleanup query:
/*
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    FOR test_user_id IN 
        SELECT id FROM auth.users 
        WHERE email LIKE '%@buddyfinder.test'
    LOOP
        -- Delete user sports
        DELETE FROM public.user_sports WHERE user_id = test_user_id;
        
        -- Delete profile (if not cascading)
        DELETE FROM public.profiles WHERE id = test_user_id;
        
        -- Delete from auth (requires service role)
        -- This should be done via Supabase Admin API
    END LOOP;
END $$;
*/

-- For automated cleanup, use:
-- npm run test:e2e -- --grep "@cleanup"
