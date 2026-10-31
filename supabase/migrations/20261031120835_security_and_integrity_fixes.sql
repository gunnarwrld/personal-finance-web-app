-- Security, integrity and performance fixes from the October 2026 audit.
--
-- 1. Signup trigger. create_notification_preferences_for_user() had no fixed
--    search_path and an unqualified table name. Supabase Auth inserts users
--    with search_path=auth, so the insert could not find the table and every
--    new signup failed with "Database error saving new user". It was also
--    callable by anon/authenticated through /rest/v1/rpc.
-- 2. currency_rates was writable by every signed-in user, so one account
--    could change the rates everybody sees. Only the refresh-currency-rates
--    edge function (service role) writes it now.
-- 3. user_subscriptions let users insert/update their own row, i.e. grant
--    themselves premium. Users can only read it now; the Stripe webhook
--    writes it with the service role.
-- 4. RLS policies are scoped to the authenticated role, evaluate auth.uid()
--    once per statement, and check that referenced accounts belong to the
--    caller (previously a row could point at another user's account id).
-- 5. Balance changes run atomically in SQL functions instead of the browser
--    reading a balance and writing it back in separate requests.
-- 6. NOT NULL ownership columns, one subscription row per user, one rates
--    row per base currency, and indexes for every foreign key.

-- ── 1. Signup trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP FUNCTION IF EXISTS public.create_notification_preferences_for_user();

-- Existing users signed up before the trigger existed (or while it was broken).
INSERT INTO public.user_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.notification_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ── 2. currency_rates: read-only for clients ───────────────────────────────

DROP POLICY IF EXISTS "Anyone can view currency rates" ON public.currency_rates;
DROP POLICY IF EXISTS "Authenticated users can insert currency rates" ON public.currency_rates;
DROP POLICY IF EXISTS "Authenticated users can update currency rates" ON public.currency_rates;
DROP POLICY IF EXISTS "Authenticated users can delete currency rates" ON public.currency_rates;

CREATE POLICY "Signed-in users can read currency rates" ON public.currency_rates
  FOR SELECT TO authenticated
  USING (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.currency_rates FROM anon, authenticated;

ALTER TABLE public.currency_rates
  ADD CONSTRAINT currency_rates_base_currency_key UNIQUE (base_currency);

-- ── 3. user_subscriptions: read-only for clients ───────────────────────────

DROP POLICY IF EXISTS "Users can manage their own user_subscriptions" ON public.user_subscriptions;

CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.user_subscriptions FROM anon, authenticated;

ALTER TABLE public.user_subscriptions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);

-- ── 4. Ownership columns ───────────────────────────────────────────────────

ALTER TABLE public.accounts
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN balance SET NOT NULL;
ALTER TABLE public.transactions
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.budgets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.recurring_transactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.bill_reminders ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.account_transfers
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN from_account_id SET NOT NULL,
  ALTER COLUMN to_account_id SET NOT NULL;

-- ── 5. RLS policies ────────────────────────────────────────────────────────

-- accounts
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.accounts;

CREATE POLICY "Users can view own accounts" ON public.accounts
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = transactions.account_id AND a.user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = transactions.account_id AND a.user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- user_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- budgets
DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;

CREATE POLICY "Users can manage their own budgets" ON public.budgets
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- recurring_transactions
DROP POLICY IF EXISTS "Users can manage their own recurring_transactions" ON public.recurring_transactions;

CREATE POLICY "Users can manage their own recurring_transactions" ON public.recurring_transactions
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      recurring_transactions.account_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.accounts a
        WHERE a.id = recurring_transactions.account_id AND a.user_id = (SELECT auth.uid())
      )
    )
  );

-- bill_reminders
DROP POLICY IF EXISTS "Users can manage their own bill_reminders" ON public.bill_reminders;

CREATE POLICY "Users can manage their own bill_reminders" ON public.bill_reminders
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      bill_reminders.account_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.accounts a
        WHERE a.id = bill_reminders.account_id AND a.user_id = (SELECT auth.uid())
      )
    )
    AND (
      bill_reminders.recurring_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.recurring_transactions r
        WHERE r.id = bill_reminders.recurring_id AND r.user_id = (SELECT auth.uid())
      )
    )
  );

-- account_transfers
DROP POLICY IF EXISTS "Users can manage their own account_transfers" ON public.account_transfers;

CREATE POLICY "Users can manage their own account_transfers" ON public.account_transfers
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = account_transfers.from_account_id AND a.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = account_transfers.to_account_id AND a.user_id = (SELECT auth.uid())
    )
  );

-- notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert their own notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- notification_preferences
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON public.notification_preferences;

CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert their own notification preferences" ON public.notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ── 6. Foreign key indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS account_transfers_user_id_idx ON public.account_transfers (user_id);
CREATE INDEX IF NOT EXISTS account_transfers_from_account_id_idx ON public.account_transfers (from_account_id);
CREATE INDEX IF NOT EXISTS account_transfers_to_account_id_idx ON public.account_transfers (to_account_id);
CREATE INDEX IF NOT EXISTS bill_reminders_user_id_idx ON public.bill_reminders (user_id);
CREATE INDEX IF NOT EXISTS bill_reminders_account_id_idx ON public.bill_reminders (account_id);
CREATE INDEX IF NOT EXISTS bill_reminders_recurring_id_idx ON public.bill_reminders (recurring_id);
CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON public.budgets (user_id);
CREATE INDEX IF NOT EXISTS recurring_transactions_user_id_idx ON public.recurring_transactions (user_id);
CREATE INDEX IF NOT EXISTS recurring_transactions_account_id_idx ON public.recurring_transactions (account_id);

