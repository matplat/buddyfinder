-- Example test data for matches feature
-- Add some test users with varied locations and sports preferences

-- Example user locations around Warsaw
INSERT INTO profiles (id, username, display_name, location, default_range_km, social_links) VALUES
  ('00000000-0000-4000-a000-000000000001', 'runner1', 'Marathon Runner', ST_SetSRID(ST_MakePoint(21.0122, 52.2297), 4326), 10, '{"strava": "runner1"}'),
  ('00000000-0000-4000-a000-000000000002', 'cyclist1', 'Road Cyclist', ST_SetSRID(ST_MakePoint(20.9862, 52.2337), 4326), 50, '{"strava": "cyclist1"}'),
  ('00000000-0000-4000-a000-000000000003', 'swimmer1', 'Pool Swimmer', ST_SetSRID(ST_MakePoint(21.0412, 52.2177), 4326), 15, '{"strava": "swimmer1"}'),
  ('00000000-0000-4000-a000-000000000004', 'multisport1', 'Triathlete', ST_SetSRID(ST_MakePoint(20.9922, 52.2417), 4326), 30, '{"strava": "multisport1"}');

-- Add sport preferences for users
INSERT INTO user_sports (user_id, sport_id, parameters, custom_range_km) VALUES
  -- Runner with 10km pace preferences
  ('00000000-0000-4000-a000-000000000001', 
   (SELECT id FROM sports WHERE name = 'bieganie'),
   '{"dystans": 10, "tempo": 330}',
   15),
  
  -- Cyclist with road cycling preferences
  ('00000000-0000-4000-a000-000000000002', 
   (SELECT id FROM sports WHERE name = 'rower szosowy'),
   '{"dystans": 50, "prędkość": 30}',
   60),
   
  -- Cyclist also does MTB
  ('00000000-0000-4000-a000-000000000002', 
   (SELECT id FROM sports WHERE name = 'rower mtb'),
   '{"dystans": 25, "czas": 90, "przewyższenie": 800}',
   40),
   
  -- Swimmer with pool preferences
  ('00000000-0000-4000-a000-000000000003', 
   (SELECT id FROM sports WHERE name = 'pływanie w basenie'),
   '{"dystans": 1500, "tempo": 120}',
   20),
   
  -- Multisport person with multiple activities
  ('00000000-0000-4000-a000-000000000004', 
   (SELECT id FROM sports WHERE name = 'bieganie'),
   '{"dystans": 10, "tempo": 300}',
   20),
   
  ('00000000-0000-4000-a000-000000000004', 
   (SELECT id FROM sports WHERE name = 'rower szosowy'),
   '{"dystans": 40, "prędkość": 28}',
   45),
   
  ('00000000-0000-4000-a000-000000000004', 
   (SELECT id FROM sports WHERE name = 'pływanie w basenie'),
   '{"dystans": 2000, "tempo": 110}',
   25);

-- Mock email addresses for test users in auth.users
INSERT INTO auth.users (id, email, email_confirmed_at) VALUES
  ('00000000-0000-4000-a000-000000000001', 'runner1@example.com', NOW()),
  ('00000000-0000-4000-a000-000000000002', 'cyclist1@example.com', NOW()),
  ('00000000-0000-4000-a000-000000000003', 'swimmer1@example.com', NOW()),
  ('00000000-0000-4000-a000-000000000004', 'multisport1@example.com', NOW());