import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Migrate/CLI operations (schema push, migrations, introspection) use the
// direct (unpooled) Neon connection. The application itself never imports
// this file — see src/lib/db.ts for the runtime client, which goes through
// the Neon driver adapter on the pooled DATABASE_URL instead.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
});
