# Stripe Integration Setup Guide

This guide will help you set up Stripe payment processing for the FinanceTracker premium subscription feature.

## Prerequisites

- A Stripe account (sign up at https://dashboard.stripe.com/register)
- Access to your Stripe Dashboard
- Your Supabase project set up

## Step 1: Get Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_test_` for test mode)
4. Add it to your `.env` file:
   ```
   VITE_STRIPE_PUBLIC_KEY=pk_test_your_actual_key_here
   ```

## Step 2: Create Products and Prices

1. In Stripe Dashboard, go to **Products** → **Add product**

### Monthly Plan
1. Create a product:
   - Name: `FinanceTracker Premium - Monthly`
   - Description: `Premium subscription with advanced analytics and AI insights`
2. Add a price:
   - Price: `$9.99`
   - Billing period: `Monthly`
   - Currency: `USD`
3. Copy the **Price ID** (starts with `price_`)
4. Add to `.env`:
   ```
   VITE_STRIPE_MONTHLY_PRICE_ID=price_your_monthly_id_here
   ```

### Yearly Plan
1. Create another product:
   - Name: `FinanceTracker Premium - Yearly`
   - Description: `Premium subscription with advanced analytics and AI insights (20% savings)`
2. Add a price:
   - Price: `$99.99`
   - Billing period: `Yearly`
   - Currency: `USD`
3. Copy the **Price ID**
4. Add to `.env`:
   ```
   VITE_STRIPE_YEARLY_PRICE_ID=price_your_yearly_id_here
   ```

## Step 3: Set Up Supabase Edge Functions

You'll need to create two Edge Functions in your Supabase project:

### Function 1: create-checkout-session

This function creates a Stripe checkout session.

Location: `supabase/functions/create-checkout-session/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  try {
    const { priceId, customerId, successUrl, cancelUrl } = await req.json()

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### Function 2: create-portal-session

This function creates a Stripe customer portal session.

Location: `supabase/functions/create-portal-session/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  try {
    const { customerId, returnUrl } = await req.json()

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### Function 3: stripe-webhooks

This function handles Stripe webhook events.

Location: `supabase/functions/stripe-webhooks/index.ts`

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

  try {
    const event = stripe.webhooks.constructEvent(body, signature!, webhookSecret)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerEmail = session.customer_details?.email

        if (customerEmail) {
          // Look up user by email
          const { data: userData } = await supabase.auth.admin.listUsers()
          const user = userData?.users?.find(u => u.email === customerEmail)

          if (user) {
            // Upsert subscription record
            await supabase.from('user_subscriptions').upsert({
              user_id: user.id,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              subscription_tier: 'premium',
              subscription_status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
            }, { onConflict: 'user_id' })

            // Update premium flag in user_preferences
            await supabase.from('user_preferences')
              .update({ is_premium: true })
              .eq('user_id', user.id)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Find user by stripe_customer_id
        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (subData) {
          const isActive = subscription.status === 'active' || subscription.status === 'trialing'

          await supabase.from('user_subscriptions')
            .update({
              subscription_status: subscription.status,
              cancel_at_period_end: subscription.cancel_at_period_end,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('user_id', subData.user_id)

          await supabase.from('user_preferences')
            .update({ is_premium: isActive })
            .eq('user_id', subData.user_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (subData) {
          await supabase.from('user_subscriptions')
            .update({
              subscription_status: 'canceled',
              subscription_tier: 'free',
              cancel_at_period_end: false,
            })
            .eq('user_id', subData.user_id)

          await supabase.from('user_preferences')
            .update({ is_premium: false })
            .eq('user_id', subData.user_id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (subData) {
          await supabase.from('user_subscriptions')
            .update({ subscription_status: 'past_due' })
            .eq('user_id', subData.user_id)
        }
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

## Step 4: Deploy Edge Functions

```bash
# Deploy the functions
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhooks

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Step 5: Configure Webhooks

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-project.supabase.co/functions/v1/stripe-webhooks`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Signing secret** and add to Supabase secrets

## Step 6: Update Database Schema

Make sure your `user_subscriptions` table has these columns:
- `stripe_customer_id` (text, nullable)
- `stripe_subscription_id` (text, nullable)
- `stripe_price_id` (text, nullable)

## Step 7: Test the Integration

1. Use Stripe test cards: https://stripe.com/docs/testing
2. Test card: `4242 4242 4242 4242`
3. Any future expiry date
4. Any 3-digit CVC

## Production Checklist

Before going live:
- [ ] Switch to live API keys in production
- [ ] Update webhook endpoint to production URL
- [ ] Test with real card in test mode
- [ ] Set up proper error logging
- [ ] Configure email receipts in Stripe
- [ ] Set up tax collection if required
- [ ] Review Stripe's terms and compliance requirements

## Troubleshooting

### Common Issues

1. **"Stripe is not configured"**
   - Check that `VITE_STRIPE_PUBLIC_KEY` is set in `.env`
   - Restart dev server after adding environment variables

2. **Checkout session fails to create**
   - Verify Edge Function is deployed
   - Check Supabase logs for errors
   - Ensure Stripe secret key is set in Supabase secrets

3. **Webhook events not received**
   - Verify webhook endpoint URL is correct
   - Check webhook signing secret is set
   - Review Stripe webhook logs in Dashboard

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
