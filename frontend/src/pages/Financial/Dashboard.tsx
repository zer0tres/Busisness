import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Calendar, CreditCard } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import type { FinancialSummary, Transaction } from '../../types';
import { format, subDays } from 'date-fns';

export default function FinancialDashboard() {
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

      // Carregar resumo financeiro (último mês)
      const last30Days = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      const [summaryRes, transactionsRes] = await Promise.all([
        api.get(`/financial/reports/summary?start_date=${last30Days}&end_date=${today}`),
        api.get(`/financial/transactions?start_date=${last30Days}&end_date=${today}`)
      ]);

      setSummary(summaryRes.data);
      setRecentTransactions((transactionsRes.data.transactions || []).slice(0, 10));
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch {
    return dateString;
  }
};

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

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Receitas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Receitas</h3>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(summary.income)}</p>
          <p className="text-xs text-gray-500 mt-2">Últimos 30 dias</p>
        </div>

        {/* Despesas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Despesas</h3>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(summary.expenses)}</p>
          <p className="text-xs text-gray-500 mt-2">Últimos 30 dias</p>
        </div>

        {/* Saldo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Saldo</h3>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(summary.balance)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Receitas - Despesas</p>
        </div>

        {/* Contas a Pagar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">A Pagar</h3>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-600">{formatCurrency(summary.payables_pending)}</p>
          <p className="text-xs text-gray-500 mt-2">Contas pendentes</p>
        </div>

        {/* Contas a Receber */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">A Receber</h3>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600">{formatCurrency(summary.receivables_pending)}</p>
          <p className="text-xs text-gray-500 mt-2">Contas pendentes</p>
        </div>

        {/* Saldo Projetado */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Saldo Projetado</h3>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${summary.projected_balance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
            {formatCurrency(summary.projected_balance)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Após pagar/receber</p>
        </div>
      </div>

      {/* Transações Recentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-800">Transações Recentes</h2>
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
                    {transaction.type === 'income' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
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