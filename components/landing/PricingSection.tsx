'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { Check } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const PLANS = [
  {
    name: 'Pro',
    badge: 'Mais popular',
    desc: 'Para produtores e criadores sérios que publicam conteúdo com frequência e precisam de velocidade.',
    priceNum: 69.99,
    priceLabel: null,
    period: '/mês',
    features: [
      { text: 'Exportações ilimitadas', detail: 'Sem teto mensal — publique o quanto quiser' },
      { text: 'Vídeos por lote ilimitados', detail: 'Processe um evento inteiro de uma só vez' },
      { text: 'Estabilização de vídeo', detail: 'Remove tremidas de gravações em arena e montaria' },
      { text: 'Logo + texto sobreposto', detail: 'Adicione marca e título com posição e cor ajustáveis' },
      { text: 'Velocidade 0.1× a 100×', detail: 'De câmera lenta a timelapse com controle preciso' },
      { text: 'Controle de áudio', detail: 'Mantenha o áudio original ou silencie com um clique' },
      { text: 'Preview em tempo real', detail: 'Visualize o resultado 9:16 antes de processar' },
      { text: 'Suporte prioritário', detail: 'Fila exclusiva com resposta em até 4h úteis' },
    ],
    trial: '5 créditos grátis',
    cta: 'Começar grátis',
    href: '/cadastro?plano=pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    badge: null,
    desc: 'Para empresas, agências e grandes produtoras que precisam de volume, personalização e suporte dedicado.',
    priceNum: null,
    priceLabel: 'Sob consulta',
    period: '',
    features: [
      { text: 'Tudo do plano Pro', detail: 'Todos os 8 recursos sem limitações' },
      { text: 'API de integração', detail: 'Conecte o RodeoClip ao seu sistema ou workflow' },
      { text: 'Gerenciamento multi-usuário', detail: 'Equipe inteira com acesso e permissões' },
      { text: 'Marca branca (white-label)', detail: 'Entregue clipes com a marca do seu cliente' },
      { text: 'Gerente de conta dedicado', detail: 'Suporte direto com SLA personalizado' },
    ],
    trial: null,
    cta: 'Falar com vendas',
    href: 'mailto:contato.rodeoclip@gmail.com?subject=Plano%20Enterprise%20-%20RodeoClip',
    highlight: false,
  },
]

const ease = [0.16, 1, 0.3, 1] as const

