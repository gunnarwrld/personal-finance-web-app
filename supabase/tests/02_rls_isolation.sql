-- User B must not be able to read, insert, update or delete user A's rows in
-- any table, and anon must see nothing at all.
BEGIN;
\ir helpers/setup.psql

SELECT no_plan();

-- ── Fixtures (as postgres, RLS bypassed) ───────────────────────────────────

SELECT tests.create_user('a0000000-0000-4000-8000-00000000000a', 'user-a@example.test');
SELECT tests.create_user('b0000000-0000-4000-8000-00000000000b', 'user-b@example.test');

CREATE TEMP TABLE ids (name text PRIMARY KEY, id integer);
GRANT SELECT ON ids TO anon, authenticated;

WITH a AS (
  INSERT INTO public.accounts (user_id, name, type, balance, currency)
  VALUES ('a0000000-0000-4000-8000-00000000000a', 'A Bank', 'Bank', 100, 'USD'),
         ('a0000000-0000-4000-8000-00000000000a', 'A Cash', 'Cash', 100, 'USD'),
         ('b0000000-0000-4000-8000-00000000000b', 'B Bank', 'Bank', 100, 'USD')
  RETURNING name, id
) INSERT INTO ids SELECT * FROM a;

WITH n AS (
  INSERT INTO public.transactions (user_id, account_id, amount, description, category, type, date)
  VALUES ('a0000000-0000-4000-8000-00000000000a', (SELECT id FROM ids WHERE name = 'A Bank'),
          10, 'A lunch', 'Food & Dining', 'expense', current_date)
  RETURNING id)
INSERT INTO ids SELECT 'A tx', id FROM n;
WITH n AS (
  INSERT INTO public.transactions (user_id, account_id, amount, description, category, type, date)
  VALUES ('b0000000-0000-4000-8000-00000000000b', (SELECT id FROM ids WHERE name = 'B Bank'),
          10, 'B lunch', 'Food & Dining', 'expense', current_date)
  RETURNING id)
INSERT INTO ids SELECT 'B tx', id FROM n;

INSERT INTO public.account_transfers (user_id, from_account_id, to_account_id, amount,
                                      from_currency, to_currency, converted_amount, transfer_date)
VALUES ('a0000000-0000-4000-8000-00000000000a', (SELECT id FROM ids WHERE name = 'A Bank'),
        (SELECT id FROM ids WHERE name = 'A Cash'), 5, 'USD', 'USD', 5, current_date);

INSERT INTO public.budgets (user_id, category, amount, start_date)
VALUES ('a0000000-0000-4000-8000-00000000000a', 'Shopping', 100, current_date),
       ('b0000000-0000-4000-8000-00000000000b', 'Shopping', 100, current_date);

WITH n AS (
  INSERT INTO public.recurring_transactions (user_id, account_id, description, amount, category,
                                             type, frequency, start_date, next_occurrence)
  VALUES ('a0000000-0000-4000-8000-00000000000a', (SELECT id FROM ids WHERE name = 'A Bank'),
          'A rent', 500, 'Bills & Utilities', 'expense', 'monthly', current_date, current_date + 30)
  RETURNING id)
INSERT INTO ids SELECT 'A recurring', id FROM n;
WITH n AS (
  INSERT INTO public.recurring_transactions (user_id, account_id, description, amount, category,
                                             type, frequency, start_date, next_occurrence)
  VALUES ('b0000000-0000-4000-8000-00000000000b', (SELECT id FROM ids WHERE name = 'B Bank'),
          'B rent', 500, 'Bills & Utilities', 'expense', 'monthly', current_date, current_date + 30)
  RETURNING id)
INSERT INTO ids SELECT 'B recurring', id FROM n;

