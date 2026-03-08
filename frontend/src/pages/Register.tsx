import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const BUSINESS_TYPES = [
  { value: 'barbershop', label: 'Barbearia' },
  { value: 'tattoo', label: 'Estúdio de Tatuagem' },
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'distributor', label: 'Distribuidora' },
  { value: 'outros', label: 'Outro' },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm_password: '',
    company_name: '', business_type: 'outros', phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (form.password !== form.confirm_password) {
      setError('As senhas não coincidem');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          company_name: form.company_name,
          business_type: form.business_type,
          phone: form.phone,
        }),
      });
      const data = await r.json();
      if (r.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('company', JSON.stringify(data.company));
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setError(data.error || Object.values(data.errors || {}).join(', '));
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Busisness</h1>
          <p className="text-gray-500 mt-2">Crie sua conta gratuitamente</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-gray-600 text-sm font-medium block mb-1">Seu nome *</label>
            <input type="text" placeholder="João Silva" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-gray-600 text-sm font-medium block mb-1">Nome do estabelecimento *</label>
            <input type="text" placeholder="Barbearia do João" value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-gray-600 text-sm font-medium block mb-1">Tipo de negócio *</label>
            <select value={form.business_type}
              onChange={e => setForm(f => ({ ...f, business_type: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400">
              {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-600 text-sm font-medium block mb-1">E-mail *</label>
            <input type="email" placeholder="joao@email.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-gray-600 text-sm font-medium block mb-1">Telefone</label>
            <input type="tel" placeholder="(00) 00000-0000" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-gray-600 text-sm font-medium block mb-1">Senha *</label>
            <input type="password" placeholder="Mínimo 6 caracteres" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-gray-600 text-sm font-medium block mb-1">Confirmar senha *</label>
            <input type="password" placeholder="Repita a senha" value={form.confirm_password}
              onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-60 mt-2">
            {loading ? 'Criando conta...' : 'Criar conta grátis'}
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
