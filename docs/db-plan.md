# Database Schema Plan

## 1. Tables

### `profiles`

Stores public user profile information.

| Column             | Data Type                    | Constraints                                                              | Description                                                                 |
| ------------------ | ---------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `id`               | `uuid`                       | `PRIMARY KEY`, `REFERENCES auth.users(id) ON DELETE CASCADE`             | Foreign key to Supabase's `auth.users` table.                               |
| `username`         | `text`                       | `UNIQUE`, `NOT NULL`, `CHECK (username ~ '^[a-z0-9_]+$')`                 | Unique, URL-friendly user identifier. Lowercase letters, numbers, and underscores only. |
| `display_name`     | `text`                       |                                                                | The name displayed to other users.                                          |
| `location`         | `geometry(Point, 4326)`      |                                                                          | User's geographical location for matching. SRID 4326 for WGS 84.            |
| `default_range_km` | `integer`                    | `CHECK (default_range_km >= 1 AND default_range_km <= 100)`              | Default travel range in kilometers. NULL if not set.                        |
| `social_links`     | `jsonb`                      |                                                                          | Flexible storage for social media links (e.g., `{"strava": "url", "garmin": "url"}`). |
| `created_at`       | `timestamp with time zone`   | `NOT NULL`, `DEFAULT now()`                                              | Timestamp of profile creation.                                              |
| `updated_at`       | `timestamp with time zone`   |                                                                          | Timestamp of the last profile update (managed by a trigger).                |

---

### `sports`

A dictionary table containing the predefined list of available sports.

| Column | Data Type | Constraints    | Description                  |
| ------ | --------- | -------------- | ---------------------------- |
| `id`   | `serial`  | `PRIMARY KEY`  | Unique identifier for the sport. |
| `name` | `text`    | `UNIQUE`, `NOT NULL` | Name of the sport (e.g., "Running", "Cycling"). |

*Note: This table will be populated using a one-time seed script.*

---

### `user_sports`

A many-to-many join table linking users to the sports they practice.

| Column            | Data Type | Constraints                                                  | Description                                                                 |
| ----------------- | --------- | ------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `user_id`         | `uuid`    | `PRIMARY KEY`, `REFERENCES profiles(id) ON DELETE CASCADE`   | Foreign key to the `profiles` table.                                        |
| `sport_id`        | `integer` | `PRIMARY KEY`, `REFERENCES sports(id) ON DELETE CASCADE`     | Foreign key to the `sports` table.                                          |
| `parameters`      | `jsonb`   | `NOT NULL`                                                   | Sport-specific parameters (e.g., pace for running, power for cycling).      |
| `custom_range_km` | `integer` | `CHECK (custom_range_km >= 1 AND custom_range_km <= 100)`    | Optional, sport-specific travel range override.                             |

---

### `deleted_users`

An analytical table to store aggregated data about deleted user accounts for analytical purposes.

| Column               | Data Type                  | Constraints         | Description                                      |
| -------------------- | -------------------------- | ------------------- | ------------------------------------------------ |
| `id`                 | `serial`                   | `PRIMARY KEY`       | Unique identifier for the log entry.             |
| `user_id`            | `uuid`                     | `NOT NULL`          | The ID of the deleted user.                      |
| `created_at_original`| `timestamp with time zone` | `NOT NULL`          | The original creation date of the user's profile. |
| `deleted_at`         | `timestamp with time zone` | `NOT NULL`, `DEFAULT now()` | Timestamp when the user was deleted.             |
| `sports_count`       | `integer`                  | `NOT NULL`          | Number of sports the user had on their profile.  |
| `connections_count`  | `integer`                  | `NOT NULL`, `DEFAULT 0` | Number of connections/buddies (future use).      |

### `users`

This column is managed by Supabase Auth and is listed here only for reference.

| Column | Data Type | Constraints | Description |
| ------ | --------- | ----------- | ----------- |
| `id` | `uuid` | `PRIMARY KEY` | Unique identifier for the user. |
| `email` | `text` | `UNIQUE`, `NOT NULL` | Email address of the user. |
| `encrypted_password` | `text` | `NOT NULL` | Encrypted password for the user. |
| `created_at` | `timestamp with time zone` | `NOT NULL`, `DEFAULT now()` | Timestamp when the user was created. |
| `updated_at` | `timestamp with time zone` | `NOT NULL`, `DEFAULT now()` | Timestamp when the user was last updated. |
| `last_sign_in_at` | `timestamp with time zone` | | Timestamp when the user last signed in. |

## 2. Relationships

- **`auth.users` ↔ `profiles`**: One-to-One. A trigger will automatically create a `profiles` entry when a new user signs up in `auth.users`.
- **`profiles` ↔ `sports`**: Many-to-Many, implemented via the `user_sports` join table.

## 3. Indexes

- **On `profiles` table:**
  - `profiles_pkey` on `(id)` (Primary Key).
  - `profiles_username_key` on `(lower(username))` for case-insensitive unique username checks.
  - `profiles_location_idx` on `(location)` using `GIST` for efficient geospatial queries.
  - `profiles_social_links_idx` on `(social_links)` using `GIN` for fast queries on JSONB data.

- **On `sports` table:**
  - `sports_pkey` on `(id)` (Primary Key).
  - `sports_name_key` on `(name)` (Unique).

- **On `user_sports` table:**
  - `user_sports_pkey` on `(user_id, sport_id)` (Composite Primary Key).
  - `user_sports_parameters_idx` on `(parameters)` using `GIN` for fast queries on JSONB data.

## 4. Row-Level Security (RLS) Policies

RLS will be enabled on tables containing user-specific data to ensure data privacy.

- **On `profiles` table:**
  - **`SELECT` Policy**: All authenticated users (`authenticated`) can view all profiles.
  - **`UPDATE` Policy**: Users can only update their own profile (`auth.uid() = id`).

- **On `user_sports` table:**
  - **`SELECT` Policy**: All authenticated users (`authenticated`) can view all user-sport entries.
  - **`INSERT`, `UPDATE`, `DELETE` Policies**: Users can only manage their own sport entries (`auth.uid() = user_id`).

## 5. Additional Considerations & Automations

- **Profile Auto-Creation**: A trigger on `auth.users` will execute a function to create a corresponding entry in the `public.profiles` table upon new user registration.
- **`deleted_users` Trigger**: A `BEFORE DELETE` trigger on the `profiles` table will execute a function to capture relevant data and insert it into the `deleted_users` table before the profile is removed.
- **`updated_at` Trigger**: A trigger will automatically update the `updated_at` column in the `profiles` table whenever a row is modified.
- **JSONB Validation**: The structure and values within the `parameters` and `social_links` `JSONB` columns will be validated at the application layer before being sent to the database.
