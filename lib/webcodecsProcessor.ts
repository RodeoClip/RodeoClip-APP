import type { FFmpeg } from '@ffmpeg/ffmpeg'
import { Muxer, ArrayBufferTarget } from 'mp4-muxer'
import type { LogoEntry, ProcessOptions } from './clientProcessor'

// ─── Processador híbrido WebCodecs ─────────────────────────────────────────────
// Isolado do pipeline FFmpeg puro (buildFFmpegArgs/processVideos em
// clientProcessor.ts) — não altera nada do motor existente. Decodifica e
// recompõe os frames por hardware (GPU) via VideoDecoder/VideoEncoder nativos,
// desenha overlays em OffscreenCanvas, e usa o FFmpeg singleton apenas para
// extrair o stream H.264 bruto (demux) e o áudio original — nenhum dos dois
// passa por recodificação de vídeo no FFmpeg. O mux final (vídeo + áudio →
// .mp4) é feito por mp4-muxer em JS puro, já que VideoEncoder não produz um
// container MP4 sozinho — apenas chunks H.264 crus.

export interface WebCodecsResult {
  supported: true
  blob: Blob
}

export interface WebCodecsUnsupported {
  supported: false
  reason: string
}

const OUTPUT_W = 1080
const OUTPUT_H = 1920
const VIDEO_BITRATE = 4_000_000 // 4 Mbps — dentro da faixa 3-5 Mbps pedida
const DEFAULT_FRAME_RATE = 30

export function isWebCodecsSupported(): boolean {
  return typeof window !== 'undefined'
    && 'VideoDecoder' in window
    && 'VideoEncoder' in window
    && 'OffscreenCanvas' in window
}

// ─── Extração de áudio via FFmpeg singleton (sem recodificar) ─────────────────
// Usa o motor FFmpeg já carregado apenas para demuxar o AAC original do
// container de entrada — muito mais barato que decodificar/reencodar vídeo.
// Como o áudio é copiado cru (-c:a copy, sem transcodificar), o sample rate e
// a contagem de canais reais precisam ser lidos do log do FFmpeg — declará-los
// errado no muxer faz o player reproduzir o stream copiado em pitch/velocidade
// incorretos, mesmo com os bytes do AAC intactos.

interface ExtractedAudio {
  data: Uint8Array
  sampleRate: number
  numberOfChannels: number
}

function parseAudioFormat(logOutput: string): { sampleRate: number; numberOfChannels: number } {
  const audioLine = logOutput.split('\n').find((l) => /Audio:/.test(l))
  const hzMatch = audioLine?.match(/(\d+)\s*Hz/)
  const sampleRate = hzMatch ? parseInt(hzMatch[1]) : 48000
  const numberOfChannels = audioLine && /\bmono\b/.test(audioLine)
    ? 1
    : audioLine && /\bstereo\b/.test(audioLine)
      ? 2
      : 2
  return { sampleRate, numberOfChannels }
}

// Mesma progressão usada em clientProcessor.ts (buildAtempoChain): atempo só
// aceita 0.5-2.0 por chamada, então velocidades fora dessa faixa precisam de
// múltiplos filtros encadeados.
function buildAtempoChain(speed: number): string {
  const filters: string[] = []
  let remaining = speed
  while (remaining > 2.0) { filters.push('atempo=2.0'); remaining /= 2.0 }
  while (remaining < 0.5) { filters.push('atempo=0.5'); remaining /= 0.5 }
  filters.push(`atempo=${remaining.toFixed(4)}`)
  return filters.join(',')
}

async function extractAudioAac(
  ffmpeg: FFmpeg,
  inputName: string,
  trimArgs: string[],
  speed: number,
): Promise<ExtractedAudio | null> {
  const audioName = `audio_${crypto.randomUUID()}.aac`
  let logOutput = ''
  const onLog = ({ message }: { message: string }) => { logOutput += message + '\n' }
  ffmpeg.on('log', onLog)
  try {
    // Velocidade !== 1 exige reencode do áudio (atempo) — só nesse caso perde-se
    // o stream-copy. Sem mudança de velocidade, copia cru (mais barato, sem perda).
    const args = speed !== 1
      ? [...trimArgs, '-i', inputName, '-vn', '-af', buildAtempoChain(speed), '-c:a', 'aac', audioName]
      : [...trimArgs, '-i', inputName, '-vn', '-c:a', 'copy', audioName]
    const exitCode = await ffmpeg.exec(args)
    if (exitCode !== 0) return null
    const data = await ffmpeg.readFile(audioName)
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data as unknown as ArrayBuffer)
    const { sampleRate, numberOfChannels } = parseAudioFormat(logOutput)
    return { data: bytes, sampleRate, numberOfChannels }
  } catch {
    return null
  } finally {
    ffmpeg.off('log', onLog)
    await ffmpeg.deleteFile(audioName).catch(() => null)
  }
}

