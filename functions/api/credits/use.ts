import { createClient } from '@supabase/supabase-js'

interface Env {
  NEXT_PUBLIC_SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Token ausente' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7))
  if (authError || !user) {
    return Response.json({ error: 'Token inválido' }, { status: 401 })
  }

  const { amount } = await request.json() as { amount: number }
  if (!amount || amount < 1) {
    return Response.json({ error: 'amount inválido' }, { status: 400 })
  }

  const { data, error: rpcError } = await supabase.rpc('use_credits', {
    p_user_id: user.id,
    p_amount: Math.floor(amount),
  })

  if (rpcError) {
    return Response.json({ error: rpcError.message }, { status: 500 })
  }

  return Response.json({ credits_remaining: data ?? 0 })
}
