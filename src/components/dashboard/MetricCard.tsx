import Card from '@/components/ui/Card';
import { formatCurrency, formatPercentage } from '@/lib/utils/formatters';

interface MetricCardProps {
  title: string;
  value: number;
  format?: 'currency' | 'number' | 'percentage';
  change?: number;
  icon: string;
  color?: 'blue' | 'green' | 'amber' | 'red';
}

export default function MetricCard({ title, value, format = 'currency', change, icon, color = 'blue' }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-primary-50 text-primary-600',
    green: 'bg-accent-50 text-accent-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-danger-50 text-danger-600',
  };

  const formattedValue = format === 'currency'
    ? formatCurrency(value)
    : format === 'percentage'
    ? `${value.toFixed(1)}%`
    : value.toLocaleString('en-IN');

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 font-mono">{formattedValue}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${change >= 0 ? 'text-accent-600' : 'text-danger-500'}`}>
              <span>{change >= 0 ? '↑' : '↓'}</span>
              <span>{formatPercentage(Math.abs(change))}</span>
              <span className="text-gray-400">vs last period</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
