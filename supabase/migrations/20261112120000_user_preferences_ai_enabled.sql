-- Per-user AI opt-out.
--
-- AI insights send a summary of the user's transactions to Groq, and only
-- when the user clicks an AI action. This flag lets a user switch that off.
-- It defaults to on (the privacy notice at /privacy explains what is sent);
-- the groq-proxy Edge Function reads it and refuses requests when it is off,
-- so turning it off cannot be bypassed from the browser.
--
-- Adding a NOT NULL column with a constant default does not rewrite the
-- table on Postgres 11+, and existing rows read the default (on).

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.user_preferences.ai_enabled IS
  'When false, AI insights are hidden in the app and groq-proxy rejects the user''s requests.';
