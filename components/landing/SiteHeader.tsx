'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { List, X } from '@phosphor-icons/react'

const NAV = [
  { label: 'Recursos', href: '#recursos' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Preços', href: '#precos' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed top-0 inset-x-0 z-50 border-b border-[#2E1F0F] bg-[#1A1008]/90 backdrop-blur-md transition-shadow duration-300 ${scrolled ? 'shadow-[0_4px_32px_rgba(0,0,0,0.5)]' : ''}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="RodeoClip" className="h-24 w-auto" />
        </Link>

        {/* Desktop nav - centro */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className="text-sm text-[#8C7560] hover:text-[#F5ECD7] transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTAs direita */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#8C7560] hover:text-[#F5ECD7] transition-colors">
            Entrar
          </Link>
          <Link href="/cadastro" className="btn-primary !py-2 !px-5 !text-xs">
            Começar grátis
          </Link>
        </div>

        <button className="md:hidden text-[#8C7560]" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={20} /> : <List size={20} />}
        </button>
      </div>

      {open && (
        <div className="absolute top-16 inset-x-0 bg-[#1A1008] border-b border-[#2E1F0F] flex flex-col px-6 py-5 gap-4 md:hidden">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className="text-sm text-[#8C7560] hover:text-[#F5ECD7]">{item.label}</Link>
          ))}
          <Link href="/cadastro" onClick={() => setOpen(false)}
            className="text-sm px-4 py-2 rounded-md bg-[#C17F3A] text-[#1A1008] font-semibold text-center">
            Começar grátis
          </Link>
        </div>
      )}
    </header>
  )
}
