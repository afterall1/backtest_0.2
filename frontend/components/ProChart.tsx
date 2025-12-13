'use client';
/**
 * ProChart - Advanced Chart with Drawing Overlay
 * ================================================
 * SSR-safe line chart with click-to-mark capability
 */
import { useEffect, useRef, memo, useState } from 'react';
import { createChart, IChartApi, LineSeries, Time } from 'lightweight-charts';
import { useAppStore } from '@/lib/store';
import type { Candle } from '@/lib/types';

interface ProChartProps {
    candles: Candle[];
    height?: number;
    enableDrawing?: boolean;
}

interface MarkerPosition {
    x: number;
    y: number;
    label: string;
}

function ProChartComponent({ candles, height = 500, enableDrawing = false }: ProChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const [markers, setMarkers] = useState<MarkerPosition[]>([]);

    const { addDrawing, strategyParams } = useAppStore();
    const drawings = strategyParams.drawing_data || [];

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

        // Add line series for equity curve
        const lineSeries = chart.addSeries(LineSeries, {
            color: '#8b5cf6',
            lineWidth: 2,
            priceLineVisible: true,
            lastValueVisible: true,
        });

        // Set equity data with proper Time type
        const lineData = candles.map(c => ({
            time: c.time as Time,
            value: c.close,
        }));

        lineSeries.setData(lineData);

        // Fit content
        chart.timeScale().fitContent();

        // Click handler for drawing
        const handleClick = (e: MouseEvent) => {
            if (!enableDrawing || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Get approximate time and price from click position
            const timeScale = chart.timeScale();
            const time = timeScale.coordinateToTime(x);

            if (time) {
                // Find closest candle
                const closestCandle = candles.reduce((prev, curr) => {
                    return Math.abs(curr.time - (time as number)) < Math.abs(prev.time - (time as number)) ? curr : prev;
                });

                addDrawing({
                    time: closestCandle.time,
                    price: closestCandle.close,
                    type: 'marker',
                    label: `Mark ${drawings.length + 1}`,
                });

                // Add visual marker
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
    }, [candles, height, enableDrawing, addDrawing, drawings.length]);

    return (
        <div
            className="relative w-full rounded-xl overflow-hidden bg-gray-900/50"
            style={{ height }}
        >
            {/* Chart Container */}
            <div
                ref={containerRef}
                className="w-full h-full"
                style={{ cursor: enableDrawing ? 'crosshair' : 'default' }}
            />

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
        </div>
    );
}

export default memo(ProChartComponent);
