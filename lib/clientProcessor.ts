import { FFmpeg } from '@ffmpeg/ffmpeg'
import { getFFmpeg } from './ffmpegSingleton'

// ─── Redimensionamento de logo ────────────────────────────────────────────────
// Logos são exibidos no máximo a ~750px de largura no vídeo final (scale até 5x
// sobre uma base de 150px). Imagens anexadas em resolução muito maior (comuns em
// exports de logo, ex: 2000px+) forçam o ffmpeg a decodificar/escalar um arquivo
// grande a cada frame do vídeo — reduzir aqui evita esse custo por frame.
const LOGO_MAX_DIMENSION = 800

export async function resizeLogoFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  const bitmap = await createImageBitmap(file)
  const largestSide = Math.max(bitmap.width, bitmap.height)
  if (largestSide <= LOGO_MAX_DIMENSION) {
    bitmap.close()
    return file
  }

  const ratio = LOGO_MAX_DIMENSION / largestSide
  const targetW = Math.round(bitmap.width * ratio)
  const targetH = Math.round(bitmap.height * ratio)

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, targetW, targetH)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return file

  return new File([blob], file.name, { type: 'image/png' })
}

// Escala o logo para o tamanho EXATO de exibição no vídeo final (uma vez por
// fila, fora do loop de vídeos) — elimina o filtro `scale=` do ffmpeg, que
// antes reescalava o PNG a cada frame de cada vídeo processado. Sobra só o
// `overlay`, muito mais barato no ffmpeg.wasm (single-thread).
export async function scaleLogoToDisplaySize(file: File, targetPx: number): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file)
  const ratio = targetPx / bitmap.width
  const targetW = targetPx % 2 === 0 ? targetPx : targetPx + 1
  const targetH = Math.round(bitmap.height * ratio / 2) * 2

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return new Uint8Array(await file.arrayBuffer())
  }
  ctx.drawImage(bitmap, 0, 0, targetW, targetH)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return new Uint8Array(await file.arrayBuffer())

  return new Uint8Array(await blob.arrayBuffer())
}

// ─── Probe unificado ──────────────────────────────────────────────────────────

interface ProbeResult {
  landscape: boolean
  hasAudio: boolean
  duration: number
  frameRate: number
  width: number
  height: number
}

export async function probeFile(ffmpeg: FFmpeg, inputName: string): Promise<ProbeResult> {
  let logOutput = ''
  const onLog = ({ message }: { message: string }) => { logOutput += message + '\n' }
  ffmpeg.on('log', onLog)
  try {
    await ffmpeg.exec(['-hide_banner', '-i', inputName, '-t', '1', '-f', 'null', '-'])
  } catch {
    // FFmpeg pode rejeitar mesmo com -f null - ; os logs já foram emitidos
  }
  ffmpeg.off('log', onLog)

  const videoLine = logOutput.split('\n').find(l => /Video:/.test(l))
  const dimMatch = videoLine?.match(/(\d{2,5})x(\d{2,5})/)
  const width = dimMatch ? parseInt(dimMatch[1]) : 0
  const height = dimMatch ? parseInt(dimMatch[2]) : 0
  const hasAudio = logOutput.split('\n').some(l => /Audio:/.test(l))

  const durationLine = logOutput.split('\n').find(l => /Duration:/.test(l))
  const durMatch = durationLine?.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2})/)
  const duration = durMatch
    ? parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseInt(durMatch[3]) + parseInt(durMatch[4]) / 100
    : 0

  // "30 fps" ou "29.97 fps" — aparece na mesma linha "Video:" do log, entre as
  // dimensões e o "tbr". Fallback 30 quando ausente (ex: alguns containers só
  // expõem tbr/tbc, sem "fps" explícito).
  const fpsMatch = videoLine?.match(/(\d+(?:\.\d+)?)\s*fps/)
  const frameRate = fpsMatch ? parseFloat(fpsMatch[1]) : 30

  return { landscape: width > 0 && height > 0 && width > height, hasAudio, duration, frameRate, width, height }
}

// ─── atempo chain ─────────────────────────────────────────────────────────────

