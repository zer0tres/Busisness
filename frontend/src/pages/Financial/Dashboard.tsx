import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Calendar, CreditCard, ChevronRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'sonner';
import type { FinancialSummary, Transaction } from '../../types';
import { format, subDays } from 'date-fns';

export default function FinancialDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<FinancialSummary>({
    income: 0,
    expenses: 0,
    balance: 0,
    payables_pending: 0,
    receivables_pending: 0,
    projected_balance: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);

      const last30Days = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      const [summaryRes, transactionsRes] = await Promise.all([
        api.get(`/financial/reports/summary?start_date=${last30Days}&end_date=${today}`),
        api.get(`/financial/transactions?start_date=${last30Days}&end_date=${today}`)
      ]);
      

      // ── Normaliza a resposta do summary (pode vir em .data ou direto) ──
      const raw = summaryRes.data;
      const s = raw.data ?? raw;
      setSummary({
        income:               Number(s.income               ?? s.total_income    ?? 0),
        expenses:             Number(s.expenses             ?? s.total_expenses  ?? 0),
        balance:              Number(s.balance              ?? s.net_balance     ?? 0),
        payables_pending:     Number(s.payables_pending     ?? s.total_payables  ?? 0),
        receivables_pending:  Number(s.receivables_pending  ?? s.total_receivables ?? 0),
        projected_balance:    Number(s.projected_balance    ?? 0),
      });

      // ── Normaliza transações ──
      const t = transactionsRes.data;
      const txList = t.data ?? t.transactions ?? t ?? [];
      setRecentTransactions(txList.slice(0, 10));

    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch {
      return dateString;
    }
  };

  // ── Config dos cards ─────────────────────────────────────────────────────────
  const cards = [
    {
      title: 'Receitas',
      value: summary.income,
      valueColor: 'text-green-600',
      subtitle: 'Últimos 30 dias',
      icon: TrendingUp,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      route: '/financial/transactions',
      clickable: true,
    },
    {
      title: 'Despesas',
      value: summary.expenses,
      valueColor: 'text-red-600',
      subtitle: 'Últimos 30 dias',
      icon: TrendingDown,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      route: '/financial/transactions',
      clickable: true,
    },
    {
      title: 'Saldo',
      value: summary.balance,
      valueColor: summary.balance >= 0 ? 'text-blue-600' : 'text-red-600',
      subtitle: 'Receitas - Despesas',
      icon: DollarSign,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      route: '/financial/transactions',
      clickable: true,
    },
    {
      title: 'A Pagar',
      value: summary.payables_pending,
      valueColor: 'text-orange-600',
      subtitle: 'Contas pendentes',
      icon: AlertCircle,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      route: '/financial/payables',
      clickable: true,
    },
    {
      title: 'A Receber',
      value: summary.receivables_pending,
      valueColor: 'text-purple-600',
      subtitle: 'Contas pendentes',
      icon: Calendar,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      route: '/financial/receivables',
      clickable: true,
    },
    {
      title: 'Saldo Projetado',
      value: summary.projected_balance,
      valueColor: summary.projected_balance >= 0 ? 'text-indigo-600' : 'text-red-600',
      subtitle: 'Após pagar/receber',
      icon: TrendingUp,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      route: null,
      clickable: false,
    },
    {
      title: 'Notas Fiscais',
      value: 0,
      valueColor: 'text-violet-600',
      subtitle: 'Gerenciar notas',
      icon: FileText,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      route: '/financial/invoices',
      clickable: true,
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Financeiro</h1>
        <p className="text-gray-600 mt-1">Visão geral dos últimos 30 dias</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          const Wrapper = card.clickable ? 'button' : 'div';

          return (
            <Wrapper
              key={card.title}
              onClick={card.clickable && card.route ? () => navigate(card.route!) : undefined}
              className={`
                w-full text-left bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition
                ${card.clickable
                  ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer group'
                  : 'hover:shadow-md'}
              `}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  {card.clickable && (
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  )}
                </div>
              </div>
              <p className={`text-3xl font-bold ${card.valueColor}`}>
                {formatCurrency(card.value)}
              </p>
              <p className="text-xs text-gray-500 mt-2">{card.subtitle}</p>
              {card.clickable && (
                <p className="text-xs text-primary-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  Clique para ver detalhes →
                </p>
              )}
            </Wrapper>
          );
        })}
      </div>

      {/* Transações Recentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-800">Transações Recentes</h2>
          </div>
          <button
            onClick={() => navigate('/financial/transactions')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium transition"
          >
            Ver todas →
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'income'
                      ? <TrendingUp className="w-5 h-5 text-green-600" />
                      : <TrendingDown className="w-5 h-5 text-red-600" />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.description || 'Sem descrição'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(transaction.transaction_date)}
                      {transaction.payment_method && ` • ${transaction.payment_method}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </p>
                  {transaction.category && (
                    <p className="text-xs text-gray-500">{transaction.category.name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}