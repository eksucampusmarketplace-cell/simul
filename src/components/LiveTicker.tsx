import { useState, useEffect } from 'react';
import { getStockQuote, formatCurrency, formatPercent } from '../utils/stockData';

const TICKER_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'GOOGL', 'SPY', 'QQQ', 'AMD'];

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export function LiveTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    const updateTicker = () => {
      const newItems = TICKER_SYMBOLS.map(symbol => {
        const quote = getStockQuote(symbol);
        return {
          symbol: quote.symbol,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
        };
      });
      setItems(newItems);
    };

    updateTicker();
    const interval = setInterval(updateTicker, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#1e2329] border-b border-[#2b3139] overflow-hidden">
      <div className="flex animate-scroll">
        {[...items, ...items].map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 px-4 py-1.5 whitespace-nowrap">
            <span className="text-xs font-medium text-white">{item.symbol}</span>
            <span className="text-xs text-white">{formatCurrency(item.price)}</span>
            <span className={`text-xs ${item.change >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {formatPercent(item.changePercent)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
