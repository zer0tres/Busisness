import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  X,
  ChevronDown,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import type { AccountPayable } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PayableFilters {
  status: string;
  start_date: string;
  end_date: string;
  search: string;
}

interface PayableFormData {
  supplier_name: string;
  description: string;
  amount: string;
  due_date: string;
  category_id: string;
  notes: string;
}

interface FinancialCategory {
  id: number;
  name: string;
  type: string;
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label: 'Pendente',
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
    dot: 'bg-amber-400',
  },
  paid: {
    label: 'Pago',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/30',
    dot: 'bg-emerald-400',
  },
  overdue: {
    label: 'Vencido',
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/30',
    dot: 'bg-red-400',
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR');
};

const isOverdue = (dueDate: string, status: string) => {
  if (status === 'paid') return false;
  return new Date(dueDate + 'T23:59:59') < new Date();
};

const getEffectiveStatus = (payable: AccountPayable): keyof typeof STATUS_CONFIG => {
  if (payable.status === 'paid') return 'paid';
  if (isOverdue(payable.due_date, payable.status)) return 'overdue';
  return 'pending';
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function SummaryCard({
  title,
  value,
  count,
  status,
  active,
  onClick,
}: {
  title: string;
  value: number;
  count: number;
  status: string;
  active: boolean;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  return (
    <button
      onClick={onClick}
      className={`
        relative flex-1 min-w-[200px] p-5 rounded-2xl border text-left transition-all duration-200
        ${active ? `${cfg.bg} ${cfg.border} ring-1 ring-inset ${cfg.border}` : 'bg-white/5 border-white/10 hover:bg-white/8'}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400 font-medium">{title}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-bold ${cfg.bg} ${cfg.color} border ${cfg.border}`}
        >
          {count}
        </span>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${active ? cfg.color : 'text-white'}`}>
        {formatCurrency(value)}
      </p>
    </button>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );
}

// ─── Modal: Confirmar pagamento ────────────────────────────────────────────────

function ConfirmPayDialog({
  payable,
  onConfirm,
  onCancel,
  loading,
}: {
  payable: AccountPayable;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#1a2236] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Confirmar Pagamento</h3>
            <p className="text-xs text-slate-400">Esta ação não pode ser desfeita</p>
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 mb-5 space-y-1.5">
          <p className="text-sm text-slate-300">
            <span className="text-slate-500">Fornecedor:</span>{' '}
            <span className="font-semibold text-white">{payable.supplier_name}</span>
          </p>
          <p className="text-sm text-slate-300">
            <span className="text-slate-500">Vencimento:</span> {formatDate(payable.due_date)}
          </p>
          <p className="text-sm">
            <span className="text-slate-500">Valor:</span>{' '}
            <span className="text-emerald-400 font-bold text-base">{formatCurrency(payable.amount)}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Criar conta ────────────────────────────────────────────────────────

function CreatePayableModal({
  categories,
  onClose,
  onSuccess,
}: {
  categories: FinancialCategory[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<PayableFormData>({
    supplier_name: '',
    description: '',
    amount: '',
    due_date: '',
    category_id: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (field: keyof PayableFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier_name || !form.amount || !form.due_date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    setLoading(true);
    const id = toast.loading('Criando conta a pagar...');
    try {
      await api.post('/financial/payables', {
        supplier_name: form.supplier_name,
        description: form.description || null,
        amount: parseFloat(form.amount),
        due_date: form.due_date,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        notes: form.notes || null,
      });
      toast.success('Conta criada com sucesso!', { id });
      onSuccess();
      onClose();
    } catch {
      toast.error('Erro ao criar conta', { id });
    } finally {
      setLoading(false);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#131c2e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <TrendingDown size={15} className="text-red-400" />
            </div>
            <h2 className="font-bold text-white">Nova Conta a Pagar</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Fornecedor */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Fornecedor <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={form.supplier_name}
                onChange={set('supplier_name')}
                placeholder="Nome do fornecedor"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Descrição</label>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={form.description}
                onChange={set('description')}
                placeholder="Ex: Aluguel de outubro, Conta de luz..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
          </div>

          {/* Valor + Vencimento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Valor <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">R$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={set('amount')}
                  placeholder="0,00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Vencimento <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="date"
                  value={form.due_date}
                  onChange={set('due_date')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Categoria</label>
            <div className="relative">
              <select
                value={form.category_id}
                onChange={set('category_id')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none [color-scheme:dark]"
              >
                <option value="">Sem categoria</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Observações</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={2}
              placeholder="Informações adicionais..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Criar Conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function Payables() {
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [confirmPay, setConfirmPay] = useState<AccountPayable | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AccountPayable | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filters, setFilters] = useState<PayableFilters>({
    status: '',
    start_date: '',
    end_date: '',
    search: '',
  });

  const fetchPayables = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      const res = await api.get(`/financial/payables?${params}`);
      setPayables(res.data.data || []);
    } catch {
      toast.error('Erro ao carregar contas a pagar');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.start_date, filters.end_date]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/financial/categories');
      setCategories(res.data.data || []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchPayables();
    fetchCategories();
  }, [fetchPayables]);

  const handlePay = async () => {
    if (!confirmPay) return;
    setPayingId(confirmPay.id);
    const id = toast.loading('Registrando pagamento...');
    try {
      await api.post(`/financial/payables/${confirmPay.id}/pay`);
      toast.success('Pagamento registrado!', { id });
      fetchPayables();
    } catch {
      toast.error('Erro ao registrar pagamento', { id });
    } finally {
      setPayingId(null);
      setConfirmPay(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    const id = toast.loading('Excluindo...');
    try {
      await api.delete(`/financial/payables/${confirmDelete.id}`);
      toast.success('Conta excluída', { id });
      fetchPayables();
    } catch {
      toast.error('Erro ao excluir conta', { id });
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  // Computed summaries
  const enriched = payables.map((p) => ({ ...p, effectiveStatus: getEffectiveStatus(p) }));

  const filtered = enriched.filter((p) => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return (
      p.supplier_name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  const total = (status: string) =>
    enriched.filter((p) => p.effectiveStatus === status).reduce((s, p) => s + p.amount, 0);
  const count = (status: string) => enriched.filter((p) => p.effectiveStatus === status).length;

  const summaries = [
    { key: 'pending', title: 'Pendentes', value: total('pending'), count: count('pending') },
    { key: 'overdue', title: 'Vencidos', value: total('overdue'), count: count('overdue') },
    { key: 'paid', title: 'Pagos', value: total('paid'), count: count('paid') },
  ];

  return (
    <div className="min-h-screen bg-[#0d1627] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <TrendingDown size={17} className="text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Contas a Pagar</h1>
            </div>
            <p className="text-slate-500 text-sm ml-12">Gerencie suas obrigações financeiras</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={15} />
            Nova Conta
          </button>
        </div>

        {/* Summary cards */}
        <div className="flex gap-4 flex-wrap mb-8">
          {summaries.map((s) => (
            <SummaryCard
              key={s.key}
              title={s.title}
              value={s.value}
              count={s.count}
              status={s.key}
              active={filters.status === s.key}
              onClick={() =>
                setFilters((prev) => ({ ...prev, status: prev.status === s.key ? '' : s.key }))
              }
            />
          ))}
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Buscar fornecedor ou descrição..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-500" />
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters((prev) => ({ ...prev, start_date: e.target.value }))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all [color-scheme:dark]"
            />
            <span className="text-slate-600 text-xs">até</span>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters((prev) => ({ ...prev, end_date: e.target.value }))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all [color-scheme:dark]"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all appearance-none [color-scheme:dark]"
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="overdue">Vencido</option>
              <option value="paid">Pago</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Clear filters */}
          {(filters.status || filters.start_date || filters.end_date || filters.search) && (
            <button
              onClick={() => setFilters({ status: '', start_date: '', end_date: '', search: '' })}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:text-white hover:border-white/20 transition-colors"
            >
              <X size={13} />
              Limpar
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/8 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Fornecedor / Descrição</span>
            <span>Vencimento</span>
            <span>Valor</span>
            <span>Categoria</span>
            <span>Status</span>
            <span className="text-right">Ações</span>
          </div>

          {/* Content */}
          {loading ? (
            <div className="p-5">
              <TableSkeleton />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <DollarSign size={22} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">Nenhuma conta encontrada</p>
              <p className="text-slate-600 text-sm mt-1">Tente ajustar os filtros ou criar uma nova conta</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((payable) => {
                const status = payable.effectiveStatus;
                const cfg = STATUS_CONFIG[status];
                const isPaying = payingId === payable.id;
                const isDeleting = deletingId === payable.id;

                return (
                  <div
                    key={payable.id}
                    className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors ${
                      status === 'overdue' ? 'bg-red-500/[0.02]' : ''
                    }`}
                  >
                    {/* Fornecedor */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        <p className="font-semibold text-white text-sm truncate">{payable.supplier_name}</p>
                      </div>
                      {payable.description && (
                        <p className="text-xs text-slate-500 mt-0.5 ml-3.5 truncate">{payable.description}</p>
                      )}
                    </div>

                    {/* Vencimento */}
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className={status === 'overdue' ? 'text-red-400' : 'text-slate-500'} />
                      <span className={`text-sm ${status === 'overdue' ? 'text-red-400 font-semibold' : 'text-slate-300'}`}>
                        {formatDate(payable.due_date)}
                      </span>
                    </div>

                    {/* Valor */}
                    <span className="text-sm font-bold text-white">{formatCurrency(payable.amount)}</span>

                    {/* Categoria */}
                    <span className="text-xs text-slate-400 truncate">{payable.category?.name || '—'}</span>

                    {/* Status */}
                    <StatusBadge status={status} />

                    {/* Ações */}
                    <div className="flex items-center gap-2 justify-end">
                      {status !== 'paid' && (
                        <button
                          onClick={() => setConfirmPay(payable)}
                          disabled={isPaying}
                          title="Marcar como pago"
                          className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
                        >
                          {isPaying ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDelete(payable)}
                        disabled={isDeleting}
                        title="Excluir"
                        className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                      >
                        {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-white/8 flex items-center justify-between">
              <span className="text-xs text-slate-600">{filtered.length} conta{filtered.length !== 1 ? 's' : ''}</span>
              <span className="text-xs text-slate-500 font-semibold">
                Total:{' '}
                <span className="text-white">
                  {formatCurrency(filtered.reduce((s, p) => s + p.amount, 0))}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreatePayableModal
          categories={categories}
          onClose={() => setShowCreate(false)}
          onSuccess={fetchPayables}
        />
      )}

      {confirmPay && (
        <ConfirmPayDialog
          payable={confirmPay}
          onConfirm={handlePay}
          onCancel={() => setConfirmPay(null)}
          loading={payingId === confirmPay.id}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-[#1a2236] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-400/10 border border-red-400/30 flex items-center justify-center">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Excluir Conta</h3>
                <p className="text-xs text-slate-400">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-5">
              Tem certeza que deseja excluir a conta de{' '}
              <span className="font-bold text-white">"{confirmDelete.supplier_name}"</span> no valor de{' '}
              <span className="text-red-400 font-bold">{formatCurrency(confirmDelete.amount)}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={!!deletingId}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deletingId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}