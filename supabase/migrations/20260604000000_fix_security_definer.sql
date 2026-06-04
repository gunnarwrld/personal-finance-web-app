-- Fix for Supabase Security Warning: Signed-In Users Can Execute SECURITY DEFINER Function
-- Change function to SECURITY INVOKER
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column') THEN
    EXECUTE 'ALTER FUNCTION public.update_updated_at_column() SECURITY INVOKER';
    EXECUTE 'REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon';
    EXECUTE 'REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM authenticated';
  END IF;
END $$;
