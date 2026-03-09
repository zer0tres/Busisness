import { useState, useEffect } from 'react';
import { Save, Building2, Clock, FileText, Scissors, Palette, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

interface BusinessConfig {
  appointment_settings: {
    duration_default: number;
    interval: number;
    advance_days: number;
    allow_online_booking: boolean;
    require_approval: boolean;
  };
  business_hours: Record<string, { open: string | null; close: string | null }>;
  public_text: { welcome: string; footer: string };
  services: { name: string; price?: number; duration?: number; description?: string }[];
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
  const [activeTab, setActiveTab] = useState<'company' | 'services' | 'schedule' | 'visual' | 'texts'>('company');

  const [companyData, setCompanyData] = useState({
    name: company?.name || '',
    email: company?.email || '',
    phone: company?.phone || '',
    address: company?.address || '',
    primary_color: company?.primary_color || '#3B82F6',
    header_image_url: (company as any)?.header_image_url || '',
  });

  const emptyService = { name: '', price: 0, duration: 60, description: '' };
  const [newService, setNewService] = useState({ ...emptyService });

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/config');
      setConfig(res.data);
    } catch { toast.error('Erro ao carregar configurações'); }
    finally { setLoading(false); }
  };

  const handleSaveCompany = async () => {
    const tid = toast.loading('Salvando...');
    try {
      setSaving(true);
      await api.put('/config/company', companyData);
      toast.success('Dados da empresa salvos!', { id: tid });
    } catch { toast.error('Erro ao salvar dados da empresa', { id: tid }); }
    finally { setSaving(false); }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    const tid = toast.loading('Salvando...');
    try {
      setSaving(true);
      await api.put('/config', {
        business_hours: config.business_hours,
        services: config.services,
        public_text: config.public_text,
        appointment_settings: config.appointment_settings,
      });
      toast.success('Configurações salvas!', { id: tid });
    } catch { toast.error('Erro ao salvar configurações', { id: tid }); }
    finally { setSaving(false); }
  };

  const handleSaveColor = async () => {
  const tid = toast.loading('Salvando visual...');
  try {
    setSaving(true);
    await api.put('/config/company', {
      primary_color: companyData.primary_color,
      header_image_url: companyData.header_image_url,
    });
    toast.success('Visual salvo com sucesso!', { id: tid });
  } catch { toast.error('Erro ao salvar visual', { id: tid }); }
  finally { setSaving(false); }
};

const handleHeaderImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    toast.error('Use apenas PNG ou JPEG'); return;
  }
  if (file.size > 2 * 1024 * 1024) {
    toast.error('Imagem muito grande. Máximo 2MB'); return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    setCompanyData({ ...companyData, header_image_url: ev.target?.result as string });
  };
  reader.readAsDataURL(file);
};

  const handleMainSave = () => {
    if (activeTab === 'company') handleSaveCompany();
    else if (activeTab === 'visual') handleSaveColor();
    else handleSaveConfig();
  };

  const addService = () => {
    if (!newService.name.trim()) { toast.error('Nome do serviço obrigatório'); return; }
    if (!config) return;
    setConfig({ ...config, services: [...(config.services || []), { ...newService }] });
    setNewService({ ...emptyService });
    toast.success('Serviço adicionado! Clique em Salvar para confirmar.');
  };

  const removeService = (index: number) => {
    if (!config) return;
    setConfig({ ...config, services: config.services.filter((_, i) => i !== index) });
  };

  const updateService = (index: number, field: string, value: string | number) => {
    if (!config) return;
    const updated = config.services.map((s, i) => i === index ? { ...s, [field]: value } : s);
    setConfig({ ...config, services: updated });
  };

  if (loading) return (
    <div className="p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded" />)}
      </div>
    </div>
  );

  if (!config) return <div className="p-6 text-red-600">Erro ao carregar configurações</div>;

  const tabs = [
    { key: 'company', label: 'Empresa', icon: Building2 },
    { key: 'services', label: 'Serviços', icon: Scissors },
    { key: 'schedule', label: 'Horários', icon: Clock },
    { key: 'visual', label: 'Visual', icon: Palette },
    { key: 'texts', label: 'Textos', icon: FileText },
  ] as const;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Configurações</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Personalize seu sistema</p>
          </div>
          <button onClick={handleMainSave} disabled={saving}
            className="flex-shrink-0 flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg transition text-sm disabled:opacity-50">
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Salvar Alterações</span>
            <span className="sm:hidden">Salvar</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 md:px-5 py-3 border-b-2 transition whitespace-nowrap text-xs md:text-sm flex-shrink-0 ${
                activeTab === key ? 'border-primary-500 text-primary-600 font-medium' : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}>
              <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6">

          {/* ── Empresa ── */}
          {activeTab === 'company' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Dados da Empresa</h3>
              <p className="text-sm text-gray-500 mb-4">Estas informações aparecem na página pública de agendamento dos seus clientes.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  { label: 'Nome da Empresa', field: 'name', type: 'text', placeholder: 'Ex: Studio Tattoo Silva' },
                  { label: 'Email de Contato', field: 'email', type: 'email', placeholder: 'contato@empresa.com' },
                  { label: 'Telefone / WhatsApp', field: 'phone', type: 'text', placeholder: '(41) 99999-9999' },
                  { label: 'Endereço', field: 'address', type: 'text', placeholder: 'Rua, número, bairro' },
                ] as const).map(({ label, field, type, placeholder }) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                    <input type={type} value={companyData[field]} placeholder={placeholder}
                      onChange={e => setCompanyData({ ...companyData, [field]: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Serviços ── */}
          {activeTab === 'services' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Serviços Disponíveis</h3>
              <p className="text-sm text-gray-500 mb-4">Estes serviços aparecem na página pública para seus clientes agendarem.</p>
              <div className="space-y-3 mb-6">
                {(config.services || []).length === 0 && (
                  <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                    <Scissors className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Nenhum serviço cadastrado. Adicione abaixo.</p>
                  </div>
                )}
                {(config.services || []).map((s, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg space-y-3">
                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Nome do Serviço</label>
                        <input type="text" value={s.name} onChange={e => updateService(i, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
                      </div>
                      <button onClick={() => removeService(i)} className="mt-5 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Preço (R$)</label>
                        <input type="number" min="0" step="0.01" value={s.price || ''}
                          onChange={e => updateService(i, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Duração (min)</label>
                        <input type="number" min="5" step="5" value={s.duration || ''}
                          onChange={e => updateService(i, 'duration', parseInt(e.target.value) || 60)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="text-xs text-gray-500 mb-1 block">Descrição (opcional)</label>
                        <input type="text" value={s.description || ''} onChange={e => updateService(i, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400" placeholder="Ex: Inclui retoque" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Adicionar novo serviço</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Nome *</label>
                    <input type="text" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })}
                      placeholder="Ex: Tatuagem Pequena"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Preço (R$)</label>
                      <input type="number" min="0" step="0.01" value={newService.price || ''}
                        onChange={e => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Duração (min)</label>
                      <input type="number" min="5" step="5" value={newService.duration}
                        onChange={e => setNewService({ ...newService, duration: parseInt(e.target.value) || 60 })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Descrição (opcional)</label>
                    <input type="text" value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })}
                      placeholder="Breve descrição do serviço"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
                  </div>
                  <button onClick={addService}
                    className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm transition font-medium">
                    <Plus className="w-4 h-4" /> Adicionar Serviço
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">* Clique em "Salvar Alterações" para confirmar.</p>
            </div>
          )}

          {/* ── Horários ── */}
          {activeTab === 'schedule' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Horário de Funcionamento</h3>
              <p className="text-sm text-gray-500 mb-4">Deixe em branco para marcar o dia como fechado. Exibido na página pública.</p>
              <div className="space-y-3">
                {Object.entries(config.business_hours).map(([day, hours]) => (
                  <div key={day} className="p-4 border border-gray-200 rounded-lg">
                    <p className="font-medium text-gray-800 mb-3">{DAY_LABELS[day] || day}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Abertura</label>
                        <input type="time" value={hours.open || ''}
                          onChange={e => setConfig({ ...config, business_hours: { ...config.business_hours, [day]: { ...hours, open: e.target.value || null } } })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Fechamento</label>
                        <input type="time" value={hours.close || ''}
                          onChange={e => setConfig({ ...config, business_hours: { ...config.business_hours, [day]: { ...hours, close: e.target.value || null } } })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                      </div>
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
              <p className="text-sm text-gray-500 mb-6">A cor escolhida será aplicada na página pública de agendamento dos seus clientes.</p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Cor Primária</label>
                <div className="flex flex-wrap gap-3 mb-4">
                  {PRESET_COLORS.map(color => (
                    <button key={color} onClick={() => setCompanyData({ ...companyData, primary_color: color })}
                      style={{ backgroundColor: color }}
                      className={`w-10 h-10 rounded-full transition hover:scale-110 ${companyData.primary_color === color ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : ''}`} />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input type="color" value={companyData.primary_color}
                    onChange={e => setCompanyData({ ...companyData, primary_color: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer flex-shrink-0" />
                  <input type="text" value={companyData.primary_color}
                    onChange={e => setCompanyData({ ...companyData, primary_color: e.target.value })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-primary-400" />
                  <div className="flex-1 h-10 rounded-lg border border-gray-200" style={{ backgroundColor: companyData.primary_color }} />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Preview da Página Pública</label>
                <div className="border border-gray-200 rounded-xl overflow-hidden max-w-xs">
                  <div style={{ backgroundColor: companyData.primary_color }} className="p-4 text-center text-white">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold mx-auto mb-2">
                      {companyData.name.charAt(0).toUpperCase() || 'E'}
                    </div>
                    <p className="font-bold">{companyData.name || 'Nome da Empresa'}</p>
                    <p className="text-white/70 text-xs">Seu negócio</p>
                  </div>
                  <div className="p-4 bg-gray-50">
                    <div className="w-full py-2 rounded-lg text-white text-sm font-medium text-center"
                      style={{ backgroundColor: companyData.primary_color }}>Agendar agora</div>
                  </div>
                </div>
              </div>
              <div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-1">Imagem de Fundo do Header</label>
  <p className="text-xs text-gray-500 mb-3">Substitui a cor sólida por uma foto no cabeçalho da página pública. PNG ou JPEG, máx. 2MB.</p>
  <div className="flex items-center gap-3">
    <label className="cursor-pointer flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm transition border border-gray-300">
      <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleHeaderImageUpload} />
      📷 Selecionar foto
    </label>
    {companyData.header_image_url && (
      <button onClick={() => setCompanyData({ ...companyData, header_image_url: '' })}
        className="text-xs text-red-500 hover:text-red-700 transition">
        ✕ Remover imagem
      </button>
    )}
  </div>
  {companyData.header_image_url && (
    <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 max-w-xs h-24 relative">
      <img src={companyData.header_image_url} alt="Preview header" className="w-full h-full object-cover" />
    </div>
  )}
</div>

{/* Preview */}
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-3">Preview da Página Pública</label>
  <div className="border border-gray-200 rounded-xl overflow-hidden max-w-xs">
    <div
      style={companyData.header_image_url
        ? { backgroundImage: `url(${companyData.header_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { backgroundColor: companyData.primary_color }}
      className="p-4 text-center text-white relative">
      <div className="absolute inset-0 bg-black/20 rounded-t-xl" />
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold mx-auto mb-2">
          {companyData.name.charAt(0).toUpperCase() || 'E'}
        </div>
        <p className="font-bold">{companyData.name || 'Nome da Empresa'}</p>
        <p className="text-white/70 text-xs">Seu negócio</p>
      </div>
    </div>
    <div className="p-4 bg-gray-50">
      <div className="w-full py-2 rounded-lg text-white text-sm font-medium text-center"
        style={{ backgroundColor: companyData.primary_color }}>Agendar agora</div>
    </div>
  </div>
</div>
              <p className="text-xs text-gray-400">* Clique em "Salvar Alterações" para aplicar a cor na página pública.</p>
            </div>
          )}

          {/* ── Textos ── */}
          {activeTab === 'texts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Textos Personalizados</h3>
              <p className="text-sm text-gray-500 mb-4">Estes textos são exibidos na página pública de agendamento dos seus clientes.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem de Boas-vindas</label>
                <p className="text-xs text-gray-400 mb-2">Aparece no topo da página pública, abaixo do nome da empresa.</p>
                <textarea value={config.public_text?.welcome || ''}
                  onChange={e => setConfig({ ...config, public_text: { ...config.public_text, welcome: e.target.value } })}
                  rows={4} placeholder="Ex: Bem-vindo ao nosso estúdio! Agende seu horário com facilidade."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rodapé</label>
                <p className="text-xs text-gray-400 mb-2">Aparece no final da página pública. Ideal para políticas e informações de pagamento.</p>
                <textarea value={config.public_text?.footer || ''}
                  onChange={e => setConfig({ ...config, public_text: { ...config.public_text, footer: e.target.value } })}
                  rows={4} placeholder="Ex: Trabalhamos apenas com agendamento. Entrada proibida para menores de 18 anos."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm" />
              </div>
              <p className="text-xs text-gray-400">* Clique em "Salvar Alterações" para publicar os textos na página pública.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
