import { Trade } from '../types/trading';
import { formatCurrency } from '../utils/stockData';

interface TradeHistoryProps {
  trades: Trade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  if (trades.length === 0) {
    return (
      <div className="p-6 text-center text-[#848e9c] text-sm">
        No trades yet. Execute a trade to see it here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[#848e9c] border-b border-[#2b3139]">
            <th className="p-2 text-left">Time</th>
            <th className="p-2 text-left">Symbol</th>
            <th className="p-2 text-left">Side</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-right">Qty</th>
            <th className="p-2 text-right">Price</th>
            <th className="p-2 text-right">Total</th>
            <th className="p-2 text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id} className="border-b border-[#1e2329] hover:bg-[#1e2329]">
              <td className="p-2 text-[#848e9c]">
                {trade.timestamp.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}
              </td>
              <td className="p-2 font-medium text-white">{trade.symbol}</td>
              <td className={`p-2 font-medium ${trade.type === 'BUY' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                {trade.type}
              </td>
              <td className="p-2 text-[#848e9c]">{trade.orderType}</td>
              <td className="p-2 text-right text-white">{trade.quantity}</td>
              <td className="p-2 text-right text-white">{formatCurrency(trade.price)}</td>
              <td className="p-2 text-right text-white font-medium">{formatCurrency(trade.total)}</td>
              <td className="p-2 text-right">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  trade.status === 'Filled' 
                    ? 'bg-[#0ecb81]/10 text-[#0ecb81]' 
                    : trade.status === 'Pending'
                    ? 'bg-[#f0b90b]/10 text-[#f0b90b]'
                    : 'bg-[#f6465d]/10 text-[#f6465d]'
                }`}>
                  {trade.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
