'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  Upload,
  SignOut,
  Lightning,
  ChartBar,
  FilmSlate,
  ArrowRight,
} from '@phosphor-icons/react'
import { ShareButtons } from '@/components/shared/ShareButtons'
import { SubscriptionCard } from '@/components/shared/SubscriptionCard'
import { AnimatedIcon } from '@/components/shared/AnimatedIcon'
import { Sidebar } from '@/components/layout/Sidebar'

const ease = [0.16, 1, 0.3, 1] as const

type Credits = { credits_remaining: number; total_conversions: number }
type Plan = { plan: string }

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | undefined>(undefined)
  const [credits, setCredits] = useState<Credits | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setUser(session.user)
      setToken(session.access_token)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login')
      else setUser(session.user)
    })
    return () => subscription.unsubscribe()
  }, [router])

  // Atualiza os blocos de stats (vídeos convertidos, exportações, plano) em tempo real:
  // busca ao montar, ao focar a aba novamente (ex: após terminar uma conversão em /conversor),
  // e a cada 15s enquanto a aba estiver visível.
  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function fetchStats() {
      const headers = { Authorization: `Bearer ${token}` }
      const [creditsRes, subRes] = await Promise.all([
        fetch('/api/credits', { headers }),
        fetch('/api/subscription', { headers }),
      ])
      if (cancelled) return
      if (creditsRes.ok) setCredits(await creditsRes.json())
      if (subRes.ok) setPlan(await subRes.json())
    }

    fetchStats()
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchStats()
    }, 15000)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchStats() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [token])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
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

  const stats = [
    {
      icon: <FilmSlate size={18} weight="duotone" />,
      label: 'Vídeos convertidos',
      value: credits ? String(credits.total_conversions) : '—',
    },
    {
      icon: <Lightning size={18} weight="duotone" />,
      label: 'Créditos restantes',
      value: credits ? String(credits.credits_remaining) : '—',
    },
    {
      icon: <ChartBar size={18} weight="duotone" />,
      label: 'Plano atual',
      value: plan ? (PLAN_LABELS[plan.plan] ?? plan.plan) : '—',
    },
  ]

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
          {/* Top bar (mobile) */}
          <header className="lg:hidden sticky top-0 z-40 border-b border-[#2E1F0F] bg-[#1A1008]/95 backdrop-blur-md px-5 h-14 flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="RodeoClip" className="h-16 w-auto" />
            <button onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2E1F0F] text-[#8C7560] hover:text-[#C17F3A] transition-colors text-xs active:scale-95">
              <SignOut size={13} /> Sair
            </button>
          </header>

          <main className="flex-1 px-5 lg:px-10 py-8 lg:py-10 flex flex-col gap-8 max-w-5xl w-full mx-auto">

            {/* Saudação */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease }}>
              <p className="text-xs text-[#8C7560] font-medium uppercase tracking-widest mb-1">Painel</p>
              <h1 className="text-2xl font-bold text-[#F5ECD7] tracking-tight">
                Olá, {firstName}
              </h1>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08, ease }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stats.map((s, i) => (
                <div key={s.label}
                  className="flex items-center gap-4 px-5 py-4 rounded-xl border border-[#2E1F0F] bg-[#1A1008]">
                  <AnimatedIcon size="sm" delay={0.1 + i * 0.08}>
                    {s.icon}
                  </AnimatedIcon>
                  <div>
                    <p className="text-lg font-bold text-[#F5ECD7] leading-none">{s.value}</p>
                    <p className="text-[11px] text-[#8C7560] mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Hero banner */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease }}
              className="relative rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 12px 60px rgba(0,0,0,0.6)' }}>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/dashboard-banner-clean.png"
                alt="RodeoClip Conversor"
                className="w-full object-cover"
                style={{ height: 'auto', maxHeight: '420px', objectPosition: '68% center' }}
              />

              <div className="absolute inset-0 bg-gradient-to-r from-[#0E0A05]/90 via-[#0E0A05]/20 to-transparent" />

              <div className="absolute inset-0 flex items-center px-8 py-8">
                <div className="flex flex-col gap-4 max-w-[280px]">
                  <span className="inline-block text-[10px] font-semibold tracking-widest uppercase text-[#C17F3A] bg-[rgba(193,127,58,0.12)] border border-[rgba(193,127,58,0.2)] px-3 py-1 rounded-full w-fit">
                    Conversor
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-[#F5ECD7] leading-tight">
                      Transforme seus vídeos agora
                    </h2>
                    <p className="text-xs text-[#8C7560] mt-2 leading-relaxed">
                      Horizontal para vertical 9:16 — pronto para TikTok, Reels e Shorts.
                    </p>
                  </div>
                  <Link href="/conversor"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C17F3A] hover:bg-[#D4984F] text-[#1A1008] font-bold text-sm transition-all hover:-translate-y-0.5 w-fit"
                    style={{ boxShadow: '0 4px 24px rgba(193,127,58,0.45)' }}>
                    <Upload size={15} weight="bold" />
                    Iniciar conversão
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Atividade recente + Upgrade lado a lado */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.24, ease }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Atividade recente — 2/3 */}
              <div className="lg:col-span-2 rounded-xl border border-[#2E1F0F] bg-[#1A1008] overflow-hidden flex flex-col">
                <div className="px-5 py-3.5 border-b border-[#2E1F0F]">
                  <h3 className="text-xs font-semibold text-[#F5ECD7] tracking-wide">Atividade recente</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center py-14 gap-3">
                  <AnimatedIcon size="md" delay={0.3} className="bg-[rgba(193,127,58,0.06)]">
                    <FilmSlate size={24} className="text-[#3D2A14]" weight="duotone" />
                  </AnimatedIcon>
                  <p className="text-sm text-[#8C7560]">Nenhum vídeo processado ainda.</p>
                  <Link href="/conversor"
                    className="text-xs text-[#C17F3A] hover:text-[#D4984F] font-semibold transition-colors flex items-center gap-1">
                    Converter meu primeiro vídeo <ArrowRight size={11} weight="bold" />
                  </Link>
                </div>
              </div>

              {/* Compartilhar + Assinatura — 1/3 */}
              <div className="flex flex-col gap-4">
                <ShareButtons />
                <SubscriptionCard token={token} />
              </div>
            </motion.div>

          </main>

          <footer className="border-t border-[#2E1F0F] py-5 text-center text-[11px] text-[#8C7560]">
            © {new Date().getFullYear()} RodeoClip. Todos os direitos reservados.
          </footer>
        </div>
      </div>
    </div>
  )
}
