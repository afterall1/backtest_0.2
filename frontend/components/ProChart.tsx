'use client';
/**
 * ProChart - Advanced Lightweight-Charts Wrapper
 * ================================================
 * SSR-safe line chart for equity curve
 * Updated for lightweight-charts v5 API
 */
import { useEffect, useRef, memo } from 'react';
import { createChart, IChartApi, LineSeries } from 'lightweight-charts';
import type { Candle } from '@/lib/types';

interface ProChartProps {
    candles: Candle[];
    trades?: unknown[];
    height?: number;
}

function ProChartComponent({ candles, height = 500 }: ProChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

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

        // Add line series for equity curve (v5 API)
        const lineSeries = chart.addSeries(LineSeries, {
            color: '#8b5cf6',
            lineWidth: 2,
            priceLineVisible: true,
            lastValueVisible: true,
        });

        // Set equity data
        const lineData = candles.map(c => ({
            time: c.time as number,
            value: c.close,
        }));

        lineSeries.setData(lineData);

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
    }, [candles, height]);

    return (
        <div
            ref={containerRef}
            className="w-full rounded-xl overflow-hidden bg-gray-900/50"
            style={{ height }}
        />
    );
}

export default memo(ProChartComponent);
