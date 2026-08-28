'use client'

import { motion } from 'motion/react'

// Estrutura Writora: eyebrow "Our Customers" | H2 | grid 3x3 de cards com avatar, nome, @handle, depoimento
const TESTIMONIALS = [
  { name: 'Rafael Mendes',   handle: '@rafaelmendes',   body: 'Antes levava uma tarde inteira pra editar os clipes do evento. Agora faço tudo em 20 minutos.',        avatar: 'https://picsum.photos/seed/rafael-rodeio/40/40' },
  { name: 'Camila Souza',    handle: '@camilasouza',    body: 'O preview antes de exportar salvou muito tempo. Consigo ver exatamente onde o logo vai ficar.',          avatar: 'https://picsum.photos/seed/camila-country/40/40' },
  { name: 'Diego Alves',     handle: '@diegoalves',     body: 'Uso no evento ao vivo. Subo os clipes, configuro uma vez e o sistema cuida do resto.',                   avatar: 'https://picsum.photos/seed/diego-arena/40/40' },
  { name: 'Fernanda Costa',  handle: '@fernandacosta',  body: 'A velocidade 2x ficou perfeita para os highlights de montaria. Engajamento disparou no Instagram.',      avatar: 'https://picsum.photos/seed/fernanda-social/40/40' },
  { name: 'Lucas Barbosa',   handle: '@lucasbarbosa',   body: 'Aplicativo fantástico. Oferece tudo que preciso para gerenciar meu conteúdo de rodeio com eficiência.',  avatar: 'https://picsum.photos/seed/lucas-bbq/40/40' },
  { name: 'Mariana Lima',    handle: '@marianalima',    body: 'A plataforma nos poupou tempo e melhorou a qualidade do conteúdo. Recomendo muito.',                     avatar: 'https://picsum.photos/seed/mariana-lima/40/40' },
  { name: 'Bruno Carvalho',  handle: '@brunocarvalho',  body: 'Uso diariamente há meses. A agilidade de exportar vários vídeos de uma vez é incomparável.',            avatar: 'https://picsum.photos/seed/bruno-carvalho/40/40' },
  { name: 'Ana Ribeiro',     handle: '@anaribeiro',     body: 'Ótimo app com muito potencial. Já me poupou bastante tempo. Aguardando as próximas atualizações.',       avatar: 'https://picsum.photos/seed/ana-ribeiro/40/40' },
  { name: 'Gustavo Pereira', handle: '@gustavopereira', body: 'Adoro este app. É intuitivo e rico em recursos. Melhorou muito como gerencio e crio conteúdo.',          avatar: 'https://picsum.photos/seed/gustavo-pereira/40/40' },
]

const ease = [0.16, 1, 0.3, 1] as const

export function TestimonialsSection() {
  return (
    <section className="py-24 px-6 border-t border-[#2E1F0F]">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">

        {/* Header centralizado — como Writora */}
        <div className="flex flex-col items-center text-center gap-4">
          <span className="eyebrow-pill">Nossos clientes</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#F5ECD7]">
            O que nossos usuários estão dizendo
          </h2>
          <p className="text-[#8C7560] text-sm max-w-md leading-relaxed">
            Veja o que alguns dos nossos usuários têm a dizer sobre o RodeoClip.
          </p>
        </div>

        {/* Grid 3x3 — como Writora */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.handle}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: i * 0.05, ease }}
              className="wp-card flex flex-col gap-3 p-5">
              {/* Avatar + nome + handle — como Writora no topo */}
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} width={36} height={36}
                  className="rounded-full object-cover grayscale opacity-70" />
                <div>
                  <p className="text-sm font-semibold text-[#F5ECD7] leading-tight">{t.name}</p>
                  <p className="text-xs text-[#5C3F1E]">{t.handle}</p>
                </div>
              </div>
              <p className="text-xs text-[#8C7560] leading-relaxed">{t.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
