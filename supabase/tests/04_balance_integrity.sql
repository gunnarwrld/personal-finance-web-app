-- Every account's balance must equal its ledger (income - expenses -
-- transfers out + converted transfers in) after each RPC, including edits
-- that change amount, type and account, deletes, and rejected calls.
-- Accounts start at 0, so balance = ledger exactly.
BEGIN;
\ir helpers/setup.psql

SELECT no_plan();

SELECT tests.create_user('c0000000-0000-4000-8000-00000000000c', 'user-c@example.test');

CREATE TEMP TABLE ids (name text PRIMARY KEY, id integer);
GRANT SELECT, INSERT ON ids TO authenticated;

WITH a AS (
  INSERT INTO public.accounts (user_id, name, type, balance, currency)
  VALUES ('c0000000-0000-4000-8000-00000000000c', 'X', 'Bank', 0, 'USD'),
         ('c0000000-0000-4000-8000-00000000000c', 'Y', 'Cash', 0, 'USD'),
         ('c0000000-0000-4000-8000-00000000000c', 'Z', 'Card', 0, 'EUR')
  RETURNING name, id
) INSERT INTO ids SELECT * FROM a;

-- Checks X, Y and Z against the expected balances and against the ledger.
CREATE FUNCTION pg_temp.check_balances(p_step text, p_x numeric, p_y numeric, p_z numeric)
RETURNS SETOF text
LANGUAGE plpgsql AS $$
DECLARE
  r record;
BEGIN
  PERFORM tests.as_postgres();
  FOR r IN
    SELECT i.name, a.balance, tests.ledger_balance(i.id) AS ledger,
           CASE i.name WHEN 'X' THEN p_x WHEN 'Y' THEN p_y ELSE p_z END AS expected
      FROM ids i JOIN public.accounts a ON a.id = i.id
     WHERE i.name IN ('X', 'Y', 'Z')
     ORDER BY i.name
  LOOP
    RETURN NEXT is(r.balance, r.expected, format('%s: %s balance is %s', p_step, r.name, r.expected));
    RETURN NEXT is(r.balance, r.ledger, format('%s: %s balance equals its ledger', p_step, r.name));
  END LOOP;
  PERFORM tests.as_user('c0000000-0000-4000-8000-00000000000c');
END $$;

SELECT tests.as_user('c0000000-0000-4000-8000-00000000000c');

-- ── Transactions ───────────────────────────────────────────────────────────

INSERT INTO ids SELECT 'income', (public.create_transaction(
  (SELECT id FROM ids WHERE name = 'X'), 'income', 100, 'Salary', 'pay', current_date)).id;
SELECT pg_temp.check_balances('create income 100 on X', 100, 0, 0);

INSERT INTO ids SELECT 'expense', (public.create_transaction(
  (SELECT id FROM ids WHERE name = 'X'), 'expense', 30, 'Food & Dining', 'lunch', current_date)).id;
SELECT pg_temp.check_balances('create expense 30 on X', 70, 0, 0);

SELECT public.update_transaction((SELECT id FROM ids WHERE name = 'expense'),
  (SELECT id FROM ids WHERE name = 'X'), 'expense', 50, 'Food & Dining', 'lunch', current_date);
SELECT pg_temp.check_balances('change expense amount 30 -> 50', 50, 0, 0);

SELECT public.update_transaction((SELECT id FROM ids WHERE name = 'expense'),
  (SELECT id FROM ids WHERE name = 'X'), 'income', 50, 'Other', 'refund', current_date);
SELECT pg_temp.check_balances('change type expense -> income', 150, 0, 0);

SELECT public.update_transaction((SELECT id FROM ids WHERE name = 'expense'),
  (SELECT id FROM ids WHERE name = 'Y'), 'income', 50, 'Other', 'refund', current_date);
SELECT pg_temp.check_balances('move income 50 from X to Y', 100, 50, 0);

SELECT public.update_transaction((SELECT id FROM ids WHERE name = 'expense'),
  (SELECT id FROM ids WHERE name = 'X'), 'expense', 20, 'Shopping', 'socks', current_date);
SELECT pg_temp.check_balances('change amount, type and account at once', 80, 0, 0);

SELECT public.update_transaction((SELECT id FROM ids WHERE name = 'expense'),
  (SELECT id FROM ids WHERE name = 'Z'), 'expense', 20, 'Shopping', 'socks', current_date);
SELECT pg_temp.check_balances('move expense to an account in another currency', 100, 0, -20);
SELECT tests.as_postgres();
SELECT is((SELECT currency FROM public.transactions WHERE id = (SELECT id FROM ids WHERE name = 'expense')),
          'EUR', 'a moved transaction takes the new account''s currency');
SELECT tests.as_user('c0000000-0000-4000-8000-00000000000c');

SELECT public.delete_transaction((SELECT id FROM ids WHERE name = 'expense'));
SELECT pg_temp.check_balances('delete the expense', 100, 0, 0);

-- ── Transfers ──────────────────────────────────────────────────────────────

