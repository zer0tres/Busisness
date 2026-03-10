import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Users, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

interface Employee { id: number; name: string; email: string; role: string; is_active: boolean; }
const emptyForm = { name: '', email: '', password: '', is_active: true };

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showPass, setShowPass] = useState(false);
  const [commission, setCommission] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => { load(); loadCommission(); }, []);

  const load = async () => {
    try { const r = await api.get('/employees'); setEmployees(r.data); }
    catch { toast.error('Erro ao carregar funcionarios'); }
    finally { setLoading(false); }
  };

  const loadCommission = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      const r = await api.get('/employees/commission?' + params);
      setCommission(r.data);
    } catch {}
  };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Nome e email obrigatorios'); return; }
    if (!editing && !form.password) { toast.error('Senha obrigatoria'); return; }
    try {
      if (editing) {
        await api.put('/employees/' + editing.id, form);
        toast.success('Funcionario atualizado!');
      } else {
        await api.post('/employees', form);
        toast.success('Funcionario criado!');
      }
      setShowForm(false); setEditing(null); setForm({ ...emptyForm }); load(); loadCommission();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro ao salvar'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover funcionario?')) return;
    try { await api.delete('/employees/' + id); toast.success('Removido!'); load(); loadCommission(); }
    catch (e: any) { toast.error(e.response?.data?.error || 'Erro ao remover'); }
  };

  const startEdit = (e: Employee) => {
    setEditing(e);
    setForm({ name: e.name, email: e.email, password: '', is_active: e.is_active });
    setShowForm(true);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Funcionarios</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie sua equipe e acompanhe comissoes</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ ...emptyForm }); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm transition">
          <Plus className="w-4 h-4" /> Novo Funcionario
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">{editing ? 'Editar Funcionario' : 'Novo Funcionario'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Nome *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
            </div>
            <div className="relative">
              <label className="text-sm text-gray-600 mb-1 block">Senha {editing ? "(deixe vazio para nao alterar)" : "*"}</label>
              <input type={showPass ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-8 text-gray-400">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="active" className="text-sm text-gray-600">Ativo</label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm transition">Salvar</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm transition">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700 text-sm">Equipe</h3>
        </div>
        {loading ? <div className="p-8 text-center text-gray-400">Carregando...</div> :
          employees.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum funcionario cadastrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {employees.map(e => (
                <div key={e.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                      {e.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{e.name}</p>
                      <p className="text-xs text-gray-500">{e.email}</p>
                    </div>
                    <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + (e.role === "owner" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>
                      {e.role === "owner" ? "Patrao" : "Funcionario"}
                    </span>
                    {!e.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inativo</span>}
                  </div>
                  {e.role !== "owner" && (
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(e)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(e.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <h3 className="font-semibold text-gray-700 text-sm flex-1">Relatorio de Atendimentos</h3>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          <button onClick={loadCommission} className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm transition">Filtrar</button>
        </div>
        <div className="divide-y divide-gray-100">
          {commission.map((c, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                  {c.employee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.employee.name}</p>
                  <p className="text-xs text-gray-500">{c.appointments_count} atendimento{c.appointments_count !== 1 ? "s" : ""} concluido{c.appointments_count !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <p className="font-semibold text-green-600 text-sm">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c.total_revenue)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
