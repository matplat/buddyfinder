-- Create the function for getting matches
CREATE OR REPLACE FUNCTION get_matches_for_user(
  current_user_id uuid,
  page_limit int DEFAULT 20,
  page_offset int DEFAULT 0
) RETURNS TABLE (
  total_count bigint,
  matched_users json
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_user_location geometry;
  current_user_range int;
BEGIN
  -- Get the current user's location and range
  SELECT location, default_range_km INTO current_user_location, current_user_range
  FROM profiles
  WHERE id = current_user_id;

  -- Validate user profile data
  IF current_user_location IS NULL OR current_user_range IS NULL THEN
    RAISE EXCEPTION 'Profile is incomplete: location and default_range_km are required'
      USING ERRCODE = 'PGRST400';
  END IF;

  RETURN QUERY WITH matched_profiles AS (
    -- Find profiles within range and aggregate their sports
    SELECT 
      p2.id,
      p2.username,
      p2.display_name,
      p2.social_links,
      au.email,
      ST_Distance(
        current_user_location::geography, 
        p2.location::geography
      ) / 1000.0 as distance_km,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'sport_id', us.sport_id,
            'name', s.name,
            'parameters', us.parameters,
            'custom_range_km', us.custom_range_km
          ) ORDER BY s.name
        ) FILTER (WHERE us.sport_id IS NOT NULL),
        '[]'::jsonb
      ) as sports,
      COUNT(us.sport_id) as common_sports_count
    FROM profiles p2
    -- Join with auth.users to get email
    LEFT JOIN auth.users au ON au.id = p2.id
    -- Left join with user_sports and sports to get sports data
    LEFT JOIN user_sports us ON us.user_id = p2.id
    LEFT JOIN sports s ON s.id = us.sport_id
    WHERE 
      p2.id != current_user_id
      AND p2.location IS NOT NULL
      AND ST_DWithin(
        current_user_location::geography,
        p2.location::geography,
        GREATEST(current_user_range, p2.default_range_km) * 1000.0
      )
    GROUP BY p2.id, p2.username, p2.display_name, p2.social_links, au.email
  )
  SELECT 
    (SELECT COUNT(*) FROM matched_profiles)::bigint as total_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', mp.id,
          'username', mp.username,
          'display_name', mp.display_name,
          'email', mp.email,
          'social_links', mp.social_links,
          'distance_km', round(mp.distance_km::numeric, 2),
          'sports', mp.sports
        )
        ORDER BY mp.distance_km ASC, mp.common_sports_count DESC
      ),
      '[]'::jsonb
    )::json as matched_users
  FROM matched_profiles mp
  OFFSET page_offset
  LIMIT page_limit;
END;
$$;