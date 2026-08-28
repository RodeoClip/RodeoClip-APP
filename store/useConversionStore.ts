'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FileStatus = 'pending' | 'processing' | 'done' | 'error'

export interface QueueItem {
  id: string
  name: string
  status: FileStatus
  errorMessage?: string
}

export interface LogoEntry {
  id: string
  file: File
  previewUrl: string
  scale: number
  x: number
  y: number
}

export interface TextOverlay {
  text: string
  fontSize: number
  color: string
  x: number
  y: number
}

export interface ProcessOptions {
  speed: number
  muteAudio: boolean
  stabilize: boolean
  logos: LogoEntry[]
  textOverlay: TextOverlay | null
  trimStart: number
  trimEnd: number
}

// ─── Interface da store ───────────────────────────────────────────────────────

interface ConversionStore {
  // Fila
  queue: QueueItem[]
  updateItem: (id: string, patch: Partial<Omit<QueueItem, 'id'>>) => void
  clearQueue: () => void

  // File System Access API
  sourceDir: FileSystemDirectoryHandle | null
  sourceFiles: FileSystemFileHandle[] | null
  sourceLabel: string
  destDir: FileSystemDirectoryHandle | null
  previewFile: File | null
  setSourceDir: (h: FileSystemDirectoryHandle | null) => Promise<void>
  setSourceFiles: (handles: FileSystemFileHandle[]) => Promise<void>
  setDestDir: (h: FileSystemDirectoryHandle | null) => void

  // Progresso
  isProcessing: boolean
  totalFiles: number
  processedFiles: number
  currentFileName: string

  // Controles
  runQueue: () => Promise<void>

  // Logos (múltiplos)
  logos: LogoEntry[]
  addLogo: (file: File, previewUrl: string) => void
  removeLogo: (id: string) => void
  updateLogo: (id: string, patch: Partial<Omit<LogoEntry, 'id' | 'file' | 'previewUrl'>>) => void

  speedMultiplier: number
  setSpeedMultiplier: (speed: number) => void

  muteAudio: boolean
  setMuteAudio: (mute: boolean) => void

  stabilize: boolean
  setStabilize: (v: boolean) => void

  textOverlay: TextOverlay | null
  setTextOverlay: (overlay: TextOverlay | null) => void
  setTextPosition: (x: number, y: number) => void

  getProcessOptions: () => ProcessOptions