// ─── Desenho de overlays (logo + texto) no canvas de composição ───────────────
// Reimplementação em Canvas2D dos mesmos efeitos visuais do filtro FFmpeg
// (overlay= e drawtext=) — não é um port de filtro, é um desenho equivalente
// feito com fillText/drawImage sobre o frame decodificado.

async function loadLogoBitmaps(logos: LogoEntry[]): Promise<ImageBitmap[]> {
  return Promise.all(logos.map((logo) => createImageBitmap(logo.file)))
}

// Desenha o frame decodificado no canvas de saída, replicando a mesma
// semântica do filtro FFmpeg (clientProcessor.ts):
//   sem stabilize: scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920
//   com stabilize: crop=iw*0.9:ih*0.9 antes do scale/crop acima (remove bordas com tremor)
// "increase" preenche o destino cobrindo os dois eixos (like CSS object-fit:
// cover) — cortamos o excesso no eixo maior via retângulo de origem, em vez
// de esticar/distorcer com um simples drawImage(frame, 0, 0, W, H).
//
// landscape=true (mesmo equivalente ao transpose=2 do buildFFmpegArgs): o
// frame de origem vem deitado (ex: 1920x1080) e precisa ser girado 90° para
// caber no canvas de saída retrato (1080x1920). Como o cover-fit precisa
// calcular a área ocupada DEPOIS da rotação, os eixos largura/altura do
// frame são tratados trocados (fullW/fullH usam displayHeight/displayWidth)
// — sem essa troca o cover-fit calcularia a escala errada e o vídeo sairia
// pequeno demais ou cortado incorretamente.
function drawSourceFrame(
  ctx: OffscreenCanvasRenderingContext2D,
  frame: VideoFrame,
  stabilize: boolean,
  landscape: boolean,
) {
  const fullW = landscape ? frame.displayHeight : frame.displayWidth
  const fullH = landscape ? frame.displayWidth : frame.displayHeight

  // Estabilização: recorta 90% central antes do cover-fit abaixo
  const cropW = stabilize ? fullW * 0.9 : fullW
  const cropH = stabilize ? fullH * 0.9 : fullH
  const srcX = (fullW - cropW) / 2
  const srcY = (fullH - cropH) / 2

  // object-fit: cover do retângulo recortado para OUTPUT_W x OUTPUT_H
  const scale = Math.max(OUTPUT_W / cropW, OUTPUT_H / cropH)
  const coverW = cropW * scale
  const coverH = cropH * scale
  const destX = (OUTPUT_W - coverW) / 2
  const destY = (OUTPUT_H - coverH) / 2

  if (!landscape) {
    ctx.drawImage(frame, srcX, srcY, cropW, cropH, destX, destY, coverW, coverH)
    return
  }

  // Gira -90° (anti-horário) em torno do centro do canvas de saída — o
  // sentido +90° inicialmente usado produzia o vídeo de cabeça para baixo
  // (confirmado visualmente em produção). Com -90°, a leitura do retângulo
  // de origem é direta (srcY/srcX/cropH/cropW, sem a subtração compensatória
  // que o sentido +90° exigia) — o canto inferior-esquerdo do frame original
  // vira o canto superior-esquerdo da saída, igual ao transpose=1 do FFmpeg.
  ctx.save()
  ctx.translate(OUTPUT_W / 2, OUTPUT_H / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.drawImage(
    frame,
    srcY, srcX, cropH, cropW,
    -coverH / 2, -coverW / 2, coverH, coverW,
  )
  ctx.restore()
}

function drawOverlays(
  ctx: OffscreenCanvasRenderingContext2D,
  logos: LogoEntry[],
  logoBitmaps: ImageBitmap[],
  textOverlay: ProcessOptions['textOverlay'],
) {
  for (let i = 0; i < logos.length; i++) {
    const logo = logos[i]
    const bitmap = logoBitmaps[i]
    const displaySize = 150 * logo.scale
    const targetH = displaySize * (bitmap.height / bitmap.width)
    ctx.drawImage(bitmap, logo.x, logo.y, displaySize, targetH)
  }

  if (textOverlay?.text) {
    ctx.save()
    ctx.font = `bold ${textOverlay.fontSize}px Arial`
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.textBaseline = 'top'
    ctx.fillText(textOverlay.text, textOverlay.x + 2, textOverlay.y + 2)
    ctx.fillStyle = textOverlay.color
    ctx.fillText(textOverlay.text, textOverlay.x, textOverlay.y)
    ctx.restore()
  }
}

// ─── Demux via FFmpeg stream-copy + fatiador Annex-B em JS puro ───────────────
//
// VideoDecoder.decode() consome EncodedVideoChunk (uma amostra H.264 crua +
// timestamp + keyframe flag), não um arquivo .mp4 inteiro. Em vez de parsear
// as caixas do container MP4 (moov/trak/stsd), extraímos o stream H.264 bruto
// via stream-copy do FFmpeg (`-vcodec copy -f h264`) — sem recodificar vídeo —
// e fatiamos os NAL units em JS. O decoder é configurado em modo Annex-B
// (`avc: { format: 'annexb' }`), que dispensa a caixa `description`/avcC: o
// SPS/PPS já vêm embutidos como NAL units no próprio stream, exatamente como
// o `-f h264` do FFmpeg os emite antes do primeiro keyframe.

interface DemuxedSample {
  data: Uint8Array
  timestamp: number // microssegundos
  duration: number // microssegundos
  isKeyFrame: boolean
}

interface DemuxedVideo {
  frameRate: number
  hasAudio: boolean
  durationSeconds: number
  samples: DemuxedSample[]
}

// Tipos de NAL unit H.264 (5 bits baixos do primeiro byte após o start code)
const NAL_TYPE_IDR = 5 // I-frame / keyframe
const NAL_TYPE_SPS = 7

function findStartCodes(data: Uint8Array): number[] {
  const offsets: number[] = []
  for (let i = 0; i < data.length - 3; i++) {
    if (data[i] === 0 && data[i + 1] === 0) {
      if (data[i + 2] === 1) {
        offsets.push(i + 3)
      } else if (data[i + 2] === 0 && data[i + 3] === 1) {
        offsets.push(i + 4)
      }
    }
  }
  return offsets
}

// Agrupa NAL units em access units (um por frame de vídeo): SPS/PPS podem
// preceder um IDR como NALs separados — tudo isso vira uma única amostra,
// já que o VideoDecoder em modo Annex-B espera o access unit completo com
// start codes preservados.
function sliceAnnexB(rawBytes: Uint8Array): { bytes: Uint8Array; isKeyFrame: boolean }[] {
  const starts = findStartCodes(rawBytes)
  if (starts.length === 0) return []

  type NalUnit = { start: number; end: number; type: number }
  const nals: NalUnit[] = []
  for (let i = 0; i < starts.length; i++) {
    const nalDataStart = starts[i]
    const end = i + 1 < starts.length
      // Volta antes do próximo start code (3 ou 4 bytes) para não incluí-lo na NAL atual
      ? starts[i + 1] - (rawBytes[starts[i + 1] - 3] === 0 ? 3 : 4)
      : rawBytes.length
    const type = rawBytes[nalDataStart] & 0x1f
    nals.push({ start: starts[i] - (rawBytes[starts[i] - 3] === 0 ? 3 : 4), end, type })
  }

  // Agrupa NALs consecutivos até (e incluindo) o próximo NAL de slice de vídeo
  // (tipo 1 ou 5) em um access unit — SPS/PPS/SEI ficam anexados ao frame seguinte.
  const units: { bytes: Uint8Array; isKeyFrame: boolean }[] = []
  let groupStart = 0
  let groupHasIdr = false
  for (let i = 0; i < nals.length; i++) {
    const nal = nals[i]
    if (nal.type === NAL_TYPE_IDR) groupHasIdr = true
    const isSlice = nal.type === 1 || nal.type === NAL_TYPE_IDR
    const isLast = i === nals.length - 1
    if (isSlice || isLast) {
      const groupEnd = nal.end
      const bytes = rawBytes.subarray(nals[groupStart].start, groupEnd)
      // NAL de padding/filler entre start codes adjacentes pode produzir um
      // access unit de comprimento zero — o VideoDecoder rejeita esse chunk
      // com "Null or empty decoder buffer", então descartamos aqui.
      if (bytes.length > 0) {
        units.push({ bytes, isKeyFrame: groupHasIdr })
      }
      groupStart = i + 1
      groupHasIdr = false
    }
  }
  return units
}

// Lê os PTS reais de cada pacote de vídeo via ffprobe, na mesma ordem em que
// os pacotes aparecem no container — a mesma ordem em que o `-f h264` acima
// emite as unidades Annex-B. Timestamps sintéticos (i * frameDuration, frame
// rate constante) divergem em vídeos de frame rate variável (comum em
// gravações de celular), causando dessincronia A/V progressiva. Retorna null
// se o ffprobe falhar ou não achar pacotes — nesse caso o chamador cai de
// volta para timestamps sintéticos.
async function readRealPtsUs(ffmpeg: FFmpeg, inputName: string): Promise<number[] | null> {
  const csvName = `pts_${crypto.randomUUID()}.csv`
  try {
    const exitCode = await ffmpeg.ffprobe([
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'packet=pts_time',
      '-of', 'csv=p=0',
      inputName,
      '-o', csvName,
    ])
    if (exitCode !== 0) return null
    const data = await ffmpeg.readFile(csvName)
    const text = new TextDecoder().decode(data instanceof Uint8Array ? data : new Uint8Array(data as unknown as ArrayBuffer))
    const times = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l !== 'N/A')
      .map((l) => Math.round(parseFloat(l) * 1_000_000))
      .filter((us) => Number.isFinite(us))
    return times.length > 0 ? times : null
  } catch {
    return null
  } finally {
    await ffmpeg.deleteFile(csvName).catch(() => null)
  }
}

