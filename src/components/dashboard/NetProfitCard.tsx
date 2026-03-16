'use client';

import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/formatters';

interface NetProfitCardProps {
  netProfit: number;
  profitMargin: number;
  periodLabel: string;
}

export default function NetProfitCard({ netProfit, profitMargin, periodLabel }: NetProfitCardProps) {
  const isPositive = netProfit >= 0;

  return (
    <Card className={`relative overflow-hidden ${isPositive ? 'bg-gradient-to-br from-accent-50 to-white border-accent-200' : 'bg-gradient-to-br from-danger-50 to-white border-danger-200'}`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600">Net Profit</p>
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">{periodLabel}</span>
        </div>
        <p className={`text-4xl md:text-5xl font-extrabold font-mono tracking-tight ${isPositive ? 'text-accent-600' : 'text-danger-600'}`}>
          {formatCurrency(netProfit)}
        </p>
        <div className="flex items-center gap-3 mt-3">
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-accent-600' : 'text-danger-600'}`}>
            <span>{isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(profitMargin).toFixed(1)}% margin</span>
          </div>
        </div>
      </div>
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-12 translate-x-12 ${isPositive ? 'bg-accent-100/50' : 'bg-danger-100/50'}`} />
    </Card>
  );
}
