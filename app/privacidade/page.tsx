import Link from 'next/link'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#1A1008] text-[#F5ECD7]">
      {/* Banner hero */}
      <div className="relative w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/banner-privacidade.png" alt="Política de Privacidade — RodeoClip" className="w-full h-auto block" />
        <Link href="/" className="absolute top-4 right-6 text-xs text-[#A89580] hover:text-[#C17F3A] transition-colors bg-[#1A1008]/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
          ← Voltar ao início
        </Link>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-sm text-[#8C7560] mb-12">Última atualização: 29 de junho de 2026</p>

        <div className="flex flex-col gap-10 text-sm text-[#A89580] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">1. Informações que coletamos</h2>
            <p>Ao utilizar o RodeoClip, coletamos as seguintes informações:</p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1.5">
              <li><strong className="text-[#F5ECD7]">Dados de conta:</strong> nome, endereço de e-mail e foto de perfil (quando fornecida via login Google).</li>
              <li><strong className="text-[#F5ECD7]">Dados de uso:</strong> informações sobre como você interage com a plataforma, como número de vídeos processados, recursos utilizados (estabilização, logo, texto, velocidade, áudio) e histórico de conversões.</li>
              <li><strong className="text-[#F5ECD7]">Dados técnicos:</strong> endereço IP, tipo de navegador, sistema operacional e dados de cookies essenciais.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">2. Vídeos e arquivos</h2>
            <p>Seus vídeos são processados exclusivamente para as operações solicitadas (conversão 9:16, estabilização, ajuste de velocidade, inserção de logo, texto sobreposto e controle de áudio). <strong className="text-[#F5ECD7]">Não armazenamos, compartilhamos ou utilizamos seus vídeos para qualquer outra finalidade.</strong> Logotipos e configurações de texto são utilizados apenas durante o processamento. Os arquivos processados ficam disponíveis para download por tempo limitado e são automaticamente excluídos após o período de expiração.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">3. Como usamos suas informações</h2>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>Fornecer, manter e melhorar os serviços do RodeoClip.</li>
              <li>Processar pagamentos e gerenciar sua assinatura.</li>
              <li>Enviar comunicações relacionadas ao serviço (confirmações, atualizações de segurança).</li>
              <li>Oferecer suporte técnico.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">4. Compartilhamento de dados</h2>
            <p><strong className="text-[#F5ECD7]">Nunca vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros</strong> para fins de marketing. Podemos compartilhar dados apenas com:</p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1.5">
              <li>Provedores de serviço essenciais (hospedagem, processamento de pagamento) sob acordos de confidencialidade.</li>
              <li>Autoridades legais, quando exigido por lei.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">5. Segurança dos dados</h2>
            <p>Utilizamos criptografia, controles de acesso e práticas de segurança para proteger suas informações. Seus dados são armazenados em servidores seguros com backups regulares.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">6. Seus direitos</h2>
            <p>Em conformidade com a LGPD (Lei Geral de Proteção de Dados), você tem direito a:</p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1.5">
              <li>Acessar seus dados pessoais.</li>
              <li>Corrigir dados incompletos ou desatualizados.</li>
              <li>Solicitar a exclusão dos seus dados.</li>
              <li>Revogar o consentimento a qualquer momento.</li>
              <li>Solicitar a portabilidade dos seus dados.</li>
            </ul>
            <p className="mt-3">Para exercer seus direitos, entre em contato: <a href="mailto:contato.rodeoclip@gmail.com" className="text-[#C17F3A] hover:underline">contato.rodeoclip@gmail.com</a></p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">7. Cookies</h2>
            <p>Utilizamos apenas cookies essenciais para o funcionamento da plataforma (autenticação e preferências de sessão). Não utilizamos cookies de rastreamento ou publicidade.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">8. Alterações nesta política</h2>
            <p>Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre mudanças significativas por e-mail ou aviso na plataforma.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F5ECD7] mb-3">9. Contato</h2>
            <p>Para dúvidas sobre esta política ou sobre seus dados pessoais:</p>
            <p className="mt-2"><strong className="text-[#F5ECD7]">RodeoClip</strong><br />E-mail: <a href="mailto:contato.rodeoclip@gmail.com" className="text-[#C17F3A] hover:underline">contato.rodeoclip@gmail.com</a></p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#2E1F0F] px-6 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <p className="text-xs text-[#8C7560]">&copy; {new Date().getFullYear()} RodeoClip. Todos os direitos reservados.</p>
          <Link href="/termos" className="text-xs text-[#8C7560] hover:text-[#C17F3A] transition-colors">Termos de Serviço</Link>
        </div>
      </footer>
    </div>
  )
}
