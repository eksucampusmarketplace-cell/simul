import { getStockQuote, formatCurrency, formatPercent } from '../utils/stockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface WatchlistProps {
  symbols: string[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export function Watchlist({ symbols, selectedSymbol, onSelectSymbol }: WatchlistProps) {
  return (
    <div className="bg-[#0b0e11]">
      <div className="p-3 border-b border-[#2b3139]">
        <h3 className="text-xs font-medium text-[#848e9c] uppercase tracking-wider">Watchlist</h3>
      </div>
      <div className="divide-y divide-[#1e2329]">
        {symbols.map(symbol => {
          const quote = getStockQuote(symbol);
          const isPositive = quote.change >= 0;
          const isSelected = symbol === selectedSymbol;

          return (
            <div
              key={symbol}
              onClick={() => onSelectSymbol(symbol)}
              className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                isSelected ? 'bg-[#2b3139]' : 'hover:bg-[#1e2329]'
              }`}
            >
              <div className="flex items-center gap-2">
                {isPositive ? (
                  <TrendingUp size={12} className="text-[#0ecb81]" />
                ) : (
                  <TrendingDown size={12} className="text-[#f6465d]" />
                )}
                <div>
                  <div className="text-xs font-medium text-white">{symbol}</div>
                  <div className="text-xs text-[#848e9c] truncate max-w-20">{quote.name.split(' ')[0]}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-white">{formatCurrency(quote.price)}</div>
                <div className={`text-xs ${isPositive ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                  {formatPercent(quote.changePercent)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