  // Trim (apenas preview — não afeta o processamento em lote)
  trimDuration: number
  trimStart: number
  trimEnd: number
  setTrimRange: (start: number, end: number) => void
  resetTrimRange: () => void
  initTrimRange: (duration: number) => void
  seekPreview: ((time: number) => void) | null
  setSeekPreview: (fn: ((time: number) => void) | null) => void
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const VIDEO_EXTS = new Set(['.mp4', '.mov', '.mxf', '.mts', '.avi'])
const FFMPEG_RESTART_EVERY = 200

function getExt(name: string): string {
  return name.slice(name.lastIndexOf('.')).toLowerCase()
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useConversionStore = create<ConversionStore>((set, get) => ({

  // ── Fila ──────────────────────────────────────────────────────────────────

  queue: [],
  updateItem: (id, patch) =>
    set((s) => ({
      queue: s.queue.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })),
  clearQueue: () => set({ queue: [] }),

  // ── File System Access API ────────────────────────────────────────────────

  sourceDir: null,
  sourceFiles: null,
  sourceLabel: '',
  destDir: null,
  previewFile: null,
  setSourceDir: async (h) => {
    set({ sourceDir: h, sourceFiles: null, sourceLabel: h?.name ?? '', previewFile: null })
    if (!h) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const [name, handle] of (h as any).entries()) {
      if ((handle as FileSystemHandle).kind === 'file' && VIDEO_EXTS.has(getExt(name))) {
        const file = await (handle as FileSystemFileHandle).getFile()
        set({ previewFile: file })
        return
      }
    }
  },
  setSourceFiles: async (handles) => {
    const videoHandles = []
    for (const handle of handles) {
      if (VIDEO_EXTS.has(getExt(handle.name))) videoHandles.push(handle)
    }
    const label = videoHandles.length === 1
      ? videoHandles[0].name
      : `${videoHandles.length} vídeos selecionados`
    set({ sourceDir: null, sourceFiles: videoHandles, sourceLabel: videoHandles.length > 0 ? label : '', previewFile: null })
    if (videoHandles.length > 0) {
      const file = await videoHandles[0].getFile()
      set({ previewFile: file })
    }
  },
  setDestDir: (h) => set({ destDir: h }),

  // ── Progresso ─────────────────────────────────────────────────────────────

  isProcessing: false,
  totalFiles: 0,
  processedFiles: 0,
  currentFileName: '',

  // ── Orquestrador FIFO ──────────────────────────────────────────────────────

  runQueue: async () => {
    const { sourceDir, sourceFiles, destDir, isProcessing, getProcessOptions, updateItem } = get()

    if (isProcessing) return
    if ((!sourceDir && !sourceFiles) || !destDir) throw new Error('Selecione a origem e a pasta de destino.')

    // 1. Mapeia FileHandles sem carregar vídeos na memória
    const entries: { handle: FileSystemFileHandle; name: string }[] = []
    if (sourceFiles) {
      for (const handle of sourceFiles) {
        entries.push({ handle, name: handle.name })
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const [name, handle] of (sourceDir as any).entries()) {
        if ((handle as FileSystemHandle).kind === 'file' && VIDEO_EXTS.has(getExt(name))) {
          entries.push({ handle: handle as FileSystemFileHandle, name })
        }
      }
    }

    if (entries.length === 0) throw new Error('Nenhum vídeo encontrado na origem selecionada.')

    // Checa créditos disponíveis antes de iniciar
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Sessão expirada. Faça login novamente.')

    const creditsRes = await fetch('/api/credits', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const creditsData = await creditsRes.json() as { credits_remaining: number }
    let creditsRemaining = creditsData.credits_remaining ?? 0

    if (false && creditsRemaining <= 0) {
      throw new Error('Seus créditos acabaram. Assine o plano Pro para continuar convertendo.')
    }

    const queueItems: QueueItem[] = entries.map(({ name }) => ({
      id: crypto.randomUUID(),
      name,
      status: 'pending',
    }))

    set({
      queue: queueItems,
      totalFiles: entries.length,
      processedFiles: 0,
      currentFileName: '',
      isProcessing: true,
    })

    // 2. Wake Lock — mantém tela ligada
    let wakeLock: WakeLockSentinel | null = null
    try {
      wakeLock = await navigator.wakeLock.request('screen')
    } catch {
      // Não suportado — continua sem ele
    }

    const { setFFmpegBusy, resetFFmpeg, getFFmpeg, attachProgressListener, detachProgressListener } = await import('@/lib/ffmpegSingleton')
    const { buildFFmpegArgs, probeFile, scaleLogoToDisplaySize } = await import('@/lib/clientProcessor')
    const { isWebCodecsSupported, processWithWebCodecs } = await import('@/lib/webcodecsProcessor')
    const webCodecsSupported = isWebCodecsSupported()

    // Pré-escala cada logo UMA VEZ para o tamanho final de exibição (a escala/posição
    // não muda durante a fila) — evita reescalar por frame dentro do ffmpeg e reler o
    // arquivo bruto a cada vídeo processado.
    const initialOpts = getProcessOptions()
    const scaledLogos = await Promise.all(
      initialOpts.logos.map((logo) => scaleLogoToDisplaySize(logo.file, Math.round(150 * logo.scale)))
    )

    // O core multi-thread (core-mt) tem uma race condition conhecida no MEMFS ao
    // reabrir um input de imagem (-loop 1) entre threads paralelas — causa
    // ERR_FILE_NOT_FOUND e trava o exec() indefinidamente. Filas com logo usam
    // single-thread para evitar esse caminho de código.
    const useSingleThread = scaledLogos.length > 0

    // Sinaliza ocupado ANTES de obter a instância para bloquear o preview
    setFFmpegBusy(true)
    // Garante instância limpa — aborta qualquer exec do preview em andamento e remove listeners zumbis
    resetFFmpeg()
    let ffmpeg = await getFFmpeg(useSingleThread)
    let processedCount = 0
    const jobId = crypto.randomUUID()
    const completedFileNames: string[] = []

    try {
      for (let i = 0; i < entries.length; i++) {
        // Sem créditos — marca os restantes como erro e encerra a fila
        if (false && creditsRemaining <= 0) {
          for (let j = i; j < entries.length; j++) {
            updateItem(queueItems[j].id, { status: 'error', errorMessage: 'Sem créditos' })
          }
          break
        }

        const { handle, name } = entries[i]
        const item = queueItems[i]

        set({ currentFileName: name, processedFiles: processedCount })
        updateItem(item.id, { status: 'processing' })

        // Restart FFmpeg a cada 200 vídeos para liberar RAM do WASM
        if (processedCount > 0 && processedCount % FFMPEG_RESTART_EVERY === 0) {
          resetFFmpeg()
          ffmpeg = await getFFmpeg(useSingleThread)
        }

        // Nome de arquivo único por vídeo: o demuxer de imagem do FFmpeg pode
        // reter cache por path entre exec() sucessivos no mesmo processo WASM
        // ao reabrir um `-loop 1 -i logo_N.png` com o mesmo nome — sintoma
        // observado como "logo aplicada só no 1º vídeo da fila". Sufixo com o
        // índice do vídeo evita qualquer reuso de path.
        const logoFileSuffix = `_${i}`

        try {
          const file = await handle.getFile()
          const buf = await file.arrayBuffer()
          const opts = getProcessOptions()

          await ffmpeg.writeFile('input.mp4', new Uint8Array(buf))

          // PROBE — garante que não há listener de progresso ativo durante o probe
          // (detachProgressListener é chamado internamente por attachProgressListener,
          //  mas fazemos explicitamente aqui para deixar a intenção clara)
          detachProgressListener(ffmpeg)
          const probe = await probeFile(ffmpeg, 'input.mp4')

          for (let li = 0; li < scaledLogos.length; li++) {
            // writeFile transfere o ArrayBuffer subjacente para o worker (postMessage
            // transferable) — na 1ª iteração o buffer de scaledLogos[li] fica detached,
            // quebrando as iterações seguintes. Copiamos os bytes a cada vídeo.
            await ffmpeg.writeFile(`logo_${li}${logoFileSuffix}.png`, scaledLogos[li].slice())
          }

          // Caminho acelerado por hardware: tenta primeiro quando o navegador
          // suporta WebCodecs. Aceita paisagem (rotação 90° no canvas) e
          // qualquer erro de decode/encode cai para supported:false — nesses
          // casos videoBlob permanece null e o fluxo cai para o FFmpeg puro
          // abaixo, que serve de rede de segurança para todo caso não coberto.
          let videoBlob: Blob | null = null
          if (webCodecsSupported) {
            console.log(`🎬 [DEBUG-FILA] Testando suporte a WebCodecs para o arquivo: ${name}`)
            const webCodecsResult = await processWithWebCodecs(opts, ffmpeg, 'input.mp4', {
              hasAudio: probe.hasAudio,
              frameRate: probe.frameRate,
              landscape: probe.landscape,
              width: probe.width,
              height: probe.height,
            }).catch((e) => {
              const msg = e instanceof Error ? e.message : 'erro desconhecido'
              console.error('💥 [DEBUG-FILA] Falha crítica ao inicializar WebCodecs na GPU:', msg)
              console.log('🛡️ [DEBUG-FILA] Acionando rede de segurança estável do FFmpeg...')
              return { supported: false as const, reason: msg }
            })

            if (webCodecsResult.supported) {
              console.log('🚀 [DEBUG-FILA] SUCESSO! Ativando aceleração por GPU para este vídeo.')
              videoBlob = webCodecsResult.blob
            } else {
              console.warn('🐢 [DEBUG-FILA] WebCodecs rejeitado. Motivo:', webCodecsResult.reason || 'Desconhecido. Acionando FFmpeg por software...')
            }
          }

          if (!videoBlob) {
            const args = await buildFFmpegArgs(ffmpeg, 'input.mp4', 'output.mp4', opts, probe, logoFileSuffix)

            // ENCODE — listener fresco, isolado, sem concorrência com o probe
            attachProgressListener(ffmpeg, ({ progress }: { progress: number }) => {
              const p = isFinite(progress) ? Math.min(0.99, Math.max(0, progress)) : 0
              set({ processedFiles: processedCount + p })
            })

            const exitCode = await ffmpeg.exec(args)

            // Remove imediatamente após o término — antes de qualquer await posterior
            detachProgressListener(ffmpeg)

            if (exitCode !== 0) throw new Error(`FFmpeg saiu com código ${exitCode}`)

            // Aguarda buffers internos do WASM drenarem
            await new Promise(r => setTimeout(r, 100))

            const dadosLeitura = await ffmpeg.readFile('output.mp4')
            const uint8 = dadosLeitura instanceof Uint8Array
              ? dadosLeitura
              : new Uint8Array(dadosLeitura as unknown as ArrayBuffer)

            videoBlob = new Blob([uint8 as BlobPart], { type: 'video/mp4' })
          }

          // Grava no disco via createWritable + close() assíncrono obrigatório
          const outName = name.replace(/\.[^.]+$/, '') + '_9x16.mp4'
          console.log('🎬 [DEBUG-CORE] 5a. Solicitando FileHandle...')
          const outHandle = await destDir.getFileHandle(outName, { create: true })
          console.log('🎬 [DEBUG-CORE] 5b. FileHandle obtido. Abrindo canal Writable...')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const writable = await (outHandle as any).createWritable({ keepExistingData: false })
          console.log('🎬 [DEBUG-CORE] 5c. Canal Writable aberto.')

          console.log('🎬 [DEBUG-CORE] 6. Escrevendo o Blob na pasta de destino local...')
          await writable.write(videoBlob)

          console.log('🎬 [DEBUG-CORE] 7. Invocando fechamento de canal assíncrono (writable.close())...')
          const tempoInicioClose = performance.now()
          await writable.close()
          console.log(`🎬 [DEBUG-CORE] 8. Canal fechado com sucesso em ${(performance.now() - tempoInicioClose).toFixed(2)}ms!`)

          // Limpa FS virtual APÓS fechar o writable
          await ffmpeg.deleteFile('input.mp4').catch(() => null)
          await ffmpeg.deleteFile('output.mp4').catch(() => null)
          for (let li = 0; li < scaledLogos.length; li++) {
            await ffmpeg.deleteFile(`logo_${li}${logoFileSuffix}.png`).catch(() => null)
          }

          processedCount++
          updateItem(item.id, { status: 'done' })
          set({ processedFiles: processedCount })

          // Consome 1 crédito pelo vídeo concluído
          try {
            const useRes = await fetch('/api/credits/use', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ amount: 1 }),
            })
            const useData = await useRes.json() as { credits_remaining: number }
            creditsRemaining = useData.credits_remaining ?? 0
          } catch {
            creditsRemaining -= 1
          }

        } catch (err) {
          // Garante limpeza do listener mesmo em caso de erro
          detachProgressListener(ffmpeg)

          await ffmpeg.deleteFile('input.mp4').catch(() => null)
          await ffmpeg.deleteFile('output.mp4').catch(() => null)
          for (let li = 0; li < scaledLogos.length; li++) {
            await ffmpeg.deleteFile(`logo_${li}${logoFileSuffix}.png`).catch(() => null)
          }
          processedCount++
          set({ processedFiles: processedCount })
          const msg = err instanceof Error ? err.message : 'Erro desconhecido'
          updateItem(item.id, { status: 'error', errorMessage: msg })
        }
      }
    } finally {
      detachProgressListener(ffmpeg)
      setFFmpegBusy(false)
      set({ isProcessing: false, currentFileName: '' })
      wakeLock?.release().catch(() => null)
    }
  },

  // ── Logos ─────────────────────────────────────────────────────────────────

  logos: [],
  addLogo: (file, previewUrl) =>
    set((s) => ({
      logos: [
        ...s.logos,
        { id: crypto.randomUUID(), file, previewUrl, scale: 1.0, x: 880, y: 1720 },
      ],
    })),
  removeLogo: (id) =>
    set((s) => ({ logos: s.logos.filter((l) => l.id !== id) })),
  updateLogo: (id, patch) =>
    set((s) => ({
      logos: s.logos.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    })),

  // ── Outras configurações ──────────────────────────────────────────────────

  speedMultiplier: 1.0,
  setSpeedMultiplier: (speed) => set({ speedMultiplier: Math.min(100.0, Math.max(0.1, speed)) }),

  muteAudio: false,
  setMuteAudio: (mute) => set({ muteAudio: mute }),

  stabilize: false,
  setStabilize: (v) => set({ stabilize: v }),

  textOverlay: null,
  setTextOverlay: (overlay) => set({ textOverlay: overlay }),
  setTextPosition: (x, y) =>
    set((s) => ({
      textOverlay: s.textOverlay ? { ...s.textOverlay, x, y } : null,
    })),

  getProcessOptions: (): ProcessOptions => {
    const s = get()
    return {
      speed: s.speedMultiplier,
      muteAudio: s.muteAudio,
      stabilize: s.stabilize,
      logos: s.logos,
      textOverlay: s.textOverlay,
      trimStart: s.trimStart,
      trimEnd: s.trimEnd,
    }
  },

  // ── Trim (corte aplicado no preview e propagado ao processamento real) ────

  trimDuration: 0,
  trimStart: 0,
  trimEnd: 0,
  setTrimRange: (start, end) => set({ trimStart: start, trimEnd: end }),
  resetTrimRange: () => set((s) => ({ trimStart: 0, trimEnd: s.trimDuration })),
  initTrimRange: (duration) => set({ trimDuration: duration, trimStart: 0, trimEnd: duration }),
  seekPreview: null,
  setSeekPreview: (fn) => set({ seekPreview: fn }),
}))
