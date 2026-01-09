/**
 * Statistics card component
 * Updated to follow UI Guidelines: consistent spacing, clear hierarchy, proper colors
 */

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'neutral';
}

const colorClasses = {
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  neutral: 'bg-neutral-500',
};

export default function StatsCard({ title, value, subtitle, icon, color = 'primary' }: StatsCardProps) {
  return (
    <div className="card">
      <div className="flex items-center">
        {icon && (
          <div className={`flex-shrink-0 rounded-lg p-3 ${colorClasses[color]} text-white`}>
            {icon}
          </div>
        )}
        <div className={icon ? 'ml-4 flex-1' : 'w-full'}>
          <dl>
            <dt className="text-sm font-medium text-neutral-600 truncate">{title}</dt>
            <dd className="mt-1 flex items-baseline">
              <div className="text-2xl font-semibold text-neutral-900">{value}</div>
              {subtitle && <div className="ml-2 text-sm text-neutral-600">{subtitle}</div>}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
