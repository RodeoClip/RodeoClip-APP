'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock } from 'lucide-react'

type Status = 'loading' | 'ready' | 'submitting' | 'success' | 'error' | 'invalid'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // O Supabase envia o token no hash: #access_token=...&type=recovery
    // supabase-js detecta automaticamente e emite o evento PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('ready')
      }
    })

    // Fallback: se já há sessão ativa com type=recovery (tab reload)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatus('ready')
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setErrorMsg('As senhas não coincidem.')
      return
    }
    setErrorMsg('')
    setStatus('submitting')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      setStatus('success')
      setTimeout(() => router.replace('/dashboard'), 2500)
    }
  }

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center px-4 py-12 bg-[#1A1008]">
      <div className="absolute inset-0 bg-[url('/hero-video.m4v')] opacity-0" aria-hidden />

      <div className="relative z-10 w-full max-w-md">
        <div
          className="p-8 rounded-2xl backdrop-blur-md bg-[#1A1008]/80 border border-[rgba(193,127,58,0.2)]"
          style={{ boxShadow: '0 8px 48px rgba(0,0,0,0.6)' }}
        >
          {/* Header */}
          <div className="mb-8 text-center flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="RodeoClip" className="h-24 w-auto" />
          </div>

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-8 h-8 rounded-full border-2 border-[#C17F3A] border-t-transparent animate-spin" />
              <p className="text-sm text-[#8C7560]">Verificando link...</p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <p className="text-sm text-red-400">Link inválido ou expirado.</p>
              <button
                onClick={() => router.replace('/login')}
                className="text-xs text-[#C17F3A] hover:text-[#D4984F] transition-colors underline underline-offset-2"
              >
                Voltar ao login
              </button>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-[#C17F3A]/15 flex items-center justify-center">
                <Lock className="text-[#C17F3A]" size={24} />
              </div>
              <h2 className="text-[#F5ECD7] font-semibold text-base">Senha redefinida!</h2>
              <p className="text-[#8C7560] text-sm">Redirecionando para o dashboard...</p>
            </div>
          )}

          {(status === 'ready' || status === 'submitting' || status === 'error') && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <h2 className="text-[#F5ECD7] font-semibold text-base mb-1">Criar nova senha</h2>
                <p className="text-[#8C7560] text-xs leading-relaxed">
                  Escolha uma senha forte com pelo menos 6 caracteres.
                </p>
              </div>

              {/* Nova senha */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="text-[#8C7560]" size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nova senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-[#F5ECD7] placeholder-[#8C7560] focus:outline-none focus:border-[#C17F3A]/60 transition-colors"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7560] hover:text-[#C17F3A] transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Confirmar senha */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="text-[#8C7560]" size={16} />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirmar senha"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-[#F5ECD7] placeholder-[#8C7560] focus:outline-none focus:border-[#C17F3A]/60 transition-colors"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7560] hover:text-[#C17F3A] transition-colors"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {errorMsg && (
                <p className="text-[#E05C5C] text-xs">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-3 rounded-xl bg-[#C17F3A] hover:bg-[#D4984F] text-[#1A1008] font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                style={{ boxShadow: '0 4px 20px rgba(193,127,58,0.35)' }}
              >
                {status === 'submitting' ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          )}
        </div>
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-[#8C7560] text-xs z-20">
        © {new Date().getFullYear()} RodeoClip. Todos os direitos reservados.
      </footer>
    </div>
  )
}