function buildAtempoChain(speed: number): string {
  const filters: string[] = []
  let remaining = speed
  while (remaining > 2.0) { filters.push('atempo=2.0'); remaining /= 2.0 }
  while (remaining < 0.5) { filters.push('atempo=0.5'); remaining /= 0.5 }
  filters.push(`atempo=${remaining.toFixed(4)}`)
  return filters.join(',')
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TextOverlay {
  text: string
  fontSize: number
  color: string
  x: number
  y: number
}

export interface LogoEntry {
  id: string
  file: File
  previewUrl: string
  scale: number
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

export interface ProcessProgress {
  fileIndex: number
  totalFiles: number
  fileName: string
  phase: 'converting' | 'zipping' | 'done'
  percent: number
}

// ─── buildFFmpegArgs ──────────────────────────────────────────────────────────
// Monta e retorna os args do exec. Chamado pelo runQueue da store.
// O input já deve estar escrito no FS virtual antes de chamar.

// Cache da fonte em memória — carregada uma única vez por sessão de fila
let fontCache: Uint8Array | null = null

async function ensureFont(ffmpeg: FFmpeg): Promise<boolean> {
  if (!fontCache) {
    try {
      const resp = await fetch('/Arial-Bold.ttf')
      fontCache = new Uint8Array(await resp.arrayBuffer())
    } catch {
      return false
    }
  }
  try {
    await ffmpeg.writeFile('Arial-Bold.ttf', fontCache)
    return true
  } catch {
    return false
  }
}

export async function buildFFmpegArgs(
  ffmpeg: FFmpeg,
  inputName: string,
  outputName: string,
  options: ProcessOptions,
  probeResult?: { landscape: boolean; hasAudio: boolean; duration: number },
  logoFileSuffix = '',
): Promise<string[]> {
  const { landscape, hasAudio, duration } = probeResult ?? await probeFile(ffmpeg, inputName)
  const includeAudio = !options.muteAudio && hasAudio

  const transpose = landscape ? 'transpose=2' : null
  const videoSpeed = `setpts=PTS/${options.speed.toFixed(4)}`
  const audioSpeed = buildAtempoChain(options.speed)

  // Estabilização: crop central 90% + upscale de volta → remove bordas com tremor sem distorcer
  // deshake causa distorção de borda no WASM independente da ordem; esta abordagem é determinística
  const stabilizeFilter = options.stabilize
    ? 'crop=iw*0.9:ih*0.9,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920'
    : 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920'

  let drawtextFilter: string | null = null
  if (options.textOverlay?.text) {
    const t = options.textOverlay
    const fontLoaded = await ensureFont(ffmpeg)
    if (fontLoaded) {
      const ffColor = `0x${t.color.replace('#', '')}`
      // Quoting do filtergraph do FFmpeg: dentro de um valor 'entre aspas simples',
      // \ e : precisam de \ antes, e um apóstrofo literal exige fechar a aspa,
      // inserir \' fora dela e reabrir ('\'') — \' sozinho dentro da aspa aberta
      // fecha a string prematuramente e corrompe o resto do filtro.
      const escaped = t.text
        .replace(/\\/g, '\\\\')
        .replace(/:/g, '\\:')
        .replace(/'/g, "'\\''")
      drawtextFilter = `drawtext=fontfile='Arial-Bold.ttf':text='${escaped}':fontsize=${t.fontSize}:fontcolor=${ffColor}:x=${Math.round(t.x)}:y=${Math.round(t.y)}:shadowcolor=0x000000@0.7:shadowx=2:shadowy=2`
    }
  }

  // Ordem: rotate → crop/scale (com ou sem margem de estabilização) → velocidade → texto
  const videoPre = [transpose, stabilizeFilter, videoSpeed, drawtextFilter].filter(Boolean).join(',')

  const logos = options.logos ?? []

  // Corte (trim): -ss/-to antes do -i faz o demuxer pular direto para o ponto
  // de início (seek rápido), sem decodificar o trecho descartado.
  const hasTrim = options.trimEnd > options.trimStart
  const trimArgs = hasTrim
    ? ['-ss', options.trimStart.toFixed(3), '-to', options.trimEnd.toFixed(3)]
    : []
  const sourceDuration = hasTrim ? options.trimEnd - options.trimStart : duration

  const inputs: string[] = [...trimArgs, '-noautorotate', '-i', inputName]
  // Duração de saída ajustada pela velocidade (setpts=PTS/speed encurta/alonga o vídeo)
  // e pelo corte selecionado, se houver. Usada para truncar o input do logo
  // explicitamente via -t, em vez de depender só de -shortest — com
  // -filter_complex + -map "[v]" nomeado, -shortest sozinho não corta de forma
  // confiável no ffmpeg.wasm, deixando o -loop 1 (stream infinito) sem fim
  // definido e travando o exec() perto do término.
  const outputDuration = sourceDuration > 0 ? sourceDuration / options.speed : 0
  for (let li = 0; li < logos.length; li++) {
    if (outputDuration > 0) inputs.push('-t', outputDuration.toFixed(3))
    inputs.push('-loop', '1', '-i', `logo_${li}${logoFileSuffix}.png`)
  }

  let filterComplex: string
  if (logos.length === 0) {
    filterComplex = includeAudio
      ? `[0:v]${videoPre}[v];[0:a]${audioSpeed}[a]`
      : `[0:v]${videoPre}[v]`
  } else {
    // Aplica os filtros base ao vídeo, depois encadeia cada logo.
    // Os PNGs de logo já chegam pré-escalados para o tamanho final de exibição
    // (via scaleLogoToDisplaySize, uma vez por fila) — sem filtro `scale=` aqui,
    // que antes rodava por frame de cada vídeo e era o gargalo real com logo anexado.
    const parts: string[] = [`[0:v]${videoPre}[base0]`]
    for (let li = 0; li < logos.length; li++) {
      const logo = logos[li]
      const inLabel = li === 0 ? 'base0' : `comp${li - 1}`
      const outLabel = li === logos.length - 1 ? 'v' : `comp${li}`
      // format=rgba explícito: evita o overlay ter que inferir/converter o
      // pixel format do PNG internamente a cada frame.
      parts.push(`[${li + 1}:v]format=rgba[logo${li}]`)
      parts.push(`[${inLabel}][logo${li}]overlay=${Math.round(logo.x)}:${Math.round(logo.y)}[${outLabel}]`)
    }
    if (includeAudio) parts.push(`[0:a]${audioSpeed}[a]`)
    filterComplex = parts.join(';')
  }

  const audioArgs = !includeAudio
    ? ['-an']
    : ['-map', '[a]', '-c:a', 'aac', '-b:a', '192k']

  return [
    ...inputs,
    '-filter_complex', filterComplex,
    '-map', '[v]',
    ...audioArgs,
    // -shortest: segurança adicional ao -t explícito acima (com -loop 1 nos
    // logos, garante que o encode não fique esperando o input do logo).
    ...(logos.length > 0 ? ['-shortest'] : []),
    '-c:v', 'libx264',
    // yuv420p explícito: com format=rgba no filtro do logo, o filtergraph pode
    // deixar o formato de pixel ambíguo para o libx264 inferir — força o
    // espaço de cor padrão compatível em vez de herdar RGBA da logo.
    '-pix_fmt', 'yuv420p',
    '-preset', 'ultrafast',
    '-crf', '24',
    '-movflags', '+faststart',
    outputName,
  ]
}

// ─── processVideos — usado pelo preview (único arquivo) ───────────────────────

export async function processVideos(
  files: File[],
  options: ProcessOptions,
  onProgress: (progress: ProcessProgress) => void,
): Promise<Blob> {
  onProgress({ fileIndex: 0, totalFiles: files.length, fileName: '', phase: 'converting', percent: 0 })
  const ffmpeg = await getFFmpeg()
  const convertedBlobs: { name: string; data: Uint8Array }[] = []

  const logos = options.logos ?? []
  for (let li = 0; li < logos.length; li++) {
    const logoBuf = await logos[li].file.arrayBuffer()
    await ffmpeg.writeFile(`logo_${li}.png`, new Uint8Array(logoBuf))
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const inputName = `input_${i}.mp4`
    const outputName = `output_${i}.mp4`

    onProgress({
      fileIndex: i,
      totalFiles: files.length,
      fileName: file.name,
      phase: 'converting',
      percent: Math.round((i / files.length) * 90),
    })

    const buf = await file.arrayBuffer()
    await ffmpeg.writeFile(inputName, new Uint8Array(buf))

    const args = await buildFFmpegArgs(ffmpeg, inputName, outputName, options)
    const exitCode = await ffmpeg.exec(args)

    if (exitCode !== 0) {
      await ffmpeg.deleteFile(inputName).catch(() => null)
      throw new Error(`Erro ao processar "${file.name}" (código ${exitCode}).`)
    }

    // Lê, converte explicitamente para Uint8Array (padrão seguro v0.12)
    const dadosLeitura = await ffmpeg.readFile(outputName)
    const uint8 = dadosLeitura instanceof Uint8Array
      ? dadosLeitura
      : new Uint8Array(dadosLeitura as unknown as ArrayBuffer)

    const baseName = file.name.replace(/\.[^.]+$/, '')
    convertedBlobs.push({ name: `${baseName}_9x16.mp4`, data: uint8 })

    await ffmpeg.deleteFile(inputName).catch(() => null)
    await ffmpeg.deleteFile(outputName).catch(() => null)
  }

  for (let li = 0; li < logos.length; li++) {
    await ffmpeg.deleteFile(`logo_${li}.png`).catch(() => null)
  }
  if (convertedBlobs.length === 0) throw new Error('Nenhum vídeo processado')

  onProgress({ fileIndex: files.length, totalFiles: files.length, fileName: '', phase: 'zipping', percent: 92 })

  if (convertedBlobs.length === 1) {
    onProgress({ fileIndex: files.length, totalFiles: files.length, fileName: '', phase: 'done', percent: 100 })
    return new Blob([convertedBlobs[0].data as BlobPart], { type: 'video/mp4' })
  }

  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const { name, data } of convertedBlobs) zip.file(name, data)
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  onProgress({ fileIndex: files.length, totalFiles: files.length, fileName: '', phase: 'done', percent: 100 })
  return zipBlob
}
