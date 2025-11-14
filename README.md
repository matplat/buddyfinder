# FITLink

## Table of Contents

- [FITLink](#fitlink)
  - [Table of Contents](#table-of-contents)
  - [Project Description](#project-description)
  - [Tech Stack](#tech-stack)
    - [Frontend](#frontend)
    - [Backend \& Database](#backend--database)
    - [Maps](#maps)
  - [Getting Started Locally](#getting-started-locally)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Available Scripts](#available-scripts)
  - [Project Scope](#project-scope)
  - [Project Status](#project-status)
  - [License](#license)

## Project Description

FITLink is a web application designed to connect amateur athletes and sports enthusiasts. It addresses the common challenge of finding training partners with similar skill levels, interests, and geographical proximity. Users can create a profile, specify their favorite sports and skill levels, and discover others in their area to team up with for activities.

## Tech Stack

### Frontend

- **Astro 5**: For building fast, content-focused pages and server-side API endpoints.
- **React 19**: Used for creating dynamic and interactive UI components.
- **TypeScript 5**: Ensures type safety across the application.
- **Tailwind CSS 4**: A utility-first CSS framework for rapid UI development.
- **Shadcn/ui**: A collection of pre-built, accessible UI components.

### Backend & Database

- **Supabase**: Backend-as-a-Service (BaaS) for authentication, database, and storage.
- **PostgreSQL with PostGIS**: For storing and querying geospatial data.

### Maps

- **OpenStreetMaps (OSM)**: Provides free and open map data.
- **Leaflet.js**: A lightweight JavaScript library for interactive maps.

### Testing

- **Vitest**: Framework for unit and integration tests.
- **React Testing Library**: Library for testing React components.
- **Playwright**: Framework for end-to-end (E2E) testing.
- **Mock Service Worker**: API mocking for integration tests.

## Getting Started Locally

### Prerequisites

- **Node.js**: Version `22.14.0` is required. You can use a version manager like `nvm` to switch to the correct version.
- **npm**: Should be installed with Node.js.

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/fitlink.git
    cd fitlink
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set up environment variables:**
    - Create a `.env` file by copying the example file:

      ```bash
      cp .env.example .env
      ```

    - Fill in the required environment variables in the `.env` file (e.g., Supabase URL and keys).

4. **Run the development server:**

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:4321`.

## Available Scripts

### Development

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Previews the production build locally.

### Code Quality

- `npm run lint`: Lints the codebase for errors.
- `npm run lint:fix`: Lints the codebase and automatically fixes issues.
- `npm run format`: Formats the code using Prettier.

### Testing

- `npm run test:unit`: Runs all unit tests once.
- `npm run test:unit:watch`: Runs unit tests in watch mode (auto-rerun on file changes).
- `npm run test:unit:ui`: Opens Vitest UI for interactive test exploration.
- `npm run test:coverage`: Generates code coverage report.

#### Running Specific Tests

```bash
# Run tests for a specific file
npm run test:unit -- src/lib/services/__tests__/user-sport.service.test.ts

# Run tests matching a pattern
npm run test:unit -- -t "should add user sport"
```

#### Test Coverage

Current test coverage: **~98%**

The project includes comprehensive unit tests for:
- **DTOs & Validation** (`src/lib/dto/__tests__/`): Zod schema validation for user inputs
- **Services** (`src/lib/services/__tests__/`): Business logic for user sports and matching
- **Configuration** (`src/lib/config/__tests__/`): Sport parameters and utilities

See `/docs/test-plan.md` for detailed testing strategy and coverage requirements.

## Project Scope

The MVP (Minimum Viable Product) of FITLink includes the following features:

- **User Account Management**: Registration, login, and logout.
- **User Profile Management**:
  - Select sports from a predefined list.
  - Define skill-based parameters for each sport.
  - Set a primary location and travel radius.
  - Optionally add links to social media profiles.
- **Partner Matching**:
  - View a list of users whose travel radius intersects with yours.
  - User list includes username, email, sports, and skill parameters.
  - Results are sorted by distance and the number of shared sports.

## Project Status

This project is currently **in development**.

## License

This project is licensed under the **MIT License**.
