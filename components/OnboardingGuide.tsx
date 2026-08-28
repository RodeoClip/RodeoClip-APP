'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Folder, Sliders, Play, Download } from '@phosphor-icons/react'

const STEPS = [
  {
    icon: <Folder size={28} weight="duotone" className="text-[#C17F3A]" />,
    title: 'Selecione as pastas',
    description: 'Escolha a pasta de origem com seus vídeos horizontais e a pasta de destino onde os arquivos convertidos serão salvos.',
  },
  {
    icon: <Sliders size={28} weight="duotone" className="text-[#C17F3A]" />,
    title: 'Configure as opções',
    description: 'Ajuste a velocidade, ative o estabilizador, adicione logotipos PNG e insira texto. Arraste os elementos diretamente no preview.',
  },
  {
    icon: <Play size={28} weight="duotone" className="text-[#C17F3A]" />,
    title: 'Visualize no preview',
    description: 'O primeiro vídeo da pasta aparece automaticamente no preview 9:16. Use o preview para posicionar logos e texto antes de converter.',
  },
  {
    icon: <Download size={28} weight="duotone" className="text-[#C17F3A]" />,
    title: 'Inicie a conversão',
    description: 'Clique em "Iniciar conversão" na seção de upload. Os vídeos serão processados em fila e salvos diretamente na pasta de destino.',
  },
]

const STORAGE_KEY = 'rodeoclip_onboarding_done'

export function OnboardingGuide() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  function close() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1)
    else close()
  }

  function prev() {
    if (step > 0) setStep(step - 1)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm bg-[#1A1008] border border-[#2E1F0F] rounded-2xl p-6 shadow-[0_24px_64px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fechar */}
            <button
              onClick={close}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-[#8C7560] hover:text-[#F5ECD7] hover:bg-[#2E1F0F] transition-colors active:scale-90"
            >
              <X size={14} weight="bold" />
            </button>

            {/* Header fixo */}
            <p className="text-[10px] font-mono text-[#C17F3A] mb-4 tracking-widest uppercase">Guia rápido</p>

            {/* Conteúdo do step com animação */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3 min-h-[120px]"
              >
                <div className="w-12 h-12 rounded-xl bg-[#0E0A05] border border-[#2E1F0F] flex items-center justify-center">
                  {STEPS[step].icon}
                </div>
                <h2 className="text-base font-bold text-[#F5ECD7]">{STEPS[step].title}</h2>
                <p className="text-xs text-[#8C7560] leading-relaxed">{STEPS[step].description}</p>
              </motion.div>
            </AnimatePresence>

            {/* Dots + navegação */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={[
                      'h-1.5 rounded-full transition-all duration-200',
                      i === step ? 'w-6 bg-[#C17F3A]' : 'w-1.5 bg-[#2E1F0F] hover:bg-[#5C3F1E]',
                    ].join(' ')}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={prev}
                    className="px-3 py-1.5 text-xs text-[#8C7560] hover:text-[#F5ECD7] border border-[#2E1F0F] hover:border-[#5C3F1E] rounded-lg transition-colors active:scale-95"
                  >
                    Voltar
                  </button>
                )}
                <button
                  onClick={next}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#C17F3A] hover:bg-[#D4924A] text-[#0E0A05] rounded-lg transition-colors active:scale-95"
                >
                  {step === STEPS.length - 1 ? 'Começar' : 'Próximo'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
