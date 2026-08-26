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

// Postgres has no `CREATE POLICY OR REPLACE` — re-running rls.sql verbatim
// fails on every table whose policies already exist. rls.sql itself stays
// pure "desired state" SQL (that's what makes it reviewable); this script
// makes re-runs idempotent by dropping each named policy first.
const policyRefs = [...sql.matchAll(/create policy (\w+) on "(\w+)"/g)];
const dropStatements = policyRefs
  .map(([, policy, table]) => `drop policy if exists ${policy} on "${table}";`)
  .join("\n");

const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query(dropStatements);
  await client.query(sql);
  console.log(`RLS policies applied (${policyRefs.length} policies across ${new Set(policyRefs.map((r) => r[2])).size} tables).`);
} finally {
  await client.end();
}
