#!/usr/bin/env tsx
/**
 * Script to manage test data for E2E tests
 * Usage:
 *   npm run test:e2e:seed    - Create all test users
 *   npm run test:e2e:cleanup - Remove all test users
 */

/* eslint-disable no-console */

import { DatabaseHelper } from "./database.helper";
import { ALL_TEST_USERS } from "../fixtures/test-users.fixture";

async function seedTestData() {
  console.log("🌱 Seeding test data...");

  const db = new DatabaseHelper();

  try {
    await db.seedAllTestUsers(ALL_TEST_USERS);
    console.log("✅ Test data seeded successfully");
  } catch (error) {
    console.error("❌ Failed to seed test data:", error);
    process.exit(1);
  }
}

async function cleanupTestData() {
  console.log("🧹 Cleaning up test data...");

  const db = new DatabaseHelper();
  const testEmails = ALL_TEST_USERS.map((user) => user.email);

  try {
    await db.cleanupTestUsers(testEmails);
    console.log("✅ Test data cleaned up successfully");
  } catch (error) {
    console.error("❌ Failed to cleanup test data:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const command = process.argv[2];

if (command === "seed") {
  seedTestData();
} else if (command === "cleanup") {
  cleanupTestData();
} else {
  console.log("Usage: tsx manage-test-data.ts [seed|cleanup]");
  process.exit(1);
}
