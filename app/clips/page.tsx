'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  FilmSlate,
  DownloadSimple,
  Trash,
  Clock,
  Gauge,
  ImageSquare,
  SpeakerSlash,
  TextT,
  VideoCamera,
  ArrowRight,
  CircleNotch,
  Upload,
} from '@phosphor-icons/react'
import { AnimatedIcon } from '@/components/shared/AnimatedIcon'
import { Sidebar } from '@/components/layout/Sidebar'

interface Clip {
  id: string
  job_id: string
  file_names: string[]
  video_count: number
  speed_multiplier: number
  used_logo: boolean
  muted_audio: boolean
  used_text_overlay: boolean
  used_stabilize: boolean
  status: string
  created_at: string
  download_available: boolean
  download_url: string | null
}

const ease = [0.16, 1, 0.3, 1] as const

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Agora'
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ClipsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [clips, setClips] = useState<Clip[]>([])
  const [fetching, setFetching] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setUser(session.user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login')
      else setUser(session.user)
    })
    return () => subscription.unsubscribe()
  }, [router])

  const fetchClips = useCallback(async () => {
    setFetching(true)
    try {
      let { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        const { data: { session: refreshed } } = await supabase.auth.refreshSession()
        session = refreshed
      }
      if (!session) return

      const res = await fetch('/api/clips', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.ok) {
        const { clips: data } = await res.json()
        setClips(data)
      }
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    if (!loading && user) fetchClips()
  }, [loading, user, fetchClips])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch('/api/clips', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    })

    setClips(prev => prev.filter(c => c.id !== id))
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#1A1008]">
        <div className="w-10 h-10 rounded-full border-2 border-[#C17F3A] border-t-transparent animate-spin" />
      </div>
    )
  }

  const userName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Usuário'
  const firstName = userName.split(' ')[0]
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined

  return (
    <div className="min-h-[100dvh] bg-[#120B04] text-[#F5ECD7] flex flex-col">
      <div className="grain" aria-hidden />

      <div className="flex flex-1">
        <Sidebar
          userName={userName}
          firstName={firstName}
          email={user?.email}
          avatarUrl={avatarUrl}
          onSignOut={handleSignOut}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar mobile */}
          <header className="lg:hidden sticky top-0 z-40 border-b border-[#2E1F0F] bg-[#1A1008]/95 backdrop-blur-md px-5 h-14 flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="RodeoClip" className="h-24 w-auto" />
            <div className="flex items-center gap-3">
              <button onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2E1F0F] text-[#8C7560] hover:text-[#C17F3A] transition-colors text-xs">
                Sair
              </button>
            </div>
          </header>

          <main className="flex-1 px-5 lg:px-10 py-8 lg:py-10 flex flex-col gap-8 max-w-5xl w-full mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease }}
            >
              <p className="text-xs text-[#8C7560] font-medium uppercase tracking-widest mb-1">Biblioteca</p>
              <h1 className="text-2xl font-bold text-[#F5ECD7] tracking-tight">Meus clipes</h1>
              <p className="text-sm text-[#8C7560] mt-1">
                {clips.length > 0
                  ? `${clips.length} conversão${clips.length > 1 ? 'ões' : ''} realizadas`
                  : 'Histórico de conversões'
                }
              </p>
            </motion.div>

            {/* Loading */}
            {fetching && (
              <div className="flex items-center justify-center py-20">
                <CircleNotch size={28} className="text-[#C17F3A] animate-spin" weight="bold" />
              </div>
            )}

            {/* Empty state */}
            {!fetching && clips.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08, ease }}
                className="rounded-xl border border-[#2E1F0F] bg-[#1A1008] flex flex-col items-center justify-center py-20 gap-4"
              >
                <AnimatedIcon size="lg" delay={0.15} className="bg-[rgba(193,127,58,0.06)]">
                  <FilmSlate size={32} className="text-[#6B5740]" weight="duotone" />
                </AnimatedIcon>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#8C7560]">Nenhuma conversão ainda</p>
                  <p className="text-xs text-[#6B5740] mt-1">Converta seu primeiro vídeo para vê-lo aqui.</p>
                </div>
                <Link href="/conversor"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C17F3A] hover:bg-[#D4984F] text-[#1A1008] font-bold text-sm transition-all hover:-translate-y-0.5"
                  style={{ boxShadow: '0 4px 24px rgba(193,127,58,0.45)' }}
                >
                  <Upload size={15} weight="bold" />
                  Converter vídeos
                  <ArrowRight size={13} weight="bold" />
                </Link>
              </motion.div>
            )}

            {/* Clips list */}
            {!fetching && clips.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08, ease }}
                className="flex flex-col gap-3"
              >
                <AnimatePresence mode="popLayout">
                  {clips.map((clip, i) => (
                    <motion.div
                      key={clip.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -80 }}
                      transition={{ duration: 0.35, delay: i * 0.03, ease }}
                      className="rounded-xl border border-[#2E1F0F] bg-[#1A1008] p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      {/* Icon */}
                      <AnimatedIcon size="md" delay={0.05 + i * 0.04}>
                        <FilmSlate size={20} weight="duotone" />
                      </AnimatedIcon>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-[#F5ECD7] truncate">
                            {clip.video_count} vídeo{clip.video_count > 1 ? 's' : ''}
                          </p>
                          <span className="text-[10px] text-[#8C7560] bg-[#1A1008] border border-[#2E1F0F] px-2 py-0.5 rounded-full">
                            {clip.status === 'completed' ? 'Concluído' : clip.status}
                          </span>
                        </div>

                        {/* Tags */}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 text-[11px] text-[#8C7560]">
                            <Gauge size={11} /> {clip.speed_multiplier}×
                          </span>
                          {clip.used_logo && (
                            <span className="flex items-center gap-1 text-[11px] text-[#8C7560]">
                              <ImageSquare size={11} /> Logo
                            </span>
                          )}
                          {clip.muted_audio && (
                            <span className="flex items-center gap-1 text-[11px] text-[#8C7560]">
                              <SpeakerSlash size={11} /> Sem áudio
                            </span>
                          )}
                          {clip.used_text_overlay && (
                            <span className="flex items-center gap-1 text-[11px] text-[#8C7560]">
                              <TextT size={11} /> Texto
                            </span>
                          )}
                          {clip.used_stabilize && (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                              <VideoCamera size={11} /> Estab.
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[11px] text-[#6B5740]">
                            <Clock size={11} /> {timeAgo(clip.created_at)}
                          </span>
                        </div>

                        {/* File names */}
                        <p className="text-[10px] text-[#6B5740] mt-1 truncate" title={clip.file_names.join(', ')}>
                          {clip.file_names.slice(0, 3).join(', ')}
                          {clip.file_names.length > 3 && ` +${clip.file_names.length - 3}`}
                        </p>

                        <p className="text-[10px] text-[#6B5740] mt-0.5">{formatDate(clip.created_at)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {clip.download_available && clip.download_url ? (
                          <a
                            href={clip.download_url}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C17F3A] hover:bg-[#D4984F] text-[#1A1008] text-xs font-semibold transition-all active:scale-95"
                          >
                            <DownloadSimple size={13} weight="bold" />
                            Baixar
                          </a>
                        ) : (
                          <span className="text-[11px] text-[#6B5740] italic px-3 py-2">
                            Expirado
                          </span>
                        )}
                        <button
                          onClick={() => handleDelete(clip.id)}
                          disabled={deletingId === clip.id}
                          className="w-9 h-9 rounded-lg border border-[#2E1F0F] flex items-center justify-center text-[#8C7560] hover:text-red-400 hover:border-red-400/30 transition-colors active:scale-95 disabled:opacity-50"
                          title="Excluir do histórico"
                        >
                          {deletingId === clip.id ? (
                            <CircleNotch size={13} className="animate-spin" />
                          ) : (
                            <Trash size={13} />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </main>

          <footer className="border-t border-[#2E1F0F] py-5 text-center text-[11px] text-[#6B5740]">
            © {new Date().getFullYear()} RodeoClip. Todos os direitos reservados.
          </footer>
        </div>
      </div>
    </div>
  )
}
