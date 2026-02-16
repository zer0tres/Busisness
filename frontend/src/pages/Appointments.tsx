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
    isOpen: false,
    appointment: null
  });
  const [formData, setFormData] = useState({
    customer_id: '',
    appointment_date: '',
    appointment_time: '',
    duration_minutes: 60,
    service_name: '',
    service_price: 0,
    notes: '',
    status: 'pending'
  });

  useEffect(() => {
    loadAppointments();
    loadCustomers();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments?include_customer=true');
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    }
  };

  const handleFilter = async () => {
    try {
      setLoading(true);
      let url = '/appointments?include_customer=true';
      if (filterDate) url += `&date=${filterDate}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      
      const response = await api.get(url);
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Erro ao filtrar:', error);
      toast.error('Erro ao filtrar agendamentos');
    } finally {
      setLoading(false);
    }
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
        status: appointment.status
      });
    } else {
      setEditingAppointment(null);
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        customer_id: '',
        appointment_date: today,
        appointment_time: '09:00',
        duration_minutes: 60,
        service_name: '',
        service_price: 0,
        notes: '',
        status: 'pending'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAppointment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const loadingToast = toast.loading(
      editingAppointment ? 'Salvando alterações...' : 'Criando agendamento...'
    );

    const data = {
      ...formData,
      customer_id: parseInt(formData.customer_id),
      service_price: parseFloat(formData.service_price.toString()),
    };

    try {
      if (editingAppointment) {
        await api.put(`/appointments/${editingAppointment.id}`, data);
        toast.success('Agendamento atualizado com sucesso!', { id: loadingToast });
      } else {
        await api.post('/appointments', data);
        toast.success('Agendamento criado com sucesso!', { id: loadingToast });
      }
      
      handleCloseModal();
      loadAppointments();
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar agendamento', { id: loadingToast });
    }
  };

  const handleDelete = async (id: number) => {
    const loadingToast = toast.loading('Excluindo agendamento...');
    
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Agendamento excluído com sucesso!', { id: loadingToast });
      setDeleteModal({ isOpen: false, appointment: null });
      loadAppointments();
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      toast.error('Erro ao excluir agendamento', { id: loadingToast });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmado', className: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'Em andamento', className: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
      no_show: { label: 'Não compareceu', className: 'bg-gray-100 text-gray-800' },
    };

    const statusInfo = statusMap[status] || statusMap.pending;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Agendamentos</h1>
            <p className="text-gray-600 mt-1">Gerencie sua agenda</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <TableSkeleton rows={5} columns={7} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Agendamentos</h1>
          <p className="text-gray-600 mt-1">Gerencie sua agenda</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Novo Agendamento
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">Todos</option>
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
              <option value="in_progress">Em andamento</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
              <option value="no_show">Não compareceu</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleFilter}
              className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition"
            >
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data/Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Serviço
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duração
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
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
            ) : (
              appointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(appointment.appointment_date)}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {appointment.appointment_time}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.customer?.name || 'Cliente não encontrado'}
                        </div>
                        {appointment.customer?.phone && (
                          <div className="text-xs text-gray-500">
                            {appointment.customer.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{appointment.service_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                    {appointment.duration_minutes} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(appointment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="font-medium text-gray-900">
                      R$ {appointment.service_price.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(appointment)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, appointment })}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário *
                  </label>
                  <input
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serviço *
                  </label>
                  <input
                    type="text"
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="Ex: Corte de cabelo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração (minutos) *
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.service_price}
                    onChange={(e) => setFormData({ ...formData, service_price: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="pending">Pendente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="in_progress">Em andamento</option>
                    <option value="completed">Concluído</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="no_show">Não compareceu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition"
                >
                  {editingAppointment ? 'Salvar Alterações' : 'Criar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        title="Excluir Agendamento"
        message={`Tem certeza que deseja excluir o agendamento de ${deleteModal.appointment?.customer?.name || 'este cliente'}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        onConfirm={() => deleteModal.appointment && handleDelete(deleteModal.appointment.id)}
        onCancel={() => setDeleteModal({ isOpen: false, appointment: null })}
      />
    </div>
  );
}