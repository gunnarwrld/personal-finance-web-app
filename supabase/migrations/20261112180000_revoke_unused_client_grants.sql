-- Drop table privileges that clients never need and RLS does not police.
--
-- Supabase grants anon and authenticated every privilege on new public
-- tables and relies on RLS to filter rows. RLS covers SELECT, INSERT,
-- UPDATE and DELETE, but not TRUNCATE: any role holding TRUNCATE can empty a
-- whole table, every user's rows included. PostgREST cannot issue TRUNCATE,
-- so this was not reachable through the API, but nothing else should be able
-- to either.
--
-- anon also held INSERT/UPDATE/DELETE on every user table. No policy grants
-- anon anything, so those writes already failed; revoking them removes the
-- dependency on every table keeping RLS enabled.
--
-- The app is unaffected: signed-in users keep SELECT/INSERT/UPDATE/DELETE
-- (still filtered by RLS), anon keeps SELECT (still returns no rows), and
-- the edge functions use the service role.

REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;

-- Tables that migrations (run as postgres) create later get the same
-- treatment instead of Supabase's default full grants.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE INSERT, UPDATE, DELETE ON TABLES FROM anon;
