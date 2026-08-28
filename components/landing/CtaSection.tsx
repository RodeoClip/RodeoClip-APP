'use client'

import Link from 'next/link'
import { motion } from 'motion/react'

export function CtaSection() {
  return (
    <section className="py-24 px-6 border-t border-[#2E1F0F]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}
          className="relative rounded-2xl border border-[#2E1F0F] overflow-hidden flex flex-col md:flex-row min-h-[380px]">

          {/* Lado esquerdo — texto + CTA */}
          <div className="relative z-10 flex flex-col justify-center gap-6 px-10 py-14 md:w-1/2 bg-[#251A0E]">
            <div aria-hidden className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 80% 80% at 0% 50%, rgba(193,127,58,0.1) 0%, transparent 70%)' }} />
            <h2 className="relative text-3xl md:text-4xl font-bold tracking-tight text-[#F5ECD7] leading-tight">
              Entre no futuro da produção de conteúdo de rodeio
            </h2>
            <p className="relative text-[#A89580] text-sm leading-relaxed max-w-sm">
              Estabilização, logo, texto, controle de áudio e velocidade ajustável. Tudo em um só lugar para você focar no que importa.
            </p>
            <Link href="/cadastro" className="btn-primary relative self-start">
              Criar conta grátis
            </Link>
          </div>

          {/* Lado direito — imagem */}
          <div className="md:w-1/2 min-h-[280px] md:min-h-full relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/banner-cta.png"
              alt="Rodeio — RodeoClip"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Gradiente de fusão com o lado esquerdo */}
            <div aria-hidden className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, #251A0E 0%, transparent 30%)' }} />
          </div>

        </motion.div>
      </div>
    </section>
  )
}
