-- The balance RPCs must refuse to touch another user's accounts, transactions
-- or transfers, and must refuse callers with no user id. A refused call must
-- leave every balance and ledger row as it was.
BEGIN;
\ir helpers/setup.psql

SELECT no_plan();

SELECT tests.create_user('a0000000-0000-4000-8000-00000000000a', 'user-a@example.test');
SELECT tests.create_user('b0000000-0000-4000-8000-00000000000b', 'user-b@example.test');

CREATE TEMP TABLE ids (name text PRIMARY KEY, id integer);
GRANT SELECT, INSERT ON ids TO anon, authenticated;

WITH a AS (
  INSERT INTO public.accounts (user_id, name, type, balance, currency)
  VALUES ('a0000000-0000-4000-8000-00000000000a', 'A Bank', 'Bank', 0, 'USD'),
         ('a0000000-0000-4000-8000-00000000000a', 'A Cash', 'Cash', 0, 'USD'),
         ('b0000000-0000-4000-8000-00000000000b', 'B Bank', 'Bank', 0, 'USD'),
         ('b0000000-0000-4000-8000-00000000000b', 'B Cash', 'Cash', 0, 'USD')
  RETURNING name, id
) INSERT INTO ids SELECT * FROM a;

-- Give each user some ledger history through the RPCs.
SELECT tests.as_user('a0000000-0000-4000-8000-00000000000a');
INSERT INTO ids SELECT 'A tx', (public.create_transaction(
  (SELECT id FROM ids WHERE name = 'A Bank'), 'income', 500, 'Salary', 'A pay', current_date)).id;
INSERT INTO ids SELECT 'A transfer', (public.create_account_transfer(
  (SELECT id FROM ids WHERE name = 'A Bank'), (SELECT id FROM ids WHERE name = 'A Cash'), 100)).id;

SELECT tests.as_user('b0000000-0000-4000-8000-00000000000b');
INSERT INTO ids SELECT 'B tx', (public.create_transaction(
  (SELECT id FROM ids WHERE name = 'B Bank'), 'income', 300, 'Salary', 'B pay', current_date)).id;

SELECT tests.as_postgres();
CREATE TEMP TABLE before AS
  SELECT a.id, a.balance FROM public.accounts a JOIN ids USING (id);
CREATE TEMP TABLE before_ledger AS
  SELECT (SELECT md5(string_agg(t::text, '|' ORDER BY t.id)) FROM public.transactions t) AS tx,
         (SELECT md5(string_agg(t::text, '|' ORDER BY t.id)) FROM public.account_transfers t) AS tr;

-- ── B targets A ────────────────────────────────────────────────────────────

SELECT tests.as_user('b0000000-0000-4000-8000-00000000000b');

SELECT throws_ok(
  $$SELECT public.create_transaction((SELECT id FROM ids WHERE name = 'A Bank'), 'expense', 50, 'Other', 'x', current_date)$$,
  'P0001', 'Account not found', 'create_transaction refuses A''s account');

SELECT throws_ok(
  $$SELECT public.update_transaction((SELECT id FROM ids WHERE name = 'A tx'), (SELECT id FROM ids WHERE name = 'B Bank'), 'income', 1, 'Other', 'x', current_date)$$,
  'P0001', 'Transaction not found', 'update_transaction refuses A''s transaction');

SELECT throws_ok(
  $$SELECT public.update_transaction((SELECT id FROM ids WHERE name = 'B tx'), (SELECT id FROM ids WHERE name = 'A Bank'), 'income', 300, 'Salary', 'B pay', current_date)$$,
  'P0001', 'Account not found', 'update_transaction refuses to move B''s transaction onto A''s account');

SELECT throws_ok(
  $$SELECT public.delete_transaction((SELECT id FROM ids WHERE name = 'A tx'))$$,
  'P0001', 'Transaction not found', 'delete_transaction refuses A''s transaction');

SELECT throws_ok(
  $$SELECT public.create_account_transfer((SELECT id FROM ids WHERE name = 'B Bank'), (SELECT id FROM ids WHERE name = 'A Bank'), 10)$$,
  'P0001', 'Destination account not found', 'create_account_transfer refuses A''s account as destination');

SELECT throws_ok(
  $$SELECT public.create_account_transfer((SELECT id FROM ids WHERE name = 'A Bank'), (SELECT id FROM ids WHERE name = 'B Bank'), 10)$$,
  'P0001', 'Source account not found', 'create_account_transfer refuses A''s account as source');

SELECT throws_ok(
  $$SELECT public.create_account_transfer((SELECT id FROM ids WHERE name = 'A Bank'), (SELECT id FROM ids WHERE name = 'A Cash'), 10)$$,
  'P0001', 'Source account not found', 'create_account_transfer refuses a transfer between two of A''s accounts');

SELECT throws_ok(
  $$SELECT public.delete_account_transfer((SELECT id FROM ids WHERE name = 'A transfer'))$$,
  'P0001', 'Transfer not found', 'delete_account_transfer refuses A''s transfer');

-- ── No user id in the JWT ──────────────────────────────────────────────────

SELECT tests.as_authenticated_without_sub();

SELECT throws_ok(
  $$SELECT public.create_transaction((SELECT id FROM ids WHERE name = 'A Bank'), 'income', 1, 'Other', 'x', current_date)$$,
  '42501', 'Not authenticated', 'create_transaction needs a user id');
SELECT throws_ok(
  $$SELECT public.update_transaction((SELECT id FROM ids WHERE name = 'A tx'), (SELECT id FROM ids WHERE name = 'A Bank'), 'income', 1, 'Other', 'x', current_date)$$,
  '42501', 'Not authenticated', 'update_transaction needs a user id');
SELECT throws_ok(
  $$SELECT public.delete_transaction((SELECT id FROM ids WHERE name = 'A tx'))$$,
  '42501', 'Not authenticated', 'delete_transaction needs a user id');
SELECT throws_ok(
  $$SELECT public.create_account_transfer((SELECT id FROM ids WHERE name = 'A Bank'), (SELECT id FROM ids WHERE name = 'A Cash'), 1)$$,
  '42501', 'Not authenticated', 'create_account_transfer needs a user id');
SELECT throws_ok(
  $$SELECT public.delete_account_transfer((SELECT id FROM ids WHERE name = 'A transfer'))$$,
  '42501', 'Not authenticated', 'delete_account_transfer needs a user id');

-- anon has no EXECUTE on these functions at all; 01_security_config.sql
-- checks that through has_function_privilege. Calling them here as anon would
-- crash the local Postgres image: supautils segfaults when a SET ROLE session
-- hits "permission denied for function". PostgREST returns a clean 42501.

-- ── Nothing changed ────────────────────────────────────────────────────────

SELECT tests.as_postgres();

SELECT is(tests.balance(b.id), b.balance, format('balance of %s is unchanged', i.name))
  FROM before b JOIN ids i USING (id);
SELECT is((SELECT md5(string_agg(t::text, '|' ORDER BY t.id)) FROM public.transactions t),
          (SELECT tx FROM before_ledger), 'no transaction rows were added, changed or removed');
SELECT is((SELECT md5(string_agg(t::text, '|' ORDER BY t.id)) FROM public.account_transfers t),
          (SELECT tr FROM before_ledger), 'no transfer rows were added, changed or removed');

SELECT * FROM finish();
ROLLBACK;
