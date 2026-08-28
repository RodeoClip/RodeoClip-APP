'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from '@phosphor-icons/react'
import Link from 'next/link'
import Image from 'next/image'

const STORAGE_KEY = 'rodeoclip_credits_popup_dismissed'
const DELAY_MS = 4000

export function FreeCreditsPopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    const t = setTimeout(() => setVisible(true), DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Modal centralizado */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 pointer-events-none"
          >
            {/* Container com aspect-ratio exato da arte para que % de posição sejam precisos */}
            <div
              className="relative w-full max-w-3xl rounded-2xl overflow-hidden border border-[#5C3F1E] shadow-[0_32px_80px_rgba(0,0,0,0.8)] pointer-events-auto"
              style={{ aspectRatio: '1512 / 850' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src="/Max_a_Recrie_essa_arte_ori.png"
                alt="5 créditos grátis ao se cadastrar no RodeoClip"
                fill
                className="object-fill"
                priority
              />

              {/* Botão centralizado no retângulo vazio da arte.
                  O bloco vazio na imagem vai de ~76% a ~90% (height) e de ~3% a ~43% (width).
                  Usamos top+bottom para centralizar verticalmente dentro dessa faixa. */}
              <div
                className="absolute z-10 flex items-center"
                style={{ top: '84%', left: '3%', width: '40%', height: '10%' }}
              >
                <Link
                  href="/cadastro"
                  onClick={dismiss}
                  className="flex items-center justify-center w-full h-full rounded-xl bg-[#C17F3A] hover:bg-[#D4924A] text-[#0E0A05] text-sm font-bold transition-colors active:scale-[0.97]"
                  style={{ boxShadow: '0 4px 20px rgba(193,127,58,0.4)' }}
                >
                  Criar conta grátis
                </Link>
              </div>

              {/* Botão fechar */}
              <button
                onClick={dismiss}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-colors active:scale-90"
                aria-label="Fechar"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
