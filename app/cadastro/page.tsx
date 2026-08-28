'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function CadastroPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-[#1A1008] px-4 py-12">
      {/* Vídeo de fundo */}
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-30">
        <source src="/hero-video.m4v" type="video/mp4" />
      </video>
      <div aria-hidden className="absolute inset-0 bg-[#1A1008]/80" />

      <div className="grain" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="rounded-2xl border border-[rgba(193,127,58,0.2)] bg-[#1A1008]/80 backdrop-blur-md p-8 flex flex-col items-center gap-6"
          style={{ boxShadow: '0 8px 48px rgba(0,0,0,0.6)' }}>

          {/* Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="RodeoClip" className="h-24 w-auto" />

          <div className="text-center">
            <h1 className="text-lg font-bold text-[#F5ECD7]">Criar sua conta</h1>
            <p className="text-xs text-[#8C7560] mt-1">Comece grátis, sem cartão de crédito</p>
          </div>

          {success ? (
            <div className="text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[rgba(193,127,58,0.15)] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#C17F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm text-[#F5ECD7] font-semibold">Conta criada!</p>
              <p className="text-xs text-[#8C7560]">Verifique seu e-mail para confirmar o cadastro.</p>
              <Link href="/login" className="text-xs text-[#C17F3A] hover:text-[#D4984F] font-semibold transition-colors mt-2">
                Ir para o login →
              </Link>
            </div>
          ) : (
            <>
              {/* Botão Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white text-[#1A1008] font-semibold text-sm hover:bg-[#F5ECD7] transition-colors"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                </svg>
                Cadastrar com Google
              </button>

              <div className="flex items-center gap-3 w-full">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[#A89580] text-xs">ou com e-mail</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
                {/* Nome */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <User size={16} className="text-[#8C7560]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[#F5ECD7] placeholder-[#8C7560] focus:outline-none focus:border-[#C17F3A]/60 transition-colors text-sm"
                  />
                </div>

                {/* E-mail */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Mail size={16} className="text-[#8C7560]" />
                  </div>
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[#F5ECD7] placeholder-[#8C7560] focus:outline-none focus:border-[#C17F3A]/60 transition-colors text-sm"
                  />
                </div>

                {/* Senha */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock size={16} className="text-[#8C7560]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha (mín. 6 caracteres)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-[#F5ECD7] placeholder-[#8C7560] focus:outline-none focus:border-[#C17F3A]/60 transition-colors text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7560] hover:text-[#C17F3A] transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Confirmar senha */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock size={16} className="text-[#8C7560]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirmar senha"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[#F5ECD7] placeholder-[#8C7560] focus:outline-none focus:border-[#C17F3A]/60 transition-colors text-sm"
                  />
                </div>

                {error && <p className="text-xs text-red-400 text-center">{error}</p>}

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#C17F3A] hover:bg-[#D4984F] text-[#1A1008] font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 mt-1"
                  style={{ boxShadow: '0 4px 20px rgba(193,127,58,0.35)' }}>
                  {loading ? 'Criando conta...' : 'Criar conta grátis'}
                </button>
              </form>

              <p className="text-xs text-[#8C7560] text-center">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-[#C17F3A] hover:text-[#D4984F] font-semibold transition-colors">
                  Entrar
                </Link>
              </p>
            </>
          )}
        </div>

        <div className="mt-5 text-center">
          <Link href="/" className="text-xs text-[#8C7560] hover:text-[#C17F3A] transition-colors">
            ← Voltar para o início
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
