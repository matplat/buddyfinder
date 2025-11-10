/**
 * Test fixtures for sports data
 */

import type { SportDto } from "@/types";

export const mockSportBieganie: SportDto = {
  id: 1,
  name: "bieganie",
};

export const mockSportRowerSzosowy: SportDto = {
  id: 2,
  name: "rower szosowy",
};

export const mockSportRowerMTB: SportDto = {
  id: 3,
  name: "rower mtb",
};

export const mockSportPlywanieBasen: SportDto = {
  id: 4,
  name: "pływanie w basenie",
};

export const mockSportPlywanieOtwarte: SportDto = {
  id: 5,
  name: "pływanie na wodach otwartych",
};

export const mockSportRolki: SportDto = {
  id: 6,
  name: "rolki",
};

export const mockSportNurkowanie: SportDto = {
  id: 7,
  name: "nurkowanie",
};

export const mockSportTenis: SportDto = {
  id: 8,
  name: "tenis",
};

/**
 * All available sports as an array
 */
export const mockAllSports: SportDto[] = [
  mockSportBieganie,
  mockSportRowerSzosowy,
  mockSportRowerMTB,
  mockSportPlywanieBasen,
  mockSportPlywanieOtwarte,
  mockSportRolki,
  mockSportNurkowanie,
  mockSportTenis,
];

/**
 * Helper to get sport by name
 */
export const getSportByName = (name: string): SportDto | undefined => {
  return mockAllSports.find((sport) => sport.name === name);
};

/**
 * Helper to get sport by id
 */
export const getSportById = (id: number): SportDto | undefined => {
  return mockAllSports.find((sport) => sport.id === id);
};
