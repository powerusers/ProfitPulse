'use client';

import Link from 'next/link';

export default function QuickActionButtons() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Link
        href="/sales/log"
        className="group relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
      >
        <div className="relative z-10">
          <div className="text-3xl mb-2">🛒</div>
          <h3 className="text-lg font-bold mb-1">Log Sale</h3>
          <p className="text-white/70 text-xs">Record a new sale</p>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
      </Link>

      <Link
        href="/stock/add"
        className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
      >
        <div className="relative z-10">
          <div className="text-3xl mb-2">📦</div>
          <h3 className="text-lg font-bold mb-1">Add Stock</h3>
          <p className="text-white/70 text-xs">Restock materials</p>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
      </Link>
    </div>
  );
}
