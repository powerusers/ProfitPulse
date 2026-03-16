import type { Metadata } from 'next';
import './globals.css';
import ToastProvider from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'ProfitPulse - Manufacturing Intelligence Platform',
  description: 'Real-time profit tracking for SME manufacturers. Track inventory, costs, and profit automatically.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
