-- Demo data for LOCAL stacks only. `supabase db reset` loads it after the
-- migrations; it is never pushed to the hosted project.
--
-- Everything here is made up: two users on the reserved example.test domain,
-- round amounts, and dates relative to today so the dashboard looks current.
-- Both users can sign in to a local stack with the password
-- `demo-password-123`.
--
-- Balances are produced by the same RPCs the app uses (create_transaction,
-- create_account_transfer), so every account's balance equals its opening
-- balance plus its ledger. The pgTAP tests in supabase/tests rely on that.

-- ── Users ──────────────────────────────────────────────────────────────────
-- The on_auth_user_created trigger creates user_preferences and
-- notification_preferences rows for each.

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', 'alex.demo@example.test',
   extensions.crypt('demo-password-123', extensions.gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alex Demo"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-0000-4000-8000-000000000002',
   'authenticated', 'authenticated', 'sam.sample@example.test',
   extensions.crypt('demo-password-123', extensions.gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sam Sample"}',
   now(), now(), '', '', '', '');

INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
  FROM auth.users u
 WHERE u.email IN ('alex.demo@example.test', 'sam.sample@example.test');

-- ── Shared reference data ──────────────────────────────────────────────────
-- Normally written by the refresh-currency-rates edge function.

INSERT INTO public.currency_rates (base_currency, rates)
VALUES ('USD', '{"USD": 1, "EUR": 0.9, "GBP": 0.8, "MXN": 20}')
ON CONFLICT (base_currency) DO NOTHING;

INSERT INTO public.user_subscriptions (user_id, subscription_tier, subscription_status)
VALUES ('aaaaaaaa-0000-4000-8000-000000000001', 'free', 'active'),
       ('bbbbbbbb-0000-4000-8000-000000000002', 'free', 'active');

-- ── Per-user data, written through the app's own RPCs ──────────────────────

DO $$
DECLARE
  v_alex uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  v_sam  uuid := 'bbbbbbbb-0000-4000-8000-000000000002';
  a_bank int; a_cash int; a_travel int;
  s_bank int; s_cash int;
  v_rent int;
BEGIN
  -- Accounts start at a round opening balance.
  INSERT INTO public.accounts (user_id, name, type, balance, currency, bank_name)
  VALUES (v_alex, 'Everyday Bank', 'Bank', 1000, 'USD', 'Example Bank')
  RETURNING id INTO a_bank;
  INSERT INTO public.accounts (user_id, name, type, balance, currency)
  VALUES (v_alex, 'Cash Wallet', 'Cash', 100, 'USD')
  RETURNING id INTO a_cash;
  INSERT INTO public.accounts (user_id, name, type, balance, currency)
  VALUES (v_alex, 'Travel Card', 'Card', 200, 'EUR')
  RETURNING id INTO a_travel;

  INSERT INTO public.accounts (user_id, name, type, balance, currency, bank_name)
  VALUES (v_sam, 'Main Bank', 'Bank', 500, 'USD', 'Sample Credit Union')
  RETURNING id INTO s_bank;
  INSERT INTO public.accounts (user_id, name, type, balance, currency)
  VALUES (v_sam, 'Pocket Cash', 'Cash', 50, 'USD')
  RETURNING id INTO s_cash;

  -- Act as Alex so auth.uid() inside the RPCs returns Alex's id.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_alex, 'role', 'authenticated')::text, true);

  PERFORM public.create_transaction(a_bank,   'income',  3000, 'Salary',            'Monthly salary',       current_date - 28);
  PERFORM public.create_transaction(a_bank,   'expense', 1200, 'Bills & Utilities', 'Rent',                 current_date - 27);
  PERFORM public.create_transaction(a_bank,   'expense',  100, 'Bills & Utilities', 'Electricity',          current_date - 20);
  PERFORM public.create_transaction(a_bank,   'expense',  150, 'Food & Dining',     'Groceries',            current_date - 14);
  PERFORM public.create_transaction(a_cash,   'expense',   20, 'Food & Dining',     'Coffee and a bagel',   current_date - 10);
  PERFORM public.create_transaction(a_cash,   'expense',   30, 'Transportation',    'Bus pass top-up',      current_date - 7);
  PERFORM public.create_transaction(a_bank,   'income',   400, 'Freelance',         'Logo design job',      current_date - 5);
  PERFORM public.create_transaction(a_bank,   'expense',   60, 'Entertainment',     'Concert tickets',      current_date - 3);
  PERFORM public.create_transaction(a_travel, 'expense',   50, 'Food & Dining',     'Dinner abroad',        current_date - 2);
  PERFORM public.create_transaction(a_bank,   'expense',   40, 'Health & Fitness',  'Gym membership',       current_date - 1);

  -- 100 USD -> 90 EUR at the seeded rate.
  PERFORM public.create_account_transfer(a_bank, a_travel, 100, 0.9, 'Top up travel card', current_date - 4);
  PERFORM public.create_account_transfer(a_bank, a_cash,    50, 1,   'ATM withdrawal',     current_date - 6);

  INSERT INTO public.budgets (user_id, category, amount, period, start_date)
  VALUES (v_alex, 'Food & Dining', 300, 'monthly', date_trunc('month', current_date)::date),
         (v_alex, 'Entertainment', 100, 'monthly', date_trunc('month', current_date)::date);

  INSERT INTO public.recurring_transactions
    (user_id, account_id, description, amount, category, type, frequency, start_date, next_occurrence)
  VALUES (v_alex, a_bank, 'Rent', 1200, 'Bills & Utilities', 'expense', 'monthly',
          current_date - 27, current_date + 3)
  RETURNING id INTO v_rent;

  INSERT INTO public.bill_reminders (user_id, account_id, title, amount, category, due_date, recurring_id)
  VALUES (v_alex, a_bank, 'Rent', 1200, 'Bills & Utilities', current_date + 3, v_rent),
         (v_alex, a_bank, 'Internet', 50, 'Bills & Utilities', current_date + 10, NULL);

  INSERT INTO public.notifications (user_id, type, title, message, priority)
  VALUES (v_alex, 'bill_reminder', 'Rent due soon', 'Rent of $1,200 is due in 3 days.', 'high'),
         (v_alex, 'budget_alert', 'Food budget check', 'You have used most of your Food & Dining budget this month.', 'medium');

  -- Now act as Sam.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_sam, 'role', 'authenticated')::text, true);

  PERFORM public.create_transaction(s_bank, 'income',  2000, 'Salary',        'Paycheck',          current_date - 15);
  PERFORM public.create_transaction(s_bank, 'expense',  800, 'Bills & Utilities', 'Rent',          current_date - 14);
  PERFORM public.create_transaction(s_bank, 'expense',   90, 'Shopping',      'New running shoes', current_date - 8);
  PERFORM public.create_transaction(s_cash, 'expense',   10, 'Food & Dining', 'Lunch',             current_date - 2);
  PERFORM public.create_account_transfer(s_bank, s_cash, 40, 1, 'Cash for the week', current_date - 9);

  INSERT INTO public.budgets (user_id, category, amount, period, start_date)
  VALUES (v_sam, 'Shopping', 200, 'monthly', date_trunc('month', current_date)::date);

  INSERT INTO public.notifications (user_id, type, title, message, priority)
  VALUES (v_sam, 'low_balance', 'Pocket Cash is low', 'Pocket Cash is below $100.', 'low');

  PERFORM set_config('request.jwt.claims', '', true);
END
$$;
