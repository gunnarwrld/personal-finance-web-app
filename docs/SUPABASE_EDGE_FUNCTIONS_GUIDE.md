# Setting Up Supabase Edge Functions for Stripe - Step-by-Step Guide

## Overview

You need to create 3 serverless functions in your Supabase project to handle Stripe operations securely. These functions will run on Supabase's servers, not in the browser.

## Option 1: Using Supabase Dashboard (Easiest - Recommended)

### Step 1: Access Edge Functions in Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/pmeajlxzukzhcmjmclbf
2. Click on **Edge Functions** in the left sidebar
3. Click **Create a new function**

### Step 2: Create Function 1 - create-checkout-session

**Function Name:** `create-checkout-session`

**Code to paste:**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { priceId, successUrl, cancelUrl } = await req.json()
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Check if user already has a Stripe customer ID
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = subscription?.stripe_customer_id

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to database
      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
        })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
      },
    })

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
```

**Click Deploy**

### Step 3: Create Function 2 - create-portal-session

**Function Name:** `create-portal-session`

**Code to paste:**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { returnUrl } = await req.json()
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get stripe customer ID
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription?.stripe_customer_id) {
      throw new Error('No Stripe customer found')
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl,
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
```

**Click Deploy**

### Step 4: Create Function 3 - stripe-webhooks

**Function Name:** `stripe-webhooks`

**Code to paste:**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret)
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
      { status: 400 }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id

        if (userId && session.subscription) {
          // Update subscription in database
          await supabase
            .from('user_subscriptions')
            .update({
              stripe_subscription_id: session.subscription as string,
              stripe_price_id: session.line_items?.data[0]?.price?.id,
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('user_id', userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by customer ID
        const { data: userSub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (userSub) {
          await supabase
            .from('user_subscriptions')
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('user_id', userSub.user_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: userSub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (userSub) {
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
            })
            .eq('user_id', userSub.user_id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: userSub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (userSub) {
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'past_due',
            })
            .eq('user_id', userSub.user_id)
        }
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    ) 
  }
})
```

**Click Deploy**

### Step 5: Set Environment Secrets

1. In Supabase Dashboard, go to **Settings** → **Edge Functions**
2. Scroll to **Function Secrets**
3. Add these secrets:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key (starts with `sk_test_...`)
   - `STRIPE_WEBHOOK_SECRET`: Leave empty for now (you'll get this after setting up webhooks in Stripe)

### Step 6: Configure Stripe Webhooks

1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://pmeajlxzukzhcmjmclbf.supabase.co/functions/v1/stripe-webhooks`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_...`)
7. Go back to Supabase Edge Functions secrets and update `STRIPE_WEBHOOK_SECRET` with this value

### Step 7: Test Your Setup

You can test the functions by:
1. Going to Edge Functions in Supabase
2. Click on a function
3. Use the **Invoke** tab to test with sample data

---

## Option 2: Using Supabase CLI (Advanced)

If you prefer using the CLI, here's how to install it on Windows:

### Install with Scoop (Recommended for Windows)

```bash
# Install Scoop first if you don't have it
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Or download the binary directly

1. Download from: https://github.com/supabase/cli/releases
2. Extract and add to your PATH

### Then use CLI commands:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref pmeajlxzukzhcmjmclbf

# Create functions locally
supabase functions new create-checkout-session
supabase functions new create-portal-session
supabase functions new stripe-webhooks

# Deploy functions
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhooks

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

---

## Summary

**What you're doing:**
- Creating 3 serverless functions that handle Stripe operations securely on the server
- These functions keep your Stripe secret key safe (never exposed to the browser)
- They handle: checkout, customer portal, and webhook events

**Where to do it:**
- **Easiest**: Use Supabase Dashboard (Option 1) - just copy/paste the code
- **Advanced**: Use Supabase CLI (Option 2) - requires installation

**What happens next:**
- Once deployed, your app will call these functions when users subscribe
- Stripe will call the webhook function when subscriptions change
- Everything updates automatically in your database

Let me know if you need help with any specific step! 🚀
