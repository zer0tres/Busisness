import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { DollarSign, CreditCard, Bell, Calendar, X, Menu, LayoutDashboard, Users, Package, Settings, LogOut, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  date: string;
  time: string;
  is_today: boolean;
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, company, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/customers', icon: Users, label: 'Clientes' },
    { path: '/appointments', icon: Calendar, label: 'Agendamentos' },
    { path: '/products', icon: Package, label: 'Produtos' },
    { path: '/financial', icon: DollarSign, label: 'Financeiro' },
    { path: '/settings', icon: Settings, label: 'Configurações' },
    { path: '/subscription', icon: CreditCard, label: 'Assinatura' },
  ];

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setNotifCount(res.data.count || 0);
    } catch {
      // silencioso
    }
  };

  const SidebarNav = ({ mobile = false }) => (
    <>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => mobile && setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
              {item.path === '/appointments' && notifCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {notifCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Link
          to="/profile"
          onClick={() => mobile && setSidebarOpen(false)}
          className="flex items-center gap-3 px-4 py-3 mb-1 rounded-lg hover:bg-gray-100 transition"
        >
          <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">Busisness</h1>
          <p className="text-sm text-gray-600 mt-1 truncate">{company?.name}</p>
        </div>
        <SidebarNav />
      </aside>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 h-full bg-white flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-primary-600">Busisness</h1>
                <p className="text-sm text-gray-600 mt-1 truncate">{company?.name}</p>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <SidebarNav mobile />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden">
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-primary-600 md:hidden">Business Suite</h1>
          </div>

          {/* Notificações */}
          <div className="relative ml-auto" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <Bell className="w-5 h-5" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>

            {/* Dropdown notificações */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 text-sm">Notificações</h3>
                  {notifCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      {notifCount} pendente{notifCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Nenhuma notificação</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <Link
                        key={n.id}
                        to="/appointments"
                        onClick={() => setNotifOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          n.is_today ? 'bg-red-100' : 'bg-amber-100'
                        }`}>
                          <Calendar className={`w-4 h-4 ${n.is_today ? 'text-red-600' : 'text-amber-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{n.message}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {n.is_today ? '🔴 Hoje' : new Date(n.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            {' às '}{n.time}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-100">
                    <Link
                      to="/appointments"
                      onClick={() => setNotifOpen(false)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Ver todos os agendamentos →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