INSERT INTO public.bill_reminders (user_id, account_id, title, amount, category, due_date)
VALUES ('a0000000-0000-4000-8000-00000000000a', (SELECT id FROM ids WHERE name = 'A Bank'),
        'A internet', 50, 'Bills & Utilities', current_date + 5),
       ('b0000000-0000-4000-8000-00000000000b', (SELECT id FROM ids WHERE name = 'B Bank'),
        'B internet', 50, 'Bills & Utilities', current_date + 5);

INSERT INTO public.notifications (user_id, type, title, message)
VALUES ('a0000000-0000-4000-8000-00000000000a', 'budget_alert', 'A alert', 'For A only'),
       ('b0000000-0000-4000-8000-00000000000b', 'budget_alert', 'B alert', 'For B only');

INSERT INTO public.user_subscriptions (user_id, subscription_tier)
VALUES ('a0000000-0000-4000-8000-00000000000a', 'free'),
       ('b0000000-0000-4000-8000-00000000000b', 'free');

INSERT INTO public.currency_rates (base_currency, rates)
VALUES ('USD', '{"USD": 1}') ON CONFLICT (base_currency) DO NOTHING;

-- Snapshot of A's data to compare against after B's attempts.
CREATE TEMP TABLE user_tables (t text PRIMARY KEY);
INSERT INTO user_tables VALUES
  ('accounts'), ('transactions'), ('account_transfers'), ('budgets'),
  ('recurring_transactions'), ('bill_reminders'), ('notifications'),
  ('notification_preferences'), ('user_preferences'), ('user_subscriptions');
GRANT SELECT ON user_tables TO anon, authenticated;

