import { StockQuote, TimeRange } from '../types/trading';
import { formatCurrency, formatPercent, formatNumber } from '../utils/stockData';

interface StockHeaderProps {
  quote: StockQuote;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export function StockHeader({ quote, timeRange, onTimeRangeChange }: StockHeaderProps) {
  const isPositive = quote.change >= 0;
  const timeRanges: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', '5Y'];

  return (
    <div className="p-4 border-b border-[#2b3139]">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{quote.symbol}</h1>
            <span className="text-sm text-[#848e9c]">{quote.name}</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-white">{formatCurrency(quote.price)}</span>
            <span className={`text-sm font-medium ${isPositive ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {isPositive ? '+' : ''}{formatCurrency(quote.change)} ({formatPercent(quote.changePercent)})
            </span>
          </div>
        </div>
        
        <div className="text-right text-xs text-[#848e9c] space-y-0.5">
          <div>Open: <span className="text-white">{formatCurrency(quote.open)}</span></div>
          <div>High: <span className="text-white">{formatCurrency(quote.high)}</span></div>
          <div>Low: <span className="text-white">{formatCurrency(quote.low)}</span></div>
          <div>Vol: <span className="text-white">{formatNumber(quote.volume)}</span></div>
          {quote.marketCap && <div>Mkt Cap: <span className="text-white">{formatNumber(quote.marketCap)}</span></div>}
        </div>
      </div>

      <div className="flex gap-1 mt-3">
        {timeRanges.map(range => (
          <button
            key={range}
            onClick={() => onTimeRangeChange(range)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              timeRange === range
                ? 'bg-[#f0b90b] text-black font-medium'
                : 'text-[#848e9c] hover:text-white hover:bg-[#2b3139]'
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
}