async function parseMp4Samples(
  ffmpeg: FFmpeg,
  inputName: string,
  frameRate: number,
  trimArgs: string[],
  speed: number,
): Promise<DemuxedVideo> {
  const rawName = `raw_${crypto.randomUUID()}.h264`
  let rawBytes: Uint8Array
  let realPts: number[] | null
  try {
    // Recodifica (não copia) o vídeo de origem sem B-frames (-bf 0). Câmeras
    // profissionais gravam GOPs com B-frames, cuja ordem de bytes no stream
    // (ordem de decodificação) diverge da ordem de apresentação — o
    // VideoDecoder por hardware rejeita esse padrão com "EncodingError:
    // Decoding error" mesmo com o profile do decoder correto. Forçar -bf 0
    // na extração garante um GOP estritamente linear (ordem de bytes =
    // ordem de apresentação), compatível com o fatiador Annex-B sequencial
    // abaixo. preset ultrafast + crf 18 mantêm essa passada rápida e com
    // perda visual mínima — ainda mais barata que decodificar todo o vídeo
    // por software, que é exatamente o que o pipeline WebCodecs evita.
    // trimArgs (-ss/-to) entram ANTES do -i: seek rápido no demuxer, sem
    // decodificar o trecho descartado — mesma técnica de buildFFmpegArgs.
    const exitCode = await ffmpeg.exec([
      ...trimArgs,
      '-i', inputName,
      '-an',
      '-vcodec', 'libx264',
      '-preset', 'ultrafast',
      '-bf', '0',
      '-crf', '18',
      '-f', 'h264',
      rawName,
    ])
    if (exitCode !== 0) throw new Error(`recodificação H.264 (sem B-frames) falhou (código ${exitCode})`)
    const data = await ffmpeg.readFile(rawName)
    rawBytes = data instanceof Uint8Array ? data : new Uint8Array(data as unknown as ArrayBuffer)
    // PTS reais via ffprobe do próprio stream recodificado (rawName), lido
    // aqui dentro — antes do cleanup abaixo apagar o arquivo — e não do
    // inputName original, já que a recodificação sem B-frames pode alterar
    // contagem/timing de frames em relação à origem; misturar PTS de um
    // stream com amostras de outro dessincronizaria o resultado.
    realPts = await readRealPtsUs(ffmpeg, rawName)
  } finally {
    await ffmpeg.deleteFile(rawName).catch(() => null)
  }

  const units = sliceAnnexB(rawBytes)
  if (units.length === 0) throw new Error('nenhuma NAL unit encontrada no stream H.264')
  if (!units.some((u) => u.isKeyFrame)) throw new Error('stream sem keyframe (IDR) — SPS/PPS pode estar ausente')

  const frameDuration = Math.round(1_000_000 / frameRate)
  const useRealPts = realPts !== null && realPts.length === units.length

  // Velocidade: divide timestamp/duration pelo fator de speed — equivalente a
  // setpts=PTS/speed no FFmpeg (speed>1 acelera, comprime os timestamps;
  // speed<1 desacelera, expande). Aplicado aqui para que o VideoEncoder
  // (que usa esses timestamps) já receba o vídeo na velocidade final.
  const speedFrameDuration = Math.round(frameDuration / speed)
  const samples: DemuxedSample[] = units.map((u, i) => ({
    data: u.bytes,
    timestamp: Math.round((useRealPts ? realPts![i] : i * frameDuration) / speed),
    duration: speedFrameDuration,
    isKeyFrame: u.isKeyFrame,
  }))

  const lastSample = samples[samples.length - 1]
  const realDurationSeconds = useRealPts
    ? (lastSample.timestamp + speedFrameDuration) / 1_000_000
    : samples.length / frameRate / speed

  return {
    frameRate,
    hasAudio: false, // detectado separadamente via probeFile antes de chamar parseMp4Samples
    durationSeconds: realDurationSeconds,
    samples,
  }
}

