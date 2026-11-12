import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

// Deletes the signed-in user's account and everything they stored.
//
// Every user-owned table references auth.users with ON DELETE CASCADE, so
// removing the auth user removes their accounts, transactions, budgets,
// bills, recurring items, notifications and preferences in the same step.
// Only the service role may delete auth users, which is why this lives in
// an Edge Function instead of the browser.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** The client must send this to show the user confirmed; guards against stray calls. */
const CONFIRMATION = 'DELETE';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      return json({ error: 'Account deletion is not configured on the server' }, 500);
    }

    // Identify the caller from their own session token.
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return json({ error: 'Unauthorized: please sign in again' }, 401);
    }

    const { confirm } = await req.json().catch(() => ({}));
    if (confirm !== CONFIRMATION) {
      return json({ error: `Send {"confirm": "${CONFIRMATION}"} to delete your account` }, 400);
    }

    // The user id comes only from the verified token, never from the body,
    // so a caller can delete nobody but themselves.
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('delete-account: deleteUser failed', deleteError.message);
      return json({ error: 'Could not delete the account. Please try again.' }, 500);
    }

    return json({ deleted: true });
  } catch (error) {
    console.error('Error in delete-account edge function:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
