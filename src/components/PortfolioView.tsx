import { Portfolio, Position } from '../types/trading';
import { formatCurrency, formatPercent } from '../utils/stockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PortfolioViewProps {
  portfolio: Portfolio;
  onSelectStock: (symbol: string) => void;
}

export function PortfolioView({ portfolio, onSelectStock }: PortfolioViewProps) {
  return (
    <div className="bg-[#0b0e11] text-white">
      <div className="p-4 border-b border-[#2b3139]">
        <div className="text-sm text-[#848e9c] mb-1">Total Portfolio Value</div>
        <div className="text-3xl font-bold">{formatCurrency(portfolio.totalValue)}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-sm font-medium ${portfolio.dayGain >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            {portfolio.dayGain >= 0 ? '+' : ''}{formatCurrency(portfolio.dayGain)}
          </span>
          <span className={`text-sm ${portfolio.dayGain >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            ({formatPercent(portfolio.dayGainPercent)})
          </span>
          <span className="text-xs text-[#848e9c]">Today</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-sm font-medium ${portfolio.totalGain >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            {portfolio.totalGain >= 0 ? '+' : ''}{formatCurrency(portfolio.totalGain)}
          </span>
          <span className={`text-sm ${portfolio.totalGain >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            ({formatPercent(portfolio.totalGainPercent)})
          </span>
          <span className="text-xs text-[#848e9c]">Total Return</span>
        </div>
      </div>

      <div className="p-4 border-b border-[#2b3139]">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#848e9c]">Buying Power</span>
          <span className="text-sm font-medium">{formatCurrency(portfolio.buyingPower)}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-medium text-[#848e9c] mb-3">Positions ({portfolio.positions.length})</h3>
        <div className="space-y-2">
          {portfolio.positions.map((position) => (
            <PositionRow key={position.symbol} position={position} onClick={() => onSelectStock(position.symbol)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PositionRow({ position, onClick }: { position: Position; onClick: () => void }) {
  const isPositive = position.totalGain >= 0;
  
  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg bg-[#1e2329] hover:bg-[#2b3139] cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPositive ? 'bg-[#0ecb81]/10' : 'bg-[#f6465d]/10'}`}>
          {isPositive ? <TrendingUp size={14} className="text-[#0ecb81]" /> : <TrendingDown size={14} className="text-[#f6465d]" />}
        </div>
        <div>
          <div className="font-medium text-sm">{position.symbol}</div>
          <div className="text-xs text-[#848e9c]">{position.quantity} shares</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium">{formatCurrency(position.totalValue)}</div>
        <div className={`text-xs ${isPositive ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
          {isPositive ? '+' : ''}{formatCurrency(position.totalGain)} ({formatPercent(position.totalGainPercent)})
        </div>
      </div>
    </div>
  );
}
