'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  CreditCard,
  XCircle,
  ArrowCounterClockwise,
  CheckCircle,
  Clock,
  Warning,
  Lightning,
} from '@phosphor-icons/react'

type Subscription = {
  plan: string
  status: string
  price_brl: number
  started_at: string | null
  expires_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  refund_status: string | null
  refund_reason: string | null
  refund_requested_at: string | null
  refund_resolved_at: string | null
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Ativo', color: 'text-emerald-400', icon: <CheckCircle size={14} weight="fill" /> },
  cancelled: { label: 'Cancelado', color: 'text-red-400', icon: <XCircle size={14} weight="fill" /> },
  expired: { label: 'Expirado', color: 'text-[#8C7560]', icon: <Clock size={14} weight="fill" /> },
  refunded: { label: 'Reembolsado', color: 'text-amber-400', icon: <ArrowCounterClockwise size={14} weight="fill" /> },
}

const REFUND_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'text-amber-400' },
  approved: { label: 'Aprovado', color: 'text-emerald-400' },
  denied: { label: 'Negado', color: 'text-red-400' },
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function SubscriptionCard({ token }: { token?: string }) {
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const fetchSub = useCallback(async (accessToken?: string) => {
    try {
      let t = accessToken
      if (!t) {
        let { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          const { data: { session: refreshed } } = await supabase.auth.refreshSession()
          session = refreshed
        }
        if (!session) return
        t = session.access_token
      }

      const res = await fetch('/api/subscription', {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (res.ok) {
        setSub(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSub(token) }, [fetchSub, token])

  async function handleCheckout() {
    setCheckoutLoading(true)
    let { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      const { data: { session: refreshed } } = await supabase.auth.refreshSession()
      session = refreshed
    }
    if (!session) { setCheckoutLoading(false); return }

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setFeedback({ type: 'error', msg: data.error ?? 'Erro ao iniciar checkout.' })
      setCheckoutLoading(false)
    }
  }

  async function handleAction(action: 'cancel' | 'refund') {
    setActionLoading(true)
    setFeedback(null)
    let { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      const { data: { session: refreshed } } = await supabase.auth.refreshSession()
      session = refreshed
    }
    if (!session) return

    const res = await fetch('/api/subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, reason: reason.trim() || undefined }),
    })

    const data = await res.json()
    setActionLoading(false)

    if (!res.ok) {
      setFeedback({ type: 'error', msg: data.error })
      return
    }

    setSub(data)
    setShowCancelModal(false)
    setShowRefundModal(false)
    setReason('')
    setFeedback({
      type: 'success',
      msg: action === 'cancel'
        ? 'Assinatura cancelada com sucesso.'
        : 'Solicitação de reembolso enviada.',
    })
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-[#2E1F0F] bg-[#1A1008] p-5 animate-pulse">
        <div className="h-4 w-32 bg-[#2E1F0F] rounded mb-4" />
        <div className="h-3 w-48 bg-[#2E1F0F] rounded" />
      </div>
    )
  }

  if (!sub) return null

  const statusCfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.active
  const isFree = sub.plan === 'free'
  const canCancel = !isFree && sub.status === 'active' && !sub.cancelled_at
  const canRefund = !isFree && sub.status !== 'refunded' && sub.refund_status !== 'pending' && sub.refund_status !== 'approved'

  return (
    <>
      <div className="rounded-xl border border-[#2E1F0F] bg-[#1A1008] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#2E1F0F] flex items-center gap-2">
          <CreditCard size={15} className="text-[#C17F3A]" weight="duotone" />
          <h3 className="text-xs font-semibold text-[#F5ECD7] tracking-wide">Minha assinatura</h3>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Plano + status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-[#F5ECD7]">{PLAN_LABELS[sub.plan] ?? sub.plan}</p>
              {!isFree && <p className="text-xs text-[#5C3F1E] mt-0.5">R$ {Number(sub.price_brl).toFixed(2).replace('.', ',')}/mês</p>}
            </div>
            <span className={`flex items-center gap-1.5 text-xs font-semibold ${statusCfg.color}`}>
              {statusCfg.icon}
              {statusCfg.label}
            </span>
          </div>

          {/* Datas */}
          {!isFree && (
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <p className="text-[#5C3F1E]">Início</p>
                <p className="text-[#A89580] font-medium">{formatDate(sub.started_at)}</p>
              </div>
              <div>
                <p className="text-[#5C3F1E]">Validade</p>
                <p className="text-[#A89580] font-medium">{formatDate(sub.expires_at)}</p>
              </div>
              {sub.cancelled_at && (
                <div>
                  <p className="text-[#5C3F1E]">Cancelado em</p>
                  <p className="text-red-400 font-medium">{formatDate(sub.cancelled_at)}</p>
                </div>
              )}
              {sub.cancel_reason && (
                <div className="col-span-2">
                  <p className="text-[#5C3F1E]">Motivo do cancelamento</p>
                  <p className="text-[#A89580]">{sub.cancel_reason}</p>
                </div>
              )}
            </div>
          )}

          {/* Reembolso status */}
          {sub.refund_status && (
            <div className="rounded-lg bg-[rgba(193,127,58,0.06)] border border-[rgba(193,127,58,0.12)] px-4 py-3">
              <div className="flex items-center gap-2 text-xs">
                <ArrowCounterClockwise size={13} className="text-[#C17F3A]" />
                <span className="text-[#A89580]">Reembolso:</span>
                <span className={`font-semibold ${REFUND_STATUS_CONFIG[sub.refund_status]?.color ?? 'text-[#A89580]'}`}>
                  {REFUND_STATUS_CONFIG[sub.refund_status]?.label ?? sub.refund_status}
                </span>
              </div>
              {sub.refund_reason && (
                <p className="text-[10px] text-[#5C3F1E] mt-1.5">{sub.refund_reason}</p>
              )}
              {sub.refund_requested_at && (
                <p className="text-[10px] text-[#3D2A14] mt-1">Solicitado em {formatDate(sub.refund_requested_at)}</p>
              )}
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
              feedback.type === 'success'
                ? 'bg-emerald-400/10 text-emerald-400'
                : 'bg-red-400/10 text-red-400'
            }`}>
              {feedback.type === 'success' ? <CheckCircle size={14} /> : <Warning size={14} />}
              {feedback.msg}
            </div>
          )}

          {/* Ações */}
          {(canCancel || canRefund) && (
            <div className="flex items-center gap-2 pt-1">
              {canCancel && (
                <button
                  onClick={() => { setShowCancelModal(true); setFeedback(null) }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-400/20 text-red-400 hover:bg-red-400/10 text-xs font-medium transition-colors">
                  <XCircle size={13} />
                  Cancelar assinatura
                </button>
              )}
              {canRefund && (
                <button
                  onClick={() => { setShowRefundModal(true); setFeedback(null) }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(193,127,58,0.2)] text-[#C17F3A] hover:bg-[rgba(193,127,58,0.08)] text-xs font-medium transition-colors">
                  <ArrowCounterClockwise size={13} />
                  Solicitar reembolso
                </button>
              )}
            </div>
          )}

          {/* Plano free — upsell */}
          {isFree && (
            <div className="flex flex-col gap-3">
              <p className="text-[11px] text-[#5C3F1E] leading-relaxed">
                Você está no plano gratuito. Após usar os 5 créditos, assine o plano Pro para continuar convertendo.
              </p>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#C17F3A] hover:bg-[#D4984F] text-[#1A1008] text-xs font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                style={{ boxShadow: '0 4px 16px rgba(193,127,58,0.35)' }}
              >
                <Lightning size={13} weight="fill" />
                {checkoutLoading ? 'Redirecionando...' : 'Assinar Pro — R$ 69,90/mês'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl border border-[#2E1F0F] bg-[#1A1008] p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <XCircle size={20} className="text-red-400" weight="fill" />
              <h4 className="text-sm font-bold text-[#F5ECD7]">Cancelar assinatura</h4>
            </div>
            <p className="text-xs text-[#A89580] leading-relaxed">
              Ao cancelar, você ainda terá acesso até o final do período pago. Após isso, sua conta voltará ao plano gratuito. Essa ação não pode ser desfeita.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo do cancelamento (opcional)"
              rows={3}
              className="w-full rounded-lg border border-[#2E1F0F] bg-[#120B04] text-[#F5ECD7] text-xs px-3 py-2.5 placeholder:text-[#3D2A14] focus:outline-none focus:border-[#C17F3A]/40 resize-none"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => { setShowCancelModal(false); setReason('') }}
                className="px-4 py-2 rounded-lg text-xs text-[#8C7560] hover:text-[#F5ECD7] transition-colors">
                Voltar
              </button>
              <button
                onClick={() => handleAction('cancel')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors disabled:opacity-50">
                {actionLoading ? 'Cancelando...' : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal reembolso */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl border border-[#2E1F0F] bg-[#1A1008] p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <ArrowCounterClockwise size={20} className="text-[#C17F3A]" weight="fill" />
              <h4 className="text-sm font-bold text-[#F5ECD7]">Solicitar reembolso</h4>
            </div>
            <p className="text-xs text-[#A89580] leading-relaxed">
              Sua solicitação será analisada pela equipe RodeoClip. O prazo de resposta é de até 5 dias úteis. Se aprovado, o valor será estornado na mesma forma de pagamento.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Por que você deseja o reembolso?"
              rows={3}
              className="w-full rounded-lg border border-[#2E1F0F] bg-[#120B04] text-[#F5ECD7] text-xs px-3 py-2.5 placeholder:text-[#3D2A14] focus:outline-none focus:border-[#C17F3A]/40 resize-none"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => { setShowRefundModal(false); setReason('') }}
                className="px-4 py-2 rounded-lg text-xs text-[#8C7560] hover:text-[#F5ECD7] transition-colors">
                Voltar
              </button>
              <button
                onClick={() => handleAction('refund')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C17F3A] hover:bg-[#D4984F] text-[#1A1008] text-xs font-bold transition-colors disabled:opacity-50">
                {actionLoading ? 'Enviando...' : 'Enviar solicitação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
