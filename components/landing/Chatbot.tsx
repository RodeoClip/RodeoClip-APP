'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChatCircleDots, X, PaperPlaneTilt } from '@phosphor-icons/react'

interface Message {
  id: number
  role: 'bot' | 'user'
  text: string
}

const KNOWLEDGE_BASE = [
  {
    keywords: ['preço', 'preco', 'valor', 'custa', 'custo', 'plano', 'mensalidade', 'assinatura', 'pagar', 'pagamento'],
    answer: 'O plano **Pro** custa **R$ 69,99/mês** e inclui **5 créditos mensais**. Cada crédito converte 1 vídeo com todos os recursos: estabilização, logo, texto sobreposto, controle de áudio e velocidade de 0.1× a 100×. Para grandes produtoras, temos o plano **Enterprise** sob consulta.',
  },
  {
    keywords: ['grátis', 'gratis', 'gratuito', 'free', 'teste', 'trial', 'experimentar'],
    answer: 'Sim! Ao criar sua conta, você recebe **5 créditos grátis** para testar o app. Cada crédito converte 1 vídeo com todas as funcionalidades (estabilização, logo, texto, áudio, velocidade). Não precisa de cartão de crédito! Após usar os créditos, assine o plano Pro por R$ 69,99/mês e ganhe 5 créditos mensais.',
  },
  {
    keywords: ['como funciona', 'como usa', 'como faz', 'funcionamento', 'usar', 'utilizar'],
    answer: 'É simples: **1)** Faça upload dos seus vídeos de rodeio, **2)** Personalize tudo — velocidade, estabilização, logo, texto e áudio, **3)** Visualize o preview 9:16 e **4)** Baixe o .zip pronto para Instagram, TikTok e YouTube Shorts!',
  },
  {
    keywords: ['formato', 'vertical', '9:16', 'resolução', 'resolucao', 'qualidade', 'dimensão'],
    answer: 'O RodeoClip converte seus vídeos para o formato **vertical 9:16**, ideal para Instagram Reels, TikTok e YouTube Shorts. Mantemos a qualidade original do vídeo!',
  },
  {
    keywords: ['logo', 'logotipo', 'marca', 'logomarca', 'marca dagua', 'watermark'],
    answer: 'Sim! Você pode adicionar sua **logo personalizada** nos vídeos. No plano Pro, troque a marca conforme cada cliente ou evento — são logotipos ilimitados!',
  },
  {
    keywords: ['velocidade', 'rapido', 'rápido', 'lento', 'speed', 'tempo', 'demora', 'processamento', 'camera lenta', 'timelapse'],
    answer: 'Você pode ajustar a velocidade de **0.1× (câmera lenta)** até **100× (timelapse)**! Controle preciso para criar highlights que prendem a atenção nos primeiros segundos.',
  },
  {
    keywords: ['estabilizar', 'estabilização', 'estabilizacao', 'tremido', 'tremida', 'treme', 'vidstab', 'shakiness'],
    answer: 'Sim! O RodeoClip possui **estabilização automática de vídeo** com tecnologia vidstab. Remove tremidas de gravações em arena, montaria e eventos. Basta ativar com um clique antes de processar!',
  },
  {
    keywords: ['texto', 'title', 'título', 'titulo', 'legenda', 'nome', 'peão', 'patrocinador', 'drawtext'],
    answer: 'Você pode adicionar **texto sobreposto** nos seus vídeos! Configure o texto, cor, tamanho e posição. Ideal para nome do peão, patrocinador ou título do evento.',
  },
  {
    keywords: ['áudio', 'audio', 'som', 'mutar', 'mudo', 'silenciar', 'mute', 'trilha'],
    answer: 'O RodeoClip oferece **controle total de áudio**! Mantenha o áudio original ou silencie com um clique. Perfeito para adicionar sua própria trilha depois.',
  },
  {
    keywords: ['pasta', 'lote', 'batch', 'vários', 'varios', 'múltiplos', 'multiplos', 'quantidade', 'volume'],
    answer: 'No plano Pro, você pode processar até **10 vídeos por lote** — perfeito para eventos inteiros! No Enterprise, o volume é ilimitado.',
  },
  {
    keywords: ['instagram', 'reels', 'tiktok', 'youtube', 'shorts', 'rede social', 'redes sociais'],
    answer: 'Os vídeos são exportados no formato ideal para **Instagram Reels**, **TikTok** e **YouTube Shorts** (9:16 vertical). Basta baixar o .zip e publicar!',
  },
  {
    keywords: ['suporte', 'ajuda', 'contato', 'email', 'falar', 'dúvida', 'duvida', 'problema'],
    answer: 'Nosso suporte está disponível pelo e-mail **contato.rodeoclip@gmail.com**. No plano Pro, você tem suporte prioritário com resposta em até 4h úteis!',
  },
  {
    keywords: ['cancelar', 'cancelamento', 'desistir', 'parar', 'reembolso', 'devolver', 'dinheiro de volta', 'estorno'],
    answer: 'Você pode **cancelar sua assinatura a qualquer momento**, diretamente no painel da sua conta. Não há multa, fidelidade ou taxa de cancelamento. Após o cancelamento, você continua com acesso até o fim do período já pago. Para solicitar, acesse seu perfil ou fale conosco: **contato.rodeoclip@gmail.com**',
  },
  {
    keywords: ['sob consulta', 'consulta', 'orçamento', 'orcamento', 'cotação', 'cotacao', 'quanto custa enterprise', 'valor enterprise'],
    answer: 'O plano **Enterprise** tem valor **sob consulta** porque é personalizado para cada empresa. O preço varia conforme o volume de vídeos, número de usuários e funcionalidades necessárias (API, marca branca, etc). Para receber uma proposta, entre em contato: **contato.rodeoclip@gmail.com**',
  },
  {
    keywords: ['seguro', 'segurança', 'seguranca', 'privacidade', 'dados', 'proteção', 'protecao'],
    answer: 'Levamos segurança a sério! Seus dados são protegidos e seus vídeos são processados de forma segura. Nunca compartilhamos suas informações.',
  },
  {
    keywords: ['api', 'integração', 'integracao', 'integrar', 'sistema', 'webhook'],
    answer: 'A **API de integração** está disponível no plano Enterprise! Conecte o RodeoClip ao seu sistema ou workflow. Entre em contato: contato.rodeoclip@gmail.com',
  },
  {
    keywords: ['white label', 'white-label', 'marca branca', 'personalizar', 'personalização'],
    answer: 'O recurso de **marca branca (white-label)** está disponível no plano Enterprise! Entregue clipes com a marca do seu cliente. Fale conosco: contato.rodeoclip@gmail.com',
  },
  {
    keywords: ['enterprise', 'empresa', 'agência', 'agencia', 'produtora', 'equipe', 'time', 'multi'],
    answer: 'O plano **Enterprise** é ideal para empresas e grandes produtoras! Inclui volume ilimitado, API, marca branca, multi-usuário e gerente dedicado. Valor sob consulta — entre em contato: contato.rodeoclip@gmail.com',
  },
  {
    keywords: ['cadastro', 'cadastrar', 'registrar', 'registro', 'criar conta', 'conta', 'login', 'entrar'],
    answer: 'Para começar, acesse **rodeoclip.com.br/cadastro** e crie sua conta! Você ganha **5 créditos grátis** para converter seus primeiros vídeos. Pode entrar com Google ou criar com e-mail e senha.',
  },
  {
    keywords: ['rodeio', 'country', 'cowboy', 'peão', 'peao', 'touro', 'festa', 'montaria'],
    answer: 'O RodeoClip foi feito especialmente para o universo do **rodeio**! Transforme seus vídeos de montarias, festas e eventos em clipes verticais prontos para viralizar nas redes sociais. 🤠',
  },
  {
    keywords: ['download', 'baixar', 'exportar', 'zip', 'arquivo'],
    answer: 'Após o processamento, seus vídeos são empacotados em um **.zip** prático para download. Basta baixar e publicar nas redes sociais!',
  },
  {
    keywords: ['preview', 'pré-visualização', 'visualizar', 'assistir', 'ver antes'],
    answer: 'Sim! Você pode assistir um **preview** do vídeo antes de exportar. No plano Pro, as prévias são ilimitadas — revise quantas vezes quiser!',
  },
]

