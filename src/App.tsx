import { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import { CandlestickChart } from './components/CandlestickChart';
import { PortfolioView } from './components/PortfolioView';
import { OptionsChain } from './components/OptionsChain';
import { TradePanel } from './components/TradePanel';
import { TradeHistory } from './components/TradeHistory';
import { StockHeader } from './components/StockHeader';
import { VideoRecorder } from './components/VideoRecorder';
import { Watchlist } from './components/Watchlist';
import { LiveTicker } from './components/LiveTicker';
import { OrderNotification } from './components/OrderNotification';
import { AutoTradeGenerator } from './components/AutoTradeGenerator';
import { AutoVideoGenerator } from './components/AutoVideoGenerator';
import { 
  getStockQuote, 
  generateCandleData, 
  generateOptionsChain,
  getAvailableSymbols,
  formatCurrency,
} from './utils/stockData';
import { fetchStockQuote, fetchCandleData } from './utils/yahooFinance';
import { captureScreenshot } from './utils/screenshot';
import { Portfolio, Trade, TimeRange, StockQuote, CandleData, OptionsContract } from './types/trading';
import { Camera, Search, BarChart3, Wallet, Clock, Settings, Activity, Menu, X, Zap, Film } from 'lucide-react';

type TabView = 'chart' | 'options' | 'portfolio' | 'history' | 'autotrade' | 'autovideo';

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState('TSLA');
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');
  const [activeTab, setActiveTab] = useState<TabView>('chart');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [lastTrade, setLastTrade] = useState<Trade | null>(null);
  const [quote, setQuote] = useState<StockQuote>(getStockQuote('TSLA'));
  const [candleData, setCandleData] = useState<CandleData[]>(generateCandleData('TSLA', '1D'));
  const [optionsData, setOptionsData] = useState<OptionsContract[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);
  const [animatedCandles, setAnimatedCandles] = useState<CandleData[]>([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const [portfolio, setPortfolio] = useState<Portfolio>({
    totalValue: 127843.56,
    totalGain: 14523.78,
    totalGainPercent: 12.81,
    dayGain: 1247.32,
    dayGainPercent: 0.98,
    buyingPower: 45231.89,
    positions: [
      {
        symbol: 'TSLA',
        name: 'Tesla, Inc.',
        quantity: 50,
        avgCost: 215.30,
        currentPrice: 248.42,
        totalValue: 12421.00,
        totalGain: 1656.00,
        totalGainPercent: 15.38,
        dayGain: 234.50,
        dayGainPercent: 1.92,
      },
      {
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        quantity: 25,
        avgCost: 745.20,
        currentPrice: 875.28,
        totalValue: 21882.00,
        totalGain: 3252.00,
        totalGainPercent: 17.45,
        dayGain: 567.25,
        dayGainPercent: 2.66,
      },
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        quantity: 100,
        avgCost: 175.40,
        currentPrice: 189.84,
        totalValue: 18984.00,
        totalGain: 1444.00,
        totalGainPercent: 8.23,
        dayGain: -123.00,
        dayGainPercent: -0.64,
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        quantity: 30,
        avgCost: 380.15,
        currentPrice: 420.72,
        totalValue: 12621.60,
        totalGain: 1217.10,
        totalGainPercent: 10.68,
        dayGain: 189.30,
        dayGainPercent: 1.52,
      },
      {
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF',
        quantity: 40,
        avgCost: 498.30,
        currentPrice: 523.96,
        totalValue: 20958.40,
        totalGain: 1026.40,
        totalGainPercent: 5.15,
        dayGain: 312.00,
        dayGainPercent: 1.51,
      },
    ],
    trades: [],
  });

  const watchlistSymbols = getAvailableSymbols();

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      // Try fetching real data first
      const [realQuote, realCandles] = await Promise.all([
        fetchStockQuote(selectedSymbol),
        fetchCandleData(selectedSymbol, timeRange),
      ]);

      if (cancelled) return;

      if (realQuote) {
        setQuote(realQuote);
        if (activeTab === 'options') {
          setOptionsData(generateOptionsChain(selectedSymbol, realQuote.price));
        }
      } else {
        const fallbackQuote = getStockQuote(selectedSymbol);
        setQuote(fallbackQuote);
        if (activeTab === 'options') {
          setOptionsData(generateOptionsChain(selectedSymbol, fallbackQuote.price));
        }
      }

      if (realCandles && realCandles.length > 0) {
        setCandleData(realCandles);
        setAnimatedCandles(realCandles);
      } else {
        const fallbackCandles = generateCandleData(selectedSymbol, timeRange);
        setCandleData(fallbackCandles);
        setAnimatedCandles(fallbackCandles);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [selectedSymbol, timeRange, activeTab]);

  // Live price updates
  useEffect(() => {
    const interval = setInterval(async () => {
      const realQuote = await fetchStockQuote(selectedSymbol);
      if (realQuote) {
        setQuote(realQuote);
      }
      
      // Update position prices in portfolio
      setPortfolio(prev => {
        const updatedPositions = prev.positions.map(pos => {
          const posQuote = getStockQuote(pos.symbol);
          return {
            ...pos,
            currentPrice: posQuote.price,
            totalValue: pos.quantity * posQuote.price,
            totalGain: (posQuote.price - pos.avgCost) * pos.quantity,
            totalGainPercent: ((posQuote.price - pos.avgCost) / pos.avgCost) * 100,
            dayGain: posQuote.change * pos.quantity,
            dayGainPercent: posQuote.changePercent,
          };
        });
        const totalValue = updatedPositions.reduce((sum, p) => sum + p.totalValue, 0) + prev.buyingPower;
        const totalGain = updatedPositions.reduce((sum, p) => sum + p.totalGain, 0);
        const dayGain = updatedPositions.reduce((sum, p) => sum + p.dayGain, 0);
        return {
          ...prev,
          positions: updatedPositions,
          totalValue,
          totalGain,
          totalGainPercent: (totalGain / (totalValue - totalGain)) * 100,
          dayGain,
          dayGainPercent: (dayGain / (totalValue - dayGain)) * 100,
        };
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const startChartAnimation = useCallback(() => {
    if (isAnimating) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setIsAnimating(false);
      setAnimatedCandles(candleData);
      return;
    }

    setIsAnimating(true);
    setAnimatedCandles([]);
    let currentIndex = 0;

    const animate = () => {
      if (currentIndex < candleData.length) {
        setAnimatedCandles(prev => [...prev, candleData[currentIndex]]);
        currentIndex++;
        animationRef.current = requestAnimationFrame(() => {
          setTimeout(animate, 80);
        });
      } else {
        setIsAnimating(false);
      }
    };

    animate();
  }, [isAnimating, candleData]);

  const handleExecuteTrade = useCallback((tradeData: Omit<Trade, 'id' | 'timestamp' | 'status'>) => {
    const newTrade: Trade = {
      ...tradeData,
      id: `TRD-${Date.now()}`,
      timestamp: new Date(),
      status: 'Filled',
    };

    setLastTrade(newTrade);
    setPortfolio(prev => {
      const newTrades = [newTrade, ...prev.trades];
      const existingPos = prev.positions.find(p => p.symbol === tradeData.symbol);
      let newPositions = [...prev.positions];
      let newBuyingPower = prev.buyingPower;

      if (tradeData.type === 'BUY') {
        newBuyingPower -= tradeData.total;
        if (existingPos) {
          const totalShares = existingPos.quantity + tradeData.quantity;
          const totalCost = existingPos.avgCost * existingPos.quantity + tradeData.price * tradeData.quantity;
          newPositions = newPositions.map(p =>
            p.symbol === tradeData.symbol
              ? {
                  ...p,
                  quantity: totalShares,
                  avgCost: totalCost / totalShares,
                  totalValue: totalShares * p.currentPrice,
                  totalGain: (p.currentPrice - totalCost / totalShares) * totalShares,
                  totalGainPercent: ((p.currentPrice - totalCost / totalShares) / (totalCost / totalShares)) * 100,
                }
              : p
          );
        } else {
          const currentQuote = getStockQuote(tradeData.symbol);
          newPositions.push({
            symbol: tradeData.symbol,
            name: currentQuote.name,
            quantity: tradeData.quantity,
            avgCost: tradeData.price,
            currentPrice: currentQuote.price,
            totalValue: tradeData.quantity * currentQuote.price,
            totalGain: (currentQuote.price - tradeData.price) * tradeData.quantity,
            totalGainPercent: ((currentQuote.price - tradeData.price) / tradeData.price) * 100,
            dayGain: currentQuote.change * tradeData.quantity,
            dayGainPercent: currentQuote.changePercent,
          });
        }
      } else {
        newBuyingPower += tradeData.total;
        if (existingPos) {
          const remainingShares = existingPos.quantity - tradeData.quantity;
          if (remainingShares <= 0) {
            newPositions = newPositions.filter(p => p.symbol !== tradeData.symbol);
          } else {
            newPositions = newPositions.map(p =>
              p.symbol === tradeData.symbol
                ? {
                    ...p,
                    quantity: remainingShares,
                    totalValue: remainingShares * p.currentPrice,
                    totalGain: (p.currentPrice - p.avgCost) * remainingShares,
                  }
                : p
            );
          }
        }
      }

      const totalValue = newPositions.reduce((sum, p) => sum + p.totalValue, 0) + newBuyingPower;
      return {
        ...prev,
        trades: newTrades,
        positions: newPositions,
        buyingPower: newBuyingPower,
        totalValue,
      };
    });
  }, []);

  const handleSelectStock = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setShowSearch(false);
    setSearchQuery('');
    setShowMobileSidebar(false);
  }, []);

  const handleAutoTradeGenerate = useCallback((tradeData: Omit<Trade, 'id' | 'timestamp' | 'status'>, _profit: number) => {
    const newTrade: Trade = {
      ...tradeData,
      id: `TRD-${Date.now()}`,
      timestamp: new Date(),
      status: 'Filled',
    };
    setLastTrade(newTrade);
    setPortfolio(prev => ({
      ...prev,
      trades: [newTrade, ...prev.trades],
    }));
  }, []);

  const handleAutoUpdatePortfolio = useCallback((symbol: string, quantity: number, avgCost: number, currentPrice: number, name: string) => {
    setPortfolio(prev => {
      const existingPos = prev.positions.find(p => p.symbol === symbol);
      let newPositions = [...prev.positions];
      if (existingPos) {
        newPositions = newPositions.map(p =>
          p.symbol === symbol
            ? {
                ...p,
                quantity,
                avgCost,
                currentPrice,
                totalValue: quantity * currentPrice,
                totalGain: (currentPrice - avgCost) * quantity,
                totalGainPercent: ((currentPrice - avgCost) / avgCost) * 100,
                dayGain: (currentPrice - avgCost) * quantity * 0.1,
                dayGainPercent: ((currentPrice - avgCost) / avgCost) * 10,
              }
            : p
        );
      } else {
        newPositions.push({
          symbol,
          name,
          quantity,
          avgCost,
          currentPrice,
          totalValue: quantity * currentPrice,
          totalGain: (currentPrice - avgCost) * quantity,
          totalGainPercent: ((currentPrice - avgCost) / avgCost) * 100,
          dayGain: (currentPrice - avgCost) * quantity * 0.1,
          dayGainPercent: ((currentPrice - avgCost) / avgCost) * 10,
        });
      }
      const totalValue = newPositions.reduce((sum, p) => sum + p.totalValue, 0) + prev.buyingPower;
      const totalGain = newPositions.reduce((sum, p) => sum + p.totalGain, 0);
      const dayGain = newPositions.reduce((sum, p) => sum + p.dayGain, 0);
      return {
        ...prev,
        positions: newPositions,
        totalValue,
        totalGain,
        totalGainPercent: (totalGain / (totalValue - totalGain)) * 100,
        dayGain,
        dayGainPercent: (dayGain / (totalValue - dayGain)) * 100,
      };
    });
  }, []);

  const filteredSymbols = searchQuery
    ? watchlistSymbols.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const currentTime = new Date();
  const marketHours = currentTime.getHours() >= 9 && currentTime.getHours() < 16;

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white font-sans" id="trading-app">
      {/* Top Navigation Bar */}
      <header className="bg-[#0b0e11] border-b border-[#2b3139] sticky top-0 z-40">
        <div className="flex items-center justify-between px-2 sm:px-4 py-2">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="lg:hidden p-1.5 rounded bg-[#1e2329]"
            >
              {showMobileSidebar ? <X size={16} /> : <Menu size={16} />}
            </button>

            <div className="flex items-center gap-2">
              <Activity size={20} className="text-[#f0b90b]" />
            </div>
            
            <div className="relative hidden sm:block">
              <div className="flex items-center bg-[#1e2329] rounded px-3 py-1.5">
                <Search size={14} className="text-[#848e9c] mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                  onFocus={() => setShowSearch(true)}
                  placeholder="Search symbol..."
                  className="bg-transparent text-sm text-white outline-none w-40 placeholder-[#848e9c]"
                />
              </div>
              {showSearch && filteredSymbols.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-[#1e2329] border border-[#2b3139] rounded-lg shadow-xl z-50 w-64">
                  {filteredSymbols.map(symbol => {
                    const q = getStockQuote(symbol);
                    return (
                      <div
                        key={symbol}
                        onClick={() => handleSelectStock(symbol)}
                        className="flex items-center justify-between px-3 py-2 hover:bg-[#2b3139] cursor-pointer"
                      >
                        <div>
                          <div className="text-sm font-medium">{symbol}</div>
                          <div className="text-xs text-[#848e9c]">{q.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs">{formatCurrency(q.price)}</div>
                          <div className={`text-xs ${q.change >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                            {q.change >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${marketHours ? 'bg-[#0ecb81]' : 'bg-[#f6465d]'}`} />
              <span className="text-xs text-[#848e9c]">
                {marketHours ? 'Market Open' : 'Market Closed'}
              </span>
            </div>

            <VideoRecorder targetElementId="trading-app" />
            
            <button
              onClick={() => captureScreenshot('main-content')}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-[#2b3139] text-white text-xs rounded hover:bg-[#3b4149] transition-colors"
            >
              <Camera size={12} />
              <span className="hidden sm:inline">Screenshot</span>
            </button>

            <div className="hidden md:flex items-center gap-1 text-xs text-[#848e9c]">
              <Clock size={12} />
              <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>
        </div>
        
        <LiveTicker />
      </header>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#0b0e11] border-r border-[#2b3139] overflow-y-auto">
            <div className="p-3 border-b border-[#2b3139]">
              <div className="flex items-center bg-[#1e2329] rounded px-3 py-1.5">
                <Search size={14} className="text-[#848e9c] mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                  placeholder="Search symbol..."
                  className="bg-transparent text-sm text-white outline-none w-full placeholder-[#848e9c]"
                />
              </div>
            </div>
            <Watchlist
              symbols={watchlistSymbols}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={handleSelectStock}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Watchlist */}
        <aside className="w-52 border-r border-[#2b3139] overflow-y-auto hidden lg:block">
          <Watchlist
            symbols={watchlistSymbols}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={handleSelectStock}
          />
        </aside>

        {/* Center Content */}
        <main className="flex-1 flex flex-col overflow-hidden" id="main-content">
          {/* Stock Header */}
          <StockHeader
            quote={quote}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          {/* Tab Navigation */}
          <div className="flex items-center border-b border-[#2b3139] px-2 sm:px-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('chart')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'chart'
                  ? 'border-[#f0b90b] text-[#f0b90b]'
                  : 'border-transparent text-[#848e9c] hover:text-white'
              }`}
            >
              <BarChart3 size={14} />
              Chart
            </button>
            <button
              onClick={() => setActiveTab('options')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'options'
                  ? 'border-[#f0b90b] text-[#f0b90b]'
                  : 'border-transparent text-[#848e9c] hover:text-white'
              }`}
            >
              <Settings size={14} />
              Options
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'portfolio'
                  ? 'border-[#f0b90b] text-[#f0b90b]'
                  : 'border-transparent text-[#848e9c] hover:text-white'
              }`}
            >
              <Wallet size={14} />
              Portfolio
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'history'
                  ? 'border-[#f0b90b] text-[#f0b90b]'
                  : 'border-transparent text-[#848e9c] hover:text-white'
              }`}
            >
              <Clock size={14} />
              Orders
            </button>
            <button
              onClick={() => setActiveTab('autotrade')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'autotrade'
                  ? 'border-[#f0b90b] text-[#f0b90b]'
                  : 'border-transparent text-[#848e9c] hover:text-white'
              }`}
            >
              <Zap size={14} />
              Auto Trade
            </button>
            <button
              onClick={() => setActiveTab('autovideo')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'autovideo'
                  ? 'border-[#f0b90b] text-[#f0b90b]'
                  : 'border-transparent text-[#848e9c] hover:text-white'
              }`}
            >
              <Film size={14} />
              <span className="hidden sm:inline">Auto Video</span>
              <span className="sm:hidden">Video</span>
            </button>

            {activeTab === 'chart' && (
              <button
                onClick={startChartAnimation}
                className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${
                  isAnimating
                    ? 'bg-[#f6465d] text-white'
                    : 'bg-[#2b3139] text-[#848e9c] hover:text-white'
                }`}
              >
                <Activity size={12} />
                {isAnimating ? 'Stop' : 'Animate'}
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'chart' && (
              <div className="h-full p-2">
                <CandlestickChart
                  data={isAnimating ? animatedCandles : candleData}
                  symbol={selectedSymbol}
                />
              </div>
            )}
            {activeTab === 'options' && (
              <OptionsChain
                options={optionsData}
                currentPrice={quote.price}
                symbol={selectedSymbol}
                onTrade={(contract, action) => {
                  handleExecuteTrade({
                    symbol: `${contract.symbol} ${contract.strike}${contract.type === 'CALL' ? 'C' : 'P'} ${contract.expiry}`,
                    type: action,
                    orderType: 'Market',
                    quantity: 1,
                    price: contract.ask * 100,
                    total: contract.ask * 100,
                  });
                }}
              />
            )}
            {activeTab === 'portfolio' && (
              <PortfolioView
                portfolio={portfolio}
                onSelectStock={handleSelectStock}
              />
            )}
            {activeTab === 'history' && (
              <TradeHistory trades={portfolio.trades} />
            )}
            {activeTab === 'autotrade' && (
              <div className="p-2 sm:p-4 max-w-lg mx-auto">
                <AutoTradeGenerator
                  onGenerateTrade={handleAutoTradeGenerate}
                  onUpdatePortfolio={handleAutoUpdatePortfolio}
                />
              </div>
            )}
            {activeTab === 'autovideo' && (
              <div className="p-2 sm:p-4 max-w-2xl mx-auto">
                <AutoVideoGenerator
                  selectedSymbol={selectedSymbol}
                  onSwitchToChart={() => setActiveTab('chart')}
                  onSetCandleData={setCandleData}
                />
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Trade Panel */}
        <aside className="w-72 border-l border-[#2b3139] overflow-y-auto hidden xl:block" id="trade-sidebar">
          <div className="p-3 border-b border-[#2b3139]">
            <h3 className="text-xs font-medium text-[#848e9c] uppercase tracking-wider">Place Order</h3>
          </div>
          <div className="p-3">
            <TradePanel quote={quote} onExecuteTrade={handleExecuteTrade} />
          </div>
          
          <div className="p-3 border-t border-[#2b3139]">
            <h4 className="text-xs text-[#848e9c] mb-2">Account Summary</h4>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#848e9c]">Portfolio Value</span>
                <span className="text-white">{formatCurrency(portfolio.totalValue)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#848e9c]">Buying Power</span>
                <span className="text-white">{formatCurrency(portfolio.buyingPower)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#848e9c]">Day P&L</span>
                <span className={portfolio.dayGain >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
                  {portfolio.dayGain >= 0 ? '+' : ''}{formatCurrency(portfolio.dayGain)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#848e9c]">Total P&L</span>
                <span className={portfolio.totalGain >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
                  {portfolio.totalGain >= 0 ? '+' : ''}{formatCurrency(portfolio.totalGain)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Order Notification */}
      <OrderNotification trade={lastTrade} onDismiss={() => setLastTrade(null)} />
    </div>
  );
}

export default App;
