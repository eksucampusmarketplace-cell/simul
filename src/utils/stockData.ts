import { CandleData, StockQuote, OptionsContract } from '../types/trading';

const POPULAR_STOCKS: Record<string, { name: string; basePrice: number }> = {
  AAPL: { name: 'Apple Inc.', basePrice: 189.84 },
  TSLA: { name: 'Tesla, Inc.', basePrice: 248.42 },
  NVDA: { name: 'NVIDIA Corporation', basePrice: 875.28 },
  MSFT: { name: 'Microsoft Corporation', basePrice: 420.72 },
  AMZN: { name: 'Amazon.com, Inc.', basePrice: 185.07 },
  META: { name: 'Meta Platforms, Inc.', basePrice: 493.50 },
  GOOGL: { name: 'Alphabet Inc.', basePrice: 174.13 },
  AMD: { name: 'Advanced Micro Devices', basePrice: 162.48 },
  SPY: { name: 'SPDR S&P 500 ETF', basePrice: 523.96 },
  QQQ: { name: 'Invesco QQQ Trust', basePrice: 449.34 },
  NFLX: { name: 'Netflix, Inc.', basePrice: 628.15 },
  DIS: { name: 'The Walt Disney Company', basePrice: 113.42 },
  BA: { name: 'The Boeing Company', basePrice: 184.37 },
  JPM: { name: 'JPMorgan Chase & Co.', basePrice: 198.54 },
  V: { name: 'Visa Inc.', basePrice: 279.83 },
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateRealisticPrice(basePrice: number, seed: number, volatility: number = 0.02): number {
  const change = (seededRandom(seed) - 0.5) * 2 * volatility * basePrice;
  return Math.round((basePrice + change) * 100) / 100;
}

export function generateCandleData(symbol: string, range: string): CandleData[] {
  const stock = POPULAR_STOCKS[symbol] || { basePrice: 150 };
  const candles: CandleData[] = [];
  
  let numCandles: number;
  let intervalMinutes: number;
  
  switch (range) {
    case '1D':
      numCandles = 78; // 6.5 hours of trading, 5-min candles
      intervalMinutes = 5;
      break;
    case '1W':
      numCandles = 5 * 78;
      intervalMinutes = 5;
      break;
    case '1M':
      numCandles = 22;
      intervalMinutes = 1440;
      break;
    case '3M':
      numCandles = 65;
      intervalMinutes = 1440;
      break;
    case '1Y':
      numCandles = 252;
      intervalMinutes = 1440;
      break;
    case '5Y':
      numCandles = 260;
      intervalMinutes = 7200;
      break;
    default:
      numCandles = 78;
      intervalMinutes = 5;
  }

  const now = new Date();
  let currentPrice = stock.basePrice;
  const trend = seededRandom(symbol.charCodeAt(0) + now.getDate()) > 0.5 ? 1 : -1;
  
  for (let i = 0; i < numCandles; i++) {
    const time = new Date(now.getTime() - (numCandles - i) * intervalMinutes * 60000);
    const seed = symbol.charCodeAt(0) * 1000 + i;
    
    const volatility = range === '1D' ? 0.003 : range === '1W' ? 0.008 : 0.015;
    const trendBias = trend * 0.001 * (i / numCandles);
    
    const open = currentPrice;
    const changePercent = (seededRandom(seed) - 0.48 + trendBias) * volatility;
    const close = Math.round((open * (1 + changePercent)) * 100) / 100;
    const high = Math.round(Math.max(open, close) * (1 + seededRandom(seed + 1) * volatility * 0.5) * 100) / 100;
    const low = Math.round(Math.min(open, close) * (1 - seededRandom(seed + 2) * volatility * 0.5) * 100) / 100;
    const volume = Math.floor(seededRandom(seed + 3) * 5000000 + 1000000);

    candles.push({
      time: time.toISOString(),
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

export function getStockQuote(symbol: string): StockQuote {
  const stock = POPULAR_STOCKS[symbol];
  if (!stock) {
    return {
      symbol,
      name: symbol,
      price: 100,
      change: 0,
      changePercent: 0,
      high: 100,
      low: 100,
      open: 100,
      previousClose: 100,
      volume: 0,
    };
  }

  const now = new Date();
  const seed = symbol.charCodeAt(0) * 100 + now.getHours() + now.getMinutes();
  const price = generateRealisticPrice(stock.basePrice, seed, 0.01);
  const previousClose = generateRealisticPrice(stock.basePrice, seed - 100, 0.005);
  const change = Math.round((price - previousClose) * 100) / 100;
  const changePercent = Math.round((change / previousClose) * 10000) / 100;

  return {
    symbol,
    name: stock.name,
    price,
    change,
    changePercent,
    high: Math.round(price * 1.012 * 100) / 100,
    low: Math.round(price * 0.988 * 100) / 100,
    open: generateRealisticPrice(stock.basePrice, seed + 50, 0.005),
    previousClose,
    volume: Math.floor(seededRandom(seed) * 50000000 + 10000000),
    marketCap: Math.floor(stock.basePrice * 1000000000 * (seededRandom(seed + 10) * 3 + 1)),
  };
}

export function generateOptionsChain(symbol: string, currentPrice: number): OptionsContract[] {
  const options: OptionsContract[] = [];
  const strikes: number[] = [];
  const step = currentPrice > 500 ? 10 : currentPrice > 100 ? 5 : 2.5;
  
  for (let i = -5; i <= 5; i++) {
    strikes.push(Math.round((currentPrice + i * step) * 100) / 100);
  }

  const expiries = ['2024-03-15', '2024-03-22', '2024-04-19', '2024-05-17'];
  
  expiries.forEach((expiry) => {
    strikes.forEach((strike, idx) => {
      const seed = symbol.charCodeAt(0) + strike + idx;
      const daysToExpiry = Math.max(1, Math.floor((new Date(expiry).getTime() - Date.now()) / 86400000));
      const moneyness = (currentPrice - strike) / currentPrice;
      
      const callPremium = Math.max(0.01, Math.round((
        Math.max(0, currentPrice - strike) +
        currentPrice * 0.02 * Math.sqrt(daysToExpiry / 365) * (1 - Math.abs(moneyness) * 2)
      ) * 100) / 100);
      
      const putPremium = Math.max(0.01, Math.round((
        Math.max(0, strike - currentPrice) +
        currentPrice * 0.02 * Math.sqrt(daysToExpiry / 365) * (1 - Math.abs(moneyness) * 2)
      ) * 100) / 100);

      const iv = Math.round((0.2 + Math.abs(moneyness) * 0.5 + seededRandom(seed) * 0.1) * 100) / 100;

      options.push({
        symbol,
        type: 'CALL',
        strike,
        expiry,
        premium: callPremium,
        bid: Math.round((callPremium * 0.97) * 100) / 100,
        ask: Math.round((callPremium * 1.03) * 100) / 100,
        volume: Math.floor(seededRandom(seed + 1) * 5000),
        openInterest: Math.floor(seededRandom(seed + 2) * 20000),
        impliedVolatility: iv,
        delta: Math.round((0.5 + moneyness * 2) * 100) / 100,
        gamma: Math.round(seededRandom(seed + 3) * 0.05 * 100) / 100,
        theta: -Math.round(seededRandom(seed + 4) * callPremium * 0.05 * 100) / 100,
        vega: Math.round(seededRandom(seed + 5) * 0.3 * 100) / 100,
      });

      options.push({
        symbol,
        type: 'PUT',
        strike,
        expiry,
        premium: putPremium,
        bid: Math.round((putPremium * 0.97) * 100) / 100,
        ask: Math.round((putPremium * 1.03) * 100) / 100,
        volume: Math.floor(seededRandom(seed + 6) * 3000),
        openInterest: Math.floor(seededRandom(seed + 7) * 15000),
        impliedVolatility: iv,
        delta: -Math.round((0.5 - moneyness * 2) * 100) / 100,
        gamma: Math.round(seededRandom(seed + 8) * 0.05 * 100) / 100,
        theta: -Math.round(seededRandom(seed + 9) * putPremium * 0.05 * 100) / 100,
        vega: Math.round(seededRandom(seed + 10) * 0.3 * 100) / 100,
      });
    });
  });

  return options;
}

export function getAvailableSymbols(): string[] {
  return Object.keys(POPULAR_STOCKS);
}

export function getStockName(symbol: string): string {
  return POPULAR_STOCKS[symbol]?.name || symbol;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)}B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return value.toFixed(2);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}
