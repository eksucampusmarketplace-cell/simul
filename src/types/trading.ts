export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  marketCap?: number;
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Position {
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
  dayGain: number;
  dayGainPercent: number;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  orderType: 'Market' | 'Limit' | 'Stop';
  quantity: number;
  price: number;
  total: number;
  timestamp: Date;
  status: 'Filled' | 'Pending' | 'Cancelled';
}

export interface OptionsContract {
  symbol: string;
  type: 'CALL' | 'PUT';
  strike: number;
  expiry: string;
  premium: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface Portfolio {
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
  dayGain: number;
  dayGainPercent: number;
  buyingPower: number;
  positions: Position[];
  trades: Trade[];
}

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y' | 'ALL';
