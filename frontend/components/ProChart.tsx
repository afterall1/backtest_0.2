'use client';
/**
 * ProChart - Professional Trading Chart with Trade Markers
 * =========================================================
 * Equity curve visualization with Buy/Sell trade markers
 */
import { useEffect, useRef, memo, useState, useCallback } from 'react';
import { createChart, IChartApi, CandlestickSeries, Time, ISeriesApi } from 'lightweight-charts';
import { useAppStore } from '@/lib/store';
import type { Candle, Trade } from '@/lib/types';

interface ProChartProps {
    candles: Candle[];
    trades?: Trade[];
    height?: number;
    enableDrawing?: boolean;
    onTradeClick?: (trade: Trade) => void;
}

interface MarkerPosition {
    x: number;
    y: number;
    label: string;
}

function ProChartComponent({
    candles,
    trades = [],
    height = 500,
    enableDrawing = false,
    onTradeClick
}: ProChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const [markers, setMarkers] = useState<MarkerPosition[]>([]);

    const { addDrawing, strategyParams } = useAppStore();
    const drawings = strategyParams.drawing_data || [];

    // Create trade markers for the chart
    const createTradeMarkers = useCallback((tradesToMark: Trade[]) => {
        if (!tradesToMark.length) return [];

        const chartMarkers: Array<{
            time: Time;
            position: 'aboveBar' | 'belowBar';
            color: string;
            shape: 'arrowUp' | 'arrowDown' | 'circle';
            text: string;
        }> = [];

        tradesToMark.forEach((trade, idx) => {
            // Entry marker
            if (trade.type === 'long') {
                chartMarkers.push({
                    time: trade.entry_time as Time,
                    position: 'belowBar',
                    color: '#22c55e', // Green
                    shape: 'arrowUp',
                    text: `L${idx + 1}`,
                });
            } else {
                chartMarkers.push({
                    time: trade.entry_time as Time,
                    position: 'aboveBar',
                    color: '#ef4444', // Red
                    shape: 'arrowDown',
                    text: `S${idx + 1}`,
                });
            }

            // Exit marker with reason label
            const exitText = trade.exit_reason === 'TARGET'
                ? 'Target 🎯'
                : trade.exit_reason === 'STOP'
                    ? 'Stop 🛑'
                    : `X${idx + 1}`;

            chartMarkers.push({
                time: trade.exit_time as Time,
                position: trade.pnl > 0 ? 'aboveBar' : 'belowBar',
                color: trade.pnl > 0 ? '#22c55e' : '#ef4444',
                shape: 'circle',
                text: exitText,
            });
        });

        // Sort by time
        return chartMarkers.sort((a, b) => (a.time as number) - (b.time as number));
    }, []);

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

        // Add candlestick series for price data
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });
        seriesRef.current = candleSeries;

        // Set OHLC candle data
        const candleData = candles.map(c => ({
            time: c.time as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
        }));
        candleSeries.setData(candleData);

        // Add trade markers (v5 compatibility)
        if (trades.length > 0) {
            const tradeMarkers = createTradeMarkers(trades);
            (candleSeries as unknown as { setMarkers: (m: unknown[]) => void }).setMarkers(tradeMarkers);
        }

        // Fit content
        chart.timeScale().fitContent();

        // Click handler for drawing mode
        const handleClick = (e: MouseEvent) => {
            if (!enableDrawing || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const timeScale = chart.timeScale();
            const time = timeScale.coordinateToTime(x);

            if (time) {
                const closestCandle = candles.reduce((prev, curr) => {
                    return Math.abs(curr.time - (time as number)) < Math.abs(prev.time - (time as number)) ? curr : prev;
                });

                addDrawing({
                    time: closestCandle.time,
                    price: closestCandle.close,
                    type: 'marker',
                    label: `Mark ${drawings.length + 1}`,
                });

                setMarkers(prev => [...prev, { x, y, label: `Mark ${drawings.length + 1}` }]);
            }
        };

        if (enableDrawing) {
            containerRef.current.addEventListener('click', handleClick);
        }

        // Resize observer
        const resizeObserver = new ResizeObserver(() => {
            if (containerRef.current) {
                chart.applyOptions({ width: containerRef.current.clientWidth });
            }
        });

        resizeObserver.observe(containerRef.current);

        const container = containerRef.current;
        return () => {
            if (container) {
                container.removeEventListener('click', handleClick);
            }
            resizeObserver.disconnect();
            chart.remove();
        };
    }, [candles, trades, height, enableDrawing, addDrawing, drawings.length, createTradeMarkers]);

    return (
        <div
            className="relative w-full rounded-xl overflow-hidden bg-gray-900/50 border border-gray-800"
            style={{ height }}
        >
            {/* Chart Container */}
            <div
                ref={containerRef}
                className="w-full h-full"
                style={{ cursor: enableDrawing ? 'crosshair' : 'default' }}
            />

            {/* Trade Count Badge */}
            {trades.length > 0 && (
                <div className="absolute top-2 left-2 z-20 px-2 py-1 rounded bg-violet-500/20 border border-violet-500/50 text-violet-300 text-xs font-medium">
                    📈 {trades.length} Trades
                </div>
            )}

            {/* Drawing Markers Overlay */}
            {enableDrawing && markers.map((marker, idx) => (
                <div
                    key={idx}
                    className="absolute w-4 h-4 rounded-full bg-yellow-400 border-2 border-yellow-600 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                    style={{ left: marker.x, top: marker.y }}
                    title={marker.label}
                />
            ))}

            {/* Drawing Mode Indicator */}
            {enableDrawing && (
                <div className="absolute top-2 right-2 z-20 px-2 py-1 rounded bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-xs font-medium">
                    🎯 Click to Mark ({drawings.length})
                </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-2 right-2 z-20 flex items-center gap-3 px-2 py-1 rounded bg-gray-900/80 text-xs">
                <span className="flex items-center gap-1">
                    <span className="w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-green-500" />
                    Long Entry
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-red-500" />
                    Short Entry
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    Exit
                </span>
            </div>
        </div>
    );
}

export default memo(ProChartComponent);
