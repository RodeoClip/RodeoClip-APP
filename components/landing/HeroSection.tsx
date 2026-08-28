'use client'

import Link from 'next/link'
import { motion } from 'motion/react'

export function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center text-center overflow-hidden">

      {/* Vídeo de fundo */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/hero-video.m4v"
      />

      {/* Overlay escuro para legibilidade */}
      <div aria-hidden className="absolute inset-0 bg-[#1A1008]/80" />

      {/* Gradiente inferior para fundir com o restante da página */}
      <div aria-hidden className="absolute bottom-0 inset-x-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #1A1008)' }} />

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 pt-32 pb-24">

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16,1,0.3,1] }}
          className="eyebrow-pill">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C17F3A]" />
          Converta, estabilize e personalize vídeos de rodeio
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.07, ease: [0.16,1,0.3,1] }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-[#F5ECD7] max-w-3xl">
          Clipes de rodeio no{' '}
          <span className="text-[#C17F3A]">formato vertical</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.13, ease: [0.16,1,0.3,1] }}
          className="text-base md:text-lg text-[#F5ECD7]/85 max-w-xl leading-relaxed">
          Faça upload, estabilize, ajuste velocidade, adicione logo e texto, controle o áudio e baixe o .zip pronto para Instagram, TikTok e YouTube Shorts.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.19, ease: [0.16,1,0.3,1] }}>
          <Link href="/cadastro" className="btn-primary">
            Criar conta grátis
          </Link>
        </motion.div>
      </div>

      {/* Mockup do app abaixo do texto, ainda dentro do hero */}
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.16,1,0.3,1] }}
        className="relative z-10 w-full max-w-5xl px-6 pb-0">
        <div className="rounded-t-xl overflow-hidden border border-b-0 border-[#2E1F0F]"
          style={{ boxShadow: '0 -4px 60px rgba(193,127,58,0.12)' }}>
          <div className="flex items-center gap-1.5 px-4 py-3 bg-[#251A0E] border-b border-[#2E1F0F]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3D2A14]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#3D2A14]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#3D2A14]" />
            <span className="ml-3 flex-1 max-w-xs mx-auto text-center text-xs text-[#8C7560] font-mono bg-[#2E1F0F] rounded px-3 py-0.5">
              rodeoclip.app/dashboard
            </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/app-mockup.png"
            alt="RodeoClip — interface do conversor"
            className="w-full h-auto block"
          />
        </div>
      </motion.div>

    </section>
  )
}
