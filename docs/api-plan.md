# REST API Plan

## 1. Resources

- **Profiles**: Represents user profile data. Corresponds to the `profiles` table.
- **Sports**: Represents the predefined list of available sports. Corresponds to the `sports` table.
- **UserSports**: Represents the sports associated with a user. Corresponds to the `user_sports` table.
- **Matches**: A computed resource representing a list of matched users based on location and sports.

## 2. Endpoints

### Authentication

All endpoints require authentication via a Supabase JWT passed in the `Authorization: Bearer <token>` header. The API will use this token to identify the user and enforce Row-Level Security (RLS) policies.

---

### Profiles

#### Get Current User's Profile

- **Method**: `GET`
- **URL**: `/api/profiles/me`
- **Description**: Retrieves the complete profile for the currently authenticated user.
- **Query Parameters**: None
- **Request Payload**: None
- **Success Response**:
  - **Code**: `200 OK`
  - **Payload**:

    ```json
    {
      "id": "a1b2c3d4-...",
      "username": "john_doe",
      "display_name": "John Doe",
      "location": { "type": "Point", "coordinates": [-74.0060, 40.7128] },
      "default_range_km": 25,
      "social_links": {
        "strava": "https://strava.com/users/12345"
      },
      "created_at": "2025-10-31T10:00:00Z",
      "updated_at": "2025-10-31T12:00:00Z"
    }
    ```

- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If the user's profile does not exist.

#### Update Current User's Profile

- **Method**: `PATCH`
- **URL**: `/api/profiles/me`
- **Description**: Updates mutable fields of the currently authenticated user's profile.
- **Query Parameters**: None
- **Request Payload**:

  ```json
  {
    "display_name": "Johnny Doe",
    "location": { "type": "Point", "coordinates": [-73.9857, 40.7484] },
    "default_range_km": 30,
    "social_links": {
      "strava": "https://strava.com/users/12345",
      "garmin": "https://connect.garmin.com/modern/profile/johndoe"
    }
  }
  ```

- **Success Response**:
  - **Code**: `200 OK`
  - **Payload**: The updated profile object (same structure as `GET /api/profiles/me`).
- **Error Responses**:
  - `400 Bad Request`: If validation fails (e.g., `default_range_km` is out of bounds 1-100).
  - `401 Unauthorized`: If the user is not authenticated.

---

### Sports

#### Get List of All Sports

- **Method**: `GET`
- **URL**: `/api/sports`
- **Description**: Retrieves the predefined list of all available sports. This is a public, read-only endpoint for authenticated users.
- **Query Parameters**: None
- **Request Payload**: None
- **Success Response**:
  - **Code**: `200 OK`
  - **Payload**:

    ```json
    [
      { "id": 1, "name": "Running" },
      { "id": 2, "name": "Road Cycling" },
      { "id": 3, "name": "MTB" }
    ]
    ```

- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.

---

### User Sports (Managing sports for the current user)

#### Get User's Sports

- **Method**: `GET`
- **URL**: `/api/profiles/me/sports`
- **Description**: Retrieves the list of sports and associated parameters for the current user.
- **Query Parameters**: None
- **Request Payload**: None
- **Success Response**:
  - **Code**: `200 OK`
  - **Payload**:

    ```json
    [
      {
        "sport_id": 1,
        "name": "Running",
        "parameters": { "pace_seconds": 330, "distance_km": 10 },
        "custom_range_km": 15
      }
    ]
    ```

- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.

#### Add a Sport to User's Profile

- **Method**: `POST`
- **URL**: `/api/profiles/me/sports`
- **Description**: Adds a new sport to the user's profile.
- **Query Parameters**: None
- **Request Payload**:

  ```json
  {
    "sport_id": 2,
    "parameters": { "speed_km_h": 30, "distance_km": 60 },
    "custom_range_km": 40
  }
  ```

- **Success Response**:
  - **Code**: `201 Created`
  - **Payload**: The newly created user sport object.
