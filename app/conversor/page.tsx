'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  Upload,
  SignOut,

  Trash,
  ArrowLeft,
  Image as ImageIcon,
  Gauge,
  SpeakerHigh,
  SpeakerSlash,
  TextT,
  VideoCamera,
  Scissors,
  X,
} from '@phosphor-icons/react'
import { UploadZone } from '@/components/UploadZone'
import { AnimatedIcon } from '@/components/shared/AnimatedIcon'
import { useConversionStore } from '@/store/useConversionStore'
import { VideoPreview } from '@/components/VideoPreview'
import { TrimBar } from '@/components/TrimBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { TourGuide } from '@/components/TourGuide'

const SPEED_MARKS = [0.1, 1, 2, 5, 10, 100]

const ease = [0.16, 1, 0.3, 1] as const

function SettingsCard({
  icon,
  label,
  summary,
  delay = 0,
  glowColor,
  expandWidth,
  align = 'left',
  tourId,
  children,
}: {
  icon: React.ReactNode
  label: string
  summary: string
  delay?: number
  glowColor?: string
  expandWidth?: string
  align?: 'left' | 'right'
  tourId?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      data-tour={tourId}
      className="relative rounded-2xl border border-[#2E1F0F] bg-[#1A1008] transition-colors duration-300 hover:border-[#5C3F1E]/80 hover:bg-[#1E1309] group"
    >
      {/* Collapsed header — always visible */}
      <div className="px-3 py-2.5 flex items-center gap-2 cursor-default">
        <AnimatedIcon size="sm" delay={delay} glowColor={glowColor}>
          {icon}
        </AnimatedIcon>
        <div className="flex flex-col min-w-0">
          <h3 className="text-xs font-semibold text-[#F5ECD7] leading-tight">{label}</h3>
          <AnimatePresence mode="wait">
            {!open && (
              <motion.span
                key="summary"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="text-[10px] text-[#C17F3A] font-mono mt-0.5"
              >
                {summary}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Expanded content — floats as popover so it's never clipped */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className={[
              'absolute top-full z-20 pt-1',
              align === 'right' ? 'right-0' : 'left-0',
            ].join(' ')}
            style={expandWidth ? { width: expandWidth, maxWidth: '90vw' } : { left: 0, right: 0 }}
          >
            <div className="rounded-xl border border-[#5C3F1E]/80 bg-[#1E1309] p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        initial={false}
        animate={{
          boxShadow: open
            ? `0 0 24px ${glowColor || 'rgba(193,127,58,0.12)'}, inset 0 1px 0 rgba(193,127,58,0.06)`
            : '0 0 0 transparent',
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )
}

export default function ConversorPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const {
    logos, addLogo, removeLogo,
    speedMultiplier, setSpeedMultiplier,
    muteAudio, setMuteAudio,
    stabilize, setStabilize,
    textOverlay, setTextOverlay,
  } = useConversionStore()

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

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const { resizeLogoFile } = await import('@/lib/clientProcessor')
    const resized = await resizeLogoFile(file)
    const url = URL.createObjectURL(resized)
    addLogo(resized, url)
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#120B04]">
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
      <TourGuide />

      <div className="flex flex-1">
        <Sidebar
          userName={userName}
          firstName={firstName}
          email={user?.email}
          onSignOut={handleSignOut}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="lg:hidden sticky top-0 z-40 border-b border-[#2E1F0F] bg-[#1A1008]/95 backdrop-blur-md px-5 h-14 flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="RodeoClip" className="h-16 w-auto" />
            <button onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2E1F0F] text-[#8C7560] hover:text-[#C17F3A] transition-colors text-xs active:scale-95">
              <SignOut size={13} /> Sair
            </button>
          </header>

          <main className="flex-1 px-5 lg:px-10 py-8 lg:py-10 flex flex-col gap-6 max-w-6xl w-full mx-auto">
            {/* Page header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease }}
              className="flex items-center justify-between">
              <div>
                <Link href="/dashboard" className="text-xs text-[#8C7560] hover:text-[#C17F3A] transition-colors flex items-center gap-1 mb-2">
                  <ArrowLeft size={12} weight="bold" /> Voltar ao painel
                </Link>
                <h1 className="text-2xl font-bold text-[#F5ECD7] tracking-tight">Conversor</h1>
                <p className="text-xs text-[#8C7560] mt-1">Horizontal para vertical 9:16</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left column — Upload + Settings */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.06, ease }}
                className="lg:col-span-3 flex flex-col gap-5">

                {/* Upload — pasta origem/destino + fila + progresso */}
                <UploadZone />

                {/* Settings */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Speed */}
                  <SettingsCard
                    tourId="speed"
                    icon={<Gauge size={16} weight="duotone" />}
                    label="Velocidade"
                    summary={`${speedMultiplier}x`}
                    delay={0.15}
                    expandWidth="320px"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          type="range"
                          min={0.1} max={100} step={0.1}
                          value={speedMultiplier}
                          onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
                          className="w-full accent-[#C17F3A] h-1.5 cursor-pointer"
                        />
                        <div className="flex justify-between px-0.5">
                          {SPEED_MARKS.map((m) => (
                            <button
                              key={m}
                              onClick={() => setSpeedMultiplier(m)}
                              className={[
                                'text-[9px] font-mono transition-colors',
                                Math.abs(speedMultiplier - m) < 0.05
                                  ? 'text-[#C17F3A] font-bold'
                                  : 'text-[#8C7560] hover:text-[#A89480]',
                              ].join(' ')}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center bg-[#0E0A05] border border-[#2E1F0F] rounded-lg shrink-0">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={speedMultiplier.toFixed(1)}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value)
                            if (!isNaN(v) && v >= 0.1 && v <= 100) setSpeedMultiplier(v)
                          }}
                          className="w-10 bg-transparent text-center text-xs font-mono text-[#C17F3A] py-1.5 outline-none"
                        />
                        <span className="text-[10px] text-[#8C7560] pr-1.5">x</span>
                        <div className="flex flex-col border-l border-[#2E1F0F]">
                          <button
                            onClick={() => setSpeedMultiplier(Math.min(100, +(speedMultiplier + 0.1).toFixed(1)))}
                            className="px-1.5 py-0.5 text-[#8C7560] hover:text-[#C17F3A] hover:bg-[rgba(193,127,58,0.08)] transition-colors active:scale-90"
                          >
                            <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor"><path d="M4 0L8 5H0L4 0Z"/></svg>
                          </button>
                          <button
                            onClick={() => setSpeedMultiplier(Math.max(0.1, +(speedMultiplier - 0.1).toFixed(1)))}
                            className="px-1.5 py-0.5 text-[#5C3F1E] hover:text-[#C17F3A] hover:bg-[rgba(193,127,58,0.08)] transition-colors active:scale-90 border-t border-[#2E1F0F]"
                          >
                            <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor"><path d="M4 5L0 0H8L4 5Z"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </SettingsCard>

                  {/* Audio */}
                  <SettingsCard
                    tourId="audio"
                    icon={muteAudio ? <SpeakerSlash size={16} weight="duotone" /> : <SpeakerHigh size={16} weight="duotone" />}
                    label="Áudio"
                    summary={muteAudio ? 'Off' : 'On'}
                    delay={0.2}
                    glowColor={muteAudio ? 'rgba(248,113,113,0.3)' : undefined}
                  >
                    <button
                      onClick={() => setMuteAudio(!muteAudio)}
                      className={[
                        'flex items-center justify-between px-3 py-2 rounded-lg border transition-all duration-200 active:scale-[0.98]',
                        muteAudio
                          ? 'border-red-400/30 bg-red-400/5 text-red-400'
                          : 'border-[#2E1F0F] bg-[rgba(193,127,58,0.06)] text-[#C17F3A]',
                      ].join(' ')}
                    >
                      <span className="text-[11px] font-semibold">{muteAudio ? 'Áudio desligado' : 'Áudio ligado'}</span>
                      <div className={[
                        'w-8 h-[18px] rounded-full relative transition-colors duration-200',
                        muteAudio ? 'bg-red-400/30' : 'bg-[rgba(193,127,58,0.3)]',
                      ].join(' ')}>
                        <div className={[
                          'absolute top-[3px] w-3 h-3 rounded-full transition-all duration-200',
                          muteAudio ? 'left-[17px] bg-red-400' : 'left-[3px] bg-[#C17F3A]',
                        ].join(' ')} />
                      </div>
                    </button>
                  </SettingsCard>

                  {/* Stabilize */}
                  <SettingsCard
                    tourId="stabilize"
                    icon={<VideoCamera size={16} weight="duotone" />}
                    label="Estabilizar"
                    summary={stabilize ? 'Ativo' : 'Off'}
                    delay={0.25}
                    glowColor={stabilize ? 'rgba(52,211,153,0.35)' : undefined}
                  >
                    <button
                      onClick={() => setStabilize(!stabilize)}
                      className={[
                        'flex items-center justify-between px-3 py-2 rounded-lg border transition-all duration-200 active:scale-[0.98]',
                        stabilize
                          ? 'border-emerald-400/30 bg-emerald-400/5 text-emerald-400'
                          : 'border-[#2E1F0F] bg-[rgba(193,127,58,0.06)] text-[#8C7560]',
                      ].join(' ')}
                    >
                      <span className="text-[11px] font-semibold">{stabilize ? 'Estabilização ativa' : 'Desativado'}</span>
                      <div className={[
                        'w-8 h-[18px] rounded-full relative transition-colors duration-200',
                        stabilize ? 'bg-emerald-400/30' : 'bg-[rgba(140,117,96,0.3)]',
                      ].join(' ')}>
                        <div className={[
                          'absolute top-[3px] w-3 h-3 rounded-full transition-all duration-200',
                          stabilize ? 'left-[17px] bg-emerald-400' : 'left-[3px] bg-[#8C7560]',
                        ].join(' ')} />
                      </div>
                    </button>
                  </SettingsCard>

                  {/* Logo */}
                  <SettingsCard
                    tourId="logo"
                    icon={<ImageIcon size={16} weight="duotone" />}
                    label="Logotipo"
                    summary={logos.length > 0 ? `${logos.length} logo${logos.length > 1 ? 's' : ''}` : 'Nenhum'}
                    delay={0.3}
                    expandWidth="280px"
                  >
                    <div className="flex flex-col gap-2">
                      {logos.map((logo) => (
                        <div key={logo.id} className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-[#0E0A05] border border-[#2E1F0F] flex items-center justify-center p-1 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={logo.previewUrl} alt="" className="w-full h-full object-contain" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <p className="text-[9px] text-[#8C7560] truncate">{logo.file.name}</p>
                            <p className="text-[9px] text-[#6B5740]">Arraste no preview · scroll p/ redimensionar</p>
                          </div>
                          <button
                            onClick={() => removeLogo(logo.id)}
                            className="shrink-0 text-[#5C3F1E] hover:text-red-400 transition-colors active:scale-90"
                            title="Remover"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      ))}
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => logoInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#2E1F0F] text-[#8C7560] hover:border-[#C17F3A]/30 hover:text-[#C17F3A] text-[11px] transition-all duration-200"
                      >
                        <Upload size={12} weight="duotone" /> Adicionar PNG
                      </motion.button>
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept=".png"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </SettingsCard>

                  {/* Text overlay */}
                  <SettingsCard
                    tourId="text"
                    icon={<TextT size={16} weight="duotone" />}
                    label="Texto"
                    summary={textOverlay?.text ? textOverlay.text : 'Nenhum'}
                    delay={0.35}
                    expandWidth="340px"
                    align="right"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Digite o texto..."
                          value={textOverlay?.text ?? ''}
                          onChange={(e) => {
                            const val = e.target.value
                            if (!val) { setTextOverlay(null); return }
                            setTextOverlay({
                              text: val,
                              fontSize: textOverlay?.fontSize ?? 48,
                              color: textOverlay?.color ?? '#ffffff',
                              x: textOverlay?.x ?? 100,
                              y: textOverlay?.y ?? 1700,
                            })
                          }}
                          className="flex-1 min-w-0 bg-[#0E0A05] border border-[#2E1F0F] rounded-lg px-3 py-2 text-sm text-[#F5ECD7] placeholder:text-[#6B5740] outline-none focus:border-[#C17F3A]/50 transition-colors"
                        />
                        {textOverlay && (
                          <button
                            onClick={() => setTextOverlay(null)}
                            title="Remover texto"
                            className="p-1.5 rounded-lg text-[#8C7560] hover:text-red-400 hover:bg-[rgba(255,255,255,0.04)] transition-colors active:scale-90 shrink-0"
                          >
                            <X size={14} weight="bold" />
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {textOverlay && (
                          <motion.div
                            key="text-options"
                            initial={{ opacity: 0, y: -6, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -6, height: 0 }}
                            transition={{ duration: 0.25, ease }}
                            className="flex flex-col gap-3 overflow-visible"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[#8C7560] shrink-0">Tamanho</span>
                              <div className="flex items-center bg-[#0E0A05] border border-[#2E1F0F] rounded-lg shrink-0">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={textOverlay.fontSize}
                                  onChange={(e) => {
                                    const v = parseInt(e.target.value)
                                    if (!isNaN(v) && v >= 8) {
                                      setTextOverlay({ ...textOverlay, fontSize: v })
                                    }
                                  }}
                                  className="w-12 bg-transparent text-center text-xs font-mono text-[#C17F3A] py-1.5 outline-none"
                                />
                                <span className="text-[10px] text-[#8C7560] pr-1.5">px</span>
                                <div className="flex flex-col border-l border-[#2E1F0F]">
                                  <button
                                    onClick={() => setTextOverlay({ ...textOverlay, fontSize: textOverlay.fontSize + 2 })}
                                    title="Aumentar texto"
                                    className="px-1.5 py-0.5 text-[#8C7560] hover:text-[#C17F3A] transition-colors active:scale-90"
                                  >
                                    <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor"><path d="M4 0L8 5H0L4 0Z"/></svg>
                                  </button>
                                  <button
                                    onClick={() => setTextOverlay({ ...textOverlay, fontSize: Math.max(8, textOverlay.fontSize - 2) })}
                                    title="Diminuir texto"
                                    className="px-1.5 py-0.5 text-[#5C3F1E] hover:text-[#C17F3A] transition-colors active:scale-90 border-t border-[#2E1F0F]"
                                  >
                                    <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor"><path d="M4 5L0 0H8L4 5Z"/></svg>
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[#8C7560] shrink-0">Cor</span>
                              <div className="flex flex-wrap gap-1.5">
                                {['#ffffff', '#000000', '#C17F3A', '#ff0000', '#00ff00', '#ffff00'].map((c) => (
                                  <button
                                    key={c}
                                    onClick={() => setTextOverlay({ ...textOverlay, color: c })}
                                    className={[
                                      'w-5 h-5 rounded-full border-2 transition-all active:scale-90 shrink-0',
                                      textOverlay.color === c ? 'border-[#C17F3A] scale-110' : 'border-[#2E1F0F]',
                                    ].join(' ')}
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                                <input
                                  type="color"
                                  value={textOverlay.color}
                                  onChange={(e) => setTextOverlay({ ...textOverlay, color: e.target.value })}
                                  title="Cor personalizada"
                                  className="w-5 h-5 rounded-full border-2 border-[#2E1F0F] cursor-pointer bg-transparent shrink-0"
                                />
                              </div>
                            </div>

                            <p className="text-[10px] text-[#8C7560]">Arraste o texto no preview para posicionar</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </SettingsCard>
                </div>

                {/* Trim (corte de preview) */}
                <div data-tour="trim" className="rounded-2xl border border-[#2E1F0F] bg-[#1A1008] p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2.5">
                    <AnimatedIcon size="sm" delay={0.35}>
                      <Scissors size={16} weight="duotone" />
                    </AnimatedIcon>
                    <h3 className="text-xs font-semibold text-[#F5ECD7]">Cortar vídeo (preview)</h3>
                  </div>
                  <TrimBar />
                </div>
              </motion.div>

              {/* Right column — Preview */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12, ease }}
                className="lg:col-span-2 flex flex-col gap-4">

                <div data-tour="preview" className="rounded-2xl border border-[#2E1F0F] bg-[#1A1008] p-5 flex flex-col items-center gap-4">
                  <div className="w-full flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-[#F5ECD7]">Preview 9:16</h3>
                  </div>
                  <VideoPreview />
                </div>

                {/* Config summary */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-xl border border-[#2E1F0F]/60 bg-[#1A1008]/50 px-4 py-3 flex items-center justify-between text-[10px] text-[#8C7560]">
                  <span>Velocidade: <strong className="text-[#C17F3A]">{speedMultiplier}x</strong></span>
                  <span className="w-px h-3 bg-[#2E1F0F]" />
                  <span>Logos: <strong className="text-[#C17F3A]">{logos.length}</strong></span>
                  <span className="w-px h-3 bg-[#2E1F0F]" />
                  <span>Estab.: <strong className="text-[#C17F3A]">{stabilize ? 'Sim' : 'Não'}</strong></span>
                  <span className="w-px h-3 bg-[#2E1F0F]" />
                  <span>Formato: <strong className="text-[#C17F3A]">9:16</strong></span>
                </motion.div>
              </motion.div>
            </div>
          </main>

          <footer className="border-t border-[#2E1F0F] py-5 text-center text-[11px] text-[#8C7560]">
            &copy; {new Date().getFullYear()} RodeoClip. Todos os direitos reservados.
          </footer>
        </div>
      </div>
    </div>
  )
}
