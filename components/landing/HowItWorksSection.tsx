'use client'

import { motion } from 'motion/react'

// Estrutura Writora: eyebrow "The Process" | H2 + subtexto | 3 cards numerados horizontais
const STEPS = [
  {
    num: '1',
    title: 'Faça upload dos vídeos',
    body: 'Selecione até 10 clipes do seu dispositivo. Suporta MP4, MOV, MXF, MTS e AVI com até 5 GB cada.',
  },
  {
    num: '2',
    title: 'Personalize tudo',
    body: 'Ajuste velocidade, ative a estabilização, adicione logo e texto, controle o áudio e confira o preview 9:16.',
  },
  {
    num: '3',
    title: 'Baixe o pacote pronto',
    body: 'Clique em processar, acompanhe o progresso e baixe o .zip com todos os clipes em Full HD 1080×1920.',
  },
]

const ease = [0.16, 1, 0.3, 1] as const

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 px-6 border-t border-[#2E1F0F]">
      <div className="max-w-6xl mx-auto flex flex-col gap-16">

        {/* Header — centralizado como Writora */}
        <div className="flex flex-col items-center text-center gap-4">
          <span className="eyebrow-pill">O processo</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#F5ECD7] max-w-xl">
            Gere clipes prontos em apenas 3 passos
          </h2>
          <p className="text-[#8C7560] max-w-md leading-relaxed text-sm">
            Transforme seus vídeos de eventos de rodeio em conteúdo vertical sem precisar instalar nada.
          </p>
        </div>

        {/* 3 steps — como Writora: numerados, horizontais, com numero grande em destaque */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <motion.div key={step.num}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: i * 0.1, ease }}
              className="flex flex-col gap-4">
              {/* Numero grande — como Writora */}
              <span className="text-5xl font-bold text-[#5C3F1E] leading-none select-none">{step.num}</span>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-semibold text-[#F5ECD7]">{step.title}</h3>
                <p className="text-sm text-[#A89580] leading-relaxed">{step.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
