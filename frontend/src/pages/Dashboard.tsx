import { useState, useEffect } from 'react';
import { Users, Calendar, Package, TrendingDown, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import AppointmentsChart from '../components/charts/AppointmentsChart';
import StockChart from '../components/charts/StockChart';
import WeekChart from '../components/charts/WeekChart';

interface DashboardStats {
  customers: number;
  appointments_today: number;
  appointments_week: number;
  products: number;
  low_stock: number;
  revenue_month: number;
}

interface AppointmentByStatus {
  status: string;
  count: number;
}

interface AppointmentByDay {
  date: string;
  count: number;
}

interface LowStockProduct {
  name: string;
  quantity: number;
  min_quantity: number;
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const company = useAuthStore((state) => state.company);
  const [stats, setStats] = useState<DashboardStats>({
    customers: 0,
    appointments_today: 0,
    appointments_week: 0,
    products: 0,
    low_stock: 0,
    revenue_month: 0
  });
  const [appointmentsByStatus, setAppointmentsByStatus] = useState<AppointmentByStatus[]>([]);
  const [appointmentsByDay, setAppointmentsByDay] = useState<AppointmentByDay[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados básicos
      const [customersRes, appointmentsTodayRes, productsRes, lowStockRes] = await Promise.all([
        api.get('/customers'),
        api.get('/appointments/today'),
        api.get('/products'),
        api.get('/products/low-stock')
      ]);

      // Carregar agendamentos por status
      const appointmentsRes = await api.get('/appointments?include_customer=true');
      const appointments = appointmentsRes.data.appointments || [];
      
      // Contar por status
      const statusCounts = appointments.reduce((acc: Record<string, number>, app: any) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});

      setAppointmentsByStatus(
        Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count: count as number
        }))
      );

      // Agendamentos por dia (últimos 7 dias)
      const last7DaysData = appointments.reduce((acc: Record<string, number>, app: any) => {
        const date = app.appointment_date;
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      setAppointmentsByDay(
        Object.entries(last7DaysData).map(([date, count]) => ({
          date,
          count: count as number
        }))
      );

      // Produtos com estoque baixo
      const lowStock = lowStockRes.data.products || [];
      setLowStockProducts(lowStock.slice(0, 10));

      // Calcular receita do mês (soma dos agendamentos completados)
      const completedAppointments = appointments.filter((app: any) => app.status === 'completed');
      const revenue = completedAppointments.reduce((sum: number, app: any) => sum + (app.service_price || 0), 0);

      setStats({
        customers: customersRes.data.customers?.length || 0,
        appointments_today: appointmentsTodayRes.data.appointments?.length || 0,
        appointments_week: appointments.length || 0,
        products: productsRes.data.products?.length || 0,
        low_stock: lowStockRes.data.products?.length || 0,
        revenue_month: revenue
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
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
          <p className="text-xs text-gray-500 mt-2">Total de clientes cadastrados</p>
        </div>

        {/* Agendamentos Hoje */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Hoje</h3>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.appointments_today}</p>
          <p className="text-xs text-gray-500 mt-2">Agendamentos para hoje</p>
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
          <p className="text-xs text-gray-500 mt-2">Total no estoque</p>
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
          <p className="text-xs text-gray-500 mt-2">Produtos abaixo do mínimo</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Agendamentos nos Últimos 7 Dias */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-800">Últimos 7 Dias</h2>
          </div>
          <WeekChart data={appointmentsByDay} />
        </div>

        {/* Agendamentos por Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-800">Agendamentos por Status</h2>
          </div>
          <AppointmentsChart data={appointmentsByStatus} />
        </div>
      </div>

      {/* Produtos com Estoque Baixo */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-800">Produtos com Estoque Baixo</h2>
          </div>
          <StockChart data={lowStockProducts} />
        </div>
      )}

      {/* Resumo do Sistema */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Resumo do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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