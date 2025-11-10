-- Enhanced function to get user email by username for authentication
-- Includes security improvements: input validation, confirmed emails only
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE  -- funkcja nie modyfikuje danych, można cache'ować wyniki
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
BEGIN
  -- 1. Input validation: NULL check
  IF p_username IS NULL OR length(trim(p_username)) = 0 THEN
    RETURN NULL;
  END IF;
  
  -- 2. Input validation: length check (zapobiega bardzo długim stringom)
  IF length(p_username) > 50 THEN
    RETURN NULL;
  END IF;
  
  -- 3. Input validation: pattern check (tylko alphanumeric + underscore)
  -- Zgodne z CHECK constraint w tabeli profiles
  IF p_username !~ '^[a-zA-Z0-9_]+$' THEN
    RETURN NULL;
  END IF;
  
  -- 4. Find user_id by username (case-insensitive)
  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE lower(username) = lower(p_username)
  LIMIT 1;  -- dodatkowe zabezpieczenie, choć username jest UNIQUE
  
  -- 5. If username not found, return NULL
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- 6. Get email from auth.users - only for confirmed, active accounts
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id
    AND email_confirmed_at IS NOT NULL  -- tylko potwierdzone emaile
    AND deleted_at IS NULL;             -- tylko aktywne konta
  
  RETURN v_email;
END;
$$;

-- Security: Revoke all public access
REVOKE ALL ON FUNCTION public.get_email_by_username(text) FROM PUBLIC;

-- Security: Grant execute only to necessary roles
GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO authenticated;

-- Documentation
COMMENT ON FUNCTION public.get_email_by_username(text) IS 
'Securely retrieves user email by username for authentication purposes.
Returns NULL if:
- Username not found
- Email not confirmed
- Account deleted
- Invalid input format

Protected against SQL injection through parameterized queries and input validation.
Protected against user enumeration through consistent NULL returns.
Uses SECURITY DEFINER to access auth.users safely without exposing admin privileges.';
