'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useConversionStore } from '@/store/useConversionStore'
import { ArrowsOut, X, Play, Pause } from '@phosphor-icons/react'
import { LogoOverlay } from './LogoOverlay'
import { TextOverlayDraggable } from './TextOverlayDraggable'
import { AnimatePresence, motion } from 'motion/react'

export function VideoPreview() {
  const {
    speedMultiplier, muteAudio, logos, textOverlay, previewFile, isProcessing,
    trimStart, trimEnd, initTrimRange, setSeekPreview,
  } = useConversionStore()

  const videoRef = useRef<HTMLVideoElement>(null)
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const srcUrlRef = useRef<string | null>(null)

  const [playing, setPlaying] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  const [progress, setProgress] = useState(0) // 0-1

  // Registra função de seek para o TrimBar (coluna esquerda) controlar o <video> daqui
  useEffect(() => {
    setSeekPreview((time: number) => {
      if (videoRef.current) videoRef.current.currentTime = time
    })
    return () => setSeekPreview(null)
  }, [setSeekPreview])

  // Quando a fila está processando, garante que nenhum exec() do preview compete com a fila
  useEffect(() => {
    if (!isProcessing) return
    import('@/lib/ffmpegSingleton').then(({ detachProgressListener, getFFmpeg }) => {
      getFFmpeg().then(ff => detachProgressListener(ff)).catch(() => null)
    })
  }, [isProcessing])

  // Cria/revoga object URL quando o arquivo muda
  useEffect(() => {
    if (srcUrlRef.current) {
      URL.revokeObjectURL(srcUrlRef.current)
      srcUrlRef.current = null
    }
    setIsLandscape(false)
    if (!previewFile) return
    const url = URL.createObjectURL(previewFile)
    srcUrlRef.current = url
    if (videoRef.current) {
      videoRef.current.src = url
      videoRef.current.load()
      videoRef.current.play().catch(() => null)
      setPlaying(true)
    }
    return () => {
      URL.revokeObjectURL(url)
      srcUrlRef.current = null
    }
  }, [previewFile])

  // Detecta orientação e inicializa o intervalo de corte quando arquivo muda
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onMeta = () => {
      setIsLandscape(v.videoWidth > v.videoHeight)
      setProgress(0)
      initTrimRange(v.duration)
    }
    const onTimeUpdate = () => {
      if (v.duration > 0) setProgress(v.currentTime / v.duration)
      // Loop restrito ao intervalo de corte selecionado (apenas preview)
      if (trimEnd > trimStart && v.currentTime >= trimEnd) {
        v.currentTime = trimStart
      }
    }
    v.addEventListener('loadedmetadata', onMeta)
    v.addEventListener('timeupdate', onTimeUpdate)
    return () => {
      v.removeEventListener('loadedmetadata', onMeta)
      v.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [previewFile, trimStart, trimEnd, initTrimRange])

  // Sincroniza playbackRate — zero CPU
  useEffect(() => {
    const clamped = Math.min(16, Math.max(0.0625, speedMultiplier))
    if (videoRef.current) videoRef.current.playbackRate = clamped
    if (fullscreenVideoRef.current) fullscreenVideoRef.current.playbackRate = clamped
  }, [speedMultiplier])

  // Sincroniza muted — zero CPU
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muteAudio
    if (fullscreenVideoRef.current) fullscreenVideoRef.current.muted = muteAudio
  }, [muteAudio])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(() => null); setPlaying(true) }
    else { v.pause(); setPlaying(false) }
  }, [])

  const openFullscreen = useCallback(() => setFullscreen(true), [])

  const closeFullscreen = useCallback(() => {
    if (fullscreenVideoRef.current && videoRef.current) {
      videoRef.current.currentTime = fullscreenVideoRef.current.currentTime
      if (playing) videoRef.current.play().catch(() => null)
    }
    setFullscreen(false)
  }, [playing])

  useEffect(() => {
    if (!fullscreen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeFullscreen() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [fullscreen, closeFullscreen])

  useEffect(() => {
    const fv = fullscreenVideoRef.current
    if (!fullscreen || !fv || !srcUrlRef.current || !videoRef.current) return
    fv.src = srcUrlRef.current
    const startTime = videoRef.current.currentTime
    fv.currentTime = (trimEnd > trimStart && (startTime < trimStart || startTime >= trimEnd))
      ? trimStart
      : startTime
    fv.playbackRate = Math.min(16, Math.max(0.0625, speedMultiplier))
    fv.muted = muteAudio
    fv.play().catch(() => null)
    videoRef.current.pause()

    const onTimeUpdate = () => {
      if (fv.duration > 0) setProgress(fv.currentTime / fv.duration)
      // Mesmo loop restrito ao intervalo de corte usado no preview normal
      if (trimEnd > trimStart && fv.currentTime >= trimEnd) {
        fv.currentTime = trimStart
      }
    }
    fv.addEventListener('timeupdate', onTimeUpdate)
    return () => fv.removeEventListener('timeupdate', onTimeUpdate)
  }, [fullscreen, speedMultiplier, muteAudio, trimStart, trimEnd])

  return (
    <>
      <div className="flex flex-col gap-3 items-center w-full">
        <div
          ref={containerRef}
          className="relative bg-[#0E0A05] rounded-xl overflow-visible border border-[#2E1F0F]"
          style={{ width: 320, height: 568 }}
        >
          <div className="w-full h-full rounded-xl overflow-hidden relative">
            {!previewFile && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <p className="text-[11px] text-[#8C7560] text-center px-6">
                  Selecione a pasta de origem para carregar o preview
                </p>
              </div>
            )}

            {/* Wrapper que aplica a rotação no layout, não via transform solto */}
            <div
              style={isLandscape ? {
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 568,
                height: 320,
                transform: 'translate(-50%, -50%) rotate(-90deg)',
              } : {
                position: 'absolute',
                inset: 0,
              }}
            >
              <video
                ref={videoRef}
                loop
                muted={muteAudio}
                playsInline
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  display: previewFile ? 'block' : 'none',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>

            {/* Botão Play/Pause centralizado */}
            {previewFile && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center group"
              >
                <div className={[
                  'w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center',
                  'transition-all duration-200 group-hover:bg-black/70 group-hover:scale-110 active:scale-95',
                  playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100',
                ].join(' ')}>
                  {playing
                    ? <Pause size={22} weight="fill" className="text-white" />
                    : <Play size={22} weight="fill" className="text-white translate-x-0.5" />
                  }
                </div>
              </button>
            )}
          </div>

          {previewFile && (
            <button
              onClick={openFullscreen}
              className="absolute top-2 right-2 z-30 w-7 h-7 rounded-md bg-[#1A1008]/70 backdrop-blur-sm flex items-center justify-center text-[#F5ECD7]/80 hover:text-[#F5ECD7] hover:bg-[#1A1008]/90 transition-all active:scale-90"
              title="Tela cheia"
            >
              <ArrowsOut size={13} weight="bold" />
            </button>
          )}

          {previewFile && logos.map((l) => <LogoOverlay key={l.id} logoId={l.id} containerRef={containerRef} />)}
          {previewFile && textOverlay && <TextOverlayDraggable containerRef={containerRef} />}

          {/* Barra de progresso */}
          {previewFile && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-xl overflow-hidden">
              <div
                className="h-full bg-[#C17F3A] transition-none"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
            onClick={closeFullscreen}
          >
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors active:scale-90"
            >
              <X size={20} weight="bold" />
            </button>

            <div
              ref={fullscreenContainerRef}
              className="relative overflow-hidden"
              style={{ height: '100vh', aspectRatio: '9/16' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/*
                Fullscreen container: largura = 100vh * 9/16, altura = 100vh
                Para landscape, o wrapper precisa ter:
                  width = container.height = 100vh
                  height = container.width = 100vh * 9/16
                rotacionado -90deg centrado no container.
              */}
              <div
                style={isLandscape ? {
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '100vh',
                  height: 'calc(100vh * 9 / 16)',
                  transform: 'translate(-50%, -50%) rotate(-90deg)',
                } : {
                  position: 'absolute',
                  inset: 0,
                }}
              >
                <video
                  ref={fullscreenVideoRef}
                  loop
                  playsInline
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {logos.map((l) => <LogoOverlay key={l.id} logoId={l.id} containerRef={fullscreenContainerRef} />)}
              {textOverlay && <TextOverlayDraggable containerRef={fullscreenContainerRef} />}

              {/* Barra de progresso fullscreen */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div
                  className="h-full bg-[#C17F3A] transition-none"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
