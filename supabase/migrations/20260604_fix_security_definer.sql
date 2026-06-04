-- Fix for Supabase Security Warning: Signed-In Users Can Execute SECURITY DEFINER Function
-- Change function to SECURITY INVOKER
ALTER FUNCTION public.update_updated_at_column() SECURITY INVOKER;

-- Revoke execute permissions from anon and authenticated users
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM authenticated;
