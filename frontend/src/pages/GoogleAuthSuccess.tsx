import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function GoogleAuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { navigate('/login?error=google_failed'); return; }

    // Buscar dados do usuário com o token recebido
    api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const { user, company } = res.data;
      setAuth(user, company, token, '');
      navigate('/dashboard');
    }).catch(() => {
      navigate('/login?error=google_failed');
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-700 font-medium">Autenticando com Google...</p>
      </div>
    </div>
  );
}