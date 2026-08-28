import type { Metadata } from 'next'
import './globals.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'

export const metadata: Metadata = {
  title: 'RodeoClip - Converta vídeos para o formato vertical',
  description: 'Transforme seus vídeos de rodeio em conteúdo vertical 9:16 com logo, velocidade e qualidade profissional. Pronto para redes sociais.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
