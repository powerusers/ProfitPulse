'use client';

import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { LowStockAlert } from '@/lib/types';

interface LowStockAlertsProps {
  alerts: LowStockAlert[];
}

export default function LowStockAlerts({ alerts }: LowStockAlertsProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Low Stock Alerts</h3>
        <div className="text-center py-4">
          <p className="text-2xl mb-1">✅</p>
          <p className="text-sm text-gray-500">All materials are well stocked</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Low Stock Alerts</h3>
        <Link href="/materials" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
          View All →
        </Link>
      </div>
      <div className="space-y-3">
        {alerts.slice(0, 5).map((alert) => (
          <div key={alert.materialId} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">{alert.materialName}</p>
              <p className="text-xs text-gray-500">{alert.currentQty} {alert.unit} remaining</p>
            </div>
            <Badge variant={alert.status === 'OUT_OF_STOCK' ? 'danger' : alert.status === 'CRITICAL' ? 'danger' : 'warning'}>
              {alert.status === 'OUT_OF_STOCK' ? 'Out' : alert.status === 'CRITICAL' ? 'Critical' : 'Low'}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
