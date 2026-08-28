import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

interface Env {
  STRIPE_SECRET_KEY: string
  NEXT_PUBLIC_SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

const PRICE_ID = 'price_1SfLZTHPlFlQEzUoHbuqm4BB'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7))
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  // Verifica se já tem assinatura ativa
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (sub?.plan === 'pro' && sub?.status === 'active') {
    return Response.json({ error: 'Já possui assinatura ativa' }, { status: 400 })
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY)
  const origin = request.headers.get('origin') ?? 'https://www.rodeoclip.com.br'

  // Reutiliza customer_id existente ou deixa Stripe criar pelo e-mail
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/dashboard?checkout=cancelled`,
    metadata: { user_id: user.id },
    subscription_data: { metadata: { user_id: user.id } },
  }

  if (sub?.stripe_customer_id) {
    sessionParams.customer = sub.stripe_customer_id
  } else {
    sessionParams.customer_email = user.email
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return Response.json({ url: session.url })
}
