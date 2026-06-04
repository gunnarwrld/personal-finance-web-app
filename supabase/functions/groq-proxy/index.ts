import Groq from 'npm:groq-sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, options } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }

    const groq = new Groq({ apiKey });

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: options?.model || 'mixtral-8x7b-32768',
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    });

    const content = response.choices[0]?.message?.content || '';

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
    
    // Provide a standardized error response
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
