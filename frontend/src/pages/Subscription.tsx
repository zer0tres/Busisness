import { useState, useEffect } from 'react';
import { Check, Crown, CreditCard, AlertCircle, Clock } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';

interface Subscription {
  plan: string;
  status: string;
  current_period_end?: string;
}

export default function Subscription() {
  const company = useAuthStore(state => state.company);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    loadData();
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      toast.success('Pagamento confirmado! Sua assinatura foi ativada.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (payment === 'failure') {
      toast.error('Pagamento nao aprovado. Tente novamente.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (payment === 'pending') {
      toast.info('Pagamento pendente. Voce sera notificado quando confirmado.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/payments/subscription');
      setSubscription(res.data.subscription);
    } catch {
      toast.error('Erro ao carregar assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const res = await api.post('/payments/create-checkout', { plan: 'premium' });
      window.location.href = res.data.checkout_url;
    } catch {
      toast.error('Erro ao criar link de pagamento');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura?')) return;
    try {
      await api.post('/payments/cancel');
      toast.success('Assinatura cancelada.');
      loadData();
    } catch {
      toast.error('Erro ao cancelar assinatura');
    }
  };

  const isActive = subscription?.status === 'active';
  const trialDays = company?.trial_days_remaining ?? 0;
  const isTrial = !isActive;

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
        <div className="h-64 bg-gray-100 rounded-xl max-w-md mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Assinatura</h1>
        <p className="text-gray-500">Gerencie seu plano</p>
      </div>

      {isTrial && trialDays > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-amber-800 text-sm">
            Voce esta no <strong>periodo de teste gratuito</strong>. Restam <strong>{trialDays} dias</strong> para assinar e continuar usando.
          </p>
        </div>
      )}

      {isTrial && trialDays === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800 text-sm">
            Seu periodo de teste <strong>encerrou</strong>. Assine para voltar a usar o sistema.
          </p>
        </div>
      )}

      {isActive && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-800">Plano Premium <span className="text-green-600 font-bold">Ativo</span></p>
              {subscription?.current_period_end && (
                <p className="text-sm text-gray-500">Renova em {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}</p>
              )}
            </div>
          </div>
          <button onClick={handleCancel} className="text-sm text-red-500 hover:text-red-700 transition">
            Cancelar
          </button>
        </div>
      )}

      {!isActive && (
        <div className="bg-white rounded-2xl border-2 border-amber-400 shadow-lg p-8 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Crown className="w-8 h-8 text-amber-500" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Plano Premium</h2>
            <div className="mt-3">
              <span className="text-5xl font-bold text-gray-800">R$ 49</span>
              <span className="text-2xl font-bold text-gray-800">,90</span>
              <span className="text-gray-400 text-sm">/mes</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">Acesso completo a todas as funcionalidades</p>
          </div>

          <ul className="space-y-3 mb-8">
            {[
              'Clientes ilimitados',
              'Agendamentos ilimitados',
              'Controle financeiro',
              'Estoque e produtos',
              'Pagina publica de agendamento',
              'Notificacoes por email',
              'Suporte prioritario',
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-amber-500" />
                </div>
                {f}
              </li>
            ))}
          </ul>

          <button onClick={handleCheckout} disabled={checkingOut}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-bold text-lg transition disabled:opacity-60">
            {checkingOut ? 'Aguarde...' : 'Assinar agora'}
          </button>

          <p className="text-center text-gray-400 text-xs mt-4 flex items-center justify-center gap-1">
            <CreditCard className="w-3 h-3" />
            Pagamento seguro via Mercado Pago · Cancele quando quiser
          </p>
        </div>
      )}
    </div>
  );
}
