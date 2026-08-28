'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, ArrowRight, ArrowLeft } from '@phosphor-icons/react'

const STORAGE_KEY = 'rodeoclip_tour_done_v2'
const PAD = 10 // padding ao redor do elemento destacado

interface Step {
  target: string // valor do data-tour
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    target: 'source-dir',
    title: 'Pasta de Origem',
    description: 'Selecione a pasta que contém seus vídeos horizontais. Todos os arquivos .mp4, .mov, .avi e .mts serão detectados automaticamente e o primeiro vídeo já aparece no preview.',
  },
  {
    target: 'dest-dir',
    title: 'Pasta de Destino',
    description: 'Escolha onde os vídeos convertidos serão salvos. Ao finalizar o processamento, os arquivos aparecerão automaticamente nessa pasta com o sufixo _9x16.mp4 — é só abrir a pasta de destino para encontrá-los.',
  },
  {
    target: 'speed',
    title: 'Velocidade',
    description: 'Controla a velocidade de reprodução do vídeo final. Use 0.4x para câmera lenta, 1x para velocidade normal, ou até 100x para timelapse. O áudio é ajustado proporcionalmente.',
  },
  {
    target: 'audio',
    title: 'Áudio',
    description: 'Ativa ou desativa o áudio no vídeo exportado. Com áudio desligado, o arquivo final fica menor e o processamento é mais rápido.',
  },
  {
    target: 'stabilize',
    title: 'Estabilizador',
    description: 'Reduz o tremor de câmera cortando 10% das bordas do frame e escalando de volta para 9:16. Ideal para vídeos gravados a cavalo ou em movimento. Aumenta levemente o tempo de processamento.',
  },
  {
    target: 'logo',
    title: 'Logotipo',
    description: 'Adicione um ou mais logos em PNG com fundo transparente. No preview, arraste para posicionar e use o scroll do mouse (ou pinça no celular) para redimensionar. Cada logo pode ter tamanho e posição independentes.',
  },
  {
    target: 'text',
    title: 'Texto',
    description: 'Insira um texto que será gravado permanentemente no vídeo. Escolha tamanho e cor, depois arraste o texto no preview para posicionar. A fonte é carregada automaticamente.',
  },
  {
    target: 'preview',
    title: 'Preview 9:16',
    description: 'Visualiza o primeiro vídeo da pasta já no formato final 9:16. Vídeos horizontais são rotacionados automaticamente. Clique para pausar/tocar, use o ícone de tela cheia para ver em tamanho completo. Os logos e textos adicionados aparecem aqui para posicionamento.',
  },
]

interface Rect { top: number; left: number; width: number; height: number }

