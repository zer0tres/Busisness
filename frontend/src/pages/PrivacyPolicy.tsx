export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Política de Privacidade</h1>
        <p className="text-gray-500 text-sm mb-8">Última atualização: março de 2026</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">1. Quem somos</h2>
          <p className="text-gray-600">A Sahjo é uma plataforma SaaS de gestão para pequenos negócios, acessível em <strong>www.sahjo.com.br</strong>. Nosso sistema permite que estabelecimentos gerenciem clientes, agendamentos, estoque e finanças, e que clientes finais agendem serviços online.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">2. Dados que coletamos</h2>
          <p className="text-gray-600 mb-2">Coletamos os seguintes dados:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li><strong>Lojistas:</strong> nome, e-mail, telefone, nome do estabelecimento, tipo de negócio e dados de acesso.</li>
            <li><strong>Clientes finais:</strong> nome, e-mail e telefone, fornecidos voluntariamente ao agendar um serviço.</li>
            <li><strong>Google OAuth:</strong> nome e e-mail da conta Google, utilizados exclusivamente para autenticação.</li>
            <li><strong>Dados de pagamento:</strong> processados pelo Mercado Pago. Não armazenamos dados de cartão.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">3. Como usamos os dados</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Criar e gerenciar contas de lojistas e clientes</li>
            <li>Enviar notificações de agendamento por e-mail</li>
            <li>Processar pagamentos de assinatura</li>
            <li>Melhorar a plataforma</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">4. Compartilhamento de dados</h2>
          <p className="text-gray-600">Não vendemos nem compartilhamos seus dados com terceiros, exceto:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
            <li><strong>Mercado Pago</strong> — para processar pagamentos</li>
            <li><strong>Resend</strong> — para envio de e-mails transacionais</li>
            <li><strong>Google</strong> — para autenticação OAuth e Google Calendar (mediante autorização explícita)</li>
            <li><strong>Railway</strong> — infraestrutura de hospedagem</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">5. Segurança</h2>
          <p className="text-gray-600">Utilizamos criptografia bcrypt para senhas, HTTPS em todas as comunicações, tokens JWT com expiração e banco de dados PostgreSQL com acesso restrito.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">6. Seus direitos</h2>
          <p className="text-gray-600">Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento entrando em contato pelo e-mail <strong>contato@sahjo.com.br</strong>.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">7. Retenção de dados</h2>
          <p className="text-gray-600">Os dados são mantidos enquanto a conta estiver ativa. Após cancelamento, os dados são removidos em até 90 dias.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">8. Contato</h2>
          <p className="text-gray-600">Dúvidas sobre esta política: <strong>contato@sahjo.com.br</strong></p>
        </section>
      </div>
    </div>
  );
}
