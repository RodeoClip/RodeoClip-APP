'use client'

import { useState } from 'react'
import { useConversionStore, type QueueItem } from '@/store/useConversionStore'
import {
  FolderOpen,
  Play,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  X,
  ArrowClockwise,
} from '@phosphor-icons/react'

type FileStatus = QueueItem['status']

const STATUS_ICON: Record<FileStatus, React.ReactNode> = {
  pending:    <span className="w-1.5 h-1.5 rounded-full bg-[#8C7560]" />,
  processing: <CircleNotch size={13} className="text-[#C17F3A] animate-spin" weight="bold" />,
  done:       <CheckCircle size={13} className="text-emerald-500" weight="fill" />,
  error:      <WarningCircle size={13} className="text-red-400" weight="fill" />,
}

export function UploadZone() {
  const {
    sourceLabel, destDir, setSourceFiles, setDestDir,
    queue, clearQueue,
    isProcessing,
    totalFiles, processedFiles, currentFileName,
    runQueue,
  } = useConversionStore()

  const [finished, setFinished] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  async function pickSourceFiles() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handles = await (window as any).showOpenFilePicker({
        multiple: true,
        types: [{
          description: 'Vídeos',
          accept: { 'video/*': ['.mp4', '.mov', '.mxf', '.mts', '.avi'] },
        }],
      })
      await setSourceFiles(handles)
      clearQueue()
      setFinished(false)
    } catch { /* usuário cancelou */ }
  }

  async function pickDestDir() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' })
      setDestDir(handle)
    } catch { /* usuário cancelou */ }
  }

  async function handleStart() {
    setFinished(false)
    setStartError(null)
    try {
      await runQueue()
      setFinished(true)
    } catch (err) {
      console.error('[UploadZone] runQueue error:', err)
      setStartError(err instanceof Error ? err.message : 'Erro ao iniciar processamento.')
    }
  }

  function handleClear() {
    clearQueue()
    setSourceFiles([])
    setDestDir(null)
    setFinished(false)
  }

  const percent = totalFiles > 0 ? Math.min(100, Math.round((processedFiles / totalFiles) * 100)) : 0
  const currentFileIndex = Math.floor(processedFiles) + 1
  const doneCount  = queue.filter(i => i.status === 'done').length
  const errorCount = queue.filter(i => i.status === 'error').length

  return (
    <div className="flex flex-col gap-4 w-full">

      {/* ── Seleção de pastas ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={pickSourceFiles}
          disabled={isProcessing}
          data-tour="source-dir"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[#2E1F0F] bg-[#1A1008] hover:border-[#5C3F1E]/80 hover:bg-[#1E1309] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-left"
        >
          <FolderOpen size={20} className="text-[#C17F3A] shrink-0" weight="duotone" />
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-[#8C7560] font-medium uppercase tracking-wider">Vídeos de origem</span>
            <span className="text-sm text-[#F5ECD7] truncate font-medium mt-0.5">
              {sourceLabel || 'Selecionar vídeos…'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={pickDestDir}
          disabled={isProcessing}
          data-tour="dest-dir"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[#2E1F0F] bg-[#1A1008] hover:border-[#5C3F1E]/80 hover:bg-[#1E1309] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-left"
        >
          <FolderOpen size={20} className="text-[#C17F3A] shrink-0" weight="duotone" />
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-[#8C7560] font-medium uppercase tracking-wider">Pasta de destino</span>
            <span className="text-sm text-[#F5ECD7] truncate font-medium mt-0.5">
              {destDir ? destDir.name : 'Selecionar pasta…'}
            </span>
          </div>
        </button>
      </div>

      {/* ── Progresso ─────────────────────────────────────────────────────── */}
      {isProcessing && (
        <div className="rounded-xl border border-[#2E1F0F] bg-[#1A1008] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleNotch size={15} className="text-[#C17F3A] animate-spin" weight="bold" />
              <span className="text-sm font-semibold text-[#F5ECD7]">
                {`Processando vídeo ${currentFileIndex} de ${totalFiles}`}
              </span>
            </div>
            <span className="text-xs font-mono text-[#C17F3A]">{percent}%</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-[#2E1F0F] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#C17F3A] transition-all duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>

          {currentFileName && (
            <p className="text-[11px] text-[#8C7560] truncate font-mono">{currentFileName}</p>
          )}
        </div>
      )}

      {/* ── Resumo pós-processamento ───────────────────────────────────────── */}
      {finished && (
        <div className="rounded-xl border border-[#2E1F0F] bg-[#1A1008] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle size={13} weight="fill" />
              {doneCount} concluído{doneCount !== 1 ? 's' : ''}
            </span>
            {errorCount > 0 && (
              <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                <WarningCircle size={13} weight="fill" />
                {errorCount} erro{errorCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-[11px] text-[#8C7560] hover:text-[#F5ECD7] transition-colors flex items-center gap-1 active:scale-95"
            >
              <ArrowClockwise size={12} weight="bold" /> Atualizar página
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-[#8C7560] hover:text-[#F5ECD7] transition-colors flex items-center gap-1 active:scale-95"
            >
              <X size={12} weight="bold" /> Limpar
            </button>
          </div>
        </div>
      )}

      {/* ── Lista da fila ─────────────────────────────────────────────────── */}
      {queue.length > 0 && (
        <div className="rounded-xl border border-[#2E1F0F] bg-[#1A1008] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2E1F0F]">
            <h3 className="text-xs font-semibold text-[#F5ECD7]">
              {queue.length} vídeo{queue.length !== 1 ? 's' : ''} na fila
            </h3>
          </div>
          <ul className="divide-y divide-[#2E1F0F]/60 max-h-64 overflow-y-auto">
            {queue.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="shrink-0">{STATUS_ICON[item.status]}</span>
                <span className={[
                  'flex-1 text-sm truncate',
                  item.status === 'done'  ? 'text-[#8C7560]' :
                  item.status === 'error' ? 'text-red-400'   :
                  'text-[#F5ECD7]',
                ].join(' ')}>
                  {item.name}
                </span>
                {item.errorMessage && (
                  <span className="text-[10px] text-red-400 shrink-0 max-w-[120px] truncate" title={item.errorMessage}>
                    {item.errorMessage}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Erro ao iniciar ───────────────────────────────────────────────── */}
      {startError && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 flex items-center gap-2 text-red-400 text-xs">
          <WarningCircle size={14} weight="fill" className="shrink-0" />
          {startError}
        </div>
      )}

      {/* ── Botão iniciar ─────────────────────────────────────────────────── */}
      {sourceLabel && destDir && !isProcessing && !finished && (
        <button
          type="button"
          onClick={handleStart}
          data-tour="start-btn"
          className="w-full py-4 rounded-2xl bg-[#C17F3A] hover:bg-[#D4984F] text-[#1A1008] font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2.5 active:scale-[0.97]"
          style={{ boxShadow: '0 8px 32px rgba(193,127,58,0.35)' }}
        >
          <Play size={16} weight="fill" />
          Iniciar processamento
        </button>
      )}

    </div>
  )
}
