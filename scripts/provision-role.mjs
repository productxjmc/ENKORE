// Creates/rotates the app_runtime Postgres role (see prisma/provision-role.sql
// for why this role has to exist at all — Neon's owner role has BYPASSRLS,
// which makes every RLS policy silently inert for it). Generates a random
// password, applies the SQL, and prints the resulting DATABASE_URL for you
// to paste into .env — it is never written to disk or logged anywhere else.
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
const template = readFileSync(path.join(here, "..", "prisma", "provision-role.sql"), "utf8");

const password = randomBytes(24).toString("base64").replace(/[+/=]/g, "");
const sql = template.replaceAll("__APP_RUNTIME_PASSWORD__", password);

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  console.error("DIRECT_URL is not set");
  process.exit(1);
}

const client = new pg.Client({ connectionString: directUrl });
await client.connect();
try {
  await client.query(sql);
  console.log("app_runtime role provisioned.");
} finally {
  await client.end();
}

// Rebuild the pooled connection string with the new role, reusing the
// host/db/query-string from DIRECT_URL's sibling (DATABASE_URL if set,
// otherwise DIRECT_URL as a fallback shape).
const source = new URL(process.env.DATABASE_URL || directUrl);
source.username = "app_runtime";
source.password = password;
console.log("\nNew DATABASE_URL for .env (runtime connection):\n");
console.log(source.toString());