INSERT INTO ids SELECT 'x->y', (public.create_account_transfer(
  (SELECT id FROM ids WHERE name = 'X'), (SELECT id FROM ids WHERE name = 'Y'), 40)).id;
SELECT pg_temp.check_balances('transfer 40 X -> Y', 60, 40, 0);

INSERT INTO ids SELECT 'x->z', (public.create_account_transfer(
  (SELECT id FROM ids WHERE name = 'X'), (SELECT id FROM ids WHERE name = 'Z'), 10, 0.9)).id;
SELECT pg_temp.check_balances('transfer 10 USD X -> 9 EUR Z', 50, 40, 9);

INSERT INTO ids SELECT 'y->x', (public.create_account_transfer(
  (SELECT id FROM ids WHERE name = 'Y'), (SELECT id FROM ids WHERE name = 'X'), 10, 5)).id;
SELECT pg_temp.check_balances('same-currency transfer ignores the rate', 60, 30, 9);

INSERT INTO ids SELECT 'z->x', (public.create_account_transfer(
  (SELECT id FROM ids WHERE name = 'Z'), (SELECT id FROM ids WHERE name = 'X'), 3.33, 1.111)).id;
SELECT pg_temp.check_balances('transfer 3.33 EUR Z -> 3.70 USD X (rounded)', 63.70, 30, 5.67);

SELECT public.delete_account_transfer((SELECT id FROM ids WHERE name = 'x->z'));
SELECT pg_temp.check_balances('delete the X -> Z transfer', 73.70, 30, -3.33);

SELECT public.delete_account_transfer((SELECT id FROM ids WHERE name = 'z->x'));
SELECT pg_temp.check_balances('delete the Z -> X transfer', 70, 30, 0);

SELECT public.delete_account_transfer((SELECT id FROM ids WHERE name = 'x->y'));
SELECT public.delete_account_transfer((SELECT id FROM ids WHERE name = 'y->x'));
SELECT pg_temp.check_balances('delete the remaining transfers', 100, 0, 0);

-- ── Rejected calls change nothing ──────────────────────────────────────────

SELECT throws_ok(
  $$SELECT public.create_transaction((SELECT id FROM ids WHERE name = 'X'), 'expense', 0, 'Other', 'x', current_date)$$,
  'P0001', 'Amount must be greater than 0', 'create_transaction rejects a zero amount');
SELECT throws_ok(
  $$SELECT public.create_transaction((SELECT id FROM ids WHERE name = 'X'), 'expense', -5, 'Other', 'x', current_date)$$,
  'P0001', 'Amount must be greater than 0', 'create_transaction rejects a negative amount');
SELECT throws_ok(
  $$SELECT public.create_transaction((SELECT id FROM ids WHERE name = 'X'), 'transfer', 5, 'Other', 'x', current_date)$$,
  '23514', NULL, 'create_transaction rejects an unknown type');
SELECT throws_ok(
  $$SELECT public.update_transaction((SELECT id FROM ids WHERE name = 'income'), (SELECT id FROM ids WHERE name = 'Y'), 'refund', 5, 'Other', 'x', current_date)$$,
  '23514', NULL, 'update_transaction rejects an unknown type');
SELECT throws_ok(
  $$SELECT public.update_transaction((SELECT id FROM ids WHERE name = 'income'), (SELECT id FROM ids WHERE name = 'Y'), 'income', 0, 'Other', 'x', current_date)$$,
  'P0001', 'Amount must be greater than 0', 'update_transaction rejects a zero amount');
SELECT throws_ok(
  $$SELECT public.update_transaction((SELECT id FROM ids WHERE name = 'income'), 2147483647, 'income', 5, 'Other', 'x', current_date)$$,
  'P0001', 'Account not found', 'update_transaction rejects a missing account');
SELECT throws_ok(
  $$SELECT public.create_account_transfer((SELECT id FROM ids WHERE name = 'X'), (SELECT id FROM ids WHERE name = 'X'), 5)$$,
  'P0001', 'Choose two different accounts', 'create_account_transfer rejects a transfer to the same account');
SELECT throws_ok(
  $$SELECT public.create_account_transfer((SELECT id FROM ids WHERE name = 'X'), (SELECT id FROM ids WHERE name = 'Z'), 5, 0)$$,
  'P0001', 'Exchange rate must be greater than 0', 'create_account_transfer rejects a zero rate across currencies');
SELECT throws_ok(
  $$SELECT public.create_account_transfer((SELECT id FROM ids WHERE name = 'X'), (SELECT id FROM ids WHERE name = 'Y'), 0)$$,
  'P0001', 'Amount must be greater than 0', 'create_account_transfer rejects a zero amount');
SELECT throws_ok(
  $$SELECT public.delete_transaction(2147483647)$$,
  'P0001', 'Transaction not found', 'delete_transaction rejects a missing id');
SELECT throws_ok(
  $$SELECT public.delete_account_transfer((SELECT id FROM ids WHERE name = 'x->y'))$$,
  'P0001', 'Transfer not found', 'delete_account_transfer rejects an already deleted transfer');

SELECT pg_temp.check_balances('after rejected calls', 100, 0, 0);

