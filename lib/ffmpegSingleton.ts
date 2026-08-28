import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

let instance: FFmpeg | null = null
let loading: Promise<FFmpeg> | null = null

// Único listener de progresso ativo — referência necessária para ffmpeg.off()
let activeProgressCallback: ((event: { progress: number }) => void) | null = null

// Quando true, o preview não deve iniciar um novo exec()
export let ffmpegBusy = false

export function setFFmpegBusy(busy: boolean) {
  ffmpegBusy = busy
}

export function attachProgressListener(
  ffmpeg: FFmpeg,
  callback: (event: { progress: number }) => void,
) {
  detachProgressListener(ffmpeg)
  activeProgressCallback = callback
  ffmpeg.on('progress', activeProgressCallback)
}

export function detachProgressListener(ffmpeg: FFmpeg) {
  if (activeProgressCallback) {
    ffmpeg.off('progress', activeProgressCallback)
    activeProgressCallback = null
  }
}

export function resetFFmpeg(): void {
  if (instance) {
    detachProgressListener(instance)
    try { instance.terminate() } catch { /* já terminado */ }
  }
  instance = null
  loading = null
}

async function loadSingleThread(ff: FFmpeg): Promise<void> {
  const fallbackURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.9/dist/umd'
  await ff.load({
    coreURL: await toBlobURL(`${fallbackURL}/ffmpeg-core.js`,   'text/javascript'),
    wasmURL: await toBlobURL(`${fallbackURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })
}

async function loadInstance(ff: FFmpeg, forceSingleThread: boolean): Promise<void> {
  if (forceSingleThread) {
    await loadSingleThread(ff)
    return
  }

  const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.9/dist/umd'
  try {
    await ff.load({
      coreURL:   await toBlobURL(`${baseURL}/ffmpeg-core.js`,        'text/javascript'),
      wasmURL:   await toBlobURL(`${baseURL}/ffmpeg-core.wasm`,      'application/wasm'),
      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
    })
  } catch {
    // mt falhou (sem SharedArrayBuffer) — fallback single-thread
    await loadSingleThread(ff)
  }
}

// forceSingleThread: usado para filas com logo — o core-mt tem uma race
// condition conhecida no MEMFS ao reabrir um input de imagem (-loop 1) em
// paralelo entre threads, causando ERR_FILE_NOT_FOUND e travamento no exec().
// Só importa na criação da instância — se já existe uma instância ativa,
// ela é reutilizada como está (o chamador deve usar resetFFmpeg() antes se
// precisar trocar de core, como o runQueue já faz).
export async function getFFmpeg(forceSingleThread = false): Promise<FFmpeg> {
  if (instance) return instance
  if (loading) return loading

  loading = (async () => {
    const ff = new FFmpeg()
    try {
      await loadInstance(ff, forceSingleThread)
    } catch (e) {
      loading = null
      throw e
    }
    instance = ff
    return ff
  })()

  return loading
}
