'use client';
/**
 * ProChart - Advanced Lightweight-Charts Wrapper
 * ================================================
 * SSR-safe candlestick chart with trade markers
 */
import { useEffect, useRef, memo } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, HistogramData } from 'lightweight-charts';
import type { Candle, Trade } from '@/lib/types';

interface ProChartProps {
    candles: Candle[];
    trades: Trade[];
    height?: number;
}

function ProChartComponent({ candles, trades, height = 500 }: ProChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

    useEffect(() => {
        if (!containerRef.current || candles.length === 0) return;

        // Create chart
        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height,
            layout: {
                background: { color: 'transparent' },
                textColor: '#9ca3af',
            },
            grid: {
                vertLines: { color: 'rgba(75, 85, 99, 0.3)' },
                horzLines: { color: 'rgba(75, 85, 99, 0.3)' },
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    color: 'rgba(139, 92, 246, 0.5)',
                    width: 1,
                    style: 2,
                },
                horzLine: {
                    color: 'rgba(139, 92, 246, 0.5)',
                    width: 1,
                    style: 2,
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(75, 85, 99, 0.5)',
            },
            timeScale: {
                borderColor: 'rgba(75, 85, 99, 0.5)',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        chartRef.current = chart;

        // Add candlestick series
        const candleSeries = chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderUpColor: '#10b981',
            borderDownColor: '#ef4444',
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });

        candleSeriesRef.current = candleSeries;

        // Add volume series
        const volumeSeries = chart.addHistogramSeries({
            color: 'rgba(139, 92, 246, 0.3)',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '',
        });

        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });

        volumeSeriesRef.current = volumeSeries;

        // Set candle data
        const candleData: CandlestickData[] = candles.map(c => ({
            time: c.time as number,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
        }));

        candleSeries.setData(candleData);

        // Set volume data
        const volumeData: HistogramData[] = candles.map(c => ({
            time: c.time as number,
            value: c.volume,
            color: c.close >= c.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
        }));

        volumeSeries.setData(volumeData);

        // Add trade markers
        if (trades.length > 0) {
            const markers = trades.flatMap(trade => [
                // Entry marker
                {
                    time: trade.entry_time as number,
                    position: 'belowBar' as const,
                    color: '#10b981',
                    shape: 'arrowUp' as const,
                    text: `BUY ${trade.entry_price.toFixed(2)}`,
                },
                // Exit marker
                {
                    time: trade.exit_time as number,
                    position: 'aboveBar' as const,
                    color: trade.pnl >= 0 ? '#10b981' : '#ef4444',
                    shape: 'arrowDown' as const,
                    text: `SELL ${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}`,
                },
            ]);

            candleSeries.setMarkers(markers);
        }

        // Fit content
        chart.timeScale().fitContent();

        // Resize observer
        const resizeObserver = new ResizeObserver(() => {
            if (containerRef.current) {
                chart.applyOptions({ width: containerRef.current.clientWidth });
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, [candles, trades, height]);

    return (
        <div
            ref={containerRef}
            className="w-full rounded-xl overflow-hidden bg-gray-900/50"
            style={{ height }}
        />
    );
}

export default memo(ProChartComponent);
