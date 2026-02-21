import { useState, useEffect } from 'react';
import {
  FileText, Plus, Search, Filter, CheckCircle2,
  Clock, XCircle, Trash2, X, ChevronDown, Edit2,
  TrendingUp, TrendingDown
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

interface Invoice {
  id: number;
  customer_id?: number;
  transaction_id?: number;
  invoice_number: string;
  invoice_type: string;
  status: string;
  issue_date: string;
  amount: number;
  tax_amount?: number;
  description?: string;
  access_key?: string;
  notes?: string;
}

interface Customer {
  id: number;
  name: string;
}

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  issued: 'Emitida',
  cancelled: 'Cancelada',
};

const typeLabel: Record<string, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  service: 'Serviço',
};

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeCard, setActiveCard] = useState<'pending' | 'issued' | 'cancelled' | null>(null);

  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Invoice | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Invoice | null>(null);

  // Form criar
  const emptyForm = {
    customer_id: '',
    invoice_number: '',
    invoice_type: 'saida',
    status: 'pending',
    issue_date: new Date().toISOString().split('T')[0],
    amount: '',
    tax_amount: '',
    description: '',
    access_key: '',
    notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  // Form editar
  const [editForm, setEditForm] = useState({
    status: '',
    access_key: '',
    notes: '',
    validation_date: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, custRes] = await Promise.all([
        api.get('/financial/invoices'),
        api.get('/customers'),
      ]);
      const invs = invRes.data.invoices ?? invRes.data ?? [];
      const custs = custRes.data.customers ?? custRes.data ?? [];
      setInvoices(Array.isArray(invs) ? invs : []);
      setCustomers(Array.isArray(custs) ? custs : []);
    } catch {
      toast.error('Erro ao carregar notas fiscais');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.invoice_number || !form.amount || !form.issue_date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    const tid = toast.loading('Criando nota fiscal...');
    try {
      await api.post('/financial/invoices', {
        ...form,
        amount: parseFloat(form.amount),
        tax_amount: form.tax_amount ? parseFloat(form.tax_amount) : null,
        customer_id: form.customer_id ? parseInt(form.customer_id) : null,
      });
      toast.success('Nota fiscal criada!', { id: tid });
      setShowCreateModal(false);
      setForm(emptyForm);
      loadData();
    } catch {
      toast.error('Erro ao criar nota fiscal', { id: tid });
    }
  };

  const handleEdit = async () => {
    if (!showEditModal) return;
    const tid = toast.loading('Atualizando...');
    try {
      await api.put(`/financial/invoices/${showEditModal.id}`, editForm);
      toast.success('Nota fiscal atualizada!', { id: tid });
      setShowEditModal(null);
      loadData();
    } catch {
      toast.error('Erro ao atualizar nota fiscal', { id: tid });
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    const tid = toast.loading('Excluindo...');
    try {
      await api.delete(`/financial/invoices/${showDeleteModal.id}`);
      toast.success('Nota fiscal excluída!', { id: tid });
      setShowDeleteModal(null);
      loadData();
    } catch {
      toast.error('Erro ao excluir nota fiscal', { id: tid });
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setDateFrom('');
    setDateTo('');
    setActiveCard(null);
  };

  // Estatísticas
  const pending = invoices.filter(i => i.status === 'pending');
  const issued = invoices.filter(i => i.status === 'issued');
  const cancelled = invoices.filter(i => i.status === 'cancelled');

  const totalIssued = issued.reduce((s, i) => s + parseFloat(String(i.amount)), 0);
  const totalPending = pending.reduce((s, i) => s + parseFloat(String(i.amount)), 0);
  const totalCancelled = cancelled.reduce((s, i) => s + parseFloat(String(i.amount)), 0);

  // Filtrar
  const filtered = invoices.filter(i => {
    if (activeCard && i.status !== activeCard) return false;
    if (statusFilter && i.status !== statusFilter) return false;
    if (typeFilter && i.invoice_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const custName = customers.find(c => c.id === i.customer_id)?.name ?? '';
      if (
        !i.invoice_number?.toLowerCase().includes(q) &&
        !i.description?.toLowerCase().includes(q) &&
        !custName.toLowerCase().includes(q) &&
        !i.access_key?.toLowerCase().includes(q)
      ) return false;
    }
    if (dateFrom && i.issue_date < dateFrom) return false;
    if (dateTo && i.issue_date > dateTo) return false;
    return true;
  });

  const formatCurrency = (v: number | string) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v));

  const formatDate = (d: string) => {
    try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR'); } catch { return d; }
  };

  const inputClass = "w-full bg-[#0d1627] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50 placeholder-white/30";

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg: Record<string, { cls: string; icon: React.ReactNode }> = {
      pending: { cls: 'bg-amber-500/15 text-amber-400', icon: <Clock className="w-3 h-3" /> },
      issued:  { cls: 'bg-emerald-500/15 text-emerald-400', icon: <CheckCircle2 className="w-3 h-3" /> },
      cancelled: { cls: 'bg-red-500/15 text-red-400', icon: <XCircle className="w-3 h-3" /> },
    };
    const c = cfg[status] ?? cfg.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.cls}`}>
        {c.icon}{statusLabel[status] ?? status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0d1627] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Notas Fiscais</h1>
            <p className="text-white/50 text-sm">Gerencie suas notas fiscais</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" /> Nova Nota
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setActiveCard(activeCard === 'issued' ? null : 'issued')}
          className={`bg-white/[0.03] border rounded-xl p-5 text-left transition hover:-translate-y-0.5 ${activeCard === 'issued' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/8 hover:border-white/15'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-white/60 text-sm font-medium">Emitidas</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalIssued)}</p>
          <p className="text-white/40 text-xs mt-1">{issued.length} nota{issued.length !== 1 ? 's' : ''}</p>
        </button>

        <button
          onClick={() => setActiveCard(activeCard === 'pending' ? null : 'pending')}
          className={`bg-white/[0.03] border rounded-xl p-5 text-left transition hover:-translate-y-0.5 ${activeCard === 'pending' ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/8 hover:border-white/15'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-white/60 text-sm font-medium">Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{formatCurrency(totalPending)}</p>
          <p className="text-white/40 text-xs mt-1">{pending.length} nota{pending.length !== 1 ? 's' : ''}</p>
        </button>

        <button
          onClick={() => setActiveCard(activeCard === 'cancelled' ? null : 'cancelled')}
          className={`bg-white/[0.03] border rounded-xl p-5 text-left transition hover:-translate-y-0.5 ${activeCard === 'cancelled' ? 'border-red-500/50 bg-red-500/5' : 'border-white/8 hover:border-white/15'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-white/60 text-sm font-medium">Canceladas</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totalCancelled)}</p>
          <p className="text-white/40 text-xs mt-1">{cancelled.length} nota{cancelled.length !== 1 ? 's' : ''}</p>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Buscar por número, cliente, chave..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0d1627] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50 placeholder-white/30"
            />
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="bg-[#0d1627] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50 [color-scheme:dark]" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="bg-[#0d1627] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50 [color-scheme:dark]" />
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-[#0d1627] border border-white/10 rounded-lg pl-9 pr-8 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50 appearance-none">
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="issued">Emitida</option>
              <option value="cancelled">Cancelada</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="bg-[#0d1627] border border-white/10 rounded-lg px-3 pr-8 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50 appearance-none">
              <option value="">Todos os tipos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
              <option value="service">Serviço</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          </div>
          {(search || statusFilter || typeFilter || dateFrom || dateTo || activeCard) && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-white/50 hover:text-white text-sm px-3 py-2 rounded-lg border border-white/10 hover:border-white/20 transition">
              <X className="w-4 h-4" /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/40">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">Nenhuma nota fiscal encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-6 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Número / Cliente</th>
                  <th className="text-left px-6 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-6 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Emissão</th>
                  <th className="text-right px-6 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Valor</th>
                  <th className="text-right px-6 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Impostos</th>
                  <th className="text-left px-6 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(inv => {
                  const custName = customers.find(c => c.id === inv.customer_id)?.name;
                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            inv.invoice_type === 'entrada' ? 'bg-emerald-500/15' : inv.invoice_type === 'saida' ? 'bg-red-500/15' : 'bg-blue-500/15'
                          }`}>
                            {inv.invoice_type === 'entrada'
                              ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                              : inv.invoice_type === 'saida'
                              ? <TrendingDown className="w-4 h-4 text-red-400" />
                              : <FileText className="w-4 h-4 text-blue-400" />
                            }
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">#{inv.invoice_number}</p>
                            <p className="text-white/50 text-xs mt-0.5">{custName ?? inv.description ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                          inv.invoice_type === 'entrada' ? 'bg-emerald-500/10 text-emerald-400' :
                          inv.invoice_type === 'saida' ? 'bg-red-500/10 text-red-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          {typeLabel[inv.invoice_type] ?? inv.invoice_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/70 text-sm">{formatDate(inv.issue_date)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white font-semibold text-sm">{formatCurrency(inv.amount)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white/50 text-sm">
                          {inv.tax_amount ? formatCurrency(inv.tax_amount) : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setShowEditModal(inv);
                              setEditForm({ status: inv.status, access_key: inv.access_key ?? '', notes: inv.notes ?? '', validation_date: '' });
                            }}
                            className="text-white/30 hover:text-violet-400 p-1.5 rounded-lg hover:bg-violet-500/10 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(inv)}
                            className="text-white/30 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-white/8 flex items-center justify-between">
            <span className="text-white/40 text-xs">{filtered.length} nota{filtered.length !== 1 ? 's' : ''}</span>
            <span className="text-white/60 text-sm font-medium">
              Total: {formatCurrency(filtered.reduce((s, i) => s + parseFloat(String(i.amount)), 0))}
            </span>
          </div>
        )}
      </div>

      {/* Modal: Criar */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131c2e] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h2 className="text-white font-semibold">Nova Nota Fiscal</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-white/40 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Número da Nota *</label>
                  <input type="text" placeholder="Ex: 000001" value={form.invoice_number}
                    onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Tipo</label>
                  <select value={form.invoice_type} onChange={e => setForm(f => ({ ...f, invoice_type: e.target.value }))} className={inputClass}>
                    <option value="saida">Saída</option>
                    <option value="entrada">Entrada</option>
                    <option value="service">Serviço</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Cliente</label>
                  <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))} className={inputClass}>
                    <option value="">Sem cliente</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputClass}>
                    <option value="pending">Pendente</option>
                    <option value="issued">Emitida</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Descrição</label>
                <input type="text" placeholder="Descrição do serviço ou produto" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Valor (R$) *</label>
                  <input type="number" step="0.01" min="0" placeholder="0,00" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Impostos (R$)</label>
                  <input type="number" step="0.01" min="0" placeholder="0,00" value={form.tax_amount}
                    onChange={e => setForm(f => ({ ...f, tax_amount: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Data de Emissão *</label>
                <input type="date" value={form.issue_date}
                  onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))}
                  className={inputClass + ' [color-scheme:dark]'} />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Chave de Acesso</label>
                <input type="text" placeholder="44 dígitos da chave de acesso" value={form.access_key}
                  onChange={e => setForm(f => ({ ...f, access_key: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Observações</label>
                <textarea placeholder="Notas adicionais..." value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className={inputClass + ' resize-none'} />
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white text-sm transition">
                Cancelar
              </button>
              <button onClick={handleCreate}
                className="flex-1 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition">
                Criar Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131c2e] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <div>
                <h2 className="text-white font-semibold">Editar Nota #{showEditModal.invoice_number}</h2>
                <p className="text-white/40 text-xs mt-0.5">{formatCurrency(showEditModal.amount)}</p>
              </div>
              <button onClick={() => setShowEditModal(null)} className="text-white/40 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-white/60 text-xs mb-1 block">Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className={inputClass}>
                  <option value="pending">Pendente</option>
                  <option value="issued">Emitida</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Chave de Acesso</label>
                <input type="text" placeholder="44 dígitos" value={editForm.access_key}
                  onChange={e => setEditForm(f => ({ ...f, access_key: e.target.value }))} className={inputClass} />
              </div>
              {editForm.status === 'issued' && (
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Data de Validação</label>
                  <input type="date" value={editForm.validation_date}
                    onChange={e => setEditForm(f => ({ ...f, validation_date: e.target.value }))}
                    className={inputClass + ' [color-scheme:dark]'} />
                </div>
              )}
              <div>
                <label className="text-white/60 text-xs mb-1 block">Observações</label>
                <textarea placeholder="Notas adicionais..." value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className={inputClass + ' resize-none'} />
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowEditModal(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white text-sm transition">
                Cancelar
              </button>
              <button onClick={handleEdit}
                className="flex-1 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Excluir */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131c2e] border border-white/10 rounded-2xl w-full max-w-sm">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-white font-semibold text-center mb-2">Excluir Nota Fiscal</h2>
              <p className="text-white/50 text-sm text-center">
                Tem certeza que deseja excluir a nota <strong className="text-white">#{showDeleteModal.invoice_number}</strong>?
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white text-sm transition">
                Cancelar
              </button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
