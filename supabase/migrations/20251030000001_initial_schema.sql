-- Migration: Initial Schema Creation
-- Description: Creates the initial database schema for BuddyFinder application
-- Author: GitHub Copilot
-- Date: 2025-10-30
-- Tables affected: profiles, sports, user_sports, deleted_users
-- Special notes: 
--   - Enables row level security on all tables
--   - Creates triggers for profile auto-creation and updated_at timestamps
--   - Sets up PostGIS extension for location-based features

-- enable the required extensions
create extension if not exists "postgis";

-- create the sports dictionary table
create table public.sports (
    id serial primary key,
    name text not null unique
);

-- enable row level security
alter table public.sports enable row level security;

-- sports table policies
-- allow anyone to read sports data
create policy "Anyone can view sports"
    on public.sports
    for select
    to anon
    using (true);

create policy "Authenticated users can view sports"
    on public.sports
    for select
    to authenticated
    using (true);

-- only allow administrators to modify sports (handled through supabase dashboard)

-- create the profiles table
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique check (username ~ '^[a-z0-9_]+$'),
    display_name text,
    location geometry(point, 4326),
    default_range_km integer check (default_range_km >= 1 and default_range_km <= 100),
    social_links jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz
);

-- enable row level security
alter table public.profiles enable row level security;

-- create indexes for profiles
create index profiles_username_idx on public.profiles (lower(username));
create index profiles_location_idx on public.profiles using gist (location);
create index profiles_social_links_idx on public.profiles using gin (social_links);

-- profiles table policies
-- allow anyone to view profiles
create policy "Anyone can view profiles"
    on public.profiles
    for select
    to anon
    using (true);

create policy "Authenticated users can view profiles"
    on public.profiles
    for select
    to authenticated
    using (true);

-- allow users to update only their own profile
create policy "Users can update own profile"
    on public.profiles
    for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- create the user_sports join table
create table public.user_sports (
    user_id uuid references public.profiles(id) on delete cascade,
    sport_id integer references public.sports(id) on delete cascade,
    parameters jsonb not null,
    custom_range_km integer check (custom_range_km >= 1 and custom_range_km <= 100),
    primary key (user_id, sport_id)
);

-- enable row level security
alter table public.user_sports enable row level security;

-- create index for user_sports
create index user_sports_parameters_idx on public.user_sports using gin (parameters);

-- user_sports table policies
-- allow anyone to view user_sports
create policy "Anyone can view user sports"
    on public.user_sports
    for select
    to anon
    using (true);

create policy "Authenticated users can view user sports"
    on public.user_sports
    for select
    to authenticated
    using (true);

-- allow users to manage their own sport entries
create policy "Users can insert own sport entries"
    on public.user_sports
    for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update own sport entries"
    on public.user_sports
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete own sport entries"
    on public.user_sports
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- create the deleted_users analytical table
create table public.deleted_users (
    id serial primary key,
    user_id uuid not null,
    created_at_original timestamptz not null,
    deleted_at timestamptz not null default now(),
    sports_count integer not null,
    connections_count integer not null default 0
);

-- enable row level security
alter table public.deleted_users enable row level security;

-- deleted_users table policies
-- only allow administrators to view deleted users data (handled through supabase dashboard)

-- create trigger function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql security definer;

-- create trigger for profiles table
create trigger on_profiles_updated
    before update on public.profiles
    for each row
    execute procedure public.handle_updated_at();

-- create trigger function to handle user deletion
create or replace function public.handle_user_deletion()
returns trigger as $$
begin
    insert into public.deleted_users (
        user_id,
        created_at_original,
        sports_count,
        connections_count
    )
    values (
        old.id,
        old.created_at,
        (select count(*) from public.user_sports where user_id = old.id),
        0  -- placeholder for future connections feature
    );
    return old;
end;
$$ language plpgsql security definer;

-- create trigger for profiles table
create trigger on_profile_deleted
    before delete on public.profiles
    for each row
    execute procedure public.handle_user_deletion();

-- create trigger function to create profile on user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id)
    values (new.id);
    return new;
end;
$$ language plpgsql security definer;

-- create trigger for auth.users table
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute procedure public.handle_new_user();

-- add helpful comments to tables and columns
comment on table public.profiles is 'Stores public user profile information';
comment on column public.profiles.id is 'References the auth.users table';
comment on column public.profiles.username is 'Unique, URL-friendly identifier (lowercase letters, numbers, underscores only)';
comment on column public.profiles.location is 'Geographical location for matching (SRID 4326)';
comment on column public.profiles.default_range_km is 'Default travel range in kilometers (1-100)';
comment on column public.profiles.social_links is 'JSON storage for social media links';

comment on table public.sports is 'Dictionary of available sports';
comment on column public.sports.name is 'Name of the sport';

comment on table public.user_sports is 'Many-to-many relationship between users and their sports';
comment on column public.user_sports.parameters is 'Sport-specific parameters (e.g., pace, power)';
comment on column public.user_sports.custom_range_km is 'Optional sport-specific travel range override';

comment on table public.deleted_users is 'Analytical table for tracking deleted user data';
comment on column public.deleted_users.sports_count is 'Number of sports the user had';
comment on column public.deleted_users.connections_count is 'Number of connections (future feature)';