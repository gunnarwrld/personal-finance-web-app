-- Locks in the security configuration confirmed on production on 2026-11-11:
-- RLS on every public table, auth.uid()-scoped policies, read-only shared
-- tables, and locked-down balance RPCs and signup trigger.
BEGIN;
\ir helpers/setup.psql

SELECT no_plan();

-- ── RLS everywhere ─────────────────────────────────────────────────────────

SELECT tables_are('public', ARRAY[
  'account_transfers', 'accounts', 'bill_reminders', 'budgets', 'currency_rates',
  'notification_preferences', 'notifications', 'recurring_transactions',
  'transactions', 'user_preferences', 'user_subscriptions'
], 'public has exactly the 11 known tables (add RLS tests for any new one)');

SELECT is_empty(
  $$ SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relrowsecurity $$,
  'RLS is enabled on every public table'
);

-- ── Policies ───────────────────────────────────────────────────────────────

SELECT is(
  (SELECT array_agg(tablename || ': ' || policyname ORDER BY tablename, policyname)
     FROM pg_policies
    WHERE schemaname = 'public'
      AND coalesce(qual, '') || coalesce(with_check, '') NOT LIKE '%auth.uid()%'),
  ARRAY['currency_rates: Signed-in users can read currency rates']::text[],
  'every policy checks auth.uid() except the currency_rates read policy'
);

SELECT is(
  (SELECT array_agg(cmd || ' ' || roles::text || ' ' || qual)
     FROM pg_policies WHERE schemaname = 'public' AND tablename = 'currency_rates'),
  ARRAY['SELECT {authenticated} true']::text[],
  'currency_rates has a single SELECT-only policy for authenticated'
);

SELECT is_empty(
  $$ SELECT tablename, policyname FROM pg_policies
      WHERE schemaname = 'public' AND roles <> ARRAY['authenticated']::name[] $$,
  'every policy applies to the authenticated role only (anon gets nothing)'
);

SELECT is(
  (SELECT array_agg(cmd) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_subscriptions'),
  ARRAY['SELECT']::text[],
  'user_subscriptions only has a SELECT policy'
);

-- ── Read-only shared tables ────────────────────────────────────────────────

SELECT ok(
  NOT has_table_privilege(r, 'public.' || t, p),
  format('%s has no %s on %s', r, p, t)
)
FROM unnest(ARRAY['anon', 'authenticated']) r,
     unnest(ARRAY['currency_rates', 'user_subscriptions']) t,
     unnest(ARRAY['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) p;

-- ── Client grants RLS does not cover ───────────────────────────────────────
-- TRUNCATE bypasses RLS entirely, and anon has no policies, so neither role
-- should hold them (20261112000000_revoke_unused_client_grants.sql).

SELECT is_empty(
  $$ SELECT r, c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace,
            unnest(ARRAY['anon', 'authenticated']) r
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
        AND has_table_privilege(r, c.oid, 'TRUNCATE') $$,
  'anon and authenticated cannot TRUNCATE any public table'
);

SELECT is_empty(
  $$ SELECT p, c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace,
            unnest(ARRAY['INSERT', 'UPDATE', 'DELETE']) p
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
        AND has_table_privilege('anon', c.oid, p) $$,
  'anon cannot INSERT, UPDATE or DELETE any public table'
);

SELECT ok(has_table_privilege('authenticated', 'public.' || t, p),
          format('authenticated keeps %s on %s', p, t))
FROM unnest(ARRAY['accounts', 'transactions', 'budgets']) t,
     unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) p;

-- Tables created later by migrations (as postgres) inherit the same rules.
SELECT is_empty(
  $$ SELECT a.grantee::regrole, a.privilege_type
       FROM pg_default_acl d, aclexplode(d.defaclacl) a
      WHERE d.defaclrole = 'postgres'::regrole
        AND d.defaclnamespace = 'public'::regnamespace
        AND d.defaclobjtype = 'r'
        AND ((a.grantee IN ('anon'::regrole, 'authenticated'::regrole) AND a.privilege_type = 'TRUNCATE')
          OR (a.grantee = 'anon'::regrole AND a.privilege_type IN ('INSERT', 'UPDATE', 'DELETE'))) $$,
  'new public tables do not grant TRUNCATE to clients or writes to anon'
);

-- ── Balance RPCs ───────────────────────────────────────────────────────────

CREATE TEMP TABLE rpc AS
SELECT p.oid, p.oid::regprocedure::text AS sig, p.prosecdef, p.proconfig, p.prosrc, coalesce(p.proacl, acldefault('f', p.proowner)) AS proacl
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('create_transaction', 'update_transaction', 'delete_transaction',
                     'create_account_transfer', 'delete_account_transfer');

SELECT is((SELECT count(*) FROM rpc), 5::bigint, 'all five balance RPCs exist (one overload each)');

SELECT ok(NOT prosecdef, sig || ' is SECURITY INVOKER') FROM rpc;
SELECT ok(proconfig @> ARRAY['search_path=""'], sig || ' pins search_path to empty') FROM rpc;
SELECT ok(prosrc LIKE '%auth.uid()%', sig || ' checks auth.uid()') FROM rpc;
SELECT ok(has_function_privilege('authenticated', oid, 'EXECUTE'), 'authenticated can execute ' || sig) FROM rpc;
SELECT ok(NOT has_function_privilege('anon', oid, 'EXECUTE'), 'anon cannot execute ' || sig) FROM rpc;
SELECT ok(
  NOT EXISTS (SELECT 1 FROM aclexplode(proacl) a WHERE a.grantee = 0 AND a.privilege_type = 'EXECUTE'),
  'PUBLIC cannot execute ' || sig
) FROM rpc;

-- ── Signup trigger ─────────────────────────────────────────────────────────

SELECT is_definer('public', 'handle_new_user', ARRAY[]::name[], 'handle_new_user is SECURITY DEFINER');

SELECT ok(
  (SELECT proconfig @> ARRAY['search_path=""'] FROM pg_proc WHERE oid = 'public.handle_new_user()'::regprocedure),
  'handle_new_user pins search_path to empty'
);

SELECT ok(NOT has_function_privilege(r, 'public.handle_new_user()', 'EXECUTE'),
          r || ' cannot execute handle_new_user')
  FROM unnest(ARRAY['anon', 'authenticated']) r;

SELECT ok(
  NOT EXISTS (SELECT 1 FROM pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
               WHERE p.oid = 'public.handle_new_user()'::regprocedure
                 AND a.grantee = 0 AND a.privilege_type = 'EXECUTE'),
  'PUBLIC cannot execute handle_new_user'
);

SELECT trigger_is('auth', 'users', 'on_auth_user_created', 'public', 'handle_new_user',
                  'on_auth_user_created runs handle_new_user');

SELECT * FROM finish();
ROLLBACK;