function PricingCard({ plan, index }: { plan: typeof PLANS[0], index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const priceRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const card = cardRef.current
    const priceEl = priceRef.current
    if (!card || !priceEl) return

    const ctx = gsap.context(() => {

      // Counter animado no preço ao entrar na viewport
      if (plan.priceNum !== null) {
        const obj = { val: 0 }
        ScrollTrigger.create({
          trigger: card,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            gsap.to(obj, {
              val: plan.priceNum,
              duration: 1.2,
              ease: 'power2.out',
              onUpdate: () => {
                if (priceEl) priceEl.textContent = `R$ ${obj.val.toFixed(2).replace('.', ',')}`
              },
            })
          },
        })
      }

      // Hover magnético
      const onMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = (e.clientX - cx) / rect.width
        const dy = (e.clientY - cy) / rect.height
        gsap.to(card, {
          x: dx * 10,
          y: dy * 10,
          rotateX: -dy * 4,
          rotateY: dx * 4,
          duration: 0.4,
          ease: 'power2.out',
          transformPerspective: 800,
        })
      }

      const onLeave = () => {
        gsap.to(card, {
          x: 0, y: 0, rotateX: 0, rotateY: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.5)',
        })
      }

      card.addEventListener('mousemove', onMove)
      card.addEventListener('mouseleave', onLeave)

      return () => {
        card.removeEventListener('mousemove', onMove)
        card.removeEventListener('mouseleave', onLeave)
      }

    }, card)

    return () => ctx.revert()
  }, [plan.priceNum, plan.priceLabel])

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, rotateY: -15, y: 24 }}
      whileInView={{ opacity: 1, rotateY: 0, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, delay: index * 0.1, ease }}
      style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      className={[
        'rounded-xl p-6 flex flex-col gap-5 border cursor-default',
        plan.highlight
          ? 'bg-[#C17F3A] border-[#D4984F]'
          : 'bg-[#251A0E] border-[#2E1F0F]',
      ].join(' ')}>

      {/* Shimmer no card Pro */}
      {plan.highlight && (
        <div aria-hidden className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="shimmer-bar" />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={`text-xs font-bold uppercase tracking-widest ${plan.highlight ? 'text-[#1A1008]' : 'text-[#8C7560]'}`}>
            {plan.name}
          </p>
          {plan.badge && (
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#1A1008] text-[#C17F3A] tracking-wide">
              {plan.badge}
            </span>
          )}
        </div>
        <p className={`text-xs leading-relaxed mb-4 ${plan.highlight ? 'text-[rgba(26,16,8,0.7)]' : 'text-[#A89580]'}`}>
          {plan.desc}
        </p>
        <div className="flex items-baseline gap-1">
          {plan.priceNum !== null ? (
            <>
              <span
                ref={priceRef}
                className={`text-4xl font-bold tracking-tight tabular-nums ${plan.highlight ? 'text-[#1A1008]' : 'text-[#F5ECD7]'}`}>
                R$ 0
              </span>
              <span className={`text-sm ${plan.highlight ? 'text-[rgba(26,16,8,0.55)]' : 'text-[#5C3F1E]'}`}>
                {plan.period}
              </span>
            </>
          ) : (
            <span className={`text-3xl font-bold tracking-tight ${plan.highlight ? 'text-[#1A1008]' : 'text-[#F5ECD7]'}`}>
              {plan.priceLabel}
            </span>
          )}
        </div>
        {plan.trial && (
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${plan.highlight ? 'bg-[#1A1008] text-[#C17F3A]' : 'bg-[rgba(193,127,58,0.1)] text-[#C17F3A]'}`}>
            {plan.trial}
          </span>
        )}
      </div>

      <div className={`w-full h-px ${plan.highlight ? 'bg-[rgba(26,16,8,0.15)]' : 'bg-[#2E1F0F]'}`} />

      <ul className="flex flex-col gap-3">
        {plan.features.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5">
            <Check size={13} weight="bold" className={`mt-0.5 shrink-0 ${plan.highlight ? 'text-[#1A1008]' : 'text-[#C17F3A]'}`} />
            <div>
              <p className={`text-xs font-semibold leading-snug ${plan.highlight ? 'text-[#1A1008]' : 'text-[#F5ECD7]'}`}>{f.text}</p>
              <p className={`text-[11px] leading-snug mt-0.5 ${plan.highlight ? 'text-[rgba(26,16,8,0.55)]' : 'text-[#8C7560]'}`}>{f.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      {plan.href.startsWith('mailto:') ? (
        <a href={plan.href}
          className={[
            'mt-auto text-xs font-semibold px-4 py-2.5 rounded-md text-center transition-colors active:scale-[0.98]',
            plan.highlight
              ? 'bg-[#1A1008] text-[#C17F3A] hover:bg-[#251A0E]'
              : 'bg-[rgba(193,127,58,0.1)] text-[#C17F3A] border border-[rgba(193,127,58,0.2)] hover:bg-[rgba(193,127,58,0.18)]',
          ].join(' ')}>
          {plan.cta}
        </a>
      ) : (
        <Link href={plan.href}
          className={[
            'mt-auto text-xs font-semibold px-4 py-2.5 rounded-md text-center transition-colors active:scale-[0.98]',
            plan.highlight
              ? 'bg-[#1A1008] text-[#C17F3A] hover:bg-[#251A0E]'
              : 'bg-[rgba(193,127,58,0.1)] text-[#C17F3A] border border-[rgba(193,127,58,0.2)] hover:bg-[rgba(193,127,58,0.18)]',
          ].join(' ')}>
          {plan.cta}
        </Link>
      )}
    </motion.div>
  )
}

export function PricingSection() {
  return (
    <section id="precos" className="py-24 px-6 border-t border-[#2E1F0F]">
      <style>{`
        .shimmer-bar {
          position: absolute;
          top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%);
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%   { left: -100% }
          60%  { left: 160% }
          100% { left: 160% }
        }
      `}</style>

      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col items-center text-center gap-4">
          <span className="eyebrow-pill">Planos e preços</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#F5ECD7]">
            Quanto custa produzir conteúdo<br className="hidden md:block" /> de rodeio de verdade?
          </h2>
          <p className="text-[#A89580] text-sm max-w-lg leading-relaxed">
            Escolha o plano certo para o seu volume de produção. Comece sem cartão de crédito e faça upgrade quando precisar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full" style={{ perspective: '1000px' }}>
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.name} plan={plan} index={i} />
          ))}
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <p className="text-center text-xs text-[#A89580]">✓ 5 créditos grátis &nbsp;·&nbsp; ✓ Sem cartão de crédito &nbsp;·&nbsp; ✓ Cancele quando quiser &nbsp;·&nbsp; ✓ Dados protegidos</p>
          <p className="text-center text-[11px] text-[#8C7560]">Dúvidas? Fale com a gente em <a href="mailto:contato.rodeoclip@gmail.com" className="text-[#C17F3A] hover:underline">contato.rodeoclip@gmail.com</a></p>
        </div>
      </div>
    </section>
  )
}
