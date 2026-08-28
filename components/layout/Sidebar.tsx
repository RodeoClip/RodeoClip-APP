'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Upload,
  SignOut,
  UserCircle,
  ChartBar,
  FilmSlate,
  Star,
  Gear,
} from '@phosphor-icons/react'

const NAV_ITEMS = [
  { icon: ChartBar, label: 'Painel', href: '/dashboard' },
  { icon: Upload, label: 'Conversor', href: '/conversor' },
  { icon: FilmSlate, label: 'Meus clipes', href: '/clips' },
  { icon: Star, label: 'Planos', href: '/#precos' },
  { icon: Gear, label: 'Configurações', href: '/configuracoes' },
]

interface SidebarProps {
  userName: string
  firstName: string
  email?: string
  avatarUrl?: string
  onSignOut: () => void
}

export function Sidebar({ userName, firstName, email, avatarUrl, onSignOut }: SidebarProps) {
  const pathname = usePathname()
  const [avatarFailed, setAvatarFailed] = useState(false)

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-[#2E1F0F] bg-[#1A1008] sticky top-0 h-[100dvh]">
      <div className="px-6 pt-7 pb-6 border-b border-[#2E1F0F]">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="RodeoClip" className="h-24 w-auto" />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.label} href={item.href} prefetch={false}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-[rgba(193,127,58,0.12)] text-[#C17F3A]'
                  : 'text-[#8C7560] hover:text-[#A89480] hover:bg-[rgba(255,255,255,0.03)]',
              ].join(' ')}>
              <item.icon size={16} weight="duotone" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-5 border-t border-[#2E1F0F] flex items-center gap-3">
        {avatarUrl && !avatarFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={userName} onError={() => setAvatarFailed(true)} className="w-8 h-8 rounded-full object-cover ring-2 ring-[#C17F3A]/30 shrink-0" />
        ) : (
          <UserCircle size={32} className="text-[#8C7560] shrink-0" weight="fill" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#F5ECD7] truncate">{firstName}</p>
          <p className="text-[10px] text-[#8C7560] truncate">{email}</p>
        </div>
        <button onClick={onSignOut} title="Sair"
          className="text-[#8C7560] hover:text-[#C17F3A] transition-colors active:scale-95">
          <SignOut size={16} />
        </button>
      </div>
    </aside>
  )
}
