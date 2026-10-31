import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

// Refreshes the shared exchange-rate row. Clients can only read
// public.currency_rates, so this is the one place rates are written, and the
// values always come from the ECB (via Frankfurter), never from a caller.

const BASE_CURRENCY = 'USD';
const RATES_URL = `https://api.frankfurter.dev/v1/latest?base=${BASE_CURRENCY}`;
// The ECB publishes once per working day; refetching more often than this
// only hammers the free API.
const MIN_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

  try {
    // ── Only signed-in users may trigger a refresh ──────────────────────
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return json({ error: 'Missing authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      return json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not available to this function' }, 500);
    }
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ── Serve the stored row if it is recent enough ─────────────────────
    const { data: current, error: readError } = await admin
      .from('currency_rates')
      .select('*')
      .eq('base_currency', BASE_CURRENCY)
      .maybeSingle();
    if (readError) throw readError;

    const age = current?.last_updated ? Date.now() - new Date(current.last_updated).getTime() : Infinity;
    if (current && age < MIN_REFRESH_INTERVAL_MS) {
      return json(current);
    }

    // ── Fetch and validate fresh rates ──────────────────────────────────
    const response = await fetch(RATES_URL, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
      return json({ error: `Exchange rate provider responded with ${response.status}` }, 502);
    }
    const body = await response.json();
    const fetched = body?.rates;
    if (!fetched || typeof fetched !== 'object') {
      return json({ error: 'Exchange rate provider returned an unexpected response' }, 502);
    }

    const rates: Record<string, number> = { [BASE_CURRENCY]: 1 };
    for (const [code, value] of Object.entries(fetched)) {
      if (/^[A-Z]{3}$/.test(code) && typeof value === 'number' && Number.isFinite(value) && value > 0) {
        rates[code] = value;
      }
    }

    const { data: saved, error: writeError } = await admin
      .from('currency_rates')
      .upsert(
        { base_currency: BASE_CURRENCY, rates, last_updated: new Date().toISOString() },
        { onConflict: 'base_currency' }
      )
      .select()
      .single();
    if (writeError) throw writeError;

    return json(saved);
  } catch (error) {
    console.error('Error in refresh-currency-rates:', error);
    return json({ error: error instanceof Error ? error.message : 'Internal server error' }, 500);
  }
});
