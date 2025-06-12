
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Production database URL from environment variable
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Configure connection for production
const connectionString = databaseUrl;

// Create connection with production settings
const client = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 20,
  idle_timeout: 20,
  connect_timeout: 60,
});

export const db = drizzle(client, { schema });
