import { useEffect, useState } from 'react';
import { Users, Calendar, Package, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface Stats {
  customers: number;
  appointments_today: number;
  low_stock_products: number;
  total_products: number;
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const company = useAuthStore((state) => state.company);
  const [stats, setStats] = useState<Stats>({
    customers: 0,
    appointments_today: 0,
    low_stock_products: 0,
    total_products: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Buscar estatísticas
      const [customersRes, appointmentsRes, productsRes, lowStockRes] = await Promise.all([
        api.get('/customers'),
        api.get('/appointments/today'),
        api.get('/products'),
        api.get('/products/low-stock'),
      ]);

      setStats({
        customers: customersRes.data.total || 0,
        appointments_today: appointmentsRes.data.total || 0,
        total_products: productsRes.data.total || 0,
        low_stock_products: lowStockRes.data.total || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const cards = [
    {
      title: 'Clientes',
      value: stats.customers,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Agendamentos Hoje',
      value: stats.appointments_today,
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      title: 'Produtos',
      value: stats.total_products,
      icon: Package,
      color: 'bg-purple-500',
    },
    {
      title: 'Estoque Baixo',
      value: stats.low_stock_products,
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Bem-vindo, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">{company?.name}</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {card.value}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumo */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Resumo do Sistema</h2>
        <div className="space-y-3 text-gray-600">
          <p>✅ Sistema de autenticação ativo</p>
          <p>✅ Gestão de clientes configurada</p>
          <p>✅ Agendamentos online disponíveis</p>
          <p>✅ Controle de estoque ativo</p>
        </div>
      </div>
    </div>
  );
}