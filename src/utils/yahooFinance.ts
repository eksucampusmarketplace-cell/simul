import { StockQuote, CandleData } from '../types/trading';

const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  '',
];
const YAHOO_BASE = 'https://query2.finance.yahoo.com';

const STOCK_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  TSLA: 'Tesla, Inc.',
  NVDA: 'NVIDIA Corporation',
  MSFT: 'Microsoft Corporation',
  AMZN: 'Amazon.com, Inc.',
  META: 'Meta Platforms, Inc.',
  GOOGL: 'Alphabet Inc.',
  AMD: 'Advanced Micro Devices',
  SPY: 'SPDR S&P 500 ETF',
  QQQ: 'Invesco QQQ Trust',
  NFLX: 'Netflix, Inc.',
  DIS: 'The Walt Disney Company',
  BA: 'The Boeing Company',
  JPM: 'JPMorgan Chase & Co.',
  V: 'Visa Inc.',
};

interface YahooChartResult {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        regularMarketOpen?: number;
        regularMarketVolume?: number;
        marketCap?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }>;
      };
    }>;
  };
}

function getIntervalAndRange(timeRange: string): { interval: string; range: string } {
  switch (timeRange) {
    case '1D': return { interval: '5m', range: '1d' };
    case '1W': return { interval: '15m', range: '5d' };
    case '1M': return { interval: '1h', range: '1mo' };
    case '3M': return { interval: '1d', range: '3mo' };
    case '1Y': return { interval: '1d', range: '1y' };
    case '5Y': return { interval: '1wk', range: '5y' };
    default: return { interval: '5m', range: '1d' };
  }
}

async function fetchWithProxies(targetUrl: string): Promise<Response | null> {
  for (const proxy of CORS_PROXIES) {
    try {
      const url = proxy ? `${proxy}${encodeURIComponent(targetUrl)}` : targetUrl;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const text = await response.text();
        if (text && !text.includes('Server-side requests') && !text.includes('Too Many Requests')) {
          return new Response(text, { status: 200 });
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const targetUrl = `${YAHOO_BASE}/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const response = await fetchWithProxies(targetUrl);
    if (!response) return null;
    
    const data: YahooChartResult = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result?.meta) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice || 0;
    const previousClose = meta.previousClose || price;
    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    return {
      symbol,
      name: STOCK_NAMES[symbol] || symbol,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      high: Math.round((meta.regularMarketDayHigh || price) * 100) / 100,
      low: Math.round((meta.regularMarketDayLow || price) * 100) / 100,
      open: Math.round((meta.regularMarketOpen || price) * 100) / 100,
      previousClose: Math.round(previousClose * 100) / 100,
      volume: meta.regularMarketVolume || 0,
      marketCap: meta.marketCap,
    };
  } catch {
    return null;
  }
}

export async function fetchCandleData(symbol: string, timeRange: string): Promise<CandleData[] | null> {
  try {
    const { interval, range } = getIntervalAndRange(timeRange);
    const targetUrl = `${YAHOO_BASE}/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
    const response = await fetchWithProxies(targetUrl);
    if (!response) return null;

    const data: YahooChartResult = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result?.timestamp || !result?.indicators?.quote?.[0]) return null;

    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];
    const candles: CandleData[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const open = quote.open?.[i];
      const high = quote.high?.[i];
      const low = quote.low?.[i];
      const close = quote.close?.[i];
      const volume = quote.volume?.[i];

      if (open != null && high != null && low != null && close != null) {
        candles.push({
          time: new Date(timestamps[i] * 1000).toISOString(),
          open,
          high,
          low,
          close,
          volume: volume || 0,
        });
      }
    }

    return candles.length > 0 ? candles : null;
  } catch {
    return null;
  }
}

export async function fetchMultipleQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();
  const promises = symbols.map(async (symbol) => {
    const quote = await fetchStockQuote(symbol);
    if (quote) {
      results.set(symbol, quote);
    }
  });
  await Promise.all(promises);
  return results;
}
