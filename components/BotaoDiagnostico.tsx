'use client'

import { executarDiagnosticoFFmpeg } from '@/lib/diagnosticoFFmpeg'

export function BotaoDiagnostico() {
  return (
    <button
      type="button"
      onClick={executarDiagnosticoFFmpeg}
      className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold shadow-lg"
    >
      🎬 Diagnóstico FFmpeg
    </button>
  )
}
