import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

interface Env {
  STRIPE_SECRET_KEY: string
  NEXT_PUBLIC_SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7))
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!sub?.stripe_customer_id) {
    return Response.json({ error: 'Nenhuma assinatura encontrada' }, { status: 404 })
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY)
  const origin = request.headers.get('origin') ?? 'https://www.rodeoclip.com.br'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${origin}/configuracoes`,
  })

  return Response.json({ url: portalSession.url })
}
