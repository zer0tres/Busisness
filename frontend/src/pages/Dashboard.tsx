import { useState, useEffect } from 'react';
import { Users, Calendar, Package, TrendingDown } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

interface DashboardStats {
  customers: number;
  appointments_today: number;
  products: number;
  low_stock: number;
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const company = useAuthStore((state) => state.company);
  const [stats, setStats] = useState<DashboardStats>({
    customers: 0,
    appointments_today: 0,
    products: 0,
    low_stock: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const [customersRes, appointmentsRes, productsRes, lowStockRes] = await Promise.all([
        api.get('/customers'),
        api.get('/appointments/today'),
        api.get('/products'),
        api.get('/products/low-stock')
      ]);

      setStats({
        customers: customersRes.data.customers?.length || 0,
        appointments_today: appointmentsRes.data.appointments?.length || 0,
        products: productsRes.data.products?.length || 0,
        low_stock: lowStockRes.data.products?.length || 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-48"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Bem-vindo, {user?.name.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 mt-1">{company?.name || 'Empresa Demo'}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Clientes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Clientes</h3>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.customers}</p>
        </div>

        {/* Agendamentos Hoje */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Agendamentos Hoje</h3>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.appointments_today}</p>
        </div>

        {/* Produtos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Produtos</h3>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.products}</p>
        </div>

        {/* Estoque Baixo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Estoque Baixo</h3>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.low_stock}</p>
        </div>
      </div>

      {/* Resumo do Sistema */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Resumo do Sistema</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <p className="text-gray-700">Sistema de autenticação ativo</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <p className="text-gray-700">Gestão de clientes configurada</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <p className="text-gray-700">Agendamentos online disponíveis</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <p className="text-gray-700">Controle de estoque ativo</p>
          </div>
        </div>
      </div>
    </div>
  );
}