-- ── Amounts with more than two decimals ────────────────────────────────────
-- The ledger stores whole cents, so the RPCs must round an amount once and
-- apply that rounded value to the balance. Rounding the stored amount and the
-- new balance separately disagrees on half cents, because Postgres rounds
-- half away from zero: a 0.005 expense on 100.00 is stored as 0.01, while
-- 100.00 - 0.005 = 99.995 would round back to 100.00.

INSERT INTO ids SELECT 'half-cent expense', (public.create_transaction(
  (SELECT id FROM ids WHERE name = 'X'), 'expense', 0.005, 'Other', 'half a cent', current_date)).id;
SELECT pg_temp.check_balances('expense 0.005 on X at 100.00 is applied as 0.01', 99.99, 0, 0);

INSERT INTO ids SELECT 'fee', (public.create_transaction(
  (SELECT id FROM ids WHERE name = 'Y'), 'expense', 5, 'Other', 'fee', current_date)).id;
INSERT INTO ids SELECT 'half-cent income', (public.create_transaction(
  (SELECT id FROM ids WHERE name = 'Y'), 'income', 0.005, 'Other', 'half a cent', current_date)).id;
SELECT pg_temp.check_balances('income 0.005 on Y at -5.00 is applied as 0.01', 99.99, -4.99, 0);

SELECT public.update_transaction((SELECT id FROM ids WHERE name = 'half-cent income'),
  (SELECT id FROM ids WHERE name = 'Y'), 'income', 2.345, 'Other', 'refund', current_date);
SELECT pg_temp.check_balances('editing that income to 2.345 applies 2.35', 99.99, -2.65, 0);

INSERT INTO ids SELECT 'half-cent transfer', (public.create_account_transfer(
  (SELECT id FROM ids WHERE name = 'X'), (SELECT id FROM ids WHERE name = 'Y'), 0.005)).id;
SELECT pg_temp.check_balances('transfer 0.005 X -> Y moves 0.01 on both sides', 99.98, -2.64, 0);

SELECT tests.as_postgres();
SELECT is(
  (SELECT array_agg(t.amount ORDER BY i.name)
     FROM ids i JOIN public.transactions t ON t.id = i.id
    WHERE i.name IN ('half-cent expense', 'half-cent income')),
  ARRAY[0.01, 2.35]::numeric[],
  'transactions store the rounded amounts');
SELECT is(
  (SELECT amount FROM public.account_transfers WHERE id = (SELECT id FROM ids WHERE name = 'half-cent transfer')),
  0.01::numeric,
  'the transfer stores the rounded amount');
SELECT tests.as_user('c0000000-0000-4000-8000-00000000000c');

-- Under half a cent rounds to 0, which is not an amount. NaN compares greater
-- than every number, so it needs its own check; a NaN balance would stay NaN.
SELECT throws_ok(
  $$SELECT public.create_transaction((SELECT id FROM ids WHERE name = 'X'), 'income', 0.004, 'Other', 'x', current_date)$$,
  'P0001', 'Amount must be greater than 0', 'create_transaction rejects an amount that rounds to 0');
SELECT throws_ok(
  $$SELECT public.create_transaction((SELECT id FROM ids WHERE name = 'X'), 'income', 'NaN', 'Other', 'x', current_date)$$,
  'P0001', 'Amount must be greater than 0', 'create_transaction rejects NaN');
SELECT throws_ok(
  $$SELECT public.update_transaction((SELECT id FROM ids WHERE name = 'income'), (SELECT id FROM ids WHERE name = 'X'), 'income', 0.004, 'Salary', 'pay', current_date)$$,
  'P0001', 'Amount must be greater than 0', 'update_transaction rejects an amount that rounds to 0');
SELECT throws_ok(
  $$SELECT public.update_transaction((SELECT id FROM ids WHERE name = 'income'), (SELECT id FROM ids WHERE name = 'X'), 'income', 'NaN', 'Salary', 'pay', current_date)$$,
  'P0001', 'Amount must be greater than 0', 'update_transaction rejects NaN');
SELECT throws_ok(
  $$SELECT public.create_account_transfer((SELECT id FROM ids WHERE name = 'X'), (SELECT id FROM ids WHERE name = 'Y'), 0.004)$$,
  'P0001', 'Amount must be greater than 0', 'create_account_transfer rejects an amount that rounds to 0');
SELECT throws_ok(
  $$SELECT public.create_account_transfer((SELECT id FROM ids WHERE name = 'X'), (SELECT id FROM ids WHERE name = 'Y'), 'NaN')$$,
  'P0001', 'Amount must be greater than 0', 'create_account_transfer rejects a NaN amount');
SELECT throws_ok(
  $$SELECT public.create_account_transfer((SELECT id FROM ids WHERE name = 'X'), (SELECT id FROM ids WHERE name = 'Z'), 5, 'NaN')$$,
  'P0001', 'Exchange rate must be greater than 0', 'create_account_transfer rejects a NaN rate across currencies');

SELECT pg_temp.check_balances('after rejected sub-cent and NaN calls', 99.98, -2.64, 0);

SELECT * FROM finish();
ROLLBACK;
