import { useState, useEffect } from 'react';
import { Check, Star, Zap, Crown, CreditCard, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

interface Plan {
  name: string;
  price: number;
  description: string;
  features: string[];
}

interface Subscription {
  plan: string;
  status: string;
  current_period_end?: string;
}

const PLAN_ICONS = {
  basic: Star,
  professional: Zap,
  premium: Crown,
};

const PLAN_COLORS = {
  basic: { bg: 'bg-blue-50', border: 'border-blue-200', btn: 'bg-blue-500 hover:bg-blue-600', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  professional: { bg: 'bg-violet-50', border: 'border-violet-300', btn: 'bg-violet-500 hover:bg-violet-600', text: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
  premium: { bg: 'bg-amber-50', border: 'border-amber-300', btn: 'bg-amber-500 hover:bg-amber-600', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
};

export default function Subscription() {
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    loadData();

    // Verificar se voltou de um pagamento
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      toast.success('Pagamento confirmado! Sua assinatura foi ativada.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (payment === 'failure') {
      toast.error('Pagamento não aprovado. Tente novamente.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (payment === 'pending') {
      toast.info('Pagamento pendente. Você será notificado quando confirmado.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes] = await Promise.all([
        api.get('/payments/plans'),
        api.get('/payments/subscription'),
      ]);
      setPlans(plansRes.data.plans || {});
      setSubscription(subRes.data.subscription);
    } catch {
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (planKey: string) => {
    setCheckingOut(planKey);
    try {
      const res = await api.post('/payments/create-checkout', { plan: planKey });
      // Em sandbox, usar sandbox_url; em produção usar checkout_url
      const url = res.data.checkout_url;
      window.open(url, '_blank');
    } catch {
      toast.error('Erro ao criar link de pagamento');
    } finally {
      setCheckingOut(null);
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

  const isCurrentPlan = (planKey: string) =>
    subscription?.plan === planKey && subscription?.status === 'active';

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-96 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Planos e Assinatura</h1>
        <p className="text-gray-500">Escolha o plano ideal para o seu negócio</p>
      </div>

      {/* Status atual */}
      {subscription && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">
                Plano atual: <span className="capitalize font-bold">{plans[subscription.plan]?.name || subscription.plan}</span>
              </p>
              <p className="text-sm text-gray-500">
                Status: <span className={`font-medium ${subscription.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                  {subscription.status === 'active' ? 'Ativo' : subscription.status === 'cancelled' ? 'Cancelado' : subscription.status}
                </span>
                {subscription.current_period_end && (
                  <> · Renova em {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}</>
                )}
              </p>
            </div>
          </div>
          {subscription.status === 'active' && (
            <button onClick={handleCancel} className="text-sm text-red-500 hover:text-red-700 transition">
              Cancelar assinatura
            </button>
          )}
        </div>
      )}

      {/* Trial banner */}
      {!subscription && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-amber-800 text-sm">
            Você está no <strong>período de teste gratuito</strong>. Assine um plano para continuar usando após o período de testes.
          </p>
        </div>
      )}

      {/* Cards de planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(plans).map(([key, plan]) => {
          const colors = PLAN_COLORS[key as keyof typeof PLAN_COLORS];
          const Icon = PLAN_ICONS[key as keyof typeof PLAN_ICONS];
          const isCurrent = isCurrentPlan(key);
          const isPopular = key === 'professional';

          return (
            <div
              key={key}
              className={`relative bg-white rounded-2xl border-2 p-6 transition ${
                isCurrent ? `${colors.border} shadow-lg` : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
              }`}
            >
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MAIS POPULAR
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`${colors.badge} text-xs font-bold px-3 py-1 rounded-full`}>
                    PLANO ATUAL
                  </span>
                </div>
              )}

              <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${colors.text}`} />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-1">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-800">
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-gray-400 text-sm">/mês</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className={`w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Check className={`w-3 h-3 ${colors.text}`} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !isCurrent && handleCheckout(key)}
                disabled={isCurrent || checkingOut === key}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition ${
                  isCurrent
                    ? 'bg-gray-100 text-gray-400 cursor-default'
                    : `${colors.btn} text-white disabled:opacity-60`
                }`}
              >
                {checkingOut === key ? 'Aguarde...' : isCurrent ? 'Plano ativo' : `Assinar ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Nota sobre pagamento */}
      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
          <CreditCard className="w-4 h-4" />
          Pagamento seguro via Mercado Pago · Cartão, PIX ou boleto · Cancele quando quiser
        </p>
      </div>
    </div>
  );
}
