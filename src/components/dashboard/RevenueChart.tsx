'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import type { RevenueDataPoint } from '@/lib/types';

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || data.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend (7 Days)</h3>
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          No data available yet. Start logging sales!
        </div>
      </Card>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend (7 Days)</h3>
      <div className="h-48 flex items-end gap-2">
        {data.map((point, i) => {
          const height = (point.revenue / maxRevenue) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full relative" style={{ height: '160px' }}>
                <div
                  className="absolute bottom-0 w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg transition-all duration-500 hover:from-primary-700 hover:to-primary-500"
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`₹${point.revenue.toLocaleString('en-IN')}`}
                />
              </div>
              <span className="text-[10px] text-gray-400 font-medium">
                {new Date(point.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
