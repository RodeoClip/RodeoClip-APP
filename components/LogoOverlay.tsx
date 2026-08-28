'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useConversionStore } from '@/store/useConversionStore'

const OUTPUT_W = 1080
const OUTPUT_H = 1920
const LOGO_BASE = 150
const MIN_SIZE = 24

interface LogoOverlayProps {
  logoId: string
  containerRef: React.RefObject<HTMLDivElement | null>
}

function getContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  if (!ref.current) return { w: 270, h: 480 }
  const rect = ref.current.getBoundingClientRect()
  return { w: rect.width, h: rect.height }
}

export function LogoOverlay({ logoId, containerRef }: LogoOverlayProps) {
  const { logos, updateLogo, removeLogo } = useConversionStore()
  const logo = logos.find((l) => l.id === logoId)
  const logoX = logo?.x ?? 0
  const logoY = logo?.y ?? 0
  const logoScale = logo?.scale ?? 1

  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const [selected, setSelected] = useState(false)
  const [containerSize, setContainerSize] = useState({ w: 270, h: 480 })
  const dragStart = useRef({ x: 0, y: 0, logoX: 0, logoY: 0 })
  const resizeStart = useRef({ x: 0, y: 0, scale: 1 })
  const pinchStart = useRef({ dist: 0, scale: 1 })
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => setContainerSize(getContainerSize(containerRef))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [containerRef])

  useEffect(() => {
    setContainerSize(getContainerSize(containerRef))
  }, [containerRef.current])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (logoRef.current && !logoRef.current.contains(e.target as Node)) {
        setSelected(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const scaleX = containerSize.w / OUTPUT_W
  const scaleY = containerSize.h / OUTPUT_H

  const displayW = LOGO_BASE * logoScale * scaleX
  const displayH = LOGO_BASE * logoScale * scaleY
  const displayX = logoX * scaleX
  const displayY = logoY * scaleY

  // --- DRAG ---
  const onDragStart = useCallback((clientX: number, clientY: number) => {
    setDragging(true)
    setSelected(true)
    dragStart.current = { x: clientX, y: clientY, logoX, logoY }
  }, [logoX, logoY])

  useEffect(() => {
    if (!dragging) return

    const onMove = (clientX: number, clientY: number) => {
      const size = getContainerSize(containerRef)
      const sx = size.w / OUTPUT_W
      const sy = size.h / OUTPUT_H
      const dx = (clientX - dragStart.current.x) / sx
      const dy = (clientY - dragStart.current.y) / sy
      const newX = Math.round(Math.max(0, Math.min(OUTPUT_W - LOGO_BASE * logoScale, dragStart.current.logoX + dx)))
      const newY = Math.round(Math.max(0, Math.min(OUTPUT_H - LOGO_BASE * logoScale, dragStart.current.logoY + dy)))
      updateLogo(logoId, { x: newX, y: newY })
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
  }, [dragging, logoScale, logoId, updateLogo, containerRef])

  // --- RESIZE ---
  const onResizeStart = useCallback((clientX: number, clientY: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    setResizing(true)
    setSelected(true)
    resizeStart.current = { x: clientX, y: clientY, scale: logoScale }
  }, [logoScale])

  useEffect(() => {
    if (!resizing) return

    const onMove = (clientX: number, clientY: number) => {
      const dx = clientX - resizeStart.current.x
      const dy = clientY - resizeStart.current.y
      const delta = (dx + dy) / 2
      const size = getContainerSize(containerRef)
      const scaleFactor = 270 / size.w
      const scaleDelta = (delta * scaleFactor) / 50
      const newScale = Math.max(0.2, Math.min(5, resizeStart.current.scale + scaleDelta))
      updateLogo(logoId, { scale: Number(newScale.toFixed(2)) })
    }

    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
    }
    const handleEnd = () => setResizing(false)

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
  }, [resizing, logoId, updateLogo, containerRef])

  // --- PINCH ZOOM ---
  const onPinchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 2) return
    e.preventDefault()
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    pinchStart.current = { dist: Math.hypot(dx, dy), scale: logoScale }
  }, [logoScale])

  useEffect(() => {
    const el = logoRef.current
    if (!el) return

    const handlePinch = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const ratio = dist / pinchStart.current.dist
      const newScale = Math.max(0.2, Math.min(5, pinchStart.current.scale * ratio))
      updateLogo(logoId, { scale: Number(newScale.toFixed(2)) })
    }

    el.addEventListener('touchmove', handlePinch, { passive: false })
    return () => el.removeEventListener('touchmove', handlePinch)
  }, [logoId, updateLogo])

  // --- SCROLL ZOOM ---
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newScale = Math.max(0.2, Math.min(5, logoScale + delta))
    updateLogo(logoId, { scale: Number(newScale.toFixed(2)) })
  }, [logoScale, logoId, updateLogo])

  if (!logo) return null

  return (
    <div
      ref={logoRef}
      onMouseDown={(e) => { e.preventDefault(); onDragStart(e.clientX, e.clientY) }}
      onTouchStart={(e) => {
        if (e.touches.length === 2) { onPinchStart(e); return }
        if (e.touches.length === 1) onDragStart(e.touches[0].clientX, e.touches[0].clientY)
      }}
      onWheel={onWheel}
      className={[
        'absolute z-20 touch-none',
        dragging || resizing ? 'cursor-grabbing' : 'cursor-grab',
      ].join(' ')}
      style={{
        left: displayX,
        top: displayY,
        width: Math.max(MIN_SIZE, displayW),
        height: Math.max(MIN_SIZE, displayH),
      }}
    >
      {/* Selection border */}
      <div className={[
        'absolute inset-0 rounded transition-all duration-150',
        selected || dragging || resizing
          ? 'border-2 border-[#C17F3A] shadow-[0_0_0_1px_rgba(193,127,58,0.3)]'
          : 'border border-transparent hover:border-white/30',
      ].join(' ')} />

      {/* Logo image */}
      <div className="w-full h-full p-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.previewUrl}
          alt=""
          className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
          draggable={false}
        />
      </div>

      {/* Corner resize handles + remove button */}
      {(selected || dragging || resizing) && (
        <>
          <div
            onMouseDown={(e) => onResizeStart(e.clientX, e.clientY, e)}
            onTouchStart={(e) => {
              if (e.touches.length === 1) onResizeStart(e.touches[0].clientX, e.touches[0].clientY, e)
            }}
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#C17F3A] rounded-full cursor-nwse-resize border-2 border-[#1A1008] shadow-md"
          />
          <div
            onMouseDown={(e) => onResizeStart(e.clientX, e.clientY, e)}
            onTouchStart={(e) => {
              if (e.touches.length === 1) onResizeStart(e.touches[0].clientX, e.touches[0].clientY, e)
            }}
            className="absolute -top-2 -left-2 w-4 h-4 bg-[#C17F3A] rounded-full cursor-nwse-resize border-2 border-[#1A1008] shadow-md"
          />
          <button
            onMouseDown={(e) => { e.stopPropagation(); removeLogo(logoId) }}
            className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-[#1A1008] shadow-md flex items-center justify-center text-white text-[8px] font-bold leading-none"
            title="Remover"
          >
            ×
          </button>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#1A1008]/90 border border-[#2E1F0F] rounded px-1.5 py-0.5 pointer-events-none">
            <span className="text-[9px] font-mono text-[#C17F3A]">{logo.scale.toFixed(1)}x</span>
          </div>
        </>
      )}
    </div>
  )
}
