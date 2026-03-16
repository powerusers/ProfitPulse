import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/formatters';

interface TaxLiabilityCardProps {
  outputGst: number;
  inputGst: number;
  netPayable: number;
}

export default function TaxLiabilityCard({ outputGst, inputGst, netPayable }: TaxLiabilityCardProps) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">GST Liability</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Output GST (Collected)</span>
          <span className="text-sm font-medium text-gray-900">{formatCurrency(outputGst)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Input GST (Paid)</span>
          <span className="text-sm font-medium text-gray-900">- {formatCurrency(inputGst)}</span>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Net GST Payable</span>
            <span className={`text-lg font-bold font-mono ${netPayable >= 0 ? 'text-danger-600' : 'text-accent-600'}`}>
              {formatCurrency(Math.abs(netPayable))}
              <span className="text-xs font-normal ml-1">{netPayable >= 0 ? 'payable' : 'refund'}</span>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
