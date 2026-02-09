import { useAuth } from '../contexts/AuthContext';

export function UsageBadge() {
  const { usage } = useAuth();

  const percentage = Math.round((usage.used / usage.limit) * 100);
  const isNearLimit = percentage >= 80;

  return (
    <div className={`usage-badge ${isNearLimit ? 'usage-badge--warning' : ''}`} title={`${usage.used} van ${usage.limit} analyses vandaag gebruikt`}>
      <span className="usage-count">{usage.used}/{usage.limit}</span>
    </div>
  );
}
