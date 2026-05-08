import { useState } from 'react';
import { StockQuote, Trade } from '../types/trading';
import { formatCurrency } from '../utils/stockData';

interface TradePanelProps {
  quote: StockQuote;
  onExecuteTrade: (trade: Omit<Trade, 'id' | 'timestamp' | 'status'>) => void;
}

export function TradePanel({ quote, onExecuteTrade }: TradePanelProps) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'Market' | 'Limit' | 'Stop'>('Market');
  const [quantity, setQuantity] = useState<string>('100');
  const [limitPrice, setLimitPrice] = useState<string>(quote.price.toFixed(2));

  const estimatedTotal = parseInt(quantity || '0') * (orderType === 'Market' ? quote.price : parseFloat(limitPrice || '0'));

  const handleSubmit = () => {
    const qty = parseInt(quantity);
    if (qty <= 0) return;

    onExecuteTrade({
      symbol: quote.symbol,
      type: side,
      orderType,
      quantity: qty,
      price: orderType === 'Market' ? quote.price : parseFloat(limitPrice),
      total: estimatedTotal,
    });
  };

  return (
    <div className="bg-[#0b0e11] border border-[#2b3139] rounded-lg p-4">
      <div className="flex mb-4">
        <button
          onClick={() => setSide('BUY')}
          className={`flex-1 py-2 text-sm font-medium rounded-l-lg transition-colors ${
            side === 'BUY'
              ? 'bg-[#0ecb81] text-black'
              : 'bg-[#2b3139] text-[#848e9c] hover:text-white'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`flex-1 py-2 text-sm font-medium rounded-r-lg transition-colors ${
            side === 'SELL'
              ? 'bg-[#f6465d] text-white'
              : 'bg-[#2b3139] text-[#848e9c] hover:text-white'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-[#848e9c] block mb-1">Order Type</label>
          <div className="flex gap-1">
            {(['Market', 'Limit', 'Stop'] as const).map(type => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex-1 py-1.5 text-xs rounded ${
                  orderType === type
                    ? 'bg-[#f0b90b] text-black font-medium'
                    : 'bg-[#2b3139] text-[#848e9c]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-[#848e9c] block mb-1">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-[#1e2329] border border-[#2b3139] rounded px-3 py-2 text-sm text-white focus:border-[#f0b90b] focus:outline-none"
            min="1"
          />
        </div>

        {orderType !== 'Market' && (
          <div>
            <label className="text-xs text-[#848e9c] block mb-1">
              {orderType === 'Limit' ? 'Limit Price' : 'Stop Price'}
            </label>
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full bg-[#1e2329] border border-[#2b3139] rounded px-3 py-2 text-sm text-white focus:border-[#f0b90b] focus:outline-none"
              step="0.01"
            />
          </div>
        )}

        <div className="pt-2 border-t border-[#2b3139]">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#848e9c]">Market Price</span>
            <span className="text-white">{formatCurrency(quote.price)}</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#848e9c]">Estimated Total</span>
            <span className="text-white font-medium">{formatCurrency(estimatedTotal)}</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className={`w-full py-3 rounded-lg text-sm font-bold transition-colors ${
            side === 'BUY'
              ? 'bg-[#0ecb81] hover:bg-[#0ecb81]/80 text-black'
              : 'bg-[#f6465d] hover:bg-[#f6465d]/80 text-white'
          }`}
        >
          {side} {quote.symbol}
        </button>
      </div>
    </div>
  );
}
