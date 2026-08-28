'use client';
import LoginPage from '@/components/ui/gaming-login';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();

  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) { router.push('/dashboard'); return null; }
    return error.message === 'Invalid login credentials'
      ? 'E-mail ou senha incorretos.'
      : error.message;
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center px-4 py-12">
      <LoginPage.VideoBackground videoUrl="/hero-video.m4v" />

      <div className="relative z-20 w-full max-w-md">
        <LoginPage.LoginForm onSubmit={handleLogin} />
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-[#8C7560] text-xs z-20">
        © {new Date().getFullYear()} RodeoClip. Todos os direitos reservados.
      </footer>
    </div>
  );
}
