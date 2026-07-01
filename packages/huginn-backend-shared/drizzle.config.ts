import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
   out: "./drizzle",
   schema: "./src/database/schema.ts",
   dialect: "postgresql",
   dbCredentials: {
      url: process.env.POSTGRESQL_URL!,
   },
});
