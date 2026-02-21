import { useState, useEffect } from 'react';
import {
  TrendingUp, Plus, Search, Filter, CheckCircle2,
  Clock, AlertTriangle, Trash2, X, ChevronDown, DollarSign
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import type { AccountReceivable } from '../../types';

interface Category {
  id: number;
  name: string;
  type: string;
}

interface Customer {
  id: number;
  name: string;
}

const isOverdue = (dueDate: string, status: string) => {
  if (status !== 'pending') return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
};

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  received: 'Recebido',
  overdue: 'Vencido',
};

const recurrenceLabel: Record<string, string> = {
  once: 'Uma vez',
  monthly: 'Mensal',
  weekly: 'Semanal',
  yearly: 'Anual',
};

export default function Receivables() {
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeCard, setActiveCard] = useState<'pending' | 'overdue' | 'received' | null>(null);

  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState<AccountReceivable | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<AccountReceivable | null>(null);

  // Form criar
  const [form, setForm] = useState({
    customer_id: '',
    category_id: '',
    description: '',
    amount: '',
    due_date: '',
    payment_method: '',
    recurrence: 'once',
    notes: '',
  });

  // Form receber
  const [receiveForm, setReceiveForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recRes, catRes, custRes] = await Promise.all([
        api.get('/financial/receivables'),
        api.get('/financial/categories'),
        api.get('/customers'),
      ]);
      const recs = recRes.data.receivables ?? recRes.data ?? [];
      const cats = catRes.data.categories ?? catRes.data ?? [];
      const custs = custRes.data.customers ?? custRes.data ?? [];
      setReceivables(Array.isArray(recs) ? recs : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setCustomers(Array.isArray(custs) ? custs : []);
    } catch (err) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.description || !form.amount || !form.due_date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    const tid = toast.loading('Criando conta...');
    try {
      await api.post('/financial/receivables', {
        ...form,
        amount: parseFloat(form.amount),
        customer_id: form.customer_id ? parseInt(form.customer_id) : null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
      });
      toast.success('Conta criada com sucesso!', { id: tid });
      setShowCreateModal(false);
      setForm({ customer_id: '', category_id: '', description: '', amount: '', due_date: '', payment_method: '', recurrence: 'once', notes: '' });
      loadData();
    } catch {
      toast.error('Erro ao criar conta', { id: tid });
    }
  };

  const handleReceive = async () => {
    if (!showReceiveModal) return;
    const tid = toast.loading('Marcando como recebido...');
    try {
      await api.post(`/financial/receivables/${showReceiveModal.id}/receive`, receiveForm);
      toast.success('Conta marcada como recebida!', { id: tid });
      setShowReceiveModal(null);
      loadData();
    } catch {
      toast.error('Erro ao marcar como recebido', { id: tid });
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    const tid = toast.loading('Excluindo...');
    try {
      await api.delete(`/financial/receivables/${showDeleteModal.id}`);
      toast.success('Conta excluída!', { id: tid });
      setShowDeleteModal(null);
      loadData();
    } catch {
      toast.error('Erro ao excluir conta', { id: tid });
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setActiveCard(null);
  };

  // Estatísticas
  const pending = receivables.filter(r => r.status === 'pending' && !isOverdue(r.due_date, r.status));
  const overdue = receivables.filter(r => isOverdue(r.due_date, r.status) || r.status === 'overdue');
  const received = receivables.filter(r => r.status === 'received');

  const totalPending = pending.reduce((s, r) => s + parseFloat(String(r.amount)), 0);
  const totalOverdue = overdue.reduce((s, r) => s + parseFloat(String(r.amount)), 0);
  const totalReceived = received.reduce((s, r) => s + parseFloat(String(r.amount)), 0);

  // Filtrar lista
  const filtered = receivables.filter(r => {
    const effectiveStatus = isOverdue(r.due_date, r.status) ? 'overdue' : r.status;

    if (activeCard === 'pending' && effectiveStatus !== 'pending') return false;
    if (activeCard === 'overdue' && effectiveStatus !== 'overdue') return false;
    if (activeCard === 'received' && effectiveStatus !== 'received') return false;

    if (statusFilter && effectiveStatus !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const customerName = customers.find(c => c.id === r.customer_id)?.name ?? '';
      if (!r.description?.toLowerCase().includes(q) && !customerName.toLowerCase().includes(q)) return false;
    }
    if (dateFrom && r.due_date < dateFrom) return false;
    if (dateTo && r.due_date > dateTo) return false;
    return true;
  });

  const formatCurrency = (v: number | string) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v));

  const formatDate = (d: string) => {
    try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR'); } catch { return d; }
  };

  const inputClass = "w-full bg-[#0d1627] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 placeholder-white/30";

  return (
    <div className="min-h-screen bg-[#0d1627] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Contas a Receber</h1>
            <p className="text-white/50 text-sm">Gerencie seus recebimentos</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" /> Nova Conta
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Pendentes */}
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
          <p className="text-white/40 text-xs mt-1">{pending.length} conta{pending.length !== 1 ? 's' : ''}</p>
        </button>

        {/* Vencidos */}
        <button
          onClick={() => setActiveCard(activeCard === 'overdue' ? null : 'overdue')}
          className={`bg-white/[0.03] border rounded-xl p-5 text-left transition hover:-translate-y-0.5 ${activeCard === 'overdue' ? 'border-red-500/50 bg-red-500/5' : 'border-white/8 hover:border-white/15'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-white/60 text-sm font-medium">Vencidos</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totalOverdue)}</p>
          <p className="text-white/40 text-xs mt-1">{overdue.length} conta{overdue.length !== 1 ? 's' : ''}</p>
        </button>

        {/* Recebidos */}
        <button
          onClick={() => setActiveCard(activeCard === 'received' ? null : 'received')}
          className={`bg-white/[0.03] border rounded-xl p-5 text-left transition hover:-translate-y-0.5 ${activeCard === 'received' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/8 hover:border-white/15'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-white/60 text-sm font-medium">Recebidos</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalReceived)}</p>
          <p className="text-white/40 text-xs mt-1">{received.length} conta{received.length !== 1 ? 's' : ''}</p>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Buscar por cliente ou descrição..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0d1627] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 placeholder-white/30"
            />
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="bg-[#0d1627] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 [color-scheme:dark]" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="bg-[#0d1627] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 [color-scheme:dark]" />
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-[#0d1627] border border-white/10 rounded-lg pl-9 pr-8 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 appearance-none">
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="received">Recebido</option>
              <option value="overdue">Vencido</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          </div>
          {(search || statusFilter || dateFrom || dateTo || activeCard) && (
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
            <TrendingUp className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">Nenhuma conta encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-6 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Cliente / Descrição</th>
                  <th className="text-left px-6 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Vencimento</th>
                  <th className="text-right px-6 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Valor</th>
                  <th className="text-left px-6 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Categoria</th>
                  <th className="text-left px-6 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(r => {
                  const overdueBadge = isOverdue(r.due_date, r.status);
                  const effectiveStatus = overdueBadge ? 'overdue' : r.status;
                  const customerName = customers.find(c => c.id === r.customer_id)?.name;

                  return (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium text-sm">{customerName || '—'}</p>
                        <p className="text-white/50 text-xs mt-0.5">{r.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${overdueBadge ? 'text-red-400' : 'text-white/70'}`}>
                          {formatDate(r.due_date)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white font-semibold text-sm">{formatCurrency(r.amount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/50 text-sm">
                          {categories.find(c => c.id === r.category_id)?.name ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          effectiveStatus === 'received' ? 'bg-emerald-500/15 text-emerald-400' :
                          effectiveStatus === 'overdue' ? 'bg-red-500/15 text-red-400' :
                          'bg-amber-500/15 text-amber-400'
                        }`}>
                          {effectiveStatus === 'received' && <CheckCircle2 className="w-3 h-3" />}
                          {effectiveStatus === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                          {effectiveStatus === 'pending' && <Clock className="w-3 h-3" />}
                          {statusLabel[effectiveStatus] ?? effectiveStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {r.status !== 'received' && (
                            <button
                              onClick={() => { setShowReceiveModal(r); setReceiveForm({ payment_date: new Date().toISOString().split('T')[0], payment_method: '' }); }}
                              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs px-2 py-1 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition"
                            >
                              <DollarSign className="w-3 h-3" /> Receber
                            </button>
                          )}
                          <button
                            onClick={() => setShowDeleteModal(r)}
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

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-white/8 flex items-center justify-between">
            <span className="text-white/40 text-xs">{filtered.length} conta{filtered.length !== 1 ? 's' : ''}</span>
            <span className="text-white/60 text-sm font-medium">
              Total: {formatCurrency(filtered.reduce((s, r) => s + parseFloat(String(r.amount)), 0))}
            </span>
          </div>
        )}
      </div>

      {/* Modal: Criar */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131c2e] border border-white/10 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h2 className="text-white font-semibold">Nova Conta a Receber</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-white/40 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Cliente</label>
                  <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))} className={inputClass}>
                    <option value="">Sem cliente</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Categoria</label>
                  <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className={inputClass}>
                    <option value="">Sem categoria</option>
                    {categories.filter(c => c.type === 'income').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Descrição *</label>
                <input type="text" placeholder="Ex: Serviço de consultoria" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Valor (R$) *</label>
                  <input type="number" step="0.01" min="0" placeholder="0,00" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Vencimento *</label>
                  <input type="date" value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className={inputClass + ' [color-scheme:dark]'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Forma de recebimento</label>
                  <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} className={inputClass}>
                    <option value="">Não definido</option>
                    <option value="pix">PIX</option>
                    <option value="transferencia">Transferência</option>
                    <option value="boleto">Boleto</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Recorrência</label>
                  <select value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))} className={inputClass}>
                    {Object.entries(recurrenceLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
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
                className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm transition">
                Cancelar
              </button>
              <button onClick={handleCreate}
                className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition">
                Criar Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Receber */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131c2e] border border-white/10 rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h2 className="text-white font-semibold">Confirmar Recebimento</h2>
              <button onClick={() => setShowReceiveModal(null)} className="text-white/40 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <p className="text-white/60 text-xs">Conta</p>
                <p className="text-white font-medium">{showReceiveModal.description}</p>
                <p className="text-emerald-400 font-bold text-lg mt-1">{formatCurrency(showReceiveModal.amount)}</p>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Data do recebimento</label>
                <input type="date" value={receiveForm.payment_date}
                  onChange={e => setReceiveForm(f => ({ ...f, payment_date: e.target.value }))}
                  className={inputClass + ' [color-scheme:dark]'} />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Forma de recebimento</label>
                <select value={receiveForm.payment_method}
                  onChange={e => setReceiveForm(f => ({ ...f, payment_method: e.target.value }))} className={inputClass}>
                  <option value="">Não informado</option>
                  <option value="pix">PIX</option>
                  <option value="transferencia">Transferência</option>
                  <option value="boleto">Boleto</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowReceiveModal(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white text-sm transition">
                Cancelar
              </button>
              <button onClick={handleReceive}
                className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition">
                Confirmar Recebimento
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
              <h2 className="text-white font-semibold text-center mb-2">Excluir Conta</h2>
              <p className="text-white/50 text-sm text-center">
                Tem certeza que deseja excluir <strong className="text-white">{showDeleteModal.description}</strong>?
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
