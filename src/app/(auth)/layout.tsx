export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">PP</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">ProfitPulse</span>
          </div>
          <p className="text-gray-500 text-sm">Manufacturing Intelligence Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
