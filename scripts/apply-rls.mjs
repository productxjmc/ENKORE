// Applies prisma/rls.sql against DIRECT_URL. Run after every `prisma
// migrate` — Prisma has no concept of RLS policies, so this step is
// separate and must be re-run whenever rls.sql changes, not just once.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(path.join(here, "..", "prisma", "rls.sql"), "utf8");

const connectionString = process.env.DIRECT_URL;
if (!connectionString) {
  console.error("DIRECT_URL is not set");
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query(sql);
  console.log("RLS policies applied.");
} finally {
  await client.end();
}
