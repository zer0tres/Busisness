import { useState, useEffect } from 'react';
import { Save, Building2, Clock, CheckSquare, FileText } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

interface BusinessConfig {
  modules: {
    appointments: boolean;
    customers: boolean;
    products: boolean;
    stock: boolean;
    services: boolean;
    gallery: boolean;
  };
  appointment_settings: {
    duration_default: number;
    interval: number;
    advance_days: number;
    allow_online_booking: boolean;
    require_approval: boolean;
  };
  business_hours: Record<string, { open: string | null; close: string | null }>;
  public_text: {
    welcome: string;
    footer: string;
  };
}

interface Template {
  name: string;
  modules: Record<string, boolean>;
}

export default function Settings() {
  const company = useAuthStore((state) => state.company);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [activeTab, setActiveTab] = useState<'company' | 'modules' | 'schedule' | 'texts'>('company');
  
  const [companyData, setCompanyData] = useState({
    name: company?.name || '',
    email: company?.email || '',
    phone: company?.phone || '',
    address: company?.address || '',
  });

  useEffect(() => {
    loadConfig();
    loadTemplates();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/config');
      setConfig(response.data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get('/config/templates');
      setTemplates(response.data.templates || {});
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const handleApplyTemplate = async (templateKey: string) => {
    if (!confirm(`Aplicar template "${templates[templateKey]?.name}"? As configurações atuais serão substituídas.`)) {
      return;
    }

    const loadingToast = toast.loading('Aplicando template...');

    try {
      setSaving(true);
      await api.post(`/config/apply-template/${templateKey}`);
      toast.success('Template aplicado com sucesso!', { id: loadingToast });
      await loadConfig();
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
      toast.error('Erro ao aplicar template', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    const loadingToast = toast.loading('Salvando configurações...');

    try {
      setSaving(true);
      await api.put('/config', config);
      toast.success('Configurações salvas com sucesso!', { id: loadingToast });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (module: keyof BusinessConfig['modules']) => {
    if (!config) return;
    setConfig({
      ...config,
      modules: {
        ...config.modules,
        [module]: !config.modules[module]
      }
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-48 mb-6"></div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-6">
        <p className="text-red-600">Erro ao carregar configurações</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>
          <p className="text-gray-600 mt-1">Personalize seu sistema</p>
        </div>
        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition ${
              activeTab === 'company'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Empresa
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition ${
              activeTab === 'modules'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            Módulos
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition ${
              activeTab === 'schedule'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Clock className="w-5 h-5" />
            Horários
          </button>
          <button
            onClick={() => setActiveTab('texts')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition ${
              activeTab === 'texts'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <FileText className="w-5 h-5" />
            Textos
          </button>
        </div>

        <div className="p-6">
          {/* Tab: Empresa */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Dados da Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={companyData.name}
                      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endereço
                    </label>
                    <input
                      type="text"
                      value={companyData.address}
                      onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Templates de Negócio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(templates).map(([key, template]) => (
                    <button
                      key={key}
                      onClick={() => handleApplyTemplate(key)}
                      disabled={saving}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-left disabled:opacity-50"
                    >
                      <h4 className="font-semibold text-gray-800 mb-2">{template.name}</h4>
                      <p className="text-xs text-gray-600">
                        {Object.values(template.modules).filter(Boolean).length} módulos ativos
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Módulos */}
          {activeTab === 'modules' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Módulos do Sistema</h3>
              <div className="space-y-3">
                {Object.entries(config.modules).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => toggleModule(key as keyof BusinessConfig['modules'])}
                      className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium text-gray-800 capitalize">
                        {key.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {key === 'appointments' && 'Sistema de agendamentos'}
                        {key === 'customers' && 'Gestão de clientes'}
                        {key === 'products' && 'Catálogo de produtos'}
                        {key === 'stock' && 'Controle de estoque'}
                        {key === 'services' && 'Lista de serviços'}
                        {key === 'gallery' && 'Galeria de fotos'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Horários */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Horário de Funcionamento</h3>
              <div className="space-y-3">
                {Object.entries(config.business_hours).map(([day, hours]) => (
                  <div key={day} className="grid grid-cols-3 gap-4 items-center p-4 border border-gray-200 rounded-lg">
                    <div className="font-medium text-gray-800 capitalize">
                      {day === 'monday' && 'Segunda'}
                      {day === 'tuesday' && 'Terça'}
                      {day === 'wednesday' && 'Quarta'}
                      {day === 'thursday' && 'Quinta'}
                      {day === 'friday' && 'Sexta'}
                      {day === 'saturday' && 'Sábado'}
                      {day === 'sunday' && 'Domingo'}
                    </div>
                    <input
                      type="time"
                      value={hours.open || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        business_hours: {
                          ...config.business_hours,
                          [day]: { ...hours, open: e.target.value || null }
                        }
                      })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="Abertura"
                    />
                    <input
                      type="time"
                      value={hours.close || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        business_hours: {
                          ...config.business_hours,
                          [day]: { ...hours, close: e.target.value || null }
                        }
                      })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="Fechamento"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Textos */}
          {activeTab === 'texts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Textos Personalizados</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem de Boas-vindas
                </label>
                <textarea
                  value={config.public_text.welcome}
                  onChange={(e) => setConfig({
                    ...config,
                    public_text: { ...config.public_text, welcome: e.target.value }
                  })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  placeholder="Texto exibido na página inicial para clientes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rodapé
                </label>
                <textarea
                  value={config.public_text.footer}
                  onChange={(e) => setConfig({
                    ...config,
                    public_text: { ...config.public_text, footer: e.target.value }
                  })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  placeholder="Informações de contato, formas de pagamento, etc"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}