import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  MapPin, Phone, Mail, Clock, Calendar, ChevronRight,
  ChevronLeft, Check, Package, Scissors, Star, X
} from 'lucide-react';

interface CompanyData {
  id: number;
  name: string;
  slug: string;
  business_type: string;
  email?: string;
  phone?: string;
  address?: string;
  primary_color: string;
  logo_url?: string;
  opening_hours?: Record<string, { open: string; close: string }>;
}

interface Service {
  name: string;
  duration?: number;
  price?: number;
  description?: string;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  price?: number;
  category?: string;
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
};

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  barbershop: 'Barbearia', restaurant: 'Restaurante',
  tattoo: 'Estúdio de Tatuagem', distributor: 'Distribuidora', other: 'Negócio',
};

function getNext30Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}


export default function PublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Booking state
  const [step, setStep] = useState<'home' | 'service' | 'date' | 'time' | 'form' | 'success'>('home');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  const days = getNext30Days();
  const [dayOffset, setDayOffset] = useState(0);
  const visibleDays = days.slice(dayOffset, dayOffset + 7);

  const API = '/api/public';

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then(data => {
        setCompany(data.company);
        setServices(data.services || []);
        setProducts(data.products || []);

        // Aplicar cor primária como CSS var
        document.documentElement.style.setProperty('--primary', data.company.primary_color || '#3B82F6');
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!selectedDate || !selectedService || !slug) return;
    setLoadingSlots(true);
    setAvailableSlots([]);
    fetch(`${API}/${slug}/availability?date=${selectedDate}&duration=${selectedService.duration || 60}`)
      .then(r => r.json())
      .then(data => setAvailableSlots(data.slots || []))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedService, slug]);

  const handleBook = async () => {
    if (!slug || !selectedService || !selectedDate || !selectedTime) return;
    if (!form.name || !form.email || !form.phone) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          notes: form.notes,
          service_name: selectedService.name,
          service_price: selectedService.price,
          duration: selectedService.duration || 60,
          date: selectedDate,
          time: selectedTime,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBookingResult(data.appointment);
        setStep('success');
      } else {
        alert(data.error || 'Erro ao agendar');
      }
    } catch {
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetBooking = () => {
    setStep('home');
    setSelectedService(null);
    setSelectedDate('');
    setSelectedTime('');
    setForm({ name: '', email: '', phone: '', notes: '' });
    setBookingResult(null);
  };

  const primaryColor = company?.primary_color || '#3B82F6';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (notFound || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Página não encontrada</h1>
          <p className="text-gray-500">Este link não corresponde a nenhuma empresa cadastrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div style={{ backgroundColor: primaryColor }} className="text-white">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-white/30" />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-white/20 flex items-center justify-center text-3xl font-bold">
              {company.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="text-white/70 text-sm mt-1">{BUSINESS_TYPE_LABEL[company.business_type] || 'Negócio'}</p>

          <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-white/80">
            {company.phone && (
              <a href={`tel:${company.phone}`} className="flex items-center gap-1 hover:text-white transition">
                <Phone className="w-4 h-4" />{company.phone}
              </a>
            )}
            {company.email && (
              <a href={`mailto:${company.email}`} className="flex items-center gap-1 hover:text-white transition">
                <Mail className="w-4 h-4" />{company.email}
              </a>
            )}
            {company.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />{company.address}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── HOME ── */}
        {step === 'home' && (
          <div className="space-y-6">
            {/* CTA Agendar */}
            {services.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: primaryColor }} />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Agende seu horário</h2>
                <p className="text-gray-500 text-sm mb-4">Escolha um serviço e marque online em poucos segundos</p>
                <button
                  onClick={() => setStep('service')}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
                >
                  Agendar agora
                </button>
              </div>
            )}

            {/* Serviços */}
            {services.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Scissors className="w-5 h-5" style={{ color: primaryColor }} />
                  Serviços
                </h2>
                <div className="space-y-3">
                  {services.map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="font-medium text-gray-800">{s.name}</p>
                        {s.description && <p className="text-gray-500 text-sm">{s.description}</p>}
                        {s.duration && <p className="text-gray-400 text-xs mt-0.5"><Clock className="w-3 h-3 inline mr-1" />{s.duration} min</p>}
                      </div>
                      {s.price && (
                        <span className="font-bold text-lg" style={{ color: primaryColor }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.price)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Produtos */}
            {products.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" style={{ color: primaryColor }} />
                  Produtos
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {products.map(p => (
                    <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                      <p className="font-medium text-gray-800 text-sm">{p.name}</p>
                      {p.description && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{p.description}</p>}
                      {p.price && (
                        <p className="font-bold mt-2" style={{ color: primaryColor }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Horários de funcionamento */}
            {company.opening_hours && Object.keys(company.opening_hours).length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                  Horários de funcionamento
                </h2>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {Object.entries(company.opening_hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between items-center px-4 py-3 text-sm">
                      <span className="text-gray-600 font-medium">{DAY_LABELS[day] || day}</span>
                      {hours?.open ? (
                        <span className="text-gray-800">{hours.open} – {hours.close}</span>
                      ) : (
                        <span className="text-gray-400">Fechado</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: SERVIÇO ── */}
        {step === 'service' && (
          <div>
            <button onClick={() => setStep('home')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 text-sm transition">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Escolha o serviço</h2>
            <div className="space-y-3">
              {services.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedService(s); setStep('date'); }}
                  className="w-full bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between shadow-sm hover:border-gray-300 transition text-left"
                >
                  <div>
                    <p className="font-medium text-gray-800">{s.name}</p>
                    {s.duration && <p className="text-gray-400 text-xs mt-0.5"><Clock className="w-3 h-3 inline mr-1" />{s.duration} min</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    {s.price && (
                      <span className="font-bold" style={{ color: primaryColor }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.price)}
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: DATA ── */}
        {step === 'date' && (
          <div>
            <button onClick={() => setStep('service')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 text-sm transition">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Escolha a data</h2>
            <p className="text-gray-500 text-sm mb-4">{selectedService?.name}</p>

            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setDayOffset(Math.max(0, dayOffset - 7))} disabled={dayOffset === 0}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 grid grid-cols-7 gap-1">
                {visibleDays.map(d => {
                  const ds = formatDate(d);
                  const selected = ds === selectedDate;
                  return (
                    <button
                      key={ds}
                      onClick={() => { setSelectedDate(ds); setStep('time'); }}
                      style={selected ? { backgroundColor: primaryColor } : {}}
                      className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs transition ${selected ? 'text-white' : 'bg-white border border-gray-100 text-gray-700 hover:border-gray-300'}`}
                    >
                      <span className="uppercase opacity-70">{d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                      <span className="font-bold text-base">{d.getDate()}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setDayOffset(Math.min(23, dayOffset + 7))} disabled={dayOffset >= 23}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: HORÁRIO ── */}
        {step === 'time' && (
          <div>
            <button onClick={() => setStep('date')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 text-sm transition">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Escolha o horário</h2>
            <p className="text-gray-500 text-sm mb-4">
              {selectedService?.name} • {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>

            {loadingSlots ? (
              <div className="text-center py-8 text-gray-400">Buscando horários...</div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Nenhum horário disponível nesta data</p>
                <button onClick={() => setStep('date')} style={{ color: primaryColor }} className="text-sm mt-2 font-medium">
                  Escolher outra data
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {availableSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => { setSelectedTime(slot); setStep('form'); }}
                    style={selectedTime === slot ? { backgroundColor: primaryColor } : {}}
                    className={`py-3 rounded-xl font-semibold text-sm transition border ${
                      selectedTime === slot ? 'text-white border-transparent' : 'bg-white border-gray-100 text-gray-800 hover:border-gray-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP: FORMULÁRIO ── */}
        {step === 'form' && (
          <div>
            <button onClick={() => setStep('time')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 text-sm transition">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Seus dados</h2>

            {/* Resumo */}
            <div className="bg-gray-100 rounded-xl p-4 mb-6 text-sm">
              <p className="font-medium text-gray-800">{selectedService?.name}</p>
              <p className="text-gray-500 mt-1">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} às {selectedTime}
              </p>
              {selectedService?.price && (
                <p className="font-bold mt-1" style={{ color: primaryColor }}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService.price)}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-600 text-sm font-medium block mb-1">Nome completo *</label>
                <input type="text" placeholder="Seu nome" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="text-gray-600 text-sm font-medium block mb-1">E-mail *</label>
                <input type="email" placeholder="seu@email.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="text-gray-600 text-sm font-medium block mb-1">Telefone / WhatsApp *</label>
                <input type="tel" placeholder="(00) 00000-0000" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="text-gray-600 text-sm font-medium block mb-1">Observações</label>
                <textarea placeholder="Alguma observação? (opcional)" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-gray-400 resize-none" />
              </div>
              <button
                onClick={handleBook}
                disabled={submitting}
                style={{ backgroundColor: primaryColor }}
                className="w-full text-white py-4 rounded-xl font-bold text-base hover:opacity-90 transition disabled:opacity-60"
              >
                {submitting ? 'Agendando...' : 'Confirmar agendamento'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: SUCESSO ── */}
        {step === 'success' && bookingResult && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
              <Check className="w-10 h-10" style={{ color: primaryColor }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Agendado!</h2>
            <p className="text-gray-500 mb-6">Seu agendamento foi realizado com sucesso.</p>

            <div className="bg-gray-50 rounded-2xl p-5 text-left mb-6 border border-gray-100">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Serviço</span>
                  <span className="font-medium text-gray-800">{bookingResult.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Data</span>
                  <span className="font-medium text-gray-800">
                    {new Date(bookingResult.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Horário</span>
                  <span className="font-medium text-gray-800">{bookingResult.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nome</span>
                  <span className="font-medium text-gray-800">{bookingResult.customer?.name}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700 mb-6">
              <Star className="w-4 h-4 inline mr-1" />
              Aguarde a confirmação do estabelecimento.
            </div>

            <button onClick={resetBooking}
              style={{ color: primaryColor }}
              className="text-sm font-medium hover:opacity-70 transition">
              Fazer outro agendamento
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-gray-400 text-xs">
        Powered by <span className="font-semibold">Business Suite</span>
      </div>
    </div>
  );
}
