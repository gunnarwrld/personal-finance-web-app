-- Checks supabase/seed.sql when it has been loaded (`supabase db reset`).
-- On a database without the demo users every test here is skipped.
BEGIN;
\ir helpers/setup.psql

SELECT plan(9);

CREATE TEMP TABLE seed_accounts (email text, name text, opening numeric, expected numeric);
INSERT INTO seed_accounts VALUES
  ('alex.demo@example.test',  'Everyday Bank', 1000, 2700),
  ('alex.demo@example.test',  'Cash Wallet',    100,  100),
  ('alex.demo@example.test',  'Travel Card',    200,  240),
  ('sam.sample@example.test', 'Main Bank',      500, 1570),
  ('sam.sample@example.test', 'Pocket Cash',     50,   80);

SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alex.demo@example.test')
  THEN skip('seed.sql is not loaded', 9)
  ELSE collect_tap(
    is((SELECT count(*) FROM auth.users WHERE email LIKE '%@example.test'
                                          AND email IN (SELECT email FROM seed_accounts)),
       2::bigint, 'the seed creates two example.test users'),
    is((SELECT count(*) FROM public.user_preferences p JOIN auth.users u ON u.id = p.user_id
         WHERE u.email IN (SELECT email FROM seed_accounts)),
       2::bigint, 'the signup trigger gave both demo users preferences'),
    is((SELECT count(*) FROM public.accounts a JOIN auth.users u ON u.id = a.user_id
         WHERE u.email IN (SELECT email FROM seed_accounts)),
       5::bigint, 'the demo users have five accounts'),
    (SELECT collect_tap(array_agg(
       is(a.balance, s.opening + tests.ledger_balance(a.id),
          format('%s / %s: balance = opening + ledger', s.email, s.name))
       ORDER BY s.email, s.name))
       FROM seed_accounts s
       JOIN auth.users u ON u.email = s.email
       JOIN public.accounts a ON a.user_id = u.id AND a.name = s.name),
    is((SELECT array_agg(a.balance ORDER BY s.email, s.name)
          FROM seed_accounts s
          JOIN auth.users u ON u.email = s.email
          JOIN public.accounts a ON a.user_id = u.id AND a.name = s.name),
       (SELECT array_agg(expected ORDER BY email, name) FROM seed_accounts),
       'seeded balances match the documented totals')
  )
END;

SELECT * FROM finish();
ROLLBACK;
