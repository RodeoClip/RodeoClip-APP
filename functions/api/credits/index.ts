import { createClient } from '@supabase/supabase-js'

interface Env {
  NEXT_PUBLIC_SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
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
  if (!user) return Response.json({ error: 'Token ausente' }, { status: 401 })

  const supabase = getSupabase(env)

  const { data, error } = await supabase
    .from('user_credits')
    .select('credits_remaining, total_conversions')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    const { data: created } = await supabase
      .from('user_credits')
      .insert({ user_id: user.id, credits_remaining: 5 })
      .select('credits_remaining, total_conversions')
      .single()

    return Response.json(created ?? { credits_remaining: 5, total_conversions: 0 })
  }

  return Response.json(data)
}
