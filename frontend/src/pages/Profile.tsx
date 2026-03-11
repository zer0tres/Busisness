import { useState } from 'react';
import { User, Mail, Lock, Save, Eye, EyeOff, Building2, Copy } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { toast } from 'sonner';

export default function Profile() {
  const { user, setAuth, company, updateCompany } = useAuthStore();
  const [companyName, setCompanyName] = useState(company?.name || '');
  const [savingCompany, setSavingCompany] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleSaveProfile = async () => {
    if (!profileData.name.trim()) { toast.error('Nome obrigatório'); return; }
    setSaving(true);
    try {
      await api.put('/auth/profile', profileData);
      // Atualizar store
      if (user && company) {
        const token = localStorage.getItem('access_token') || '';
        const refresh = localStorage.getItem('refresh_token') || '';
        setAuth({ ...user, name: profileData.name, email: profileData.email }, company, token, refresh);
      }
      toast.success('Perfil atualizado!');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current_password) { toast.error('Senha atual obrigatória'); return; }
    if (passwordData.new_password.length < 6) { toast.error('Nova senha deve ter pelo menos 6 caracteres'); return; }
    if (passwordData.new_password !== passwordData.confirm_password) { toast.error('Senhas não coincidem'); return; }
    setSaving(true);
    try {
      await api.put('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      toast.success('Senha alterada com sucesso!');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!companyName.trim()) { toast.error('Nome obrigatório'); return; }
    setSavingCompany(true);
    try {
      await api.put('/config/company', { name: companyName });
      updateCompany({ name: companyName });
      toast.success('Nome da empresa atualizado!');
    } catch { toast.error('Erro ao atualizar nome'); }
    finally { setSavingCompany(false); }
  };

  const makeSlug = (text: string) => text.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const toggleShow = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(s => ({ ...s, [field]: !s[field] }));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Meu Perfil</h1>
        <p className="text-gray-600 mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-lg">{user?.name}</p>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <p className="text-gray-400 text-xs mt-1">{company?.name}</p>
        </div>
      </div>

      {/* Dados pessoais */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-500" />
          Dados Pessoais
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome completo</label>
            <input
              type="text"
              value={profileData.name}
              onChange={e => setProfileData(d => ({ ...d, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-800"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={profileData.email}
                onChange={e => setProfileData(d => ({ ...d, email: e.target.value }))}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-800"
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar dados'}
          </button>
        </div>
      </div>

      {/* Empresa */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary-500" />
          Empresa
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome da empresa</label>
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-800" />
          </div>
          {companyName && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs font-medium text-blue-700 mb-1">🔗 Link público atual</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-800 font-medium flex-1 truncate">sahjo.com.br/book/{makeSlug(companyName)}</span>
                <button type="button" onClick={() => { navigator.clipboard.writeText(`https://www.sahjo.com.br/book/${makeSlug(companyName)}`); toast.success('Link copiado!'); }}
                  className="shrink-0 flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition">
                  <Copy className="w-3 h-3" /> Copiar
                </button>
              </div>
            </div>
          )}
          <button onClick={handleSaveCompany} disabled={savingCompany}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium transition disabled:opacity-50">
            <Save className="w-4 h-4" />
            {savingCompany ? 'Salvando...' : 'Salvar nome'}
          </button>
        </div>
      </div>

      {/* Alterar senha */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary-500" />
          Alterar Senha
        </h2>
        <div className="space-y-4">
          {([
            { key: 'current', label: 'Senha atual', field: 'current_password' },
            { key: 'new', label: 'Nova senha', field: 'new_password' },
            { key: 'confirm', label: 'Confirmar nova senha', field: 'confirm_password' },
          ] as const).map(({ key, label, field }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPasswords[key] ? 'text' : 'password'}
                  value={passwordData[field]}
                  onChange={e => setPasswordData(d => ({ ...d, [field]: e.target.value }))}
                  className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-800"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => toggleShow(key)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          {passwordData.new_password && passwordData.confirm_password && (
            <p className={`text-xs font-medium ${passwordData.new_password === passwordData.confirm_password ? 'text-green-600' : 'text-red-500'}`}>
              {passwordData.new_password === passwordData.confirm_password ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
            </p>
          )}
          <button
            onClick={handleChangePassword}
            disabled={saving}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium transition disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            {saving ? 'Alterando...' : 'Alterar senha'}
          </button>
        </div>
      </div>
    </div>
  );
}