// ─── Pipeline principal ─────────────────────────────────────────────────────

export async function processWithWebCodecs(
  options: ProcessOptions,
  ffmpeg: FFmpeg,
  inputName: string,
  probe: { hasAudio: boolean; frameRate?: number; landscape: boolean; width?: number; height?: number },
): Promise<WebCodecsResult | WebCodecsUnsupported> {
  if (!isWebCodecsSupported()) {
    return { supported: false, reason: 'WebCodecs API indisponível neste navegador' }
  }

  const speed = options.speed || 1
  // Corte (trim): mesma técnica de buildFFmpegArgs — -ss/-to antes do -i
  // fazem o demuxer pular direto para o ponto de início.
  const hasTrim = options.trimEnd > options.trimStart
  const trimArgs = hasTrim
    ? ['-ss', options.trimStart.toFixed(3), '-to', options.trimEnd.toFixed(3)]
    : []

  let demuxed: DemuxedVideo
  try {
    demuxed = await parseMp4Samples(ffmpeg, inputName, probe.frameRate ?? DEFAULT_FRAME_RATE, trimArgs, speed)
    demuxed.hasAudio = probe.hasAudio
  } catch (e) {
    return { supported: false, reason: `Falha ao demuxar H.264: ${(e as Error).message}` }
  }

  const logoBitmaps = await loadLogoBitmaps(options.logos ?? [])
  const canvas = new OffscreenCanvas(OUTPUT_W, OUTPUT_H)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    logoBitmaps.forEach((b) => b.close())
    return { supported: false, reason: 'OffscreenCanvas 2D indisponível' }
  }

  const safeFrameRate = Math.round(Number(demuxed.frameRate)) || DEFAULT_FRAME_RATE

  // Extraído ANTES de montar o muxer: o sample rate/canais reais do áudio
  // (lidos do log do FFmpeg) precisam estar disponíveis para declarar a track
  // de áudio corretamente — declarar 48kHz/stereo fixo quando o stream copiado
  // é mono ou 44.1kHz faz o player reproduzir em pitch/velocidade errados.
  // Pulado quando muteAudio (equivalente a -an no buildFFmpegArgs).
  const extractedAudio = demuxed.hasAudio && !options.muteAudio
    ? await extractAudioAac(ffmpeg, inputName, trimArgs, speed)
    : null

  const muxerTarget = new ArrayBufferTarget()
  const muxer = new Muxer({
    target: muxerTarget,
    video: { codec: 'avc', width: OUTPUT_W, height: OUTPUT_H, frameRate: safeFrameRate },
    audio: extractedAudio
      ? { codec: 'aac', numberOfChannels: extractedAudio.numberOfChannels, sampleRate: extractedAudio.sampleRate }
      : undefined,
    fastStart: 'in-memory',
  })

  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error('[webcodecsProcessor] VideoEncoder error', e),
  })
  encoder.configure({
    codec: 'avc1.640028', // H.264 High Profile — estável para redes sociais
    width: OUTPUT_W,
    height: OUTPUT_H,
    bitrate: VIDEO_BITRATE,
    framerate: safeFrameRate,
  })

  // VideoDecoder.output() dispara na mesma ordem em que decode() foi chamado
  // (decodificação em ordem de apresentação, sem B-frames aqui — Annex-B com
  // GOPs simples) — a fila espelha 1:1 demuxed.samples para recuperar qual
  // amostra de origem gerou cada frame decodificado e propagar isKeyFrame real.
  const keyFrameQueue = demuxed.samples.map((s) => s.isKeyFrame)
  let keyFrameCursor = 0

  let decodeErrorMessage: string | null = null
  const decoder = new VideoDecoder({
    output: (frame) => {
      try {
        // Ajusta o frame decodificado (resolução original) para o formato
        // final 1080x1920 (rotação se paisagem + cover-fit + crop de
        // estabilização opcional), aplica overlays, e reencapsula como VideoFrame.
        drawSourceFrame(ctx, frame, options.stabilize, probe.landscape)
        drawOverlays(ctx, options.logos ?? [], logoBitmaps, options.textOverlay)

        const composed = new VideoFrame(canvas, {
          timestamp: frame.timestamp,
          duration: frame.duration ?? undefined,
        })
        // Preserva os keyframes reais do stream de origem (detectados no
        // parsing Annex-B) em vez de usar encodeQueueSize como proxy — isso
        // garantia só o 1º frame como key em vídeos longos, quebrando seek.
        const keyFrame = keyFrameQueue[keyFrameCursor] ?? false
        keyFrameCursor++
        encoder.encode(composed, { keyFrame })
        composed.close()
      } catch (e) {
        decodeErrorMessage = (e as Error).message
      } finally {
        frame.close()
      }
    },
    error: (e) => { decodeErrorMessage = e.message },
  })

  // Modo Annex-B: dispensa `description` (avcC) — o SPS/PPS emitidos pelo
  // `-f h264` do FFmpeg já vêm como NAL units dentro do próprio stream, e é
  // esse SPS real (não a codec string) que o decoder efetivamente usa para
  // decodificar. Mas a codec string ainda precisa ser COMPATÍVEL com o stream
  // real: 'avc1.42001f' declara Constrained Baseline Profile, que proíbe
  // B-frames por especificação. Câmeras profissionais tipicamente gravam em
  // High/Main profile com B-frames — o browser recusa o stream com
  // "EncodingError: Decoding error" porque o profile declarado não permite a
  // estrutura de referência que o SPS real contém. High Profile (0x64) é
  // superset de Baseline e decodifica ambos os casos.
  // `avc.format` ainda não está nos tipos DOM do TS instalado — configure()
  // tipado como any apenas aqui, a API do browser aceita o campo em runtime.
  // codedWidth/codedHeight aqui são só um hint inicial — o SPS real embutido
  // no stream Annex-B é o que efetivamente dita a resolução decodificada
  // (frame.displayWidth/displayHeight refletem o SPS, não este hint). Ainda
  // assim, usar a resolução real da origem (do probe) em vez do tamanho de
  // saída evita depender de coincidência entre os dois valores — relevante
  // sobretudo para vídeos em paisagem, cuja resolução nativa (ex: 1920x1080)
  // é bem diferente do canvas de saída retrato (1080x1920).
  decoder.configure({
    codec: 'avc1.640028',
    codedWidth: probe.width || OUTPUT_W,
    codedHeight: probe.height || OUTPUT_H,
    avc: { format: 'annexb' },
  } as VideoDecoderConfig)

  for (const sample of demuxed.samples) {
    decoder.decode(new EncodedVideoChunk({
      type: sample.isKeyFrame ? 'key' : 'delta',
      timestamp: sample.timestamp,
      duration: sample.duration,
      data: sample.data as BufferSource,
    }))
  }
  await decoder.flush()
  decoder.close()

  if (decodeErrorMessage) {
    encoder.close()
    logoBitmaps.forEach((b) => b.close())
    return { supported: false, reason: `Falha na decodificação: ${decodeErrorMessage}` }
  }

  await encoder.flush()
  encoder.close()
  logoBitmaps.forEach((b) => b.close())

  // Áudio: já extraído antes de montar o muxer (extractedAudio), com o
  // sample rate/canais reais lidos do log do FFmpeg — escrito direto no muxer
  // como stream cru, sem passar pelo AudioDecoder/Encoder, já que já está em
  // AAC e só precisa ser remultiplexado.
  if (extractedAudio) {
    muxer.addAudioChunkRaw(
      extractedAudio.data,
      'key',
      0,
      demuxed.durationSeconds * 1_000_000,
    )
  }

  muxer.finalize()
  return { supported: true, blob: new Blob([muxerTarget.buffer], { type: 'video/mp4' }) }
}
