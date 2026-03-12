import { Link } from 'react-router-dom';
import {
  Calendar, Users, Package, DollarSign, BarChart2, Globe,
  Bell, UserCheck, Clock, ChevronRight, CheckCircle, Star,
  Scissors, Palette, UtensilsCrossed, Building2
} from 'lucide-react';

const features = [
  { icon: Calendar, title: 'Agendamentos Online', description: 'Seus clientes agendam 24h por dia pela página pública do seu negócio, sem precisar ligar. Você recebe notificações e confirma com um clique.', color: 'bg-blue-50 text-blue-600' },
  { icon: Globe, title: 'Página Pública de Reservas', description: 'Cada negócio recebe um link exclusivo (sahjo.com.br/book/seu-negocio) para compartilhar no Instagram, WhatsApp ou onde quiser.', color: 'bg-violet-50 text-violet-600' },
  { icon: Users, title: 'Gestão de Clientes', description: 'Cadastre clientes com nome, telefone, CPF e histórico completo de atendimentos. Encontre qualquer cliente em segundos.', color: 'bg-green-50 text-green-600' },
  { icon: DollarSign, title: 'Financeiro Automático', description: 'Ao concluir um atendimento, o sistema registra automaticamente a receita. Acompanhe entradas, saídas e saldo em tempo real.', color: 'bg-emerald-50 text-emerald-600' },
  { icon: Package, title: 'Controle de Estoque', description: 'Gerencie produtos, quantidades e preços. Saiba exatamente o que tem em estoque e evite surpresas na hora do atendimento.', color: 'bg-orange-50 text-orange-600' },
  { icon: UserCheck, title: 'Multi-Funcionários', description: 'Adicione sua equipe com perfis de funcionário. Acompanhe quem atendeu cada cliente e calcule comissões por período.', color: 'bg-pink-50 text-pink-600' },
  { icon: Bell, title: 'Notificações', description: 'Fique por dentro de novos agendamentos e atividades importantes do seu negócio sem precisar ficar verificando o sistema.', color: 'bg-yellow-50 text-yellow-600' },
  { icon: BarChart2, title: 'Relatórios e Dashboard', description: 'Visualize o desempenho do seu negócio com gráficos de faturamento, agendamentos e crescimento ao longo do tempo.', color: 'bg-cyan-50 text-cyan-600' },
  { icon: Clock, title: 'Agenda Inteligente', description: 'Veja todos os agendamentos do dia, filtre por data, status e funcionário. Nunca mais perca um horário ou confunda agendamentos.', color: 'bg-indigo-50 text-indigo-600' },
];

const businessTypes = [
  { icon: Scissors, label: 'Barbearias' },
  { icon: Palette, label: 'Estúdios de Tatuagem' },
  { icon: UtensilsCrossed, label: 'Restaurantes' },
  { icon: Building2, label: 'E muito mais...' },
];

const steps = [
  { num: '01', title: 'Crie sua conta', desc: 'Cadastro gratuito em menos de 2 minutos. Sem cartão de crédito.' },
  { num: '02', title: 'Configure seu negócio', desc: 'Adicione seus serviços, preços, horários e foto de capa.' },
  { num: '03', title: 'Compartilhe seu link', desc: 'Envie seu link exclusivo para clientes pelo WhatsApp ou Instagram.' },
  { num: '04', title: 'Gerencie tudo em um lugar', desc: 'Agendamentos, clientes, financeiro e estoque na palma da mão.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Sahjo</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition px-4 py-2 rounded-lg hover:bg-gray-50">Entrar</Link>
            <Link to="/register" className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">Criar conta grátis</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Star className="w-4 h-4" />
            30 dias grátis · Sem cartão de crédito
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            Gerencie seu negócio com{' '}
            <span className="text-blue-600">mais organização</span>{' '}
            e menos trabalho
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Agendamentos online, controle financeiro, gestão de clientes e muito mais — tudo em um sistema simples, feito para pequenos negócios brasileiros.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition shadow-lg shadow-blue-200">
              Criar conta grátis <ChevronRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-bold px-8 py-4 rounded-xl text-lg transition hover:bg-gray-50">
              Já tenho conta — Entrar
            </Link>
          </div>
        </div>
      </section>

      {/* PARA QUEM É */}
      <section className="py-12 px-6 border-y border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8">Feito para negócios como o seu</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {businessTypes.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700 text-center">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Tudo que você precisa em um só lugar</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Sem planilha, sem caderno, sem bagunça. O Sahjo centraliza a gestão do seu negócio.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div key={title} className="p-6 rounded-2xl border border-gray-100 hover:shadow-md transition bg-white">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Como começar</h2>
            <p className="text-gray-500 text-lg">Em menos de 5 minutos você já tem seu negócio no Sahjo.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="flex gap-5 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-3xl font-black text-blue-100 leading-none flex-shrink-0">{num}</div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{title}</h3>
                  <p className="text-gray-500 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREÇO */}
      <section className="py-24 px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Plano simples, sem surpresas</h2>
          <p className="text-gray-500 mb-10">Um único plano com tudo incluído.</p>
          <div className="bg-white border-2 border-blue-100 rounded-3xl p-8 shadow-xl shadow-blue-50">
            <div className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">PLANO PREMIUM</div>
            <div className="text-5xl font-black text-gray-900 mb-1">R$ 49<span className="text-2xl font-bold text-gray-400">,90</span></div>
            <div className="text-gray-400 text-sm mb-8">por mês · cancele quando quiser</div>
            <ul className="text-left space-y-3 mb-8">
              {['Agendamentos ilimitados','Clientes e funcionários ilimitados','Página pública de reservas','Controle financeiro completo','Gestão de estoque','Relatórios e dashboard','Suporte por e-mail'].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />{item}
                </li>
              ))}
            </ul>
            <Link to="/register" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition text-center shadow-lg shadow-blue-200">
              Começar 30 dias grátis
            </Link>
            <p className="text-xs text-gray-400 mt-4">Sem cartão de crédito. Cancele quando quiser.</p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-6 bg-blue-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Pronto para organizar seu negócio?</h2>
          <p className="text-blue-100 text-lg mb-8">Junte-se a outros profissionais que já usam o Sahjo.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-blue-600 font-bold px-8 py-4 rounded-xl text-lg transition">
              Criar conta grátis <ChevronRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="flex items-center justify-center gap-2 border-2 border-blue-400 hover:border-white text-white font-bold px-8 py-4 rounded-xl text-lg transition">
              Entrar
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Calendar className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-gray-700">Sahjo</span>
            <span className="text-gray-400 text-sm ml-2">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link to="/privacy" className="hover:text-gray-700 transition">Política de Privacidade</Link>
            <Link to="/terms" className="hover:text-gray-700 transition">Termos de Uso</Link>
            <a href="mailto:contato@sahjo.com.br" className="hover:text-gray-700 transition">contato@sahjo.com.br</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
