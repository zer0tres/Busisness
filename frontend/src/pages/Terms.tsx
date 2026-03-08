export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Termos de Uso</h1>
        <p className="text-gray-500 text-sm mb-8">Última atualização: março de 2026</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">1. Aceitação dos termos</h2>
          <p className="text-gray-600">Ao criar uma conta na plataforma Sahjo, você concorda com estes Termos de Uso. Se não concordar, não utilize o serviço.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">2. Descrição do serviço</h2>
          <p className="text-gray-600">A Sahjo oferece uma plataforma de gestão para pequenos negócios, incluindo controle de clientes, agendamentos, estoque, finanças e página pública de agendamento.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">3. Período de teste e assinatura</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Novos cadastros têm <strong>30 dias gratuitos</strong> com acesso completo.</li>
            <li>Após o período de teste, é necessário assinar o <strong>Plano Premium por R$ 49,90/mês</strong> para continuar usando.</li>
            <li>O pagamento é processado via Mercado Pago.</li>
            <li>A assinatura pode ser cancelada a qualquer momento.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">4. Responsabilidades do usuário</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Manter a confidencialidade da sua senha</li>
            <li>Não usar a plataforma para fins ilegais</li>
            <li>Fornecer informações verdadeiras no cadastro</li>
            <li>Não tentar acessar dados de outros lojistas</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">5. Disponibilidade</h2>
          <p className="text-gray-600">Nos esforçamos para manter a plataforma disponível 24/7, mas não garantimos disponibilidade ininterrupta. Manutenções podem ocorrer sem aviso prévio.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">6. Cancelamento</h2>
          <p className="text-gray-600">Você pode cancelar sua assinatura a qualquer momento pela aba "Assinatura" no dashboard. O acesso continua até o fim do período pago.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">7. Contato</h2>
          <p className="text-gray-600">Dúvidas: <strong>contato@sahjo.com.br</strong></p>
        </section>
      </div>
    </div>
  );
}
