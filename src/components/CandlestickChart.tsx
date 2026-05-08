import { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries, IChartApi } from 'lightweight-charts';
import { CandleData } from '../types/trading';

interface CandlestickChartProps {
  data: CandleData[];
  symbol: string;
  onAnimationFrame?: (frame: number) => void;
}

export function CandlestickChart({ data, symbol, onAnimationFrame }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const container = chartContainerRef.current;
    
    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b0e11' },
        textColor: '#848e9c',
      },
      grid: {
        vertLines: { color: '#1e2329' },
        horzLines: { color: '#1e2329' },
      },
      width: container.clientWidth,
      height: container.clientHeight,
      crosshair: {
        vertLine: { color: '#f0b90b', width: 1, style: 2 },
        horzLine: { color: '#f0b90b', width: 1, style: 2 },
      },
      timeScale: {
        borderColor: '#2b3139',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: '#2b3139',
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderDownColor: '#f6465d',
      borderUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
      wickUpColor: '#0ecb81',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const chartData = data.map((d, idx) => ({
      time: idx as unknown as string,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumeData = data.map((d, idx) => ({
      time: idx as unknown as string,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(14, 203, 129, 0.3)' : 'rgba(246, 70, 93, 0.3)',
    }));

    candlestickSeries.setData(chartData);
    volumeSeries.setData(volumeData);
    chart.timeScale().fitContent();

    if (onAnimationFrame) {
      onAnimationFrame(data.length);
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, symbol, onAnimationFrame]);

  return (
    <div ref={chartContainerRef} className="w-full h-full min-h-80" />
  );
}
