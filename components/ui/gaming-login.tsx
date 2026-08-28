'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, X, ArrowLeft } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (email: string, password: string, remember: boolean) => Promise<string | null>;
}

interface VideoBackgroundProps {
  videoUrl: string;
}

interface FormInputProps {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

interface SocialButtonProps {
  icon: React.ReactNode;
  name: string;
  onClick?: () => void;
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  id: string;
}

const FormInput: React.FC<FormInputProps> = ({ icon, type, placeholder, value, onChange, required }) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[#F5ECD7] placeholder-[#8C7560] focus:outline-none focus:border-[#C17F3A]/60 transition-colors"
    />
  </div>
);

const SocialButton: React.FC<SocialButtonProps> = ({ icon, name, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-[#C17F3A]/10 hover:border-[#C17F3A]/30 hover:text-[#C17F3A] transition-all text-xs font-medium"
  >
    {icon}
    <span className="hidden sm:inline">{name}</span>
  </button>
);

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, id }) => (
  <div className="relative inline-block w-10 h-5 cursor-pointer">
    <input type="checkbox" id={id} className="sr-only" checked={checked} onChange={onChange} />
    <div className={`absolute inset-0 rounded-full transition-colors duration-200 ${checked ? 'bg-[#C17F3A]' : 'bg-white/20'}`}>
      <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
    </div>
  </div>
);

const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-[#1A1008]/80 z-10" />
      <video
        ref={videoRef}
        className="absolute inset-0 min-w-full min-h-full object-cover"
        autoPlay loop muted playsInline
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
    </div>
  );
};

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [forgotError, setForgotError] = useState('');

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setForgotStatus('loading');
    setForgotError('');
    const { supabase } = await import('@/lib/supabaseClient');
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      console.error('[ForgotPassword]', error);
      setForgotStatus('error');
      setForgotError(error.message);
    } else {
      setForgotStatus('sent');
    }
  }

  function closeForgot() {
    setShowForgot(false);
    setForgotEmail('');
    setForgotStatus('idle');
    setForgotError('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    const err = await onSubmit(email, password, remember);
    if (err) setLoginError(err);
    setIsSubmitting(false);
  };

  async function handleGoogleLogin() {
    const { supabase } = await import('@/lib/supabaseClient');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });
  }

  return (
    <div className="relative p-8 rounded-2xl backdrop-blur-md bg-[#1A1008]/70 border border-[rgba(193,127,58,0.2)]"
      style={{ boxShadow: '0 8px 48px rgba(0,0,0,0.6)' }}>

      {/* Header */}
      <div className="mb-8 text-center flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="RodeoClip" className="h-24 w-auto" />
        <p className="text-[#8C7560] text-sm">Entre na sua conta para continuar</p>
      </div>

      {/* Botão Google — principal */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white text-[#1A1008] font-semibold text-sm hover:bg-[#F5ECD7] transition-colors mb-6"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
        Continuar com Google
      </button>

      {/* Divisor */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[#A89580] text-xs">ou entre com e-mail</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Formulário e-mail */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          icon={<Mail className="text-[#8C7560]" size={16} />}
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <div className="relative">
          <FormInput
            icon={<Lock className="text-[#8C7560]" size={16} />}
            type={showPassword ? 'text' : 'password'}
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setRemember(!remember)}>
            <ToggleSwitch checked={remember} onChange={() => setRemember(!remember)} id="remember-me" />
            <label htmlFor="remember-me" className="text-xs text-[#8C7560] cursor-pointer hover:text-[#F5ECD7] transition-colors">
              Lembrar de mim
            </label>
          </div>
          <button
            type="button"
            onClick={() => { setForgotEmail(email); setShowForgot(true); }}
            className="text-xs text-[#8C7560] hover:text-[#C17F3A] transition-colors"
          >
            Esqueci a senha
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-[#C17F3A] hover:bg-[#D4984F] text-[#1A1008] font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
          style={{ boxShadow: '0 4px 20px rgba(193,127,58,0.35)' }}
        >
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>

        {loginError && (
          <p className="text-[#E05C5C] text-xs text-center">{loginError}</p>
        )}
      </form>

      <p className="mt-6 text-center text-xs text-[#8C7560]">
        Não tem uma conta?{' '}
        <a href="/cadastro" className="text-[#C17F3A] hover:text-[#D4984F] font-semibold transition-colors">
          Criar conta grátis
        </a>
      </p>

      <p className="mt-4 text-center text-[10px] text-[#8C7560]">
        Ao entrar, você concorda com os{' '}
        <a href="/termos" className="text-[#A89580] hover:text-[#C17F3A] transition-colors">Termos</a>
        {' '}e a{' '}
        <a href="/privacidade" className="text-[#A89580] hover:text-[#C17F3A] transition-colors">Privacidade</a>.
      </p>

      {/* Modal recuperação de senha */}
      {showForgot && (
        <div className="absolute inset-0 rounded-2xl backdrop-blur-sm bg-[#1A1008]/95 flex flex-col p-8 z-10">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={closeForgot}
              className="flex items-center gap-1.5 text-xs text-[#8C7560] hover:text-[#C17F3A] transition-colors"
            >
              <ArrowLeft size={14} />
              Voltar
            </button>
            <button
              type="button"
              onClick={closeForgot}
              className="text-[#8C7560] hover:text-[#F5ECD7] transition-colors"
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>

          {forgotStatus === 'sent' ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-[#C17F3A]/15 flex items-center justify-center">
                <Mail className="text-[#C17F3A]" size={24} />
              </div>
              <h3 className="text-[#F5ECD7] font-semibold text-base">E-mail enviado!</h3>
              <p className="text-[#8C7560] text-sm leading-relaxed max-w-[240px]">
                Verifique sua caixa de entrada em <span className="text-[#C17F3A]">{forgotEmail}</span> e siga o link para redefinir sua senha.
              </p>
              <button
                type="button"
                onClick={closeForgot}
                className="mt-4 text-xs text-[#8C7560] hover:text-[#C17F3A] transition-colors underline underline-offset-2"
              >
                Voltar ao login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-5">
              <div>
                <h3 className="text-[#F5ECD7] font-semibold text-base mb-1">Redefinir senha</h3>
                <p className="text-[#8C7560] text-xs leading-relaxed">
                  Informe seu e-mail e enviaremos um link para criar uma nova senha.
                </p>
              </div>

              <FormInput
                icon={<Mail className="text-[#8C7560]" size={16} />}
                type="email"
                placeholder="Seu e-mail"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required
              />

              {forgotStatus === 'error' && (
                <p className="text-[#E05C5C] text-xs">{forgotError}</p>
              )}

              <button
                type="submit"
                disabled={forgotStatus === 'loading'}
                className="w-full py-3 rounded-xl bg-[#C17F3A] hover:bg-[#D4984F] text-[#1A1008] font-bold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 4px 20px rgba(193,127,58,0.35)' }}
              >
                {forgotStatus === 'loading' ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

const LoginPage = { LoginForm, VideoBackground };
export default LoginPage;
