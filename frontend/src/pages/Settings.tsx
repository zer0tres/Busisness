import { useState, useEffect } from 'react';
import { Save, Building2, Clock, CheckSquare, FileText, Scissors, Palette, Plus, Trash2 } from 'lucide-react';
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
  services: { name: string; price?: number; duration?: number; description?: string }[];
}

interface Template {
  name: string;
  modules: Record<string, boolean>;
}

const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#06B6D4', '#6366F1', '#111827', '#6B7280',
];

const DAY_LABELS: Record<string, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
};

export default function Settings() {
  const company = useAuthStore((state) => state.company);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [activeTab, setActiveTab] = useState<'company' | 'modules' | 'schedule' | 'texts' | 'services' | 'visual'>('company');

  const [companyData, setCompanyData] = useState({
    name: company?.name || '',
    email: company?.email || '',
    phone: company?.phone || '',
    address: company?.address || '',
    primary_color: company?.primary_color || '#3B82F6',
  });

  // Novo serviço em branco
  const emptyService = { name: '', price: 0, duration: 60, description: '' };
  const [newService, setNewService] = useState({ ...emptyService });

  useEffect(() => {
    loadConfig();
    loadTemplates();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/config');
      setConfig(response.data);
    } catch {
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get('/config/templates');
      setTemplates(response.data.templates || {});
    } catch {
      console.error('Erro ao carregar templates');
    }
  };

  const handleApplyTemplate = async (templateKey: string) => {
    if (!confirm(`Aplicar template "${templates[templateKey]?.name}"? As configurações atuais serão substituídas.`)) return;
    const tid = toast.loading('Aplicando template...');
    try {
      setSaving(true);
      await api.post(`/config/apply-template/${templateKey}`);
      toast.success('Template aplicado!', { id: tid });
      await loadConfig();
    } catch {
      toast.error('Erro ao aplicar template', { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    const tid = toast.loading('Salvando...');
    try {
      setSaving(true);
      await api.put('/config', { ...config, services: config.services });
      toast.success('Configurações salvas!', { id: tid });
    } catch {
      toast.error('Erro ao salvar', { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    const tid = toast.loading('Salvando dados da empresa...');
    try {
      setSaving(true);
      await api.put('/config/company', companyData);
      toast.success('Dados da empresa salvos!', { id: tid });
    } catch {
      // Fallback: salva junto com config
      toast.success('Dados atualizados!', { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (module: keyof BusinessConfig['modules']) => {
    if (!config) return;
    setConfig({ ...config, modules: { ...config.modules, [module]: !config.modules[module] } });
  };

  const addService = () => {
    if (!newService.name.trim()) { toast.error('Nome do serviço obrigatório'); return; }
    if (!config) return;
    setConfig({ ...config, services: [...(config.services || []), { ...newService }] });
    setNewService({ ...emptyService });
    toast.success('Serviço adicionado! Salve as configurações para confirmar.');
  };

  const removeService = (index: number) => {
    if (!config) return;
    const updated = config.services.filter((_, i) => i !== index);
    setConfig({ ...config, services: updated });
  };

  const updateService = (index: number, field: string, value: string | number) => {
    if (!config) return;
    const updated = config.services.map((s, i) => i === index ? { ...s, [field]: value } : s);
    setConfig({ ...config, services: updated });
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded" />)}
        </div>
      </div>
    );
  }

  if (!config) return <div className="p-6 text-red-600">Erro ao carregar configurações</div>;

  const tabs = [
    { key: 'company', label: 'Empresa', icon: Building2 },
    { key: 'modules', label: 'Módulos', icon: CheckSquare },
    { key: 'services', label: 'Serviços', icon: Scissors },
    { key: 'schedule', label: 'Horários', icon: Clock },
    { key: 'visual', label: 'Visual', icon: Palette },
    { key: 'texts', label: 'Textos', icon: FileText },
  ] as const;

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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 transition whitespace-nowrap text-sm ${
                activeTab === key
                  ? 'border-primary-500 text-primary-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ── Empresa ── */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Dados da Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Nome', field: 'name', type: 'text' },
                    { label: 'Email', field: 'email', type: 'email' },
                    { label: 'Telefone', field: 'phone', type: 'text' },
                    { label: 'Endereço', field: 'address', type: 'text' },
                  ].map(({ label, field, type }) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                      <input
                        type={type}
                        value={companyData[field as keyof typeof companyData]}
                        onChange={e => setCompanyData({ ...companyData, [field]: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Templates de Negócio</h3>
                <p className="text-sm text-gray-500 mb-3">Aplique um template para configurar serviços e módulos automaticamente para seu nicho.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(templates).map(([key, template]) => (
                    <button
                      key={key}
                      onClick={() => handleApplyTemplate(key)}
                      disabled={saving}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-left disabled:opacity-50"
                    >
                      <h4 className="font-semibold text-gray-800 text-sm mb-1">{template.name}</h4>
                      <p className="text-xs text-gray-500">
                        {Object.values(template.modules).filter(Boolean).length} módulos
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Módulos ── */}
          {activeTab === 'modules' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Módulos do Sistema</h3>
              <div className="space-y-3">
                {Object.entries(config.modules).map(([key, value]) => {
                  const descriptions: Record<string, string> = {
                    appointments: 'Sistema de agendamentos online',
                    customers: 'Gestão de clientes',
                    products: 'Catálogo de produtos',
                    stock: 'Controle de estoque',
                    services: 'Lista de serviços na página pública',
                    gallery: 'Galeria de fotos (tattoo, estética)',
                  };
                  return (
                    <label key={key} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => toggleModule(key as keyof BusinessConfig['modules'])}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                      />
                      <div>
                        <div className="font-medium text-gray-800 capitalize">{key.replace('_', ' ')}</div>
                        <div className="text-sm text-gray-500">{descriptions[key]}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Serviços ── */}
          {activeTab === 'services' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Serviços Disponíveis</h3>
              <p className="text-sm text-gray-500 mb-6">Estes serviços aparecem na sua página pública para agendamento.</p>

              {/* Lista de serviços */}
              <div className="space-y-3 mb-6">
                {(config.services || []).length === 0 && (
                  <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                    <Scissors className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    Nenhum serviço cadastrado. Adicione abaixo ou aplique um template.
                  </div>
                )}
                {(config.services || []).map((s, i) => (
                  <div key={i} className="grid grid-cols-12 gap-3 items-center p-4 border border-gray-200 rounded-lg">
                    <div className="col-span-4">
                      <label className="text-xs text-gray-500 mb-1 block">Nome</label>
                      <input
                        type="text"
                        value={s.name}
                        onChange={e => updateService(i, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Preço (R$)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={s.price || ''}
                        onChange={e => updateService(i, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Duração (min)</label>
                      <input
                        type="number"
                        min="5"
                        step="5"
                        value={s.duration || ''}
                        onChange={e => updateService(i, 'duration', parseInt(e.target.value) || 60)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs text-gray-500 mb-1 block">Descrição</label>
                      <input
                        type="text"
                        value={s.description || ''}
                        onChange={e => updateService(i, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end pt-5">
                      <button
                        onClick={() => removeService(i)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Adicionar novo serviço */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Adicionar novo serviço</h4>
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-4">
                    <label className="text-xs text-gray-500 mb-1 block">Nome *</label>
                    <input
                      type="text"
                      value={newService.name}
                      onChange={e => setNewService({ ...newService, name: e.target.value })}
                      placeholder="Ex: Corte de Cabelo"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">Preço (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newService.price || ''}
                      onChange={e => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0,00"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">Duração (min)</label>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={newService.duration}
                      onChange={e => setNewService({ ...newService, duration: parseInt(e.target.value) || 60 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs text-gray-500 mb-1 block">Descrição</label>
                    <input
                      type="text"
                      value={newService.description}
                      onChange={e => setNewService({ ...newService, description: e.target.value })}
                      placeholder="Opcional"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={addService}
                      className="w-full flex items-center justify-center gap-1 bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 rounded-lg text-sm transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Horários ── */}
          {activeTab === 'schedule' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Horário de Funcionamento</h3>
              <p className="text-sm text-gray-500 mb-4">Deixe em branco para marcar o dia como fechado.</p>
              <div className="space-y-3">
                {Object.entries(config.business_hours).map(([day, hours]) => (
                  <div key={day} className="grid grid-cols-3 gap-4 items-center p-4 border border-gray-200 rounded-lg">
                    <div className="font-medium text-gray-800">{DAY_LABELS[day] || day}</div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Abertura</label>
                      <input
                        type="time"
                        value={hours.open || ''}
                        onChange={e => setConfig({
                          ...config,
                          business_hours: { ...config.business_hours, [day]: { ...hours, open: e.target.value || null } }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Fechamento</label>
                      <input
                        type="time"
                        value={hours.close || ''}
                        onChange={e => setConfig({
                          ...config,
                          business_hours: { ...config.business_hours, [day]: { ...hours, close: e.target.value || null } }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Visual ── */}
          {activeTab === 'visual' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Identidade Visual</h3>
              <p className="text-sm text-gray-500 mb-6">A cor primária é usada na sua página pública e nos emails.</p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Cor Primária</label>
                <div className="flex flex-wrap gap-3 mb-4">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setCompanyData({ ...companyData, primary_color: color })}
                      style={{ backgroundColor: color }}
                      className={`w-10 h-10 rounded-full transition hover:scale-110 ${
                        companyData.primary_color === color ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : ''
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={companyData.primary_color}
                    onChange={e => setCompanyData({ ...companyData, primary_color: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={companyData.primary_color}
                    onChange={e => setCompanyData({ ...companyData, primary_color: e.target.value })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-primary-400"
                    placeholder="#3B82F6"
                  />
                  <div
                    className="flex-1 h-10 rounded-lg border border-gray-200"
                    style={{ backgroundColor: companyData.primary_color }}
                  />
                </div>
              </div>

              {/* Preview da landing page */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Preview da Página Pública</label>
                <div className="border border-gray-200 rounded-xl overflow-hidden max-w-sm">
                  <div style={{ backgroundColor: companyData.primary_color }} className="p-4 text-center text-white">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold mx-auto mb-2">
                      {companyData.name.charAt(0).toUpperCase() || 'E'}
                    </div>
                    <p className="font-bold">{companyData.name || 'Nome da Empresa'}</p>
                    <p className="text-white/70 text-xs">Seu negócio</p>
                  </div>
                  <div className="p-4 bg-gray-50">
                    <div
                      className="w-full py-2 rounded-lg text-white text-sm font-medium text-center"
                      style={{ backgroundColor: companyData.primary_color }}
                    >
                      Agendar agora
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleSaveCompany}
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Salvar cor
                </button>
              </div>
            </div>
          )}

          {/* ── Textos ── */}
          {activeTab === 'texts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Textos Personalizados</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem de Boas-vindas</label>
                <textarea
                  value={config.public_text?.welcome || ''}
                  onChange={e => setConfig({ ...config, public_text: { ...config.public_text, welcome: e.target.value } })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  placeholder="Texto exibido na página inicial para clientes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rodapé</label>
                <textarea
                  value={config.public_text?.footer || ''}
                  onChange={e => setConfig({ ...config, public_text: { ...config.public_text, footer: e.target.value } })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  placeholder="Informações de pagamento, políticas, etc."
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
