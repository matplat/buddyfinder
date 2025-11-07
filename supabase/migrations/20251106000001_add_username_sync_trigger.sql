-- Migration: Add Username Synchronization Trigger
-- Description: Synchronizes username from auth.users.raw_user_meta_data to profiles.username
-- Author: BuddyFinder Team
-- Date: 2025-11-06

-- Create trigger function to sync username from auth metadata to profile
CREATE OR REPLACE FUNCTION public.handle_new_user_username()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profile with username from metadata
  -- Only if username exists in metadata
  UPDATE public.profiles
  SET username = LOWER(NEW.raw_user_meta_data->>'username')
  WHERE id = NEW.id
  AND (NEW.raw_user_meta_data->>'username') IS NOT NULL
  AND (NEW.raw_user_meta_data->>'username') != '';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
-- Fires AFTER INSERT to ensure profile is created first by handle_new_user()
CREATE TRIGGER on_auth_user_username_sync
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user_username();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user_username() IS 
  'Synchronizes username from user metadata to profile table after user creation';
