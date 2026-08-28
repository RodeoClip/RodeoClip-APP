import Link from 'next/link'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#1A1008] text-[#F5ECD7]">
      {/* Banner hero */}
      <div className="relative w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/banner-termos.png" alt="Termos de Serviço — RodeoClip" className="w-full h-auto block" />
        <Link href="/" className="absolute top-4 right-6 text-xs text-[#A89580] hover:text-[#C17F3A] transition-colors bg-[#1A1008]/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
          ← Voltar ao início
        </Link>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-sm text-[#8C7560] mb-12">Última atualização: 29 de junho de 2026</p>

        <div className="flex flex-col gap-10 text-sm text-[#A89580] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">1. Aceitação dos termos</h2>
            <p>Ao acessar ou utilizar o RodeoClip, você concorda com estes Termos de Serviço. Se não concordar, não utilize a plataforma. O uso continuado após alterações constitui aceitação dos termos atualizados.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">2. Descrição do serviço</h2>
            <p>O RodeoClip é uma plataforma SaaS de conversão de vídeos para formato vertical (9:16), voltada para criadores de conteúdo e produtoras do segmento de rodeio. O serviço inclui upload em lote (até 10 vídeos), ajuste de velocidade (0.1× a 100×), estabilização de vídeo, inserção de logotipo personalizado, texto sobreposto com posição e cor ajustáveis, controle de áudio, preview em tempo real e download em .zip dos clipes processados em Full HD 1080×1920.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">3. Planos e pagamento</h2>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li><strong className="text-[#F5ECD7]">Plano Pro (R$ 69,99/mês):</strong> exportações ilimitadas, até 10 vídeos por lote, estabilização de vídeo, logo e texto sobreposto, velocidade 0.1× a 100×, controle de áudio, preview em tempo real e suporte prioritário.</li>
              <li><strong className="text-[#F5ECD7]">Créditos gratuitos:</strong> ao criar uma conta, o usuário recebe <strong className="text-[#F5ECD7]">5 créditos grátis</strong> para testar o app. Cada crédito permite converter 1 vídeo com todos os 8 recursos disponíveis.</li>
              <li><strong className="text-[#F5ECD7]">Plano Enterprise (sob consulta):</strong> valor personalizado conforme volume de vídeos, número de usuários e funcionalidades necessárias (API, marca branca, multi-usuário, gerente dedicado).</li>
            </ul>
            <p className="mt-3">Os 5 créditos gratuitos são concedidos uma única vez por conta e não expiram. Após o uso dos créditos, o usuário pode assinar o plano Pro para conversões ilimitadas. Os valores podem ser atualizados mediante aviso prévio de 30 dias por e-mail.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">4. Cancelamento e reembolso</h2>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>Você pode <strong className="text-[#F5ECD7]">cancelar sua assinatura a qualquer momento</strong>, sem multa, taxa de cancelamento ou fidelidade.</li>
              <li>Após o cancelamento, o acesso ao plano permanece ativo até o <strong className="text-[#F5ECD7]">final do período já pago</strong>.</li>
              <li>Não há reembolso proporcional para o período restante após o cancelamento.</li>
              <li>Para cancelar, acesse as configurações da sua conta ou entre em contato pelo e-mail <a href="mailto:contato.rodeoclip@gmail.com" className="text-[#C17F3A] hover:underline">contato.rodeoclip@gmail.com</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">5. Uso aceitável</h2>
            <p>Ao utilizar o RodeoClip, você se compromete a:</p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1.5">
              <li>Fazer upload apenas de conteúdo sobre o qual possui direitos autorais ou autorização de uso.</li>
              <li>Não utilizar o serviço para processar conteúdo ilegal, ofensivo ou que viole direitos de terceiros.</li>
              <li>Não tentar acessar sistemas, dados ou funcionalidades sem autorização.</li>
              <li>Não revender ou redistribuir o serviço sem autorização prévia.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">6. Propriedade do conteúdo</h2>
            <p><strong className="text-[#F5ECD7]">Você mantém todos os direitos sobre seus vídeos e conteúdos.</strong> O RodeoClip não reivindica propriedade sobre os arquivos que você envia ou processa. Concedemos apenas uma licença limitada para processar seus vídeos conforme solicitado por você.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">7. Disponibilidade do serviço</h2>
            <p>Nos esforçamos para manter o RodeoClip disponível 24/7, mas não garantimos disponibilidade ininterrupta. Manutenções programadas serão comunicadas com antecedência. Não nos responsabilizamos por indisponibilidades causadas por fatores fora do nosso controle.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">8. Limitação de responsabilidade</h2>
            <p>O RodeoClip é fornecido &ldquo;como está&rdquo;. Não nos responsabilizamos por danos indiretos, perdas de dados ou lucros cessantes decorrentes do uso ou impossibilidade de uso do serviço. Nossa responsabilidade total é limitada ao valor pago nos últimos 12 meses.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">9. Suspensão e encerramento</h2>
            <p>Reservamo-nos o direito de suspender ou encerrar contas que violem estes Termos, com notificação prévia quando possível. Em caso de encerramento por violação, não haverá reembolso.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">10. Alterações nos termos</h2>
            <p>Podemos atualizar estes Termos periodicamente. Alterações significativas serão notificadas por e-mail com pelo menos 15 dias de antecedência. O uso continuado após a data de vigência constitui aceitação.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">11. Legislação aplicável</h2>
            <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca do domicílio do usuário para dirimir quaisquer controvérsias, conforme o Código de Defesa do Consumidor.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">12. Contato</h2>
            <p>Para dúvidas sobre estes Termos de Serviço:</p>
            <p className="mt-2"><strong className="text-[#F5ECD7]">RodeoClip</strong><br />E-mail: <a href="mailto:contato.rodeoclip@gmail.com" className="text-[#C17F3A] hover:underline">contato.rodeoclip@gmail.com</a></p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#2E1F0F] px-6 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <p className="text-xs text-[#8C7560]">&copy; {new Date().getFullYear()} RodeoClip. Todos os direitos reservados.</p>
          <Link href="/privacidade" className="text-xs text-[#8C7560] hover:text-[#C17F3A] transition-colors">Política de Privacidade</Link>
        </div>
      </footer>
    </div>
  )
}
