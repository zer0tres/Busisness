import { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, X, Phone, Mail } from 'lucide-react';
import api from '../services/api';
import type { Customer } from '../types';
import { toast } from 'sonner';
import ConfirmDialog from '../components/ConfirmDialog';
import TableSkeleton from '../components/TableSkeleton';


const maskPhone = (v: string) => {
  v = v.replace(/\D/g, '').slice(0, 11);
  if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
};

const maskCPF = (v: string) => {
  v = v.replace(/\D/g, '').slice(0, 11);
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; customer: Customer | null }>({ isOpen: false, customer: null });
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', cpf: '', address: '', notes: '' });

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      setCustomers(res.data.customers || []);
    } catch { toast.error('Erro ao carregar clientes'); }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers?search=${search}`);
      setCustomers(res.data.customers || []);
    } catch { toast.error('Erro ao buscar clientes'); }
    finally { setLoading(false); }
  };

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({ name: customer.name, email: customer.email || '', phone: customer.phone || '', cpf: customer.cpf || '', address: customer.address || '', notes: customer.notes || '' });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', email: '', phone: '', cpf: '', address: '', notes: '' });
    }
    setShowModal(true);
  };

  const handleClose = () => { setShowModal(false); setEditingCustomer(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tid = toast.loading(editingCustomer ? 'Salvando...' : 'Criando cliente...');
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast.success('Cliente atualizado!', { id: tid });
      } else {
        await api.post('/customers', formData);
        toast.success('Cliente criado!', { id: tid });
      }
      handleClose();
      loadCustomers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar cliente', { id: tid });
    }
  };

  const handleDelete = async (id: number) => {
    const tid = toast.loading('Excluindo...');
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Cliente excluído!', { id: tid });
      setDeleteModal({ isOpen: false, customer: null });
      loadCustomers();
    } catch { toast.error('Erro ao excluir', { id: tid }); }
  };

  if (loading) return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Clientes</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <TableSkeleton rows={5} columns={5} />
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Clientes</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Gerencie seus clientes</p>
        </div>
        <button onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg transition text-sm md:text-base">
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Novo Cliente</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar por nome, email ou telefone..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
          </div>
          <button onClick={handleSearch} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm">
            Buscar
          </button>
        </div>
      </div>

      {/* ── MOBILE: Cards ── */}
      <div className="md:hidden space-y-3">
        {customers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500 text-sm">Nenhum cliente encontrado</p>
          </div>
        ) : customers.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-800">{c.name}</p>
                {c.cpf && <p className="text-xs text-gray-400">CPF: {c.cpf}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteModal({ isOpen: true, customer: c })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {c.phone && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />{c.phone}
                </p>
              )}
              {c.email && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />{c.email}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP: Tabela ── */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Nome', 'Email', 'Telefone', 'CPF', 'Ações'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider last:text-right">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  Nenhum cliente encontrado
                </td>
              </tr>
            ) : customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{c.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{c.email || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{c.phone || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{c.cpf || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleOpenModal(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteModal({ isOpen: true, customer: c })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5 text-gray-600" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone *</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="(99) 99999-9999" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                <input type="text" value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition text-sm">{editingCustomer ? 'Salvar' : 'Criar Cliente'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={deleteModal.isOpen} title="Excluir Cliente"
        message={`Tem certeza que deseja excluir ${deleteModal.customer?.name}?`}
        confirmText="Excluir" cancelText="Cancelar" type="danger"
        onConfirm={() => deleteModal.customer && handleDelete(deleteModal.customer.id)}
        onCancel={() => setDeleteModal({ isOpen: false, customer: null })} />
    </div>
  );
}