-- ── 7. Atomic balance changes ──────────────────────────────────────────────
-- SECURITY INVOKER: every statement still goes through the caller's RLS.
-- Each function runs in a single transaction, so a failure part-way leaves
-- both the ledger row and the account balance untouched.

CREATE OR REPLACE FUNCTION public.create_transaction(
  p_account_id integer,
  p_type text,
  p_amount numeric,
  p_category text,
  p_description text,
  p_date date
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_currency text;
  v_transaction public.transactions;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;

  UPDATE public.accounts
     SET balance = balance + CASE WHEN p_type = 'income' THEN p_amount ELSE -p_amount END
   WHERE id = p_account_id AND user_id = v_user_id
  RETURNING currency INTO v_currency;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  INSERT INTO public.transactions (user_id, account_id, type, amount, category, description, date, currency)
  VALUES (v_user_id, p_account_id, p_type, p_amount, p_category, p_description, p_date, v_currency)
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_transaction(
  p_id integer,
  p_account_id integer,
  p_type text,
  p_amount numeric,
  p_category text,
  p_description text,
  p_date date
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_old public.transactions;
  v_currency text;
  v_transaction public.transactions;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;

  SELECT * INTO v_old
    FROM public.transactions
   WHERE id = p_id AND user_id = v_user_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  -- Lock both accounts in a fixed order so concurrent edits cannot deadlock.
  PERFORM 1
     FROM public.accounts
    WHERE id IN (v_old.account_id, p_account_id) AND user_id = v_user_id
    ORDER BY id
      FOR UPDATE;

  -- Undo the old amount, then apply the new one (possibly on another account).
  UPDATE public.accounts
     SET balance = balance - CASE WHEN v_old.type = 'income' THEN v_old.amount ELSE -v_old.amount END
   WHERE id = v_old.account_id AND user_id = v_user_id;

  UPDATE public.accounts
     SET balance = balance + CASE WHEN p_type = 'income' THEN p_amount ELSE -p_amount END
   WHERE id = p_account_id AND user_id = v_user_id
  RETURNING currency INTO v_currency;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  UPDATE public.transactions
     SET account_id = p_account_id,
         type = p_type,
         amount = p_amount,
         category = p_category,
         description = p_description,
         date = p_date,
         currency = v_currency
   WHERE id = p_id
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_transaction(p_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_old public.transactions;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.transactions
   WHERE id = p_id AND user_id = v_user_id
  RETURNING * INTO v_old;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  UPDATE public.accounts
     SET balance = balance - CASE WHEN v_old.type = 'income' THEN v_old.amount ELSE -v_old.amount END
   WHERE id = v_old.account_id AND user_id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_account_transfer(
  p_from_account_id integer,
  p_to_account_id integer,
  p_amount numeric,
  p_exchange_rate numeric DEFAULT 1,
  p_description text DEFAULT NULL,
  p_transfer_date date DEFAULT CURRENT_DATE
)
RETURNS public.account_transfers
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_from public.accounts;
  v_to public.accounts;
  v_rate numeric;
  v_converted numeric;
  v_transfer public.account_transfers;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;
  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'Choose two different accounts';
  END IF;

  PERFORM 1
     FROM public.accounts
    WHERE id IN (p_from_account_id, p_to_account_id) AND user_id = v_user_id
    ORDER BY id
      FOR UPDATE;

  SELECT * INTO v_from FROM public.accounts WHERE id = p_from_account_id AND user_id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source account not found';
  END IF;
  SELECT * INTO v_to FROM public.accounts WHERE id = p_to_account_id AND user_id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destination account not found';
  END IF;

  v_rate := CASE WHEN v_from.currency = v_to.currency THEN 1 ELSE p_exchange_rate END;
  IF v_rate IS NULL OR v_rate <= 0 THEN
    RAISE EXCEPTION 'Exchange rate must be greater than 0';
  END IF;
  v_converted := round(p_amount * v_rate, 2);

  UPDATE public.accounts SET balance = balance - p_amount WHERE id = v_from.id;
  UPDATE public.accounts SET balance = balance + v_converted WHERE id = v_to.id;

  INSERT INTO public.account_transfers (
    user_id, from_account_id, to_account_id, amount, from_currency, to_currency,
    exchange_rate, converted_amount, description, transfer_date
  )
  VALUES (
    v_user_id, v_from.id, v_to.id, p_amount, v_from.currency, v_to.currency,
    v_rate, v_converted, p_description, COALESCE(p_transfer_date, CURRENT_DATE)
  )
  RETURNING * INTO v_transfer;

  RETURN v_transfer;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_account_transfer(p_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_old public.account_transfers;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.account_transfers
   WHERE id = p_id AND user_id = v_user_id
  RETURNING * INTO v_old;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer not found';
  END IF;

  UPDATE public.accounts SET balance = balance + v_old.amount
   WHERE id = v_old.from_account_id AND user_id = v_user_id;
  UPDATE public.accounts SET balance = balance - v_old.converted_amount
   WHERE id = v_old.to_account_id AND user_id = v_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_transaction(integer, text, numeric, text, text, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_transaction(integer, integer, text, numeric, text, text, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_transaction(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_account_transfer(integer, integer, numeric, numeric, text, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_account_transfer(integer) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_transaction(integer, text, numeric, text, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_transaction(integer, integer, text, numeric, text, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_transaction(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_account_transfer(integer, integer, numeric, numeric, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_account_transfer(integer) TO authenticated;
