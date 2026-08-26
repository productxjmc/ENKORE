-- Provisions the least-privilege role the APPLICATION connects as at
-- runtime. Neon's default owner role (neondb_owner, or whatever role ran
-- `prisma migrate`) has BYPASSRLS — confirmed empirically, not assumed —
-- so every policy in rls.sql is silently ignored for that role no matter
-- how many `FORCE ROW LEVEL SECURITY` statements it carries. This role is
-- what makes RLS actually apply.
--
-- Run once per environment (dev/staging/prod each need their own) via
-- `npm run db:provision-role` (scripts/provision-role.mjs), which
-- generates a random password, substitutes it for the __APP_RUNTIME_PASSWORD__
-- placeholder below, and never prints or commits it — it's written straight
-- to your local .env. Safe to re-run: role creation is guarded, grants are
-- idempotent (a re-run rotates the password).

do $$
begin
  if not exists (select from pg_roles where rolname = 'app_runtime') then
    create role app_runtime login password '__APP_RUNTIME_PASSWORD__' nosuperuser nocreatedb nocreaterole nobypassrls;
  else
    alter role app_runtime with password '__APP_RUNTIME_PASSWORD__';
  end if;
end
$$;

grant usage on schema public to app_runtime;
grant usage on schema app to app_runtime;

grant select, insert, update, delete on all tables in schema public to app_runtime;
grant usage, select on all sequences in schema public to app_runtime;
grant execute on all functions in schema app to app_runtime;

-- So future `prisma migrate` runs (as the owner role) don't require a
-- manual re-grant before app_runtime can see the new table.
alter default privileges for role neondb_owner in schema public
  grant select, insert, update, delete on tables to app_runtime;
alter default privileges for role neondb_owner in schema public
  grant usage, select on sequences to app_runtime;
alter default privileges for role neondb_owner in schema app
  grant execute on functions to app_runtime;
