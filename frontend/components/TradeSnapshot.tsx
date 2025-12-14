'use client';
/**
 * TradeSnapshot - Mini Chart for Trade Detail
 * =============================================
 * Lightweight chart showing a single trade with price lines
 */
import { useEffect, useRef, memo } from 'react';
import { createChart, IChartApi, CandlestickSeries, Time } from 'lightweight-charts';
import type { Candle, Trade } from '@/lib/types';

interface TradeSnapshotProps {
    candles: Candle[];
    trade: Trade;
    height?: number;
}

function TradeSnapshotComponent({ candles, trade, height = 200 }: TradeSnapshotProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!containerRef.current || candles.length === 0) return;

        // Filter candles around the trade (10 buffer on each side)
        const tradeStartIdx = candles.findIndex(c => c.time >= trade.entry_time);
        const tradeEndIdx = candles.findIndex(c => c.time >= trade.exit_time);

        const startIdx = Math.max(0, tradeStartIdx - 10);
        const endIdx = Math.min(candles.length - 1, tradeEndIdx + 10);
        const visibleCandles = candles.slice(startIdx, endIdx + 1);

        if (visibleCandles.length === 0) return;

        // Create chart
        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height,
            layout: {
                background: { color: 'transparent' },
                textColor: '#9ca3af',
                fontSize: 10,
            },
            grid: {
                vertLines: { color: 'rgba(75, 85, 99, 0.2)' },
                horzLines: { color: 'rgba(75, 85, 99, 0.2)' },
            },
            rightPriceScale: {
                borderColor: 'rgba(75, 85, 99, 0.3)',
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderColor: 'rgba(75, 85, 99, 0.3)',
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                horzLine: { visible: false },
                vertLine: { visible: false },
            },
        });

        chartRef.current = chart;

        // Add candlestick series
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        // Set candle data
        const candleData = visibleCandles.map(c => ({
            time: c.time as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
        }));
        candleSeries.setData(candleData);

        // Create Price Lines
        // Entry Price - Blue
        candleSeries.createPriceLine({
            price: trade.entry_price,
            color: '#3b82f6',
            lineWidth: 2,
            lineStyle: 0, // Solid
            axisLabelVisible: true,
            title: 'ENTRY',
        });

        // Stop Loss - Red
        if (trade.sl_price) {
            candleSeries.createPriceLine({
                price: trade.sl_price,
                color: '#ef4444',
                lineWidth: 1,
                lineStyle: 2, // Dashed
                axisLabelVisible: true,
                title: 'STOP',
            });
        }

        // Take Profit - Green
        if (trade.tp_price) {
            candleSeries.createPriceLine({
                price: trade.tp_price,
                color: '#22c55e',
                lineWidth: 1,
                lineStyle: 2, // Dashed
                axisLabelVisible: true,
                title: 'TARGET',
            });
        }

        // Exit Price - Gray
        candleSeries.createPriceLine({
            price: trade.exit_price,
            color: trade.pnl >= 0 ? '#22c55e' : '#ef4444',
            lineWidth: 1,
            lineStyle: 1, // Dotted
            axisLabelVisible: true,
            title: 'EXIT',
        });

        // Add trade markers
        const markers = [
            {
                time: trade.entry_time as Time,
                position: 'belowBar' as const,
                color: trade.type === 'long' ? '#22c55e' : '#ef4444',
                shape: trade.type === 'long' ? 'arrowUp' as const : 'arrowDown' as const,
                text: trade.type === 'long' ? 'BUY' : 'SELL',
            },
            {
                time: trade.exit_time as Time,
                position: 'aboveBar' as const,
                color: trade.pnl >= 0 ? '#22c55e' : '#ef4444',
                shape: 'circle' as const,
                text: trade.exit_reason === 'TARGET' ? '🎯' : trade.exit_reason === 'STOP' ? '🛑' : 'EXIT',
            },
        ];
        // Add trade markers (use type assertion for v5 compatibility)
        (candleSeries as unknown as { setMarkers: (markers: unknown[]) => void }).setMarkers(markers);

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
    }, [candles, trade, height]);

    return (
        <div className="rounded-lg overflow-hidden bg-gray-900/50 border border-gray-700/50">
            {/* Header */}
            <div className="px-3 py-2 bg-gray-800/50 border-b border-gray-700/50 flex items-center justify-between">
                <span className="text-xs text-gray-400">Trade Snapshot</span>
                <span className={`text-xs font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl_percent.toFixed(2)}%
                </span>
            </div>

            {/* Chart */}
            <div
                ref={containerRef}
                className="w-full"
                style={{ height }}
            />

            {/* Legend */}
            <div className="px-3 py-1.5 bg-gray-800/30 flex items-center justify-center gap-4 text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-blue-500" /> Entry
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-red-500 border-dashed" /> Stop
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-green-500 border-dashed" /> Target
                </span>
            </div>
        </div>
    );
}

export default memo(TradeSnapshotComponent);