CREATE FUNCTION pg_temp.snapshot(p_user uuid)
RETURNS TABLE (t text, digest text)
LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT ut.t FROM user_tables ut ORDER BY 1 LOOP
    t := r.t;
    EXECUTE format('SELECT md5(coalesce(string_agg(x::text, ''|'' ORDER BY x::text), '''')) FROM public.%I x WHERE user_id = $1', r.t)
      INTO digest USING p_user;
    RETURN NEXT;
  END LOOP;
END $$;

CREATE TEMP TABLE a_before AS SELECT * FROM pg_temp.snapshot('a0000000-0000-4000-8000-00000000000a');

SELECT ok((SELECT count(*) FROM public.notification_preferences
            WHERE user_id = 'a0000000-0000-4000-8000-00000000000a') = 1,
          'signup trigger created A''s notification_preferences');

-- ── As user B ──────────────────────────────────────────────────────────────

SELECT tests.as_user('b0000000-0000-4000-8000-00000000000b');

-- SELECT: B sees only B's rows in every table.
SELECT is(
  (SELECT tests.rows_affected(format('SELECT 1 FROM public.%I WHERE user_id <> %L', t,
                                     'b0000000-0000-4000-8000-00000000000b'))),
  0::bigint, format('B cannot see any other user''s rows in %s', t))
FROM user_tables;

SELECT ok(
  (SELECT tests.rows_affected(format('SELECT 1 FROM public.%I', t))) > 0,
  format('B still sees B''s own rows in %s', t))
FROM user_tables WHERE t <> 'account_transfers';

SELECT ok((SELECT count(*) FROM public.currency_rates) > 0, 'B can read the shared currency rates');

-- UPDATE: no rows of A's are visible to update.
SELECT is(tests.rows_affected(format('UPDATE public.%I SET user_id = user_id WHERE user_id = %L', t,
                                     'a0000000-0000-4000-8000-00000000000a')),
          0::bigint, format('B cannot update A''s rows in %s', t))
FROM user_tables WHERE t <> 'user_subscriptions';

SELECT is(tests.rows_affected($$UPDATE public.accounts SET balance = 0 WHERE name = 'A Bank'$$),
          0::bigint, 'B cannot zero A''s account balance');

-- DELETE: no rows of A's are visible to delete.
SELECT is(tests.rows_affected(format('DELETE FROM public.%I WHERE user_id = %L', t,
                                     'a0000000-0000-4000-8000-00000000000a')),
          0::bigint, format('B cannot delete A''s rows in %s', t))
FROM user_tables WHERE t NOT IN ('user_subscriptions');

-- INSERT rows owned by A.
SELECT throws_ok(
  $$INSERT INTO public.accounts (user_id, name, type) VALUES ('a0000000-0000-4000-8000-00000000000a', 'planted', 'Cash')$$,
  '42501', NULL, 'B cannot insert an account owned by A');
SELECT throws_ok(
  $$INSERT INTO public.transactions (user_id, account_id, amount, description, category, type, date)
    VALUES ('a0000000-0000-4000-8000-00000000000a', (SELECT id FROM ids WHERE name = 'A Bank'), 1, 'x', 'Other', 'expense', current_date)$$,
  '42501', NULL, 'B cannot insert a transaction owned by A');
SELECT throws_ok(
  $$INSERT INTO public.budgets (user_id, category, amount, start_date) VALUES ('a0000000-0000-4000-8000-00000000000a', 'Other', 1, current_date)$$,
  '42501', NULL, 'B cannot insert a budget owned by A');
SELECT throws_ok(
  $$INSERT INTO public.recurring_transactions (user_id, description, amount, category, type, frequency, start_date, next_occurrence)
    VALUES ('a0000000-0000-4000-8000-00000000000a', 'x', 1, 'Other', 'expense', 'monthly', current_date, current_date)$$,
  '42501', NULL, 'B cannot insert a recurring transaction owned by A');
SELECT throws_ok(
  $$INSERT INTO public.bill_reminders (user_id, title, amount, category, due_date) VALUES ('a0000000-0000-4000-8000-00000000000a', 'x', 1, 'Other', current_date)$$,
  '42501', NULL, 'B cannot insert a bill reminder owned by A');
SELECT throws_ok(
  $$INSERT INTO public.notifications (user_id, type, title, message) VALUES ('a0000000-0000-4000-8000-00000000000a', 'budget_alert', 'x', 'x')$$,
  '42501', NULL, 'B cannot insert a notification for A');
SELECT throws_ok(
  $$INSERT INTO public.account_transfers (user_id, from_account_id, to_account_id, amount, from_currency, to_currency, converted_amount, transfer_date)
    VALUES ('a0000000-0000-4000-8000-00000000000a', (SELECT id FROM ids WHERE name = 'A Bank'), (SELECT id FROM ids WHERE name = 'A Cash'), 1, 'USD', 'USD', 1, current_date)$$,
  '42501', NULL, 'B cannot insert a transfer owned by A');
SELECT throws_ok(
  $$INSERT INTO public.user_subscriptions (user_id, subscription_tier) VALUES ('b0000000-0000-4000-8000-00000000000b', 'premium')$$,
  '42501', NULL, 'B cannot write user_subscriptions, even for B');
SELECT throws_ok(
  $$UPDATE public.user_subscriptions SET subscription_tier = 'premium'$$,
  '42501', NULL, 'B cannot upgrade its own subscription');
SELECT throws_ok(
  $$UPDATE public.currency_rates SET rates = '{"USD": 2}'$$,
  '42501', NULL, 'B cannot change the shared currency rates');
SELECT throws_ok(
  $$DELETE FROM public.currency_rates$$,
  '42501', NULL, 'B cannot delete the shared currency rates');

-- B's own rows cannot be pointed at A's accounts or handed over to A.
SELECT throws_ok(
  $$INSERT INTO public.transactions (user_id, account_id, amount, description, category, type, date)
    VALUES ('b0000000-0000-4000-8000-00000000000b', (SELECT id FROM ids WHERE name = 'A Bank'), 1, 'x', 'Other', 'expense', current_date)$$,
  '42501', NULL, 'B cannot add a transaction to A''s account');
SELECT throws_ok(
  $$UPDATE public.transactions SET account_id = (SELECT id FROM ids WHERE name = 'A Bank') WHERE id = (SELECT id FROM ids WHERE name = 'B tx')$$,
  '42501', NULL, 'B cannot move its transaction onto A''s account');
SELECT throws_ok(
  $$INSERT INTO public.account_transfers (user_id, from_account_id, to_account_id, amount, from_currency, to_currency, converted_amount, transfer_date)
    VALUES ('b0000000-0000-4000-8000-00000000000b', (SELECT id FROM ids WHERE name = 'B Bank'), (SELECT id FROM ids WHERE name = 'A Bank'), 1, 'USD', 'USD', 1, current_date)$$,
  '42501', NULL, 'B cannot record a transfer into A''s account');
SELECT throws_ok(
  $$INSERT INTO public.recurring_transactions (user_id, account_id, description, amount, category, type, frequency, start_date, next_occurrence)
    VALUES ('b0000000-0000-4000-8000-00000000000b', (SELECT id FROM ids WHERE name = 'A Bank'), 'x', 1, 'Other', 'expense', 'monthly', current_date, current_date)$$,
  '42501', NULL, 'B cannot schedule a recurring transaction on A''s account');
SELECT throws_ok(
  $$INSERT INTO public.bill_reminders (user_id, account_id, title, amount, category, due_date)
    VALUES ('b0000000-0000-4000-8000-00000000000b', (SELECT id FROM ids WHERE name = 'A Bank'), 'x', 1, 'Other', current_date)$$,
  '42501', NULL, 'B cannot attach a bill reminder to A''s account');
SELECT throws_ok(
  $$INSERT INTO public.bill_reminders (user_id, recurring_id, title, amount, category, due_date)
    VALUES ('b0000000-0000-4000-8000-00000000000b', (SELECT id FROM ids WHERE name = 'A recurring'), 'x', 1, 'Other', current_date)$$,
  '42501', NULL, 'B cannot link a bill reminder to A''s recurring transaction');
SELECT throws_ok(
  format('UPDATE public.%I SET user_id = %L WHERE user_id = %L', t,
         'a0000000-0000-4000-8000-00000000000a', 'b0000000-0000-4000-8000-00000000000b'),
  '42501', NULL, format('B cannot hand its %s rows over to A', t))
FROM user_tables WHERE t NOT IN ('user_subscriptions', 'account_transfers');

-- ── As anon ────────────────────────────────────────────────────────────────

SELECT tests.as_anon();

SELECT is(tests.rows_affected(format('SELECT 1 FROM public.%I', t)), 0::bigint,
          format('anon sees no rows in %s', t))
FROM user_tables;
SELECT is((SELECT count(*) FROM public.currency_rates), 0::bigint, 'anon sees no currency rates');

SELECT throws_ok(format('UPDATE public.%I SET user_id = user_id', t), '42501', NULL,
                 format('anon cannot update %s', t))
FROM user_tables;
SELECT throws_ok(format('DELETE FROM public.%I', t), '42501', NULL,
                 format('anon cannot delete from %s', t))
FROM user_tables;
SELECT throws_ok(
  $$INSERT INTO public.accounts (user_id, name, type) VALUES ('a0000000-0000-4000-8000-00000000000a', 'planted', 'Cash')$$,
  '42501', NULL, 'anon cannot insert accounts');
SELECT throws_ok(
  $$INSERT INTO public.notifications (user_id, type, title, message) VALUES ('a0000000-0000-4000-8000-00000000000a', 'budget_alert', 'x', 'x')$$,
  '42501', NULL, 'anon cannot insert notifications');

-- ── A's data is untouched ──────────────────────────────────────────────────

SELECT tests.as_postgres();

SELECT is(now.digest, before.digest, format('A''s %s rows are unchanged', before.t))
FROM a_before before
JOIN pg_temp.snapshot('a0000000-0000-4000-8000-00000000000a') now USING (t);

SELECT * FROM finish();
ROLLBACK;
