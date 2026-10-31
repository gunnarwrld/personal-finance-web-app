import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

// ─────────────────────────────────────────────────────────────
// Request limits
// ─────────────────────────────────────────────────────────────
const RATE_LIMIT = {
  /** Max requests a single user can make per window (strict 5 RPM to prevent a single user from exhausting global pool) */
  maxRequestsPerWindow: 5,
  /** Window duration in milliseconds (1 minute) */
  windowMs: 60_000,
  /** Max requests across ALL users per window (safe margin below Groq's 30 RPM global limit) */
  globalMaxPerWindow: 25,
  /** Global window duration in milliseconds (1 minute) */
  globalWindowMs: 60_000,
};

/** Models callers may pick. Keep in sync with GROQ_CONFIG.models in src/config/groq.ts. */
const ALLOWED_MODELS = new Set(['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']);
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
/** The app's prompts are a few KB; anything far larger is not ours. */
const MAX_PROMPT_CHARS = 24_000;
const MAX_TOKENS_CAP = 2048;

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Errors use real HTTP status codes so they show up as failures in the
// function logs; the client reads the {"error"} body from FunctionsHttpError.
function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extraHeaders },
  });
}

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
      return json({ error: 'Missing authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return json({ error: 'Unauthorized: please sign in again' }, 401);
    }

    // ── Rate-limit check ────────────────────────────────────
    const { allowed, retryAfterMs } = checkRateLimit(user.id);
    if (!allowed) {
      const retryAfterSec = Math.ceil((retryAfterMs ?? 60_000) / 1000);
      return json(
        { error: `Rate limit exceeded. Try again in ${retryAfterSec} seconds.` },
        429,
        { 'Retry-After': String(retryAfterSec) }
      );
    }

    // ── Parse and validate body ──────────────────────────────
    const { prompt, options } = await req.json().catch(() => ({}));
    if (!prompt || typeof prompt !== 'string') {
      return json({ error: 'A non-empty "prompt" string is required' }, 400);
    }
    if (prompt.length > MAX_PROMPT_CHARS) {
      return json({ error: 'Prompt is too long' }, 400);
    }

    const model = options?.model ?? DEFAULT_MODEL;
    if (!ALLOWED_MODELS.has(model)) {
      return json({ error: `Model "${model}" is not allowed` }, 400);
    }

    // Clamp numeric options to sane ranges
    const maxTokens = Math.min(Math.max(Number(options?.maxTokens) || 1024, 1), MAX_TOKENS_CAP);
    const temperature = Math.min(Math.max(Number(options?.temperature ?? 0.7), 0), 2);

    // ── Call Groq ────────────────────────────────────────────
    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
      return json({ error: 'GROQ_API_KEY environment variable is not set' }, 500);
    }

    const groqResponse = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    const completion = await groqResponse.json().catch(() => null);
    if (!groqResponse.ok) {
      const upstreamMessage = completion?.error?.message || `status ${groqResponse.status}`;
      console.error('Groq API error:', groqResponse.status, upstreamMessage);
      if (groqResponse.status === 401) {
        return json({ error: 'Invalid Groq API key on the server' }, 502);
      }
      if (groqResponse.status === 429) {
        return json({ error: 'The AI provider is busy. Please try again in a minute.' }, 429, { 'Retry-After': '60' });
      }
      return json({ error: `AI provider error: ${upstreamMessage}` }, 502);
    }

    const content = completion?.choices?.[0]?.message?.content || '';

    // Housekeeping: prune expired buckets every so often
    pruneExpiredBuckets();

    return json({
      content,
      usage: completion?.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
      } : undefined,
      model: completion?.model ?? model,
    });
  } catch (error) {
    console.error('Error in groq-proxy edge function:', error);
    return json({ error: error instanceof Error ? error.message : 'Internal server error' }, 500);
  }
});
