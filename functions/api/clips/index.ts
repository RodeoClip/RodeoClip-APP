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
    .from('conversion_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return Response.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
  }

  const clips = (data ?? []).map(clip => ({
    ...clip,
    download_available: false,
    download_url: null,
  }))

  return Response.json({ clips })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getUser(request, env)
  if (!user) return Response.json({ error: 'Token ausente' }, { status: 401 })

  const supabase = getSupabase(env)
  const body = await request.json() as Record<string, unknown>

  const { error } = await supabase.from('conversion_history').insert({
    user_id: user.id,
    job_id: body.jobId,
    file_names: body.fileNames,
    video_count: body.videoCount,
    speed_multiplier: body.speedMultiplier,
    used_logo: body.usedLogo,
    muted_audio: body.mutedAudio,
    used_text_overlay: body.usedTextOverlay,
    used_stabilize: body.usedStabilize,
  })

  if (error) {
    return Response.json({ error: 'Erro ao salvar histórico' }, { status: 500 })
  }

  return Response.json({ ok: true }, { status: 201 })
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getUser(request, env)
  if (!user) return Response.json({ error: 'Token ausente' }, { status: 401 })

  const supabase = getSupabase(env)
  const { id } = await request.json() as { id: string }

  if (!id) {
    return Response.json({ error: 'ID obrigatório' }, { status: 400 })
  }

  await supabase
    .from('conversion_history')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  return Response.json({ ok: true })
}
