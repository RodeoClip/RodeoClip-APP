'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { motion } from 'motion/react'
import {
  UserCircle,
  SignOut,
  FloppyDisk,
  Lock,
  Envelope,
  IdentificationCard,
  CircleNotch,
  CheckCircle,
  Warning,
  ArrowRight,
} from '@phosphor-icons/react'
import { Sidebar } from '@/components/layout/Sidebar'

const ease = [0.16, 1, 0.3, 1] as const

type SectionStatus = 'idle' | 'loading' | 'success' | 'error'

export default function ConfiguracoesPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Nome
  const [name, setName] = useState('')
  const [nameStatus, setNameStatus] = useState<SectionStatus>('idle')
  const [nameError, setNameError] = useState('')

  // Email
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<SectionStatus>('idle')
  const [emailError, setEmailError] = useState('')

  // Reset de senha por email
  const [resetStatus, setResetStatus] = useState<SectionStatus>('idle')

  const [avatarFailed, setAvatarFailed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setUser(session.user)
      setName(session.user.user_metadata?.full_name ?? '')
      setEmail(session.user.email ?? '')
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

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setNameError('Nome não pode estar vazio.'); return }
    setNameError('')
    setNameStatus('loading')
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } })
    if (error) {
      setNameError(error.message)
      setNameStatus('error')
    } else {
      setNameStatus('success')
      setTimeout(() => setNameStatus('idle'), 3000)
    }
  }

  async function handleSaveEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) { setEmailError('E-mail inválido.'); return }
    if (email === user?.email) { setEmailError('Este já é seu e-mail atual.'); return }
    setEmailError('')
    setEmailStatus('loading')
    const { error } = await supabase.auth.updateUser({ email: email.trim() })
    if (error) {
      setEmailError(error.message)
      setEmailStatus('error')
    } else {
      setEmailStatus('success')
      setTimeout(() => setEmailStatus('idle'), 4000)
    }
  }

  async function handleResetPassword() {
    if (!user?.email) return
    setResetStatus('loading')
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setResetStatus('error')
    } else {
      setResetStatus('success')
      setTimeout(() => setResetStatus('idle'), 5000)
    }
  }

  const isGoogleUser = user?.app_metadata?.provider === 'google'

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
            <button onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2E1F0F] text-[#8C7560] hover:text-[#C17F3A] transition-colors text-xs">
              <SignOut size={13} /> Sair
            </button>
          </header>

          <main className="flex-1 px-5 lg:px-10 py-8 lg:py-10 flex flex-col gap-8 max-w-2xl w-full mx-auto">

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease }}>
              <p className="text-xs text-[#8C7560] font-medium uppercase tracking-widest mb-1">Conta</p>
              <h1 className="text-2xl font-bold text-[#F5ECD7] tracking-tight">Configurações</h1>
              <p className="text-sm text-[#8C7560] mt-1">Gerencie seus dados e preferências</p>
            </motion.div>

            {/* Avatar + info */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.06, ease }}
              className="flex items-center gap-4 px-5 py-4 rounded-xl border border-[#2E1F0F] bg-[#1A1008]">
              {avatarUrl && !avatarFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={userName} onError={() => setAvatarFailed(true)} className="w-14 h-14 rounded-full object-cover ring-2 ring-[#C17F3A]/30 shrink-0" />
              ) : (
                <UserCircle size={56} className="text-[#5C3F1E] shrink-0" weight="fill" />
              )}
              <div>
                <p className="text-sm font-semibold text-[#F5ECD7]">{userName}</p>
                <p className="text-xs text-[#8C7560] mt-0.5">{user?.email}</p>
                {isGoogleUser && (
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(193,127,58,0.1)] text-[#C17F3A] border border-[rgba(193,127,58,0.2)] mt-1.5">
                    Conta Google
                  </span>
                )}
              </div>
            </motion.div>

            {/* Nome */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12, ease }}
              className="rounded-xl border border-[#2E1F0F] bg-[#1A1008] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#2E1F0F] flex items-center gap-2.5">
                <IdentificationCard size={15} className="text-[#C17F3A]" weight="duotone" />
                <h2 className="text-xs font-semibold text-[#F5ECD7] tracking-wide">Nome de exibição</h2>
              </div>
              <form onSubmit={handleSaveName} className="px-5 py-5 flex flex-col gap-4">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-2.5 bg-[#0E0A05] border border-[#2E1F0F] rounded-lg text-sm text-[#F5ECD7] placeholder-[#5C3F1E] focus:outline-none focus:border-[#C17F3A]/60 transition-colors"
                />
                <StatusMessage status={nameStatus} error={nameError} successMsg="Nome atualizado!" />
                <div className="flex justify-end">
                  <SaveButton status={nameStatus} />
                </div>
              </form>
            </motion.section>

            {/* Email */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18, ease }}
              className="rounded-xl border border-[#2E1F0F] bg-[#1A1008] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#2E1F0F] flex items-center gap-2.5">
                <Envelope size={15} className="text-[#C17F3A]" weight="duotone" />
                <h2 className="text-xs font-semibold text-[#F5ECD7] tracking-wide">E-mail</h2>
              </div>
              {isGoogleUser ? (
                <div className="px-5 py-5">
                  <p className="text-xs text-[#8C7560]">
                    Sua conta usa o Google para autenticação. O e-mail é gerenciado pela sua conta Google e não pode ser alterado aqui.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSaveEmail} className="px-5 py-5 flex flex-col gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-2.5 bg-[#0E0A05] border border-[#2E1F0F] rounded-lg text-sm text-[#F5ECD7] placeholder-[#5C3F1E] focus:outline-none focus:border-[#C17F3A]/60 transition-colors"
                  />
                  <StatusMessage
                    status={emailStatus}
                    error={emailError}
                    successMsg="Confirmação enviada! Verifique sua caixa de entrada."
                  />
                  <div className="flex justify-end">
                    <SaveButton status={emailStatus} />
                  </div>
                </form>
              )}
            </motion.section>

            {/* Senha — apenas reset por e-mail (não exibe para usuários Google) */}
            {!isGoogleUser && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.24, ease }}
                className="rounded-xl border border-[#2E1F0F] bg-[#1A1008] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#2E1F0F] flex items-center gap-2.5">
                  <Lock size={15} className="text-[#C17F3A]" weight="duotone" />
                  <h2 className="text-xs font-semibold text-[#F5ECD7] tracking-wide">Senha</h2>
                </div>
                <div className="px-5 py-5 flex flex-col gap-4">
                  <p className="text-xs text-[#8C7560] leading-relaxed">
                    Para redefinir sua senha, enviaremos um link para <span className="text-[#A89580]">{user?.email}</span>. Basta clicar no link para escolher uma nova senha.
                  </p>
                  {resetStatus === 'success' && (
                    <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle size={13} weight="fill" />
                      Link enviado! Verifique sua caixa de entrada.
                    </p>
                  )}
                  {resetStatus === 'error' && (
                    <p className="flex items-center gap-1.5 text-xs text-red-400">
                      <Warning size={13} weight="fill" />
                      Erro ao enviar. Tente novamente.
                    </p>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={handleResetPassword}
                      disabled={resetStatus === 'loading' || resetStatus === 'success'}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#2E1F0F] text-[#C17F3A] hover:bg-[rgba(193,127,58,0.08)] text-xs font-semibold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed">
                      {resetStatus === 'loading' ? (
                        <CircleNotch size={13} className="animate-spin" weight="bold" />
                      ) : (
                        <ArrowRight size={13} weight="bold" />
                      )}
                      {resetStatus === 'loading' ? 'Enviando...' : 'Enviar link de redefinição'}
                    </button>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Sessão */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.30, ease }}
              className="rounded-xl border border-[#2E1F0F] bg-[#1A1008] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#2E1F0F]">
                <h2 className="text-xs font-semibold text-[#F5ECD7] tracking-wide">Sessão</h2>
              </div>
              <div className="px-5 py-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#8C7560]">Encerrar sessão atual</p>
                  <p className="text-xs text-[#5C3F1E] mt-0.5">Você será redirecionado para o login.</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2E1F0F] text-[#8C7560] hover:text-red-400 hover:border-red-400/30 transition-colors text-xs font-semibold active:scale-95">
                  <SignOut size={13} />
                  Sair
                </button>
              </div>
            </motion.section>

          </main>

          <footer className="border-t border-[#2E1F0F] py-5 text-center text-[11px] text-[#6B5740]">
            © {new Date().getFullYear()} RodeoClip. Todos os direitos reservados.
          </footer>
        </div>
      </div>
    </div>
  )
}

function SaveButton({ status }: { status: SectionStatus }) {
  return (
    <button
      type="submit"
      disabled={status === 'loading' || status === 'success'}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C17F3A] hover:bg-[#D4984F] text-[#1A1008] text-xs font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ boxShadow: '0 2px 16px rgba(193,127,58,0.3)' }}>
      {status === 'loading' ? (
        <CircleNotch size={13} className="animate-spin" weight="bold" />
      ) : (
        <FloppyDisk size={13} weight="bold" />
      )}
      {status === 'loading' ? 'Salvando...' : 'Salvar'}
    </button>
  )
}

function StatusMessage({ status, error, successMsg }: { status: SectionStatus; error: string; successMsg: string }) {
  if (status === 'success') {
    return (
      <p className="flex items-center gap-1.5 text-xs text-emerald-400">
        <CheckCircle size={13} weight="fill" />
        {successMsg}
      </p>
    )
  }
  if ((status === 'error' || error) && error) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-red-400">
        <Warning size={13} weight="fill" />
        {error}
      </p>
    )
  }
  return null
}
