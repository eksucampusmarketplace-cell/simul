import { useState, useRef, useCallback } from 'react';
import { Video, Download, Play, RefreshCw, Film } from 'lucide-react';
import { fetchStockQuote } from '../utils/yahooFinance';
import { getStockQuote, formatCurrency, generateCandleData } from '../utils/stockData';
import { fetchCandleData } from '../utils/yahooFinance';
import { StockQuote, CandleData } from '../types/trading';

interface AutoVideoGeneratorProps {
  selectedSymbol: string;
  onSwitchToChart: () => void;
  onSetCandleData: (data: CandleData[]) => void;
}

type VideoTradeType = 'stock' | 'call' | 'put';

interface GeneratedVideoTrade {
  symbol: string;
  name: string;
  type: VideoTradeType;
  entryPrice: number;
  exitPrice: number;
  profit: number;
  percentGain: number;
  quantity: number;
  strikePrice?: number;
  expiry?: string;
}

export function AutoVideoGenerator({ selectedSymbol, onSwitchToChart, onSetCandleData }: AutoVideoGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [tradeType, setTradeType] = useState<VideoTradeType>('stock');
  const [targetProfit, setTargetProfit] = useState(75000);
  const [generatedTrade, setGeneratedTrade] = useState<GeneratedVideoTrade | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const generateVideo = useCallback(async () => {
    setIsGenerating(true);
    setVideoUrl(null);
    setProgress('Fetching real-time price data...');

    // Step 1: Get real stock data
    let quote: StockQuote;
    let realQuote: StockQuote | null = null;
    try {
      realQuote = await fetchStockQuote(selectedSymbol);
    } catch {
      // fallback
    }
    quote = realQuote || getStockQuote(selectedSymbol);
    const currentPrice = quote.price;

    // Step 2: Generate the trade details
    setProgress('Generating trade...');
    await new Promise(r => setTimeout(r, 500));

    let trade: GeneratedVideoTrade;
    if (tradeType === 'stock') {
      const percentGain = 8 + Math.random() * 20;
      const entryPrice = currentPrice / (1 + percentGain / 100);
      const quantity = Math.round(targetProfit / (currentPrice - entryPrice));
      const actualProfit = (currentPrice - entryPrice) * quantity;
      trade = {
        symbol: selectedSymbol,
        name: quote.name,
        type: 'stock',
        entryPrice: Math.round(entryPrice * 100) / 100,
        exitPrice: currentPrice,
        profit: Math.round(actualProfit * 100) / 100,
        percentGain: Math.round(percentGain * 100) / 100,
        quantity,
      };
    } else {
      const isCall = tradeType === 'call';
      const strikeOffset = isCall ? -3 + Math.random() * 6 : -6 + Math.random() * 3;
      const strikePrice = Math.round((currentPrice + strikeOffset) / 0.5) * 0.5;
      const intrinsicValue = isCall ? Math.max(0, currentPrice - strikePrice) : Math.max(0, strikePrice - currentPrice);
      const timeValue = currentPrice * 0.02 + Math.random() * currentPrice * 0.03;
      const currentPremium = intrinsicValue + timeValue;
      const percentGain = 80 + Math.random() * 250;
      const entryPremium = currentPremium / (1 + percentGain / 100);
      const contracts = Math.round(targetProfit / ((currentPremium - entryPremium) * 100));
      const actualProfit = (currentPremium - entryPremium) * contracts * 100;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + Math.floor(Math.random() * 21) + 7);
      trade = {
        symbol: selectedSymbol,
        name: quote.name,
        type: tradeType,
        entryPrice: Math.round(entryPremium * 100) / 100,
        exitPrice: Math.round(currentPremium * 100) / 100,
        profit: Math.round(actualProfit * 100) / 100,
        percentGain: Math.round(percentGain * 100) / 100,
        quantity: contracts,
        strikePrice,
        expiry: expiry.toISOString().split('T')[0],
      };
    }
    setGeneratedTrade(trade);

    // Step 3: Fetch real candle data for the chart
    setProgress('Loading chart data...');
    let candles: CandleData[] | null = null;
    try {
      candles = await fetchCandleData(selectedSymbol, '1D');
    } catch {
      // fallback
    }
    if (!candles || candles.length === 0) {
      candles = generateCandleData(selectedSymbol, '1D');
    }
    onSetCandleData(candles);
    onSwitchToChart();

    // Step 4: Create canvas and start recording
    setProgress('Starting recording...');
    await new Promise(r => setTimeout(r, 800));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsGenerating(false);
      setProgress('Error: Could not create canvas');
      return;
    }

    canvas.width = 1920;
    canvas.height = 1080;
    canvasRef.current = canvas;

    const stream = canvas.captureStream(30);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 10000000,
      });
    } catch {
      recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm',
        videoBitsPerSecond: 8000000,
      });
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const videoPromise = new Promise<string>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(URL.createObjectURL(blob));
      };
    });

    mediaRecorderRef.current = recorder;
    recorder.start(100);

    // Step 5: Animate the chart frame by frame
    setProgress('Recording chart animation...');
    const totalFrames = candles.length;
    const entryFrame = Math.floor(totalFrames * 0.15);
    const exitFrame = totalFrames - 1;

    for (let i = 0; i < totalFrames; i++) {
      const visibleCandles = candles.slice(0, i + 1);
      drawChartFrame(ctx, canvas, visibleCandles, trade, i, entryFrame, exitFrame, selectedSymbol);
      await new Promise(r => setTimeout(r, 100));
      setProgress(`Recording... ${Math.round((i / totalFrames) * 100)}%`);
    }

    // Hold on final frame showing profit
    setProgress('Showing profit result...');
    for (let i = 0; i < 30; i++) {
      drawChartFrame(ctx, canvas, candles, trade, totalFrames, entryFrame, exitFrame, selectedSymbol);
      await new Promise(r => setTimeout(r, 100));
    }

    // Step 6: Stop recording
    setProgress('Finalizing video...');
    recorder.stop();
    const url = await videoPromise;
    setVideoUrl(url);
    setIsGenerating(false);
    setProgress('Video ready!');
  }, [selectedSymbol, tradeType, targetProfit, onSwitchToChart, onSetCandleData]);

  const downloadVideo = useCallback(() => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `${selectedSymbol}-trade-${Date.now()}.webm`;
      link.click();
    }
  }, [videoUrl, selectedSymbol]);

  const profitPresets = [30000, 50000, 75000, 100000, 150000, 200000];

  return (
    <div className="bg-[#1e2329] rounded-lg border border-[#2b3139] p-4">
      <div className="flex items-center gap-2 mb-4">
        <Film size={16} className="text-[#f0b90b]" />
        <h3 className="text-sm font-semibold text-white">Auto Video Generator</h3>
        <span className="text-[10px] bg-[#f0b90b] text-[#0b0e11] px-1.5 py-0.5 rounded font-bold">1-CLICK</span>
      </div>

      <p className="text-xs text-[#848e9c] mb-3">
        One click generates a full video: chart animation with entry/exit markers, trade details, and profit display. Ready for TikTok.
      </p>

      {/* Trade Type */}
      <div className="mb-3">
        <label className="text-xs text-[#848e9c] mb-1.5 block">Trade Type</label>
        <div className="flex gap-2">
          <button
            onClick={() => setTradeType('stock')}
            className={`flex-1 px-3 py-2 text-xs rounded font-medium transition-colors ${
              tradeType === 'stock' ? 'bg-[#0ecb81] text-white' : 'bg-[#2b3139] text-[#848e9c] hover:text-white'
            }`}
          >
            Stock
          </button>
          <button
            onClick={() => setTradeType('call')}
            className={`flex-1 px-3 py-2 text-xs rounded font-medium transition-colors ${
              tradeType === 'call' ? 'bg-[#0ecb81] text-white' : 'bg-[#2b3139] text-[#848e9c] hover:text-white'
            }`}
          >
            Call
          </button>
          <button
            onClick={() => setTradeType('put')}
            className={`flex-1 px-3 py-2 text-xs rounded font-medium transition-colors ${
              tradeType === 'put' ? 'bg-[#f6465d] text-white' : 'bg-[#2b3139] text-[#848e9c] hover:text-white'
            }`}
          >
            Put
          </button>
        </div>
      </div>

      {/* Target Profit */}
      <div className="mb-4">
        <label className="text-xs text-[#848e9c] mb-1.5 block">Target Profit</label>
        <div className="grid grid-cols-3 gap-1.5">
          {profitPresets.map(preset => (
            <button
              key={preset}
              onClick={() => setTargetProfit(preset)}
              className={`px-2 py-1.5 text-xs rounded font-medium transition-colors ${
                targetProfit === preset ? 'bg-[#0ecb81] text-white' : 'bg-[#2b3139] text-[#848e9c] hover:text-white'
              }`}
            >
              ${(preset / 1000).toFixed(0)}K
            </button>
          ))}
        </div>
      </div>

      {/* Generate Video Button */}
      <button
        onClick={generateVideo}
        disabled={isGenerating}
        className="w-full py-3 bg-gradient-to-r from-[#f0b90b] to-[#f8d12f] text-[#0b0e11] font-bold text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
      >
        {isGenerating ? (
          <RefreshCw size={16} className="animate-spin" />
        ) : (
          <Video size={16} />
        )}
        {isGenerating ? progress : 'Generate Video'}
      </button>

      {/* Progress bar */}
      {isGenerating && (
        <div className="mt-3">
          <div className="h-1 bg-[#2b3139] rounded-full overflow-hidden">
            <div className="h-full bg-[#f0b90b] rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* Video Ready + Trade Summary */}
      {videoUrl && generatedTrade && (
        <div className="mt-4 space-y-3">
          <div className="p-3 bg-[#0b0e11] rounded-lg border border-[#0ecb81]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#0ecb81]">Trade Summary</span>
              <span className="text-sm text-[#0ecb81] font-bold">
                +{formatCurrency(generatedTrade.profit)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div><span className="text-[#848e9c]">Symbol: </span><span className="text-white">{generatedTrade.symbol}</span></div>
              <div><span className="text-[#848e9c]">Type: </span><span className="text-white capitalize">{generatedTrade.type}</span></div>
              <div><span className="text-[#848e9c]">Entry: </span><span className="text-white">{formatCurrency(generatedTrade.entryPrice)}</span></div>
              <div><span className="text-[#848e9c]">Exit: </span><span className="text-[#0ecb81]">{formatCurrency(generatedTrade.exitPrice)}</span></div>
              <div><span className="text-[#848e9c]">Gain: </span><span className="text-[#0ecb81]">+{generatedTrade.percentGain}%</span></div>
              <div><span className="text-[#848e9c]">{generatedTrade.type === 'stock' ? 'Shares' : 'Contracts'}: </span><span className="text-white">{generatedTrade.quantity}</span></div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={downloadVideo}
              className="flex-1 py-2.5 bg-[#0ecb81] text-black font-semibold text-xs rounded flex items-center justify-center gap-2 hover:bg-[#0ecb81]/80 transition-colors"
            >
              <Download size={14} />
              Download Video
            </button>
            <button
              onClick={() => window.open(videoUrl, '_blank')}
              className="px-4 py-2.5 bg-[#2b3139] text-white text-xs rounded flex items-center justify-center gap-2 hover:bg-[#3b4149] transition-colors"
            >
              <Play size={14} />
              Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function drawChartFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  candles: CandleData[],
  trade: GeneratedVideoTrade,
  currentFrame: number,
  entryFrame: number,
  exitFrame: number,
  symbol: string
) {
  const w = canvas.width;
  const h = canvas.height;

  // Background
  ctx.fillStyle = '#0b0e11';
  ctx.fillRect(0, 0, w, h);

  // Chart area
  const chartLeft = 80;
  const chartRight = w - 40;
  const chartTop = 120;
  const chartBottom = h - 180;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  if (candles.length === 0) return;

  // Calculate price range
  const prices = candles.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...prices) * 0.998;
  const maxPrice = Math.max(...prices) * 1.002;
  const priceRange = maxPrice - minPrice;

  const priceToY = (price: number) => chartTop + (1 - (price - minPrice) / priceRange) * chartHeight;
  const candleWidth = Math.max(2, (chartWidth / candles.length) * 0.7);
  const gap = chartWidth / candles.length;

  // Grid lines
  ctx.strokeStyle = '#1e2329';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = chartTop + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();
    
    const price = maxPrice - (priceRange / 5) * i;
    ctx.fillStyle = '#848e9c';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`$${price.toFixed(2)}`, chartLeft - 10, y + 4);
  }

  // Draw candles
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const x = chartLeft + gap * i + gap / 2;
    const isGreen = c.close >= c.open;
    
    ctx.strokeStyle = isGreen ? '#0ecb81' : '#f6465d';
    ctx.fillStyle = isGreen ? '#0ecb81' : '#f6465d';

    // Wick
    ctx.beginPath();
    ctx.moveTo(x, priceToY(c.high));
    ctx.lineTo(x, priceToY(c.low));
    ctx.lineWidth = 1;
    ctx.stroke();

    // Body
    const bodyTop = priceToY(Math.max(c.open, c.close));
    const bodyBottom = priceToY(Math.min(c.open, c.close));
    const bodyHeight = Math.max(1, bodyBottom - bodyTop);
    ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
  }

  // Entry marker
  if (currentFrame >= entryFrame && entryFrame < candles.length) {
    const entryX = chartLeft + gap * entryFrame + gap / 2;
    const entryY = priceToY(trade.entryPrice);
    
    // Entry line
    ctx.strokeStyle = '#f0b90b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(entryX, entryY);
    ctx.lineTo(chartRight, entryY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Entry label
    ctx.fillStyle = '#f0b90b';
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`BUY $${trade.entryPrice.toFixed(2)}`, entryX + 10, entryY - 10);

    // Arrow
    ctx.beginPath();
    ctx.moveTo(entryX, entryY + 5);
    ctx.lineTo(entryX - 6, entryY + 15);
    ctx.lineTo(entryX + 6, entryY + 15);
    ctx.closePath();
    ctx.fill();
  }

  // Exit marker
  if (currentFrame >= exitFrame) {
    const exitX = chartLeft + gap * exitFrame + gap / 2;
    const exitY = priceToY(trade.exitPrice);
    
    // Exit line
    ctx.strokeStyle = '#0ecb81';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(chartLeft, exitY);
    ctx.lineTo(exitX, exitY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Exit label
    ctx.fillStyle = '#0ecb81';
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`SELL $${trade.exitPrice.toFixed(2)}`, exitX - 10, exitY - 10);

    // Arrow
    ctx.beginPath();
    ctx.moveTo(exitX, exitY - 5);
    ctx.lineTo(exitX - 6, exitY - 15);
    ctx.lineTo(exitX + 6, exitY - 15);
    ctx.closePath();
    ctx.fill();
  }

  // Header
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(symbol, chartLeft, 50);

  ctx.fillStyle = '#848e9c';
  ctx.font = '18px -apple-system, sans-serif';
  ctx.fillText(trade.name, chartLeft + ctx.measureText(symbol).width + 20, 50);

  // Current price
  const lastCandle = candles[candles.length - 1];
  const priceColor = lastCandle.close >= lastCandle.open ? '#0ecb81' : '#f6465d';
  ctx.fillStyle = priceColor;
  ctx.font = 'bold 28px -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`$${trade.exitPrice.toFixed(2)}`, chartRight, 50);

  // Trade info bar at bottom
  const infoY = h - 130;
  ctx.fillStyle = '#1e2329';
  ctx.fillRect(chartLeft, infoY, chartWidth, 110);
  ctx.strokeStyle = '#2b3139';
  ctx.lineWidth = 1;
  ctx.strokeRect(chartLeft, infoY, chartWidth, 110);

  // Trade type label
  const typeLabel = trade.type === 'stock' ? 'STOCK TRADE' : trade.type === 'call' ? 'CALL OPTION' : 'PUT OPTION';
  ctx.fillStyle = '#f0b90b';
  ctx.font = 'bold 14px -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(typeLabel, chartLeft + 20, infoY + 25);

  // Trade details
  ctx.fillStyle = '#848e9c';
  ctx.font = '13px -apple-system, sans-serif';
  ctx.fillText(`Entry: $${trade.entryPrice.toFixed(2)}`, chartLeft + 20, infoY + 50);
  ctx.fillText(`Exit: $${trade.exitPrice.toFixed(2)}`, chartLeft + 200, infoY + 50);
  ctx.fillText(`${trade.type === 'stock' ? 'Shares' : 'Contracts'}: ${trade.quantity}`, chartLeft + 380, infoY + 50);
  
  if (trade.strikePrice) {
    ctx.fillText(`Strike: $${trade.strikePrice}`, chartLeft + 540, infoY + 50);
  }

  // Profit display (shown after exit)
  if (currentFrame >= exitFrame) {
    ctx.fillStyle = '#0ecb81';
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`+$${trade.profit.toLocaleString()}`, chartRight - 20, infoY + 30);
    
    ctx.fillStyle = '#0ecb81';
    ctx.font = '16px -apple-system, sans-serif';
    ctx.fillText(`+${trade.percentGain}%`, chartRight - 20, infoY + 55);
  }

  // Watermark
  ctx.fillStyle = '#2b3139';
  ctx.font = '11px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TradeView Pro', w / 2, h - 15);

  // Timestamp
  ctx.fillStyle = '#848e9c';
  ctx.font = '12px -apple-system, sans-serif';
  ctx.textAlign = 'right';
  const now = new Date();
  ctx.fillText(now.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }), chartRight, 80);
}
