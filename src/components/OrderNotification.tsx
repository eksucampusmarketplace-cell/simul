import { useState, useEffect } from 'react';
import { Trade } from '../types/trading';
import { formatCurrency } from '../utils/stockData';
import { CheckCircle2, X } from 'lucide-react';

interface OrderNotificationProps {
  trade: Trade | null;
  onDismiss: () => void;
}

export function OrderNotification({ trade, onDismiss }: OrderNotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trade) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [trade, onDismiss]);

  if (!trade) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
    }`}>
      <div className="bg-[#1e2329] border border-[#2b3139] rounded-lg p-4 shadow-2xl min-w-72">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#0ecb81]" />
            <span className="text-sm font-medium text-white">Order Filled</span>
          </div>
          <button onClick={() => { setVisible(false); onDismiss(); }} className="text-[#848e9c] hover:text-white">
            <X size={14} />
          </button>
        </div>
        <div className="mt-2 pl-6">
          <div className="text-xs text-[#848e9c]">
            {trade.type} {trade.quantity} {trade.symbol} @ {formatCurrency(trade.price)}
          </div>
          <div className="text-xs text-[#848e9c] mt-0.5">
            Total: {formatCurrency(trade.total)}
          </div>
          <div className="text-xs text-[#0ecb81] mt-1">
            {trade.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}
