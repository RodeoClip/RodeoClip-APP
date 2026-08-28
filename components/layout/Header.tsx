import Link from 'next/link'

export function Header() {
  return (
    <header className="w-full border-b px-6 py-4">
      <nav className="flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">RodeoClip</Link>
        <div className="flex gap-4">
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </nav>
    </header>
  )
}
