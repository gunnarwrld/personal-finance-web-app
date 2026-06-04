import Groq from 'npm:groq-sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';

// ─────────────────────────────────────────────────────────────
// Rate-limit configuration
// ─────────────────────────────────────────────────────────────
const RATE_LIMIT = {
  /** Max requests a single user can make per window */
  maxRequestsPerWindow: 10,
  /** Window duration in milliseconds (1 minute) */
  windowMs: 60_000,
  /** Max requests across ALL users per window (global safety net) */
  globalMaxPerWindow: 200,
  /** Global window duration in milliseconds (1 minute) */
  globalWindowMs: 60_000,
};

// ─────────────────────────────────────────────────────────────
// In-memory sliding-window counters
// Edge Function instances are short-lived, so this resets on
// cold starts — which is fine; it's a best-effort guard, not a
// billing system. For stricter limits, swap for a KV / Redis store.
// ─────────────────────────────────────────────────────────────
const perUserBuckets = new Map<string, { count: number; resetAt: number }>();
let globalBucket = { count: 0, resetAt: Date.now() + RATE_LIMIT.globalWindowMs };

function checkRateLimit(userId: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();

  // ── Global limit ──────────────────────────────────────────
  if (now >= globalBucket.resetAt) {
    globalBucket = { count: 0, resetAt: now + RATE_LIMIT.globalWindowMs };
  }
  if (globalBucket.count >= RATE_LIMIT.globalMaxPerWindow) {
    return { allowed: false, retryAfterMs: globalBucket.resetAt - now };
  }

  // ── Per-user limit ────────────────────────────────────────
  let bucket = perUserBuckets.get(userId);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_LIMIT.windowMs };
    perUserBuckets.set(userId, bucket);
  }
  if (bucket.count >= RATE_LIMIT.maxRequestsPerWindow) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  // ── Allowed — increment both counters ─────────────────────
  bucket.count++;
  globalBucket.count++;
  return { allowed: true };
}

// Periodically clean up expired per-user buckets so the map
// doesn't grow unbounded during a long-lived instance.
function pruneExpiredBuckets() {
  const now = Date.now();
  for (const [key, bucket] of perUserBuckets) {
    if (now >= bucket.resetAt) perUserBuckets.delete(key);
  }
}

// ─────────────────────────────────────────────────────────────
// CORS headers
// ─────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─────────────────────────────────────────────────────────────
// Edge Function handler
// ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Authenticate the caller ─────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized — invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Rate-limit check ────────────────────────────────────
    const { allowed, retryAfterMs } = checkRateLimit(user.id);
    if (!allowed) {
      const retryAfterSec = Math.ceil((retryAfterMs ?? 60_000) / 1000);
      return new Response(
        JSON.stringify({
          error: `Rate limit exceeded. Try again in ${retryAfterSec} seconds.`,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSec),
          },
        }
      );
    }

    // ── Parse and validate body ──────────────────────────────
    const { prompt, options } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'A non-empty "prompt" string is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cap max_tokens to prevent abuse
    const maxTokens = Math.min(options?.maxTokens ?? 1024, 2048);

    // ── Call Groq ────────────────────────────────────────────
    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }

    const groq = new Groq({ apiKey });

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: options?.model || 'mixtral-8x7b-32768',
      temperature: options?.temperature ?? 0.7,
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content || '';

    // Housekeeping: prune expired buckets every so often
    pruneExpiredBuckets();

    return new Response(
      JSON.stringify({
        content,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
        model: response.model,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in groq-proxy edge function:', error);

    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
