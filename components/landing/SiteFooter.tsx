// Footer — como Writora: logo | links | copyright
export function SiteFooter() {
  return (
    <footer className="border-t border-[#2E1F0F] px-6 py-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="RodeoClip" className="h-20 w-auto" />
        </div>
        <p className="text-xs text-[#8C7560] order-last md:order-none">
          &copy; {new Date().getFullYear()} RodeoClip. Todos os direitos reservados.
        </p>
        <div className="flex items-center gap-6">
          <a href="/privacidade" className="text-xs text-[#8C7560] hover:text-[#C17F3A] transition-colors">Privacidade</a>
          <a href="/termos" className="text-xs text-[#8C7560] hover:text-[#C17F3A] transition-colors">Termos</a>
        </div>
      </div>
    </footer>
  )
}
