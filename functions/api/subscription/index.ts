import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

interface Env {
  NEXT_PUBLIC_SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  STRIPE_SECRET_KEY: string
}

function getSupabase(env: Env) {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}

async function getUser(request: Request, env: Env) {
  const supabase = getSupabase(env)
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7))
  return user
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getUser(request, env)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = getSupabase(env)

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    const { data: created } = await supabase
      .from('subscriptions')
      .insert({ user_id: user.id, plan: 'free', status: 'active', price_brl: 0 })
      .select('*')
      .single()

    return Response.json(created ?? {
      plan: 'free',
      status: 'active',
      price_brl: 0,
      cancelled_at: null,
      cancel_reason: null,
      refund_status: null,
      refund_reason: null,
    })
  }

  return Response.json(data)
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getUser(request, env)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json() as { action: string; reason?: string }
  const { action, reason } = body

  const supabase = getSupabase(env)

  if (action === 'cancel') {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, status, cancelled_at, stripe_subscription_id')
      .eq('user_id', user.id)
      .single()

    if (!sub || sub.plan === 'free') {
      return Response.json({ error: 'Não há assinatura ativa para cancelar' }, { status: 400 })
    }
    if (sub.cancelled_at) {
      return Response.json({ error: 'Assinatura já cancelada' }, { status: 400 })
    }

    if (sub.stripe_subscription_id) {
      const stripe = new Stripe(env.STRIPE_SECRET_KEY)
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      })
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) return Response.json({ error: 'Erro ao cancelar' }, { status: 500 })
    return Response.json(data)
  }

  if (action === 'refund') {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, refund_status, price_brl')
      .eq('user_id', user.id)
      .single()

    if (!sub || sub.plan === 'free') {
      return Response.json({ error: 'Não há assinatura para solicitar reembolso' }, { status: 400 })
    }
    if (sub.refund_status === 'pending') {
      return Response.json({ error: 'Já existe uma solicitação de reembolso pendente' }, { status: 400 })
    }
    if (sub.refund_status === 'approved') {
      return Response.json({ error: 'Reembolso já aprovado' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        refund_requested_at: new Date().toISOString(),
        refund_status: 'pending',
        refund_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) return Response.json({ error: 'Erro ao solicitar reembolso' }, { status: 500 })
    return Response.json(data)
  }

  return Response.json({ error: 'Ação inválida' }, { status: 400 })
}