function getRect(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

function getTooltipStyle(rect: Rect): React.CSSProperties {
  const tooltipW = 300
  const tooltipH = 160 // estimativa
  const spaceBelow = window.innerHeight - (rect.top + rect.height + PAD)
  const spaceAbove = rect.top - PAD
  const spaceRight = window.innerWidth - (rect.left + rect.width + PAD)

  // Preferência: abaixo → acima → direita → esquerda
  if (spaceBelow >= tooltipH) {
    return {
      position: 'fixed',
      top: rect.top + rect.height + PAD + 8,
      left: Math.min(Math.max(PAD, rect.left), window.innerWidth - tooltipW - PAD),
      width: tooltipW,
    }
  }
  if (spaceAbove >= tooltipH) {
    return {
      position: 'fixed',
      bottom: window.innerHeight - rect.top + PAD + 8,
      left: Math.min(Math.max(PAD, rect.left), window.innerWidth - tooltipW - PAD),
      width: tooltipW,
    }
  }
  if (spaceRight >= tooltipW) {
    return {
      position: 'fixed',
      top: Math.min(Math.max(PAD, rect.top), window.innerHeight - tooltipH - PAD),
      left: rect.left + rect.width + PAD + 8,
      width: tooltipW,
    }
  }
  return {
    position: 'fixed',
    top: Math.min(Math.max(PAD, rect.top), window.innerHeight - tooltipH - PAD),
    right: window.innerWidth - rect.left + PAD + 8,
    width: tooltipW,
  }
}

export function TourGuide() {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)

  // Mostra na primeira visita
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Pequeno delay para o DOM renderizar
      const t = setTimeout(() => setActive(true), 600)
      return () => clearTimeout(t)
    }
  }, [])

  const updateRect = useCallback(() => {
    if (!active) return
    const r = getRect(STEPS[step].target)
    setRect(r)
    // Rola o elemento para a view se necessário
    if (r) {
      const el = document.querySelector(`[data-tour="${STEPS[step].target}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [active, step])

  useEffect(() => {
    updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [updateRect])

  function close() {
    localStorage.setItem(STORAGE_KEY, '1')
    setActive(false)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else close()
  }

  function prev() {
    if (step > 0) setStep(s => s - 1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!active) return
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step])

  if (!active) return null

  const clipPath = rect
    ? `polygon(
        0% 0%, 100% 0%, 100% 100%, 0% 100%,
        0% ${rect.top - PAD}px,
        ${rect.left - PAD}px ${rect.top - PAD}px,
        ${rect.left - PAD}px ${rect.top + rect.height + PAD}px,
        ${rect.left + rect.width + PAD}px ${rect.top + rect.height + PAD}px,
        ${rect.left + rect.width + PAD}px ${rect.top - PAD}px,
        0% ${rect.top - PAD}px
      )`
    : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'

  const tooltipStyle = rect ? getTooltipStyle(rect) : { position: 'fixed' as const, top: '50%', left: '50%' }
  const current = STEPS[step]

  return (
    <>
      {/* Overlay escuro com spotlight recortado */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9990] pointer-events-none"
        style={{
          background: 'rgba(0,0,0,0.75)',
          clipPath,
          transition: 'clip-path 0.35s cubic-bezier(0.16,1,0.3,1)',
        }}
      />

      {/* Borda laranja ao redor do elemento */}
      <AnimatePresence mode="wait">
        {rect && (
          <motion.div
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed z-[9991] pointer-events-none rounded-xl"
            style={{
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
              border: '2px solid #C17F3A',
              boxShadow: '0 0 0 4px rgba(193,127,58,0.15), 0 0 24px rgba(193,127,58,0.25)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Bloqueio de clique no overlay (exceto tooltip) */}
      <div
        className="fixed inset-0 z-[9992]"
        onClick={close}
      />

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="z-[9993] bg-[#1A1008] border border-[#5C3F1E] rounded-2xl p-4 shadow-[0_16px_48px_rgba(0,0,0,0.7)]"
          style={tooltipStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fechar */}
          <button
            onClick={close}
            className="absolute top-3 right-3 w-6 h-6 rounded-md flex items-center justify-center text-[#8C7560] hover:text-[#F5ECD7] hover:bg-[#2E1F0F] transition-colors"
          >
            <X size={12} weight="bold" />
          </button>

          {/* Step counter */}
          <p className="text-[9px] font-mono text-[#C17F3A] tracking-widest uppercase mb-2">
            {step + 1} / {STEPS.length}
          </p>

          <h3 className="text-sm font-bold text-[#F5ECD7] mb-1.5 pr-6">{current.title}</h3>
          <p className="text-[11px] text-[#8C7560] leading-relaxed mb-4">{current.description}</p>

          {/* Dots */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={[
                    'h-1 rounded-full transition-all duration-200',
                    i === step ? 'w-5 bg-[#C17F3A]' : 'w-1 bg-[#2E1F0F] hover:bg-[#5C3F1E]',
                  ].join(' ')}
                />
              ))}
            </div>

            <div className="flex gap-1.5">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="w-7 h-7 rounded-lg border border-[#2E1F0F] flex items-center justify-center text-[#8C7560] hover:text-[#F5ECD7] hover:border-[#5C3F1E] transition-colors active:scale-90"
                >
                  <ArrowLeft size={13} weight="bold" />
                </button>
              )}
              <button
                onClick={next}
                className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-[#C17F3A] hover:bg-[#D4924A] text-[#0E0A05] text-[11px] font-bold transition-colors active:scale-95"
              >
                {step === STEPS.length - 1 ? 'Concluir' : 'Próximo'}
                {step < STEPS.length - 1 && <ArrowRight size={11} weight="bold" />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
