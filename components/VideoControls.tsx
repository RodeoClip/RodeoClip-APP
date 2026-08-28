'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Play, Pause, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'

interface VideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  compact?: boolean
}

export function VideoControls({ videoRef, compact = false }: VideoControlsProps) {
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => setCurrentTime(video.currentTime)
    const onLoaded = () => setDuration(video.duration)
    const onMute = () => setMuted(video.muted)

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('loadedmetadata', onLoaded)
    video.addEventListener('volumechange', onMute)

    if (video.duration) setDuration(video.duration)
    setMuted(video.muted)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('volumechange', onMute)
    }
  }, [videoRef])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play()
    else video.pause()
  }, [videoRef])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
  }, [videoRef])

  const seek = useCallback((e: React.MouseEvent) => {
    const video = videoRef.current
    const bar = progressRef.current
    if (!video || !bar) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    video.currentTime = pct * video.duration
  }, [videoRef])

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={[
      'flex items-center gap-2 w-full',
      compact ? 'px-2 py-1.5' : 'px-3 py-2',
    ].join(' ')}
      style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}
    >
      <button onClick={togglePlay} className="text-white/90 hover:text-white active:scale-90 transition-all shrink-0">
        {playing ? <Pause size={compact ? 14 : 18} weight="fill" /> : <Play size={compact ? 14 : 18} weight="fill" />}
      </button>

      <span className={[
        'font-mono text-white/70 shrink-0',
        compact ? 'text-[9px]' : 'text-[11px]',
      ].join(' ')}>
        {formatTime(currentTime)}
      </span>

      <div
        ref={progressRef}
        onClick={seek}
        className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer relative group"
      >
        <div
          className="h-full bg-[#C17F3A] rounded-full transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 5px)` }}
        />
      </div>

      <span className={[
        'font-mono text-white/70 shrink-0',
        compact ? 'text-[9px]' : 'text-[11px]',
      ].join(' ')}>
        {formatTime(duration)}
      </span>

      <button onClick={toggleMute} className="text-white/70 hover:text-white active:scale-90 transition-all shrink-0">
        {muted ? <SpeakerSlash size={compact ? 12 : 16} weight="fill" /> : <SpeakerHigh size={compact ? 12 : 16} weight="fill" />}
      </button>
    </div>
  )
}
