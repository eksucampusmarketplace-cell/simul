import { useState } from 'react';
import { OptionsContract } from '../types/trading';
import { formatCurrency } from '../utils/stockData';

interface OptionsChainProps {
  options: OptionsContract[];
  currentPrice: number;
  symbol: string;
  onTrade?: (contract: OptionsContract, action: 'BUY' | 'SELL') => void;
}

export function OptionsChain({ options, currentPrice, symbol, onTrade }: OptionsChainProps) {
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [showType, setShowType] = useState<'CALL' | 'PUT' | 'BOTH'>('BOTH');

  const expiries = [...new Set(options.map(o => o.expiry))];
  const activeExpiry = selectedExpiry || expiries[0] || '';
  
  const filteredOptions = options.filter(o => o.expiry === activeExpiry);
  const calls = filteredOptions.filter(o => o.type === 'CALL');
  const puts = filteredOptions.filter(o => o.type === 'PUT');
  const strikes = [...new Set(filteredOptions.map(o => o.strike))].sort((a, b) => a - b);

  return (
    <div className="bg-[#0b0e11] text-white">
      <div className="p-3 border-b border-[#2b3139]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Options Chain - {symbol}</h3>
          <span className="text-xs text-[#848e9c]">Last: {formatCurrency(currentPrice)}</span>
        </div>
        
        <div className="flex gap-2 mb-3">
          {expiries.map(expiry => (
            <button
              key={expiry}
              onClick={() => setSelectedExpiry(expiry)}
              className={`px-3 py-1 text-xs rounded ${
                activeExpiry === expiry
                  ? 'bg-[#f0b90b] text-black font-medium'
                  : 'bg-[#2b3139] text-[#848e9c] hover:bg-[#3b4149]'
              }`}
            >
              {new Date(expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {(['CALL', 'PUT', 'BOTH'] as const).map(type => (
            <button
              key={type}
              onClick={() => setShowType(type)}
              className={`px-3 py-1 text-xs rounded ${
                showType === type
                  ? 'bg-[#2b3139] text-white'
                  : 'text-[#848e9c] hover:text-white'
              }`}
            >
              {type === 'BOTH' ? 'All' : type === 'CALL' ? 'Calls' : 'Puts'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        {showType === 'BOTH' ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#848e9c] border-b border-[#2b3139]">
                <th className="p-2 text-left">Bid</th>
                <th className="p-2 text-left">Ask</th>
                <th className="p-2 text-left">Vol</th>
                <th className="p-2 text-left">IV</th>
                <th className="p-2 text-center font-bold text-[#f0b90b]">Strike</th>
                <th className="p-2 text-right">IV</th>
                <th className="p-2 text-right">Vol</th>
                <th className="p-2 text-right">Bid</th>
                <th className="p-2 text-right">Ask</th>
              </tr>
            </thead>
            <tbody>
              {strikes.map(strike => {
                const call = calls.find(c => c.strike === strike);
                const put = puts.find(p => p.strike === strike);
                const isITMCall = strike < currentPrice;
                const isITMPut = strike > currentPrice;
                const isATM = Math.abs(strike - currentPrice) < (currentPrice * 0.01);

                return (
                  <tr 
                    key={strike} 
                    className={`border-b border-[#1e2329] hover:bg-[#1e2329] ${isATM ? 'bg-[#f0b90b]/5' : ''}`}
                  >
                    <td className={`p-2 ${isITMCall ? 'text-[#0ecb81]' : 'text-white'} cursor-pointer hover:underline`}
                        onClick={() => call && onTrade?.(call, 'BUY')}>
                      {call ? call.bid.toFixed(2) : '-'}
                    </td>
                    <td className={`p-2 ${isITMCall ? 'text-[#0ecb81]' : 'text-white'}`}>
                      {call ? call.ask.toFixed(2) : '-'}
                    </td>
                    <td className="p-2 text-[#848e9c]">{call ? call.volume.toLocaleString() : '-'}</td>
                    <td className="p-2 text-[#848e9c]">{call ? `${(call.impliedVolatility * 100).toFixed(1)}%` : '-'}</td>
                    <td className={`p-2 text-center font-medium ${isATM ? 'text-[#f0b90b]' : 'text-white'}`}>
                      {strike.toFixed(2)}
                    </td>
                    <td className="p-2 text-right text-[#848e9c]">{put ? `${(put.impliedVolatility * 100).toFixed(1)}%` : '-'}</td>
                    <td className="p-2 text-right text-[#848e9c]">{put ? put.volume.toLocaleString() : '-'}</td>
                    <td className={`p-2 text-right ${isITMPut ? 'text-[#f6465d]' : 'text-white'} cursor-pointer hover:underline`}
                        onClick={() => put && onTrade?.(put, 'BUY')}>
                      {put ? put.bid.toFixed(2) : '-'}
                    </td>
                    <td className={`p-2 text-right ${isITMPut ? 'text-[#f6465d]' : 'text-white'}`}>
                      {put ? put.ask.toFixed(2) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#848e9c] border-b border-[#2b3139]">
                <th className="p-2 text-left">Strike</th>
                <th className="p-2 text-left">Bid</th>
                <th className="p-2 text-left">Ask</th>
                <th className="p-2 text-left">Last</th>
                <th className="p-2 text-left">Vol</th>
                <th className="p-2 text-left">OI</th>
                <th className="p-2 text-left">IV</th>
                <th className="p-2 text-left">Delta</th>
                <th className="p-2 text-left">Gamma</th>
                <th className="p-2 text-left">Theta</th>
                <th className="p-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {(showType === 'CALL' ? calls : puts).map((option, idx) => {
                const isITM = showType === 'CALL' ? option.strike < currentPrice : option.strike > currentPrice;
                return (
                  <tr key={idx} className={`border-b border-[#1e2329] hover:bg-[#1e2329] ${isITM ? 'bg-[#0ecb81]/5' : ''}`}>
                    <td className="p-2 font-medium">{option.strike.toFixed(2)}</td>
                    <td className="p-2 text-[#0ecb81]">{option.bid.toFixed(2)}</td>
                    <td className="p-2 text-[#f6465d]">{option.ask.toFixed(2)}</td>
                    <td className="p-2">{option.premium.toFixed(2)}</td>
                    <td className="p-2 text-[#848e9c]">{option.volume.toLocaleString()}</td>
                    <td className="p-2 text-[#848e9c]">{option.openInterest.toLocaleString()}</td>
                    <td className="p-2 text-[#848e9c]">{(option.impliedVolatility * 100).toFixed(1)}%</td>
                    <td className="p-2">{option.delta.toFixed(3)}</td>
                    <td className="p-2">{option.gamma.toFixed(3)}</td>
                    <td className="p-2 text-[#f6465d]">{option.theta.toFixed(3)}</td>
                    <td className="p-2">
                      <button 
                        onClick={() => onTrade?.(option, 'BUY')}
                        className="px-2 py-0.5 bg-[#0ecb81] text-black text-xs rounded font-medium hover:bg-[#0ecb81]/80"
                      >
                        Buy
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
