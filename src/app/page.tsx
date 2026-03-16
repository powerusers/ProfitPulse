import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">PP</span>
            </div>
            <span className="text-2xl font-bold text-white">ProfitPulse</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-white/80 hover:text-white text-sm font-medium px-4 py-2 transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-xl">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" />
            Built for Indian SME Manufacturers
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            Know Your <span className="text-amber-400">True Daily Profit</span> in Under 5 Minutes
          </h1>

          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop guessing your margins. ProfitPulse automatically tracks your raw materials,
            calculates real costs with waste &amp; GST, and shows you exactly how much money you made today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/signup" className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 w-full sm:w-auto">
              Start Free Trial
            </Link>
            <Link href="/login" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all border border-white/20 w-full sm:w-auto">
              Sign In
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left border border-white/10">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="text-white font-bold text-lg mb-2">Auto BOM Backflushing</h3>
              <p className="text-white/70 text-sm">Log a sale, and raw materials are auto-deducted from inventory based on your recipes. No manual counting.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left border border-white/10">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-white font-bold text-lg mb-2">Weighted Avg Costing</h3>
              <p className="text-white/70 text-sm">Buy flour at ₹40/kg today and ₹45/kg tomorrow — we auto-calculate your true cost to protect your margins.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left border border-white/10">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="text-white font-bold text-lg mb-2">True P&amp;L</h3>
              <p className="text-white/70 text-sm">See Net Profit after GST liability and fixed expenses. A bank-ready financial view, updated in real-time.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-6">
        <div className="max-w-6xl mx-auto text-center text-white/50 text-sm">
          © 2026 ProfitPulse. Built for manufacturers who want to spend less time on admin and more time growing their business.
        </div>
      </footer>
    </div>
  );
}
