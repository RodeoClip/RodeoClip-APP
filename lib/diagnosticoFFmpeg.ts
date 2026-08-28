'use client'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

export async function executarDiagnosticoFFmpeg(): Promise<void> {
  console.clear()
  console.log('🎬 [Diagnóstico] Iniciando FFmpeg WASM v0.12...')

  const ffmpeg = new FFmpeg()
  const logs: string[] = []

  ffmpeg.on('log', ({ message }) => {
    console.log('🎬 [FFmpeg Core]:', message)
    logs.push(message)
  })

  try {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.9/dist/umd'

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })

    console.log('✅ FFmpeg carregado com sucesso em produção!')
    console.log('─'.repeat(60))

    await ffmpeg.exec(['-filters'])

    // Aguarda logs drenarem
    await new Promise(r => setTimeout(r, 500))

    const allText = logs.join('\n')
    const hasVidstabDetect    = allText.includes('vidstabdetect')
    const hasVidstabTransform = allText.includes('vidstabtransform')

    console.log('─'.repeat(60))
    console.log('🔍 [Diagnóstico] Resultado da varredura:')
    console.log(`  vidstabdetect   : ${hasVidstabDetect    ? '✅ ATIVO' : '❌ NÃO ENCONTRADO'}`)
    console.log(`  vidstabtransform: ${hasVidstabTransform ? '✅ ATIVO' : '❌ NÃO ENCONTRADO'}`)

    if (!hasVidstabDetect && !hasVidstabTransform) {
      console.warn('⚠️  vidstab NÃO está compilado nesta build. O filtro "deshake" é o disponível.')
    }
  } catch (error) {
    console.error('❌ Falha catastrófica ao carregar o FFmpeg no ar:', error)
  } finally {
    ffmpeg.terminate()
  }
}