const QUICK_QUESTIONS = [
  'Como funciona?',
  'Qual o preço?',
  'Créditos grátis?',
  'Tem estabilização?',
  'Posso adicionar texto?',
  'Como cancelar?',
]

const GREETING: Message = {
  id: 0,
  role: 'bot',
  text: 'Olá! 👋 Sou o assistente do **RodeoClip**. Como posso ajudar você hoje?',
}

function findAnswer(input: string): string {
  const normalized = input.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

  let bestMatch = { score: 0, answer: '' }

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0
    for (const kw of entry.keywords) {
      const kwNorm = kw.normalize('NFD').replace(/[̀-ͯ]/g, '')
      if (normalized.includes(kwNorm)) {
        score += kwNorm.length
      }
    }
    if (score > bestMatch.score) {
      bestMatch = { score, answer: entry.answer }
    }
  }

  if (bestMatch.score > 0) return bestMatch.answer

  return 'Não entendi completamente sua pergunta, mas estou aqui para ajudar! Tente perguntar sobre **preços**, **como funciona**, **formatos** ou **suporte**. Ou fale diretamente conosco: **contato.rodeoclip@gmail.com** 😊'
}

function formatText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const idRef = useRef(1)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  function sendMessage(text: string) {
    if (!text.trim()) return

    const userMsg: Message = { id: idRef.current++, role: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    const delay = 400 + Math.random() * 800
    setTimeout(() => {
      const answer = findAnswer(text)
      const botMsg: Message = { id: idRef.current++, role: 'bot', text: answer }
      setMessages(prev => [...prev, botMsg])
      setIsTyping(false)
    }, delay)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      {/* Botão flutuante */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#C17F3A] text-[#1A1008] flex items-center justify-center shadow-lg shadow-[#C17F3A]/25 hover:bg-[#D4984F] active:scale-95 transition-colors"
            aria-label="Abrir chat"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="RodeoClip" className="w-10 h-10 object-contain rounded-full bg-[#1A1008] p-0.5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Janela do chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] h-[520px] max-h-[calc(100dvh-48px)] flex flex-col rounded-2xl overflow-hidden border border-[#2E1F0F] shadow-2xl shadow-black/40"
            style={{ background: '#1A1008' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#251A0E] border-b border-[#2E1F0F]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1A1008] border border-[#2E1F0F] flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="RodeoClip" className="w-7 h-7 object-contain" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#F5ECD7]">RodeoClip</p>
                  <p className="text-[10px] text-[#5C3F1E]">Assistente virtual</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5C3F1E] hover:text-[#F5ECD7] hover:bg-[#2E1F0F] transition-colors"
                aria-label="Fechar chat"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Mensagens */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 scrollbar-thin">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-[#1A1008] border border-[#2E1F0F] flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo.png" alt="" className="w-5 h-5 object-contain" />
                    </div>
                  )}
                  <div
                    className={[
                      'max-w-[80%] px-3.5 py-2.5 text-[13px] leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-[#C17F3A] text-[#1A1008] rounded-2xl rounded-br-md'
                        : 'bg-[#251A0E] text-[#F5ECD7]/90 rounded-2xl rounded-bl-md border border-[#2E1F0F]',
                    ].join(' ')}
                  >
                    {formatText(msg.text)}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#251A0E] border border-[#2E1F0F] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5C3F1E] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5C3F1E] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5C3F1E] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}

              {/* Quick questions (aparece sempre que o bot não está digitando) */}
              {!isTyping && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-[#2E1F0F] text-[#C17F3A] hover:bg-[#251A0E] hover:border-[#C17F3A]/30 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-[#2E1F0F] bg-[#251A0E]">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua pergunta..."
                  className="flex-1 bg-[#1A1008] border border-[#2E1F0F] rounded-xl px-3.5 py-2.5 text-[13px] text-[#F5ECD7] placeholder:text-[#5C3F1E] outline-none focus:border-[#C17F3A]/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-[#C17F3A] text-[#1A1008] flex items-center justify-center hover:bg-[#D4984F] disabled:opacity-30 disabled:hover:bg-[#C17F3A] active:scale-95 transition-all shrink-0"
                  aria-label="Enviar"
                >
                  <PaperPlaneTilt size={18} weight="fill" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
