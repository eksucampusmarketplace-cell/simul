import { useState } from 'react';
import { Zap, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import { fetchStockQuote } from '../utils/yahooFinance';
import { getStockQuote, formatCurrency } from '../utils/stockData';
import { Trade, StockQuote } from '../types/trading';

interface AutoTradeGeneratorProps {
  onGenerateTrade: (trade: Omit<Trade, 'id' | 'timestamp' | 'status'>, profit: number) => void;
  onUpdatePortfolio: (symbol: string, quantity: number, avgCost: number, currentPrice: number, name: string) => void;
}

const TRENDING_STOCKS = ['TSLA', 'NVDA', 'AAPL', 'MSFT', 'AMD', 'META', 'AMZN', 'GOOGL', 'SPY', 'QQQ'];

type TradeType = 'stock' | 'call' | 'put';

export function AutoTradeGenerator({ onGenerateTrade, onUpdatePortfolio }: AutoTradeGeneratorProps) {
  const [selectedStock, setSelectedStock] = useState('TSLA');
  const [targetProfit, setTargetProfit] = useState(50000);
  const [tradeType, setTradeType] = useState<TradeType>('stock');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTrade, setGeneratedTrade] = useState<{
    symbol: string;
    name: string;
    type: TradeType;
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    profit: number;
    percentGain: number;
    strikePrice?: number;
    expiry?: string;
    premium?: number;
    contracts?: number;
  } | null>(null);

  const generateTrade = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      let realQuote: StockQuote | null = null;
      try {
        realQuote = await fetchStockQuote(selectedStock);
      } catch {
        // fallback below
      }

      const quote = realQuote || getStockQuote(selectedStock);
      const currentPrice = quote.price;

      if (tradeType === 'stock') {
        const percentGain = 5 + Math.random() * 25;
        const entryPrice = currentPrice / (1 + percentGain / 100);
        const quantity = Math.round(targetProfit / (currentPrice - entryPrice));
        const actualProfit = (currentPrice - entryPrice) * quantity;

        const trade = {
          symbol: selectedStock,
          name: quote.name,
          type: 'stock' as TradeType,
          entryPrice: Math.round(entryPrice * 100) / 100,
          exitPrice: currentPrice,
          quantity,
          profit: Math.round(actualProfit * 100) / 100,
          percentGain: Math.round(percentGain * 100) / 100,
        };

        setGeneratedTrade(trade);
        onUpdatePortfolio(selectedStock, quantity, trade.entryPrice, currentPrice, quote.name);
        onGenerateTrade({
          symbol: selectedStock,
          type: 'BUY',
          orderType: 'Market',
          quantity,
          price: trade.entryPrice,
          total: trade.entryPrice * quantity,
        }, actualProfit);

      } else {
        const isCall = tradeType === 'call';
        const strikeOffset = isCall ? -5 + Math.random() * 10 : -10 + Math.random() * 5;
        const strikePrice = Math.round((currentPrice + strikeOffset) / 0.5) * 0.5;

        const intrinsicValue = isCall
          ? Math.max(0, currentPrice - strikePrice)
          : Math.max(0, strikePrice - currentPrice);
        const timeValue = currentPrice * 0.02 + Math.random() * currentPrice * 0.03;
        const currentPremium = intrinsicValue + timeValue;

        const percentGain = 50 + Math.random() * 300;
        const entryPremium = currentPremium / (1 + percentGain / 100);
        const contracts = Math.round(targetProfit / ((currentPremium - entryPremium) * 100));
        const actualProfit = (currentPremium - entryPremium) * contracts * 100;

        const expiry = new Date();
        expiry.setDate(expiry.getDate() + Math.floor(Math.random() * 30) + 7);
        const expiryStr = expiry.toISOString().split('T')[0];

        const trade = {
          symbol: selectedStock,
          name: quote.name,
          type: tradeType,
          entryPrice: Math.round(entryPremium * 100) / 100,
          exitPrice: Math.round(currentPremium * 100) / 100,
          quantity: contracts,
          profit: Math.round(actualProfit * 100) / 100,
          percentGain: Math.round(percentGain * 100) / 100,
          strikePrice,
          expiry: expiryStr,
          premium: Math.round(currentPremium * 100) / 100,
          contracts,
        };

        setGeneratedTrade(trade);

        const optionSymbol = `${selectedStock} $${strikePrice} ${isCall ? 'C' : 'P'} ${expiryStr}`;

        onGenerateTrade({
          symbol: optionSymbol,
          type: 'BUY',
          orderType: 'Market',
          quantity: contracts,
          price: trade.entryPrice * 100,
          total: trade.entryPrice * contracts * 100,
        }, actualProfit);
      }
    } catch (err) {
      console.error('Auto trade generation failed:', err);
      setError('Failed to generate trade. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const profitPresets = [30000, 50000, 75000, 100000, 150000, 200000];

  return (
    <div className="bg-[#1e2329] rounded-lg border border-[#2b3139] p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} className="text-[#f0b90b]" />
        <h3 className="text-sm font-semibold text-white">Auto Trade Generator</h3>
      </div>

      {/* Stock Selection */}
      <div className="mb-3">
        <label className="text-xs text-[#848e9c] mb-1.5 block">Select Stock</label>
        <div className="grid grid-cols-5 gap-1.5">
          {TRENDING_STOCKS.map(stock => (
            <button
              key={stock}
              onClick={() => setSelectedStock(stock)}
              className={`px-2 py-1.5 text-xs rounded font-medium transition-colors ${
                selectedStock === stock
                  ? 'bg-[#f0b90b] text-[#0b0e11]'
                  : 'bg-[#2b3139] text-[#848e9c] hover:text-white hover:bg-[#3b4149]'
              }`}
            >
              {stock}
            </button>
          ))}
        </div>
      </div>

      {/* Trade Type */}
      <div className="mb-3">
        <label className="text-xs text-[#848e9c] mb-1.5 block">Trade Type</label>
        <div className="flex gap-2">
          <button
            onClick={() => setTradeType('stock')}
            className={`flex-1 px-3 py-2 text-xs rounded font-medium transition-colors ${
              tradeType === 'stock'
                ? 'bg-[#0ecb81] text-white'
                : 'bg-[#2b3139] text-[#848e9c] hover:text-white'
            }`}
          >
            Stock
          </button>
          <button
            onClick={() => setTradeType('call')}
            className={`flex-1 px-3 py-2 text-xs rounded font-medium transition-colors ${
              tradeType === 'call'
                ? 'bg-[#0ecb81] text-white'
                : 'bg-[#2b3139] text-[#848e9c] hover:text-white'
            }`}
          >
            Call Option
          </button>
          <button
            onClick={() => setTradeType('put')}
            className={`flex-1 px-3 py-2 text-xs rounded font-medium transition-colors ${
              tradeType === 'put'
                ? 'bg-[#f6465d] text-white'
                : 'bg-[#2b3139] text-[#848e9c] hover:text-white'
            }`}
          >
            Put Option
          </button>
        </div>
      </div>

      {/* Target Profit */}
      <div className="mb-3">
        <label className="text-xs text-[#848e9c] mb-1.5 block">Target Profit</label>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {profitPresets.map(preset => (
            <button
              key={preset}
              onClick={() => setTargetProfit(preset)}
              className={`px-2 py-1.5 text-xs rounded font-medium transition-colors ${
                targetProfit === preset
                  ? 'bg-[#0ecb81] text-white'
                  : 'bg-[#2b3139] text-[#848e9c] hover:text-white'
              }`}
            >
              ${(preset / 1000).toFixed(0)}K
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <DollarSign size={14} className="text-[#848e9c]" />
          <input
            type="number"
            value={targetProfit}
            onChange={(e) => setTargetProfit(Number(e.target.value))}
            className="flex-1 bg-[#2b3139] border border-[#3b4149] rounded px-3 py-1.5 text-sm text-white outline-none focus:border-[#f0b90b]"
            min={1000}
            max={1000000}
          />
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateTrade}
        disabled={isGenerating}
        className="w-full py-2.5 bg-[#f0b90b] text-[#0b0e11] font-semibold text-sm rounded hover:bg-[#f8d12f] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <RefreshCw size={14} className="animate-spin" />
        ) : (
          <TrendingUp size={14} />
        )}
        {isGenerating ? 'Generating...' : 'Generate Trade'}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-[#f6465d]/10 border border-[#f6465d]/30 rounded text-xs text-[#f6465d] text-center">
          {error}
        </div>
      )}

      {/* Generated Trade Result */}
      {generatedTrade && (
        <div className="mt-4 p-3 bg-[#0b0e11] rounded-lg border border-[#2b3139]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#848e9c]">Generated Trade</span>
            <span className="text-xs text-[#0ecb81] font-semibold">
              +{formatCurrency(generatedTrade.profit)} ({generatedTrade.percentGain}%)
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#848e9c]">Symbol</span>
              <span className="text-white font-medium">{generatedTrade.symbol}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#848e9c]">Type</span>
              <span className="text-white capitalize">{generatedTrade.type}</span>
            </div>
            {generatedTrade.type !== 'stock' && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-[#848e9c]">Strike</span>
                  <span className="text-white">${generatedTrade.strikePrice}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#848e9c]">Expiry</span>
                  <span className="text-white">{generatedTrade.expiry}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#848e9c]">Contracts</span>
                  <span className="text-white">{generatedTrade.contracts}</span>
                </div>
              </>
            )}
            {generatedTrade.type === 'stock' && (
              <div className="flex justify-between text-xs">
                <span className="text-[#848e9c]">Shares</span>
                <span className="text-white">{generatedTrade.quantity}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-[#848e9c]">Entry</span>
              <span className="text-white">{formatCurrency(generatedTrade.entryPrice)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#848e9c]">Current / Exit</span>
              <span className="text-[#0ecb81]">{formatCurrency(generatedTrade.exitPrice)}</span>
            </div>
            <div className="border-t border-[#2b3139] pt-1.5 mt-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-[#848e9c] font-medium">Total P&L</span>
                <span className="text-[#0ecb81] font-bold">+{formatCurrency(generatedTrade.profit)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="mt-3 text-[10px] text-[#848e9c] text-center">
        Uses real-time market prices. Screenshot or record for content.
      </p>
    </div>
  );
}
