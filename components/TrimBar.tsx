'use client'

import { useEffect, useRef, useState, useCallback, type PointerEvent as ReactPointerEvent } from 'react'
import { useConversionStore } from '@/store/useConversionStore'
import { Scissors, ArrowsLeftRight } from '@phosphor-icons/react'
import { gsap } from 'gsap'

const THUMB_COUNT = 8

export function TrimBar() {
  const { previewFile, trimDuration, trimStart, trimEnd, setTrimRange, resetTrimRange, seekPreview } = useConversionStore()

  const [dragging, setDragging] = useState<'start' | 'end' | 'slip' | null>(null)
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const slipRef = useRef<{ startX: number; origStart: number; origEnd: number } | null>(null)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const selectionRef = useRef<HTMLDivElement>(null)
  const handleStartRef = useRef<HTMLDivElement>(null)
  const handleEndRef = useRef<HTMLDivElement>(null)

  // Gera thumbnails do vídeo capturando frames em intervalos via <video>+<canvas> off-screen
  useEffect(() => {
    setThumbnails([])
    if (!previewFile || trimDuration === 0) return

    let cancelled = false
    const video = document.createElement('video')
    video.muted = true
    video.src = URL.createObjectURL(previewFile)

    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 96
    const ctx = canvas.getContext('2d')

    const captured: string[] = []

    async function captureAt(time: number): Promise<string> {
      return new Promise((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked)
          if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', 0.6))
        }
        video.addEventListener('seeked', onSeeked)
        video.currentTime = time
      })
    }

    video.addEventListener('loadedmetadata', async () => {
      for (let i = 0; i < THUMB_COUNT; i++) {
        if (cancelled) break
        const time = (trimDuration / THUMB_COUNT) * i
        const frame = await captureAt(time)
        captured.push(frame)
      }
      if (!cancelled) setThumbnails([...captured])
      URL.revokeObjectURL(video.src)
    })

    return () => {
      cancelled = true
      URL.revokeObjectURL(video.src)
    }
  }, [previewFile, trimDuration])

  const formatTime = useCallback((t: number) => {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  const timeFromClientX = useCallback((clientX: number) => {
    const track = trackRef.current
    if (!track || trimDuration === 0) return 0
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return ratio * trimDuration
  }, [trimDuration])

  const handlePointerDown = useCallback((handle: 'start' | 'end') => (e: ReactPointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(handle)
  }, [])

  // Slip Edit — arrasta o conteúdo dentro da região selecionada, deslocando início/fim
  // juntos e mantendo a duração do corte constante (não altera trimEnd - trimStart)
  const handleSlipPointerDown = useCallback((e: ReactPointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    slipRef.current = { startX: e.clientX, origStart: trimStart, origEnd: trimEnd }
    setDragging('slip')
  }, [trimStart, trimEnd])

  useEffect(() => {
    if (!dragging) return

    const onMove = (e: PointerEvent) => {
      if (dragging === 'slip') {
        const slip = slipRef.current
        const track = trackRef.current
        if (!slip || !track || trimDuration === 0) return
        const rect = track.getBoundingClientRect()
        const deltaTime = ((e.clientX - slip.startX) / rect.width) * trimDuration
        const clipLength = slip.origEnd - slip.origStart
        const clampedDelta = Math.min(Math.max(deltaTime, -slip.origStart), trimDuration - slip.origEnd)
        const newStart = slip.origStart + clampedDelta
        const newEnd = newStart + clipLength
        setTrimRange(newStart, newEnd)
        seekPreview?.(newStart)
        return
      }

      const t = timeFromClientX(e.clientX)
      if (dragging === 'start') {
        const clamped = Math.min(t, trimEnd - 0.1)
        setTrimRange(clamped, trimEnd)
        seekPreview?.(clamped)
      } else {
        const clamped = Math.max(t, trimStart + 0.1)
        setTrimRange(trimStart, clamped)
        seekPreview?.(clamped)
      }
    }
    const onUp = () => { setDragging(null); slipRef.current = null }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, trimStart, trimEnd, trimDuration, timeFromClientX, setTrimRange, seekPreview])

  // Entrada animada + pulso contínuo na região selecionada (compositor-only: opacity/scale/y)
  useEffect(() => {
    if (trimDuration === 0 || !wrapperRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        wrapperRef.current,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out' }
      )
      gsap.fromTo(
        [handleStartRef.current, handleEndRef.current],
        { scale: 0, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.35, ease: 'back.out(2)', stagger: 0.05, delay: 0.1 }
      )
      gsap.to(selectionRef.current, {
        boxShadow: '0 0 0 2px rgba(193,127,58,0.9), 0 0 16px rgba(193,127,58,0.5)',
        duration: 1.1,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    }, wrapperRef)

    return () => ctx.revert()
  }, [previewFile, trimDuration])

  // Feedback tátil GSAP nos handles ao arrastar
  useEffect(() => {
    const activeHandle = dragging === 'start' ? handleStartRef.current : dragging === 'end' ? handleEndRef.current : null
    if (!activeHandle) return
    gsap.to(activeHandle, { scale: 1.15, duration: 0.2, ease: 'power2.out' })
    return () => {
      gsap.to(activeHandle, { scale: 1, duration: 0.2, ease: 'power2.out' })
    }
  }, [dragging])

  // Feedback tátil GSAP na moldura durante o Slip Edit
  useEffect(() => {
    if (!selectionRef.current) return
    gsap.to(selectionRef.current, {
      scale: dragging === 'slip' ? 1.02 : 1,
      duration: 0.2,
      ease: 'power2.out',
    })
  }, [dragging])

  if (!previewFile || trimDuration === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <Scissors size={20} className="text-[#3D2A14]" weight="duotone" />
        <p className="text-[11px] text-[#8C7560]">Selecione um vídeo para habilitar o corte</p>
      </div>
    )
  }

  const startPct = (trimStart / trimDuration) * 100
  const endPct = (trimEnd / trimDuration) * 100

  return (
    <div ref={wrapperRef} className="flex flex-col gap-2.5" style={{ visibility: 'hidden' }}>
      <div className="flex items-center justify-between text-[10px] text-[#8C7560] font-mono">
        <span className="text-[#C17F3A] font-semibold">{formatTime(trimStart)}</span>
        <button
          onClick={resetTrimRange}
          className="text-[#8C7560] hover:text-[#C17F3A] font-sans font-semibold transition-colors"
        >
          Redefinir corte
        </button>
        <span className="text-[#C17F3A] font-semibold">{formatTime(trimEnd)}</span>
      </div>

      <div
        ref={trackRef}
        className="relative h-14 rounded-xl overflow-hidden border border-[#2E1F0F] select-none touch-none bg-[#0E0A05]"
      >
        {/* Trilha de thumbnails do vídeo */}
        <div className="absolute inset-0 flex">
          {thumbnails.length > 0
            ? thumbnails.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="h-full flex-1 object-cover" draggable={false} />
              ))
            : Array.from({ length: THUMB_COUNT }).map((_, i) => (
                <div key={i} className="h-full flex-1 bg-[#1A1008] border-r border-[#2E1F0F]/50 last:border-r-0" />
              ))}
        </div>

        {/* Máscaras escurecendo o que fica fora do corte */}
        <div className="absolute inset-y-0 left-0 bg-black/70" style={{ width: `${startPct}%` }} />
        <div className="absolute inset-y-0 right-0 bg-black/70" style={{ width: `${100 - endPct}%` }} />

        {/* Moldura da região selecionada — arrastável para Slip Edit (desloca início/fim juntos) */}
        <div
          ref={selectionRef}
          onPointerDown={handleSlipPointerDown}
          className="absolute inset-y-0 border-2 border-[#C17F3A] cursor-grab active:cursor-grabbing flex items-center justify-center"
          style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
        >
          <div className="w-5 h-5 rounded-full bg-[#C17F3A]/90 flex items-center justify-center pointer-events-none">
            <ArrowsLeftRight size={11} weight="bold" className="text-[#1A1008]" />
          </div>
        </div>

        {/* Handle início — alça estilo CapCut com grip */}
        <div
          ref={handleStartRef}
          onPointerDown={handlePointerDown('start')}
          className="absolute top-0 bottom-0 w-4 -ml-2 bg-[#C17F3A] cursor-ew-resize flex items-center justify-center rounded-l-md z-10"
          style={{ left: `${startPct}%` }}
        >
          <div className="flex flex-col gap-[3px]">
            <span className="w-2.5 h-[2px] bg-[#1A1008] rounded-full" />
            <span className="w-2.5 h-[2px] bg-[#1A1008] rounded-full" />
            <span className="w-2.5 h-[2px] bg-[#1A1008] rounded-full" />
          </div>
        </div>

        {/* Handle fim — alça estilo CapCut com grip */}
        <div
          ref={handleEndRef}
          onPointerDown={handlePointerDown('end')}
          className="absolute top-0 bottom-0 w-4 -ml-2 bg-[#C17F3A] cursor-ew-resize flex items-center justify-center rounded-r-md z-10"
          style={{ left: `${endPct}%` }}
        >
          <div className="flex flex-col gap-[3px]">
            <span className="w-2.5 h-[2px] bg-[#1A1008] rounded-full" />
            <span className="w-2.5 h-[2px] bg-[#1A1008] rounded-full" />
            <span className="w-2.5 h-[2px] bg-[#1A1008] rounded-full" />
          </div>
        </div>
      </div>

      <p className="text-[10px] text-[#8C7560] text-center">
        Duração selecionada: <span className="text-[#C17F3A] font-mono">{formatTime(trimEnd - trimStart)}</span>
      </p>
      <p className="text-[10px] text-[#8C7560] text-center">
        Arraste as bordas para cortar · arraste o centro para deslizar (Slip Edit)
      </p>
    </div>
  )
}
