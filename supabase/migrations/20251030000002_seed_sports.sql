-- Migration: Seed Sports Table
-- Description: Inserts initial sport disciplines for MVP version
-- Author: GitHub Copilot
-- Date: 2025-10-30
-- Tables affected: sports
-- Special notes: 
--   - These are the core sports defined in PRD for MVP
--   - Sport names are in lowercase for consistency
--   - If you need to add more sports later, create a new migration

-- delete existing data from sports table
-- this ensures we don't get primary key conflicts and maintains a clean state
truncate table public.sports restart identity cascade;

-- insert core sports for MVP
insert into public.sports (name) values
    ('bieganie'),
    ('rower szosowy'),
    ('rower mtb'),
    ('pływanie w basenie'),
    ('pływanie na wodach otwartych'),
    ('rolki'),
    ('nurkowanie'),
    ('tenis');

-- add helpful comments about the inserted sports
comment on table public.sports is 'Core sports available in MVP version as defined in PRD';