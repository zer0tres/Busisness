import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, X, Clock, User } from 'lucide-react';
import api from '../services/api';
import type { Appointment, Customer } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import ConfirmDialog from '../components/ConfirmDialog';
import TableSkeleton from '../components/TableSkeleton';

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; appointment: Appointment | null }>({
    isOpen: false, appointment: null
  });
  const [employees, setEmployees] = useState<{id:number;name:string;role:string}[]>([]);
  const [formData, setFormData] = useState({
    customer_id: '', appointment_date: '', appointment_time: '',
    duration_minutes: 60, service_name: '', service_price: 0, notes: '', status: 'pending', employee_id: ''
  });

  useEffect(() => { loadAppointments(); loadCustomers(); loadEmployees(); }, []);

  const loadEmployees = async () => {
    try { const r = await api.get('/employees'); setEmployees(r.data); } catch {}
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments?include_customer=true');
      setAppointments(response.data.appointments || []);
    } catch { toast.error('Erro ao carregar agendamentos'); }
    finally { setLoading(false); }
  };

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch { toast.error('Erro ao carregar clientes'); }
  };

  const handleFilter = async () => {
    try {
      setLoading(true);
      let url = '/appointments?include_customer=true';
      if (filterDate) url += `&date=${filterDate}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      const response = await api.get(url);
      setAppointments(response.data.appointments || []);
    } catch { toast.error('Erro ao filtrar agendamentos'); }
    finally { setLoading(false); }
  };

  const handleOpenModal = (appointment?: Appointment) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setFormData({
        customer_id: appointment.customer_id.toString(),
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        duration_minutes: appointment.duration_minutes,
        service_name: appointment.service_name,
        service_price: appointment.service_price,
        notes: appointment.notes || '',
        status: appointment.status,
        employee_id: (appointment as any).employee_id?.toString() || ''
      });
    } else {
      setEditingAppointment(null);
      setFormData({
        customer_id: '', appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '09:00', duration_minutes: 60,
        service_name: '', service_price: 0, notes: '', status: 'pending', employee_id: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tid = toast.loading(editingAppointment ? 'Salvando...' : 'Criando agendamento...');
    try {
      const data = { ...formData, customer_id: parseInt(formData.customer_id), service_price: parseFloat(formData.service_price.toString()) };
      if (editingAppointment) {
        await api.put(`/appointments/${editingAppointment.id}`, data);
        toast.success('Agendamento atualizado!', { id: tid });
      } else {
        await api.post('/appointments', data);
        toast.success('Agendamento criado!', { id: tid });
      }
      setShowModal(false);
      setEditingAppointment(null);
      loadAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar agendamento', { id: tid });
    }
  };

  const handleDelete = async (id: number) => {
    const tid = toast.loading('Excluindo...');
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Agendamento excluído!', { id: tid });
      setDeleteModal({ isOpen: false, appointment: null });
      loadAppointments();
    } catch { toast.error('Erro ao excluir', { id: tid }); }
  };

  const STATUS_MAP: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Confirmado', className: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'Em andamento', className: 'bg-purple-100 text-purple-800' },
    completed: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
    no_show: { label: 'Não compareceu', className: 'bg-gray-100 text-gray-800' },
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const s = STATUS_MAP[status] || STATUS_MAP.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.className}`}>{s.label}</span>;
  };

  const formatDate = (dateString: string) => {
    try { return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }); }
    catch { return dateString; }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}min`;
  };

  const formatDateShort = (dateString: string) => {
    try { return format(parseISO(dateString), "dd/MM", { locale: ptBR }); }
    catch { return dateString; }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Agendamentos</h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <TableSkeleton rows={5} columns={7} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Agendamentos</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Gerencie sua agenda</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg transition text-sm md:text-base"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Novo Agendamento</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm">
              <option value="">Todos</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleFilter}
              className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition text-sm">
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE: Cards ── */}
      <div className="md:hidden space-y-3">
        {appointments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500 text-sm">Nenhum agendamento encontrado</p>
          </div>
        ) : appointments.map(appt => (
          <div key={appt.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-800">{appt.customer?.name || 'Cliente'}</p>
                <p className="text-sm text-gray-500">{appt.service_name}</p>
              </div>
              <StatusBadge status={appt.status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDateShort(appt.appointment_date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {appt.appointment_time}
              </span>
              <span>{formatDuration(appt.duration_minutes)}</span>
              <span className="ml-auto font-semibold text-gray-800">
                R$ {appt.service_price.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button onClick={() => handleOpenModal(appt)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm">
                <Edit className="w-4 h-4" /> Editar
              </button>
              <button onClick={() => setDeleteModal({ isOpen: true, appointment: appt })}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition text-sm">
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP: Tabela ── */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Data/Hora', 'Cliente', 'Serviço', 'Duração', 'Status', 'Valor', 'Ações'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider last:text-right">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  Nenhum agendamento encontrado
                </td>
              </tr>
            ) : appointments.map(appt => (
              <tr key={appt.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{formatDate(appt.appointment_date)}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{appt.appointment_time}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{appt.customer?.name || 'Cliente não encontrado'}</div>
                      {appt.customer?.phone && <div className="text-xs text-gray-500">{appt.customer.phone}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{appt.service_name}</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">{formatDuration(appt.duration_minutes)}</td>
                <td className="px-6 py-4 text-center"><StatusBadge status={appt.status} /></td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">R$ {appt.service_price.toFixed(2)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleOpenModal(appt)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteModal({ isOpen: true, appointment: appt })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingAppointment(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
                <select value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required>
                  <option value="">Selecione um cliente</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data *</label>
                  <input type="date" value={formData.appointment_date} onChange={e => setFormData({ ...formData, appointment_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Horário *</label>
                  <input type="time" value={formData.appointment_time} onChange={e => setFormData({ ...formData, appointment_time: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Serviço *</label>
                  <input type="text" value={formData.service_name} onChange={e => setFormData({ ...formData, service_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="Ex: Corte de cabelo" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duração (min) *</label>
                  <select value={formData.duration_minutes} onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required>
                    {[15,30,45,60,90,120,150,180,210,240,270,300,330,360,420,480,540,600,660,720].map(m => (
                      <option key={m} value={m}>{m < 60 ? `${m} min` : m % 60 === 0 ? `${m/60}h` : `${Math.floor(m/60)}h ${m%60}min`}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor *</label>
                  <input type="number" min="0" step="0.01" value={formData.service_price} onChange={e => setFormData({ ...formData, service_price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="0.00" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm">
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              {formData.status === 'completed' && employees.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Funcionario que atendeu</label>
                  <select value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm">
                    <option value="">Selecionar funcionario...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} {e.role === 'owner' ? '(Patrao)' : ''}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingAppointment(null); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition text-sm">
                  {editingAppointment ? 'Salvar' : 'Criar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        title="Excluir Agendamento"
        message={`Tem certeza que deseja excluir o agendamento de ${deleteModal.appointment?.customer?.name || 'este cliente'}?`}
        confirmText="Excluir" cancelText="Cancelar" type="danger"
        onConfirm={() => deleteModal.appointment && handleDelete(deleteModal.appointment.id)}
        onCancel={() => setDeleteModal({ isOpen: false, appointment: null })}
      />
    </div>
  );
}
