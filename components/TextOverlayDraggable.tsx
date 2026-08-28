'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useConversionStore } from '@/store/useConversionStore'

const OUTPUT_W = 1080
const OUTPUT_H = 1920

interface TextOverlayDraggableProps {
  containerRef: React.RefObject<HTMLDivElement | null>
}

function getContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  if (!ref.current) return { w: 320, h: 568 }
  const rect = ref.current.getBoundingClientRect()
  return { w: rect.width, h: rect.height }
}

export function TextOverlayDraggable({ containerRef }: TextOverlayDraggableProps) {
  const { textOverlay, setTextPosition, setTextOverlay } = useConversionStore()

  const [dragging, setDragging] = useState(false)
  const [containerSize, setContainerSize] = useState({ w: 320, h: 568 })
  const dragStart = useRef({ x: 0, y: 0, textX: 0, textY: 0 })
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => setContainerSize(getContainerSize(containerRef))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [containerRef])

  const scaleX = containerSize.w / OUTPUT_W
  const scaleY = containerSize.h / OUTPUT_H

  const onDragStart = useCallback((clientX: number, clientY: number) => {
    if (!textOverlay) return
    setDragging(true)
    dragStart.current = {
      x: clientX, y: clientY,
      textX: textOverlay.x, textY: textOverlay.y,
    }
  }, [textOverlay])

  useEffect(() => {
    if (!dragging) return

    const onMove = (clientX: number, clientY: number) => {
      const size = getContainerSize(containerRef)
      const sx = size.w / OUTPUT_W
      const sy = size.h / OUTPUT_H
      const dx = (clientX - dragStart.current.x) / sx
      const dy = (clientY - dragStart.current.y) / sy
      const newX = Math.round(Math.max(0, Math.min(OUTPUT_W - 100, dragStart.current.textX + dx)))
      const newY = Math.round(Math.max(0, Math.min(OUTPUT_H - 50, dragStart.current.textY + dy)))
      setTextPosition(newX, newY)
    }

    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
    }
    const handleEnd = () => setDragging(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleEnd)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [dragging, setTextPosition, containerRef])

  if (!textOverlay || !textOverlay.text) return null

  const displayX = textOverlay.x * scaleX
  const displayY = textOverlay.y * scaleY
  const displayFontSize = textOverlay.fontSize * scaleX

  return (
    <div
      ref={textRef}
      onMouseDown={(e) => { e.preventDefault(); onDragStart(e.clientX, e.clientY) }}
      onTouchStart={(e) => {
        if (e.touches.length === 1) onDragStart(e.touches[0].clientX, e.touches[0].clientY)
      }}
      className={[
        'group absolute z-20 touch-none select-none px-2 py-1 rounded',
        dragging ? 'cursor-grabbing border border-[#C17F3A]' : 'cursor-grab border border-transparent hover:border-white/30',
      ].join(' ')}
      style={{
        left: displayX,
        top: displayY,
        fontSize: displayFontSize,
        color: textOverlay.color,
        fontWeight: 'bold',
        textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.5)',
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      {textOverlay.text}
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); setTextOverlay(null) }}
        title="Remover texto"
        className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-[#1A1008] border border-[#5C3F1E] text-[#F5ECD7] flex items-center justify-center text-[11px] leading-none opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:border-red-500 active:scale-90"
        style={{ fontSize: 11 }}
      >
        ×
      </button>
    </div>
  )
}
