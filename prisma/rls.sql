-- ENKORE Row-Level Security policies (Postgres / Neon)
-- Translated from the `rls` blocks in base44/entities/*.jsonc in the
-- original Base44 codebase. Run this AFTER `prisma migrate` — Prisma does
-- not manage RLS policies, so this file is applied separately (see
-- package.json `db:rls` script) and re-applied whenever it changes.
--
-- SESSION CONTEXT
-- Set per request, before any query, by src/lib/db.ts:
--   app.user_id    -- our User.id (synced from Clerk) of the caller, or '' if anonymous
--   app.user_email -- caller's verified email, or ''
--   app.user_role  -- 'ADMIN' | 'MODERATOR' | 'USER' | ''
-- These are connection-scoped (SET LOCAL inside a transaction), never
-- trusted from client input.
--
-- IMPORTANT: the Postgres role Prisma connects as must NOT own these
-- tables and must NOT be a superuser, or RLS is silently skipped. Use a
-- dedicated `app_runtime` role for the application, reserve the
-- migration/owner role for `prisma migrate` only.
--
-- DELIBERATE DEVIATION FROM BASE44: Base44 auto-stamps every record with
-- `created_by_id` and many of its rls rules fall back to "the creator
-- always has access". This schema has no generic createdById column —
-- ownership is expressed through the actual domain relation instead
-- (Musician.userId, Fan.userId, Affiliate.userId, or an email match for
-- guest/pre-account flows). That's more precise than a bare creator flag
-- for every case where the "creator" of a row IS the Musician/Fan/
-- Affiliate the row belongs to. The exception is FanWallPost, where
-- Base44's own schema has no fan-identity field to match against either
-- (see below) — simplified to admin-moderated writes there.
--
-- SCOPE: this is a first-pass, careful translation of the *original*
-- rules for review, not a final sign-off — a few entities (BookingEnquiry,
-- MusicianPreRegistration, MusicianNomination, FanRewardSurvey,
-- EarlyAccessSignup) are public lead-gen forms where Base44's rules were
-- ambiguous about anonymous submission; here they're public-insert +
-- admin-read, which is simpler and errs toward protecting PII rather than
-- restricting form submission (the safer direction to be wrong in).

create schema if not exists app;

create or replace function app.uid() returns text language sql stable as
  $$ select nullif(current_setting('app.user_id', true), '') $$;

create or replace function app.email() returns text language sql stable as
  $$ select nullif(current_setting('app.user_email', true), '') $$;

create or replace function app.is_admin() returns boolean language sql stable as
  $$ select coalesce(current_setting('app.user_role', true), '') = 'ADMIN' $$;

-- True if the caller IS the musician the given Musician.id refers to
-- (matched by linked Clerk-backed userId, falling back to email for
-- musicians who don't yet have a userId synced).
create or replace function app.owns_musician(target_id text) returns boolean language sql stable as $$
  select exists (
    select 1 from "Musician" m
    where m.id = target_id
      and (m."userId" = app.uid() or (m.email = app.email() and app.email() is not null))
  )
$$;

create or replace function app.owns_fan(target_id text) returns boolean language sql stable as $$
  select exists (
    select 1 from "Fan" f
    where f.id = target_id
      and (f."userId" = app.uid() or (f.email = app.email() and app.email() is not null))
  )
$$;

create or replace function app.owns_affiliate(target_id text) returns boolean language sql stable as $$
  select exists (
    select 1 from "Affiliate" a
    where a.id = target_id
      and (a."userId" = app.uid() or (a.email = app.email() and app.email() is not null))
  )
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Identity
-- ─────────────────────────────────────────────────────────────────────────

alter table "User" enable row level security;
alter table "User" force row level security;
create policy user_select on "User" for select using (id = app.uid() or app.is_admin());
create policy user_update on "User" for update using (id = app.uid() or app.is_admin())
  with check (id = app.uid() or app.is_admin());
-- User rows are created/removed only by server-side code connected via
-- withServiceRole (the Clerk webhook handler, and getCurrentAppUser()'s
-- inline-create fallback for the first request after sign-up, before the
-- webhook has landed) — never a client-scoped self-insert, since nothing
-- has verified the caller's claimed clerkId/email against Clerk at that
-- point. BUG FIX (found live in production): this table had FORCE ROW
-- LEVEL SECURITY with zero insert/delete policies at all, which blocks
-- insert/delete for every session including service-role ones — Postgres
-- denies an entire command type outright when no policy of that type
-- exists, session variables notwithstanding. That broke both call sites
-- above (P2039-shaped failures), meaning brand-new Clerk sign-ins could
-- fail site-wide. Every other identity table (Fan, Affiliate) already had
-- a `for all` policy covering insert; User was the only one missing it.
create policy user_insert on "User" for insert with check (app.is_admin());
create policy user_delete on "User" for delete using (app.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- Musicians & catalogue — storefronts are public by product design
-- ─────────────────────────────────────────────────────────────────────────

alter table "Musician" enable row level security;
alter table "Musician" force row level security;
create policy musician_select on "Musician" for select using (true);
create policy musician_write on "Musician" for all using (
  "userId" = app.uid() or (email = app.email() and app.email() is not null) or app.is_admin()
) with check (
  "userId" = app.uid() or (email = app.email() and app.email() is not null) or app.is_admin()
);

alter table "Track" enable row level security;
alter table "Track" force row level security;
create policy track_select on "Track" for select using (true);
create policy track_write on "Track" for all using (app.owns_musician("musicianId") or app.is_admin())
  with check (app.owns_musician("musicianId") or app.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- Fans & engagement
-- ─────────────────────────────────────────────────────────────────────────

alter table "Fan" enable row level security;
alter table "Fan" force row level security;
create policy fan_select on "Fan" for select using (
  "userId" = app.uid() or (email = app.email() and app.email() is not null) or app.is_admin()
);
create policy fan_write on "Fan" for all using (
  "userId" = app.uid() or (email = app.email() and app.email() is not null) or app.is_admin()
) with check (
  "userId" = app.uid() or (email = app.email() and app.email() is not null) or app.is_admin()
);

alter table "Follow" enable row level security;
alter table "Follow" force row level security;
create policy follow_select on "Follow" for select using (
  app.owns_fan("fanId") or app.owns_musician("musicianId") or app.is_admin()
);
create policy follow_insert on "Follow" for insert with check (true); -- public: following requires no account
create policy follow_update on "Follow" for update using (app.owns_fan("fanId") or app.is_admin());
create policy follow_delete on "Follow" for delete using (app.owns_fan("fanId") or app.is_admin());

-- FanWallPost: Base44's original rule was `create: null`, meaning no
-- direct client insert at all — posts are written server-side (e.g. after
-- a lightweight spam/profanity check) rather than trusted from the
-- client. Its schema also has no fan identity field (fan_name/fan_email
-- are free text, not a Fan reference), so the usual creator fallback
-- can't be matched against anything reliable for edits either.
alter table "FanWallPost" enable row level security;
alter table "FanWallPost" force row level security;
create policy fanwallpost_select on "FanWallPost" for select using ("isVisible" = true or app.is_admin());
-- No insert policy: the POST /fan-wall API route writes through a service
-- connection after validating the message server-side.
create policy fanwallpost_modify on "FanWallPost" for update using (app.is_admin()) with check (app.is_admin());
create policy fanwallpost_delete on "FanWallPost" for delete using (app.is_admin());

alter table "Message" enable row level security;
alter table "Message" force row level security;
create policy message_select on "Message" for select using (
  app.owns_musician("musicianId")
  or ("fanId" is not null and app.owns_fan("fanId"))
  or ("fanEmail" = app.email() and app.email() is not null)
  or app.is_admin()
);
create policy message_insert on "Message" for insert with check (
  app.owns_musician("musicianId") or ("fanEmail" = app.email() and app.email() is not null) or app.is_admin()
);
create policy message_modify on "Message" for update using (
  app.owns_musician("musicianId") or ("fanEmail" = app.email() and app.email() is not null) or app.is_admin()
) with check (
  app.owns_musician("musicianId") or ("fanEmail" = app.email() and app.email() is not null) or app.is_admin()
);
create policy message_delete on "Message" for delete using (
  app.owns_musician("musicianId") or ("fanEmail" = app.email() and app.email() is not null) or app.is_admin()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Events, bookings, tours
-- ─────────────────────────────────────────────────────────────────────────

alter table "Event" enable row level security;
alter table "Event" force row level security;
create policy event_select on "Event" for select using (true);
create policy event_write on "Event" for all using (app.owns_musician("musicianId") or app.is_admin())
  with check (app.owns_musician("musicianId") or app.is_admin());

alter table "TicketPurchase" enable row level security;
alter table "TicketPurchase" force row level security;
create policy ticketpurchase_select on "TicketPurchase" for select using (
  app.owns_fan("fanId") or app.owns_musician("musicianId") or app.is_admin()
);
-- No PUBLIC insert policy — ticket purchases are created server-side only,
-- from a verified payment-gateway webhook (never trust client-asserted
-- payment status — see the Yoco price-validation gap noted separately).
-- Still needs its own app.is_admin()-scoped policy for that server code to
-- write through at all — RLS is default-deny per command, confirmed the
-- hard way on Purchase's identical pattern (see the comment there).
create policy ticketpurchase_write on "TicketPurchase" for insert with check (app.is_admin());
create policy ticketpurchase_modify on "TicketPurchase" for update using (app.owns_musician("musicianId") or app.is_admin())
  with check (app.owns_musician("musicianId") or app.is_admin());
create policy ticketpurchase_delete on "TicketPurchase" for delete using (app.owns_musician("musicianId") or app.is_admin());

alter table "Attendance" enable row level security;
alter table "Attendance" force row level security;
create policy attendance_select on "Attendance" for select using (
  app.owns_musician("musicianId") or ("fanEmail" = app.email() and app.email() is not null) or app.is_admin()
);
create policy attendance_insert on "Attendance" for insert with check (true); -- QR check-in at the door, walk-ups included
create policy attendance_modify on "Attendance" for update using (app.owns_musician("musicianId") or app.is_admin())
  with check (app.owns_musician("musicianId") or app.is_admin());
create policy attendance_delete on "Attendance" for delete using (app.is_admin());

alter table "BookingEnquiry" enable row level security;
alter table "BookingEnquiry" force row level security;
create policy bookingenquiry_select on "BookingEnquiry" for select using (
  app.owns_musician("musicianId") or ("organizerEmail" = app.email() and app.email() is not null) or app.is_admin()
);
create policy bookingenquiry_insert on "BookingEnquiry" for insert with check (true); -- public booking request form, no account required
create policy bookingenquiry_modify on "BookingEnquiry" for update using (app.owns_musician("musicianId") or app.is_admin())
  with check (app.owns_musician("musicianId") or app.is_admin());
create policy bookingenquiry_delete on "BookingEnquiry" for delete using (app.owns_musician("musicianId") or app.is_admin());

alter table "AvailabilitySlot" enable row level security;
alter table "AvailabilitySlot" force row level security;
create policy availabilityslot_select on "AvailabilitySlot" for select using (true);
create policy availabilityslot_write on "AvailabilitySlot" for all using (app.owns_musician("musicianId") or app.is_admin())
  with check (app.owns_musician("musicianId") or app.is_admin());

alter table "TourCampaign" enable row level security;
alter table "TourCampaign" force row level security;
create policy tourcampaign_select on "TourCampaign" for select using (true);
create policy tourcampaign_write on "TourCampaign" for all using (app.owns_musician("musicianId") or app.is_admin())
  with check (app.owns_musician("musicianId") or app.is_admin());

alter table "TourContribution" enable row level security;
alter table "TourContribution" force row level security;
create policy tourcontribution_select on "TourContribution" for select using (
  app.owns_musician("musicianId") or ("fanEmail" = app.email() and app.email() is not null) or app.is_admin()
);
-- No PUBLIC insert — created server-side from a verified payment webhook.
-- Same app.is_admin() write policy needed for that code to write at all —
-- see the Purchase comment for why omitting this isn't merely stricter.
create policy tourcontribution_write on "TourContribution" for insert with check (app.is_admin());
create policy tourcontribution_modify on "TourContribution" for update using (app.owns_musician("musicianId") or app.is_admin())
  with check (app.owns_musician("musicianId") or app.is_admin());
create policy tourcontribution_delete on "TourContribution" for delete using (app.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- Commerce: purchases, merch, subscriptions — the highest-stakes tables
-- ─────────────────────────────────────────────────────────────────────────

alter table "Purchase" enable row level security;
alter table "Purchase" force row level security;
create policy purchase_select on "Purchase" for select using (
  ("fanEmail" = app.email() and app.email() is not null) or app.owns_musician("musicianId") or app.is_admin()
);
-- No PUBLIC/plain-user insert or update path — unlike the lead-gen tables,
-- a financial record gets no `with check (true)` insert. Confirmed the
-- hard way: RLS is default-deny per command, so simply omitting a policy
-- does NOT mean "the admin/service-role context can still write" — it
-- means nobody can, service role included, until an explicit policy says
-- so. purchase_write below is that policy, scoped to app.is_admin() (which
-- is what withServiceRole's context satisfies); anonymous/regular callers
-- still can't reach it since they're never granted that role. The only two
-- callers that ever run under an admin/service-role context here:
--   1. The payment-initialize route (src/app/api/payments/payfast/
--      initialize) — trusted because IT does the price validation, against
--      Track.minimumPrice, before creating the pending row. This is the
--      fix for the Yoco gap noted in the code review: initializePayment's
--      original Payfast path already did this correctly; initializeYoco/
--      initializePaymentGateway (a newer, undocumented second gateway
--      path found while porting Payfast) did not.
--   2. The webhook (src/app/api/webhooks/payfast) — trusted because it
--      verifies Payfast's signature and calls Payfast's own confirm
--      endpoint before ever touching this table.
create policy purchase_write on "Purchase" for insert with check (app.is_admin());
create policy purchase_modify on "Purchase" for update using (app.is_admin()) with check (app.is_admin());
create policy purchase_delete on "Purchase" for delete using (app.is_admin());

alter table "Merchandise" enable row level security;
alter table "Merchandise" force row level security;
create policy merchandise_select on "Merchandise" for select using (true);
create policy merchandise_write on "Merchandise" for all using (app.owns_musician("musicianId") or app.is_admin())
  with check (app.owns_musician("musicianId") or app.is_admin());

alter table "MerchandiseOrder" enable row level security;
alter table "MerchandiseOrder" force row level security;
create policy merchandiseorder_select on "MerchandiseOrder" for select using (
  ("fanEmail" = app.email() and app.email() is not null) or app.owns_musician("musicianId") or app.is_admin()
);
-- No PUBLIC insert — created server-side from a verified payment webhook.
-- Same app.is_admin() write policy needed for that code to write at all —
-- see the Purchase comment for why omitting this isn't merely stricter.
create policy merchandiseorder_write on "MerchandiseOrder" for insert with check (app.is_admin());
create policy merchandiseorder_modify on "MerchandiseOrder" for update using (app.owns_musician("musicianId") or app.is_admin())
  with check (app.owns_musician("musicianId") or app.is_admin());
create policy merchandiseorder_delete on "MerchandiseOrder" for delete using (app.is_admin());

alter table "FanSubscription" enable row level security;
alter table "FanSubscription" force row level security;
create policy fansubscription_select on "FanSubscription" for select using (
  ("fanEmail" = app.email() and app.email() is not null) or app.owns_musician("musicianId") or app.is_admin()
);
-- No PUBLIC insert — created server-side once the first payment clears.
-- Same app.is_admin() write policy needed for that code to write at all —
-- see the Purchase comment for why omitting this isn't merely stricter.
create policy fansubscription_write on "FanSubscription" for insert with check (app.is_admin());
create policy fansubscription_modify on "FanSubscription" for update using (app.is_admin())
  with check (app.is_admin()); -- cancellation goes through an API route, not a direct row edit
create policy fansubscription_delete on "FanSubscription" for delete using (app.is_admin());

alter table "MusicianSubscription" enable row level security;
alter table "MusicianSubscription" force row level security;
create policy musiciansubscription_select on "MusicianSubscription" for select using (
  app.owns_musician("musicianId") or app.is_admin()
);
-- No PUBLIC insert/update — subscription lifecycle is server-managed.
-- Same app.is_admin() write policy needed for that code to write at all —
-- see the Purchase comment for why omitting this isn't merely stricter.
create policy musiciansubscription_write on "MusicianSubscription" for insert with check (app.is_admin());
create policy musiciansubscription_modify on "MusicianSubscription" for update using (app.is_admin()) with check (app.is_admin());
create policy musiciansubscription_delete on "MusicianSubscription" for delete using (app.is_admin());

alter table "SubscriptionPayment" enable row level security;
alter table "SubscriptionPayment" force row level security;
create policy subscriptionpayment_select on "SubscriptionPayment" for select using (
  ("musicianEmail" = app.email() and app.email() is not null) or app.owns_musician("musicianId") or app.is_admin()
);
-- No PUBLIC insert/update — matches Base44's original `create: false,
-- update: false` (server/webhook-only, deliberately). That original rule
-- still let Base44's own backend functions write, through a first-party
-- privilege bypass outside the entity RLS system entirely; app.is_admin()
-- is this rebuild's equivalent, and — same as everywhere else this
-- pattern appears — needs its own explicit policy or nothing can write,
-- service-role code included.
create policy subscriptionpayment_write on "SubscriptionPayment" for insert with check (app.is_admin());
create policy subscriptionpayment_modify on "SubscriptionPayment" for update using (app.is_admin()) with check (app.is_admin());
create policy subscriptionpayment_delete on "SubscriptionPayment" for delete using (app.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- Payouts & fee plans — admin-controlled money movement
-- ─────────────────────────────────────────────────────────────────────────

alter table "Payout" enable row level security;
alter table "Payout" force row level security;
create policy payout_select on "Payout" for select using (app.owns_musician("musicianId") or app.is_admin());
create policy payout_write on "Payout" for all using (app.is_admin()) with check (app.is_admin());

alter table "MusicianPayoutInfo" enable row level security;
alter table "MusicianPayoutInfo" force row level security;
create policy musicianpayoutinfo_select on "MusicianPayoutInfo" for select using (
  app.owns_musician("musicianId") or app.is_admin()
);
create policy musicianpayoutinfo_write on "MusicianPayoutInfo" for all using (app.owns_musician("musicianId") or app.is_admin())
  with check (app.owns_musician("musicianId") or app.is_admin());

alter table "FeePlan" enable row level security;
alter table "FeePlan" force row level security;
create policy feeplan_select on "FeePlan" for select using (true);
create policy feeplan_write on "FeePlan" for all using (app.is_admin()) with check (app.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- Affiliates
-- ─────────────────────────────────────────────────────────────────────────

alter table "Affiliate" enable row level security;
alter table "Affiliate" force row level security;
create policy affiliate_select on "Affiliate" for select using (
  "userId" = app.uid() or (email = app.email() and app.email() is not null) or app.is_admin()
);
create policy affiliate_write on "Affiliate" for all using (
  "userId" = app.uid() or (email = app.email() and app.email() is not null) or app.is_admin()
) with check (
  "userId" = app.uid() or (email = app.email() and app.email() is not null) or app.is_admin()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Public lead-gen / pre-registration forms
-- Public insert, admin-only read/update/delete (PII protection > form
-- friction — see file header).
--
-- GOTCHA (confirmed against the live database, not theoretical): Prisma's
-- .create() does an implicit INSERT ... RETURNING, and Postgres RLS applies
-- the table's SELECT policy to that RETURNING output — so an anonymous
-- submitter passes the public INSERT check and then gets a
-- "new row violates row-level security policy" error anyway, from reading
-- the row back, because SELECT here is admin-only. Every API route that
-- writes to one of these tables from an anonymous/non-admin context must
-- use .createMany() (no RETURNING) instead of .create(), or run the write
-- through withServiceRole if the created row genuinely needs to be
-- returned to the caller. See src/app/api/first-fruits/route.ts.
-- ─────────────────────────────────────────────────────────────────────────

alter table "MusicianPreRegistration" enable row level security;
alter table "MusicianPreRegistration" force row level security;
create policy musicianprereg_select on "MusicianPreRegistration" for select using (app.is_admin());
create policy musicianprereg_insert on "MusicianPreRegistration" for insert with check (true);
create policy musicianprereg_modify on "MusicianPreRegistration" for update using (app.is_admin()) with check (app.is_admin());
create policy musicianprereg_delete on "MusicianPreRegistration" for delete using (app.is_admin());

alter table "FirstFruitsApplication" enable row level security;
alter table "FirstFruitsApplication" force row level security;
create policy firstfruitsapplication_select on "FirstFruitsApplication" for select using (app.is_admin());
create policy firstfruitsapplication_insert on "FirstFruitsApplication" for insert with check (true);
create policy firstfruitsapplication_modify on "FirstFruitsApplication" for update using (app.is_admin()) with check (app.is_admin());
create policy firstfruitsapplication_delete on "FirstFruitsApplication" for delete using (app.is_admin());

alter table "SeasonOfSingingApplication" enable row level security;
alter table "SeasonOfSingingApplication" force row level security;
create policy seasonofsingingapplication_select on "SeasonOfSingingApplication" for select using (app.is_admin());
create policy seasonofsingingapplication_insert on "SeasonOfSingingApplication" for insert with check (true);
create policy seasonofsingingapplication_modify on "SeasonOfSingingApplication" for update using (app.is_admin()) with check (app.is_admin());
create policy seasonofsingingapplication_delete on "SeasonOfSingingApplication" for delete using (app.is_admin());

alter table "MusicianNomination" enable row level security;
alter table "MusicianNomination" force row level security;
create policy musiciannomination_select on "MusicianNomination" for select using (app.is_admin());
create policy musiciannomination_insert on "MusicianNomination" for insert with check (true);
create policy musiciannomination_modify on "MusicianNomination" for update using (app.is_admin()) with check (app.is_admin());
create policy musiciannomination_delete on "MusicianNomination" for delete using (app.is_admin());

alter table "FanRewardSurvey" enable row level security;
alter table "FanRewardSurvey" force row level security;
create policy fanrewardsurvey_select on "FanRewardSurvey" for select using (app.is_admin());
create policy fanrewardsurvey_insert on "FanRewardSurvey" for insert with check (true);
create policy fanrewardsurvey_modify on "FanRewardSurvey" for update using (app.is_admin()) with check (app.is_admin());
create policy fanrewardsurvey_delete on "FanRewardSurvey" for delete using (app.is_admin());

alter table "EarlyAccessSignup" enable row level security;
alter table "EarlyAccessSignup" force row level security;
create policy earlyaccesssignup_select on "EarlyAccessSignup" for select using (app.is_admin());
create policy earlyaccesssignup_insert on "EarlyAccessSignup" for insert with check (true);
create policy earlyaccesssignup_modify on "EarlyAccessSignup" for update using (app.is_admin()) with check (app.is_admin());
create policy earlyaccesssignup_delete on "EarlyAccessSignup" for delete using (app.is_admin());

alter table "GraphicDesigner" enable row level security;
alter table "GraphicDesigner" force row level security;
create policy graphicdesigner_select on "GraphicDesigner" for select using (true); -- public directory
create policy graphicdesigner_write on "GraphicDesigner" for all using (app.is_admin()) with check (app.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- Musician performance goals
-- ─────────────────────────────────────────────────────────────────────────

alter table "Goal" enable row level security;
alter table "Goal" force row level security;
create policy goal_select on "Goal" for select using (app.owns_musician("musicianId") or app.is_admin());
create policy goal_write on "Goal" for all using (app.owns_musician("musicianId") or app.is_admin())
  with check (app.owns_musician("musicianId") or app.is_admin());
