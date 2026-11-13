-- Round every amount the balance RPCs receive to the cent before using it.
--
-- The ledger columns are DECIMAL(15,2), so a stored amount is rounded to the
-- cent, but the RPCs applied the raw parameter to the balance and let the
-- column round the *sum*. Postgres rounds half away from zero, so the two
-- roundings disagree on half cents: a 0.005 expense on a balance of 100.00
-- was stored as 0.01, but 100.00 - 0.005 = 99.995 rounds back to 100.00. The
-- balance then no longer equals the ledger, and nothing in the app notices or
-- repairs it. The forms only send whole cents, so this took a crafted
-- request, but the database should not rely on the forms.
--
-- Each RPC now rounds the amount once, at the start, and uses that value for
-- both the ledger row and the balance change. An amount that rounds to 0
-- (under half a cent) is rejected like 0 itself.
--
-- NaN is rejected too, for amounts and exchange rates: numeric NaN compares
-- greater than every number, so it passed the old `<= 0` checks, and a NaN
-- balance stays NaN through every later change. Infinity is rejected with
-- the same message instead of failing later with a numeric overflow.
--
-- Exchange rates are deliberately not rounded: account_transfers.exchange_rate
-- keeps only 4 decimals, which would lose precision on pairs like JPY -> EUR.
-- converted_amount is computed from the rate as sent and is what the balances
-- use.
--
-- Apart from those checks the function bodies are unchanged from
-- 20261031120835_security_and_integrity_fixes.sql. CREATE OR REPLACE keeps
-- the existing grants (EXECUTE for authenticated only). Rows already stored
-- are not touched.

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
  -- Round once; the ledger row and the balance change both use this value.
  p_amount := round(p_amount, 2);
  IF p_amount IS NULL OR p_amount <= 0
     OR p_amount = 'NaN'::numeric OR p_amount = 'Infinity'::numeric THEN
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
  -- Round once; the ledger row and the balance change both use this value.
  p_amount := round(p_amount, 2);
  IF p_amount IS NULL OR p_amount <= 0
     OR p_amount = 'NaN'::numeric OR p_amount = 'Infinity'::numeric THEN
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
  -- Round once; the transfer row and the source balance both use this value.
  p_amount := round(p_amount, 2);
  IF p_amount IS NULL OR p_amount <= 0
     OR p_amount = 'NaN'::numeric OR p_amount = 'Infinity'::numeric THEN
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
  IF v_rate IS NULL OR v_rate <= 0
     OR v_rate = 'NaN'::numeric OR v_rate = 'Infinity'::numeric THEN
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
