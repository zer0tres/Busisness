import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const company = useAuthStore(state => state.company);

  useEffect(() => {
    if (!company) return;
    const allowed = ['/subscription', '/settings'];
    const isAllowed = allowed.some(p => location.pathname.startsWith(p));
    if (!company.can_access && !isAllowed) {
      navigate('/subscription');
    }
  }, [company, location.pathname]);

  if (!company) return <>{children}</>;

  const isBlocked = !company.can_access;
  const allowed = ['/subscription', '/settings'];
  const isAllowed = allowed.some(p => location.pathname.startsWith(p));

  if (isBlocked && !isAllowed) return null;

  return <>{children}</>;
}
