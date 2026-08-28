import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

interface Env {
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  NEXT_PUBLIC_SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

// Créditos adicionados ao ativar o plano pro
const PRO_CREDITS = 5

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY)
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  const body = await request.text()
  const sig = request.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return new Response('Assinatura inválida', { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const userId = session.metadata?.user_id
      if (!userId) break

      const customerId = session.customer as string
      const subscriptionId = session.subscription as string

      await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan: 'pro',
          status: 'active',
          price_brl: 6999,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      // Adiciona créditos pro
      await supabase
        .from('user_credits')
        .upsert({
          user_id: userId,
          credits_remaining: PRO_CREDITS,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      break
    }

    case 'invoice.paid': {
      // Renovação mensal — cobrança de R$ 69,99 confirmada, apenas garante status ativo
      const invoice = event.data.object as Stripe.Invoice
      const subId = invoice.subscription as string
      if (!subId) break

      const subscription = await stripe.subscriptions.retrieve(subId)
      const userId = subscription.metadata?.user_id
      if (!userId) break

      await supabase
        .from('subscriptions')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      break
    }

    case 'customer.subscription.deleted': {
      // Cancelamento — volta para free
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.user_id
      if (!userId) break

      await supabase
        .from('subscriptions')
        .update({
          plan: 'free',
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = invoice.subscription as string
      if (!subId) break

      const subscription = await stripe.subscriptions.retrieve(subId)
      const userId = subscription.metadata?.user_id
      if (!userId) break

      await supabase
        .from('subscriptions')
        .update({ status: 'past_due', updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      break
    }
  }

  return new Response('ok', { status: 200 })
}
