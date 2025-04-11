import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db } from "./db";

// This script will synchronize your database schema with your Drizzle schema
async function main() {
  console.log("Starting database schema migration...");
  
  try {
    await migrate(db, { migrationsFolder: "drizzle/migrations" });
    console.log("Database schema migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();