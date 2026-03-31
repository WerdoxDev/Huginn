import { defineConfig } from "prisma/config";

export default defineConfig({
   schema: "prisma/schema.prisma",
   migrations: {
      path: "prisma/migrations",
   },
   datasource: {
      url: "postgres://neondb_owner:ltTC3WhoIge8@ep-broad-water-a2fs6hmn-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require",
   },
});
