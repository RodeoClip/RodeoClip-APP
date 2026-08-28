'use client'

import { motion } from 'motion/react'
import { UploadSimple, Gauge, VideoCamera, Download, Image, TextT, SpeakerHigh, Crosshair } from '@phosphor-icons/react'

const FEATURES = [
  {
    icon: UploadSimple,
    title: 'Upload em lote',
    body: 'Arraste até 10 vídeos de uma vez. Suporta MP4, MOV, MXF, MTS e AVI com até 5 GB cada.',
  },
  {
    icon: Gauge,
    title: 'Velocidade ajustável',
    body: 'De câmera lenta 0.1x até timelapse 100x. Controle preciso para highlights que prendem a atenção.',
  },
  {
    icon: Crosshair,
    title: 'Estabilização de vídeo',
    body: 'Remove tremidas automaticamente com tecnologia vidstab. Ideal para gravações em arena e montaria.',
  },
  {
    icon: Image,
    title: 'Logo personalizado',
    body: 'Suba seu PNG, ajuste escala e posição. O logo fica gravado em todos os clipes exportados.',
  },
  {
    icon: TextT,
    title: 'Texto sobreposto',
    body: 'Adicione título, nome do peão ou patrocinador. Cor, tamanho e posição totalmente ajustáveis.',
  },
  {
    icon: SpeakerHigh,
    title: 'Controle de áudio',
    body: 'Mantenha o áudio original ou silencie com um clique. Perfeito para adicionar trilha depois.',
  },
  {
    icon: VideoCamera,
    title: 'Preview em tempo real',
    body: 'Visualize o resultado 9:16 antes de processar. Sem surpresas, sem retrabalho.',
  },
  {
    icon: Download,
    title: 'Download em .zip',
    body: 'Todos os clipes Full HD 1080×1920 num único arquivo pronto para postar.',
  },
]

const ease = [0.16, 1, 0.3, 1] as const

export function FeaturesSection() {
  return (
    <section id="recursos" className="py-24 px-6 section-alt">
      <div className="max-w-6xl mx-auto flex flex-col gap-16">

        {/* Header — como Writora: eyebrow + H2 + subtexto centralizados */}
        <div className="flex flex-col items-center text-center gap-4">
          <span className="eyebrow-pill">Recursos</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#F5ECD7] max-w-xl">
            Gerencie seus clipes como um profissional
          </h2>
          <p className="text-[#8C7560] max-w-md leading-relaxed text-sm">
            RodeoClip é uma ferramenta focada que entrega vídeos de rodeio prontos para redes sociais em segundos.
          </p>
        </div>

        {/* Grid de features — como Writora: 2 colunas no desktop, cards com icone+titulo+corpo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease }}
              className="wp-card p-7 flex flex-col gap-4">
              <div className="w-9 h-9 rounded-lg bg-[rgba(193,127,58,0.1)] flex items-center justify-center shrink-0">
                <f.icon size={18} weight="duotone" className="text-[#C17F3A]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm font-semibold text-[#F5ECD7]">{f.title}</h3>
                <p className="text-xs text-[#A89580] leading-relaxed">{f.body}</p>
              </div>
              <a href="#como-funciona" className="text-xs text-[#C17F3A] hover:underline mt-auto">
                Saiba mais
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