- **Error Responses**:
  - `400 Bad Request`: If validation fails (e.g., `sport_id` doesn't exist, `custom_range_km` is out of bounds).
  - `401 Unauthorized`: If the user is not authenticated.
  - `409 Conflict`: If the user already has this sport on their profile.

#### Update a Sport on User's Profile

- **Method**: `PUT`
- **URL**: `/api/profiles/me/sports/{sport_id}`
- **Description**: Updates the parameters or custom range for a specific sport on the user's profile.
- **Query Parameters**: None
- **Request Payload**:

  ```json
  {
    "parameters": { "pace_seconds": 320, "distance_km": 12 },
    "custom_range_km": 20
  }
  ```

- **Success Response**:
  - **Code**: `200 OK`
  - **Payload**: The updated user sport object.
- **Error Responses**:
  - `400 Bad Request`: If validation fails.
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If the user does not have this sport on their profile.

#### Remove a Sport from User's Profile

- **Method**: `DELETE`
- **URL**: `/api/profiles/me/sports/{sport_id}`
- **Description**: Removes a sport from the user's profile.
- **Query Parameters**: None
- **Request Payload**: None
- **Success Response**:
  - **Code**: `204 No Content`
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If the user does not have this sport on their profile.

---

### Matches

#### Get Matched Users

- **Method**: `GET`
- **URL**: `/api/matches`
- **Description**: Retrieves a list of other users who are potential matches. The matching logic is based on the intersection of travel ranges. The results are sorted by distance (ascending) and then by the number of common sports (descending).
- **Query Parameters**:
  - `limit` (integer, optional, default: 20): For pagination.
  - `offset` (integer, optional, default: 0): For pagination.
- **Request Payload**: None
- **Success Response**:
  - **Code**: `200 OK`
  - **Payload**:

    ```json
    {
      "data": [
        {
          "user_id": "d4e5f6a7-...",
          "username": "jane_runner",
          "display_name": "Jane Runner",
          "email": "jane.runner@example.com",
          "distance_km": 5.4,
          "social_links": { "strava": "..." },
          "sports": [
            {
              "sport_id": 1,
              "name": "Running",
              "parameters": { "pace_seconds": 340, "distance_km": 10 }
            }
          ]
        }
      ],
      "pagination": {
        "total": 1,
        "limit": 20,
        "offset": 0
      }
    }
    ```

- **Error Responses**:
  - `400 Bad Request`: If the current user has not set their location or default distance.
  - `401 Unauthorized`: If the user is not authenticated.

## 3. Authentication and Authorization

- **Authentication**: Handled by Supabase. The client application is responsible for signing up/in users and acquiring a JWT. Every request to this API must include the JWT in the `Authorization: Bearer <token>` header.
- **Authorization**: Primarily enforced by PostgreSQL's Row-Level Security (RLS) policies, as defined in `db-plan.md`.
  - Users can only modify their own `profiles` and `user_sports` entries.
  - All authenticated users can view all `profiles` and `user_sports` data, which is necessary for the matching feature.
- The API backend will validate the JWT and use the `user_id` from it to execute database queries, automatically applying the RLS policies.

## 4. Validation and Business Logic

- **Validation**:
  - Input validation is performed at the API layer before data is sent to the database.
  - `profiles.default_range_km` and `user_sports.custom_range_km` must be between 1 and 100.
  - `profiles.username` must match the regex `^[a-z0-9_]+$`.
  - `user_sports.parameters` JSONB object structure will be validated in the application logic to ensure it contains the correct keys for each sport.
- **Business Logic**:
  - **User Matching (`GET /api/matches`)**: This is the core business logic. The endpoint will:
    1. Get the current user's profile, including their location and all their sports with their respective ranges (custom or default).
    2. Execute a PostGIS query (`ST_DWithin`) to find all other users whose location is within the combined range (current user's range for a sport + other user's range for that sport).
    3. For the matched users, calculate the number of common sports.
    4. Sort the results primarily by distance (ascending) and secondarily by the count of common sports (descending).
    5. Paginate and return the results.
  - **Profile Auto-Creation**: A database trigger on `auth.users` automatically creates a new entry in `public.profiles` upon user registration. The API does not need to handle this.
