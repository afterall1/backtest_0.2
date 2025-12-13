'use client';
/**
 * MetricsGrid - Performance Metrics Display
 * ===========================================
 * Premium grid layout for trading statistics
 */
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Percent,
    Target,
    BarChart3,
    Activity,
    DollarSign,
    AlertTriangle
} from 'lucide-react';
import type { PerformanceMetrics } from '@/lib/types';

interface MetricsGridProps {
    metrics: PerformanceMetrics;
    initialCapital: number;
}

export default function MetricsGrid({ metrics, initialCapital }: MetricsGridProps) {
    const metricCards = [
        {
            label: 'Total Return',
            value: `$${metrics.total_return.toLocaleString()}`,
            subValue: `${metrics.total_return_pct >= 0 ? '+' : ''}${metrics.total_return_pct.toFixed(2)}%`,
            icon: DollarSign,
            color: metrics.total_return >= 0 ? 'emerald' : 'red',
            positive: metrics.total_return >= 0,
        },
        {
            label: 'Win Rate',
            value: `${metrics.win_rate.toFixed(1)}%`,
            subValue: `${metrics.winning_trades}W / ${metrics.losing_trades}L`,
            icon: Target,
            color: metrics.win_rate >= 50 ? 'emerald' : 'yellow',
            positive: metrics.win_rate >= 50,
        },
        {
            label: 'Sharpe Ratio',
            value: metrics.sharpe_ratio.toFixed(2),
            subValue: metrics.sharpe_ratio >= 1 ? 'Good' : metrics.sharpe_ratio >= 0 ? 'Neutral' : 'Poor',
            icon: BarChart3,
            color: metrics.sharpe_ratio >= 1 ? 'emerald' : metrics.sharpe_ratio >= 0 ? 'yellow' : 'red',
            positive: metrics.sharpe_ratio >= 1,
        },
        {
            label: 'Sortino Ratio',
            value: metrics.sortino_ratio.toFixed(2),
            subValue: 'Risk-adj. return',
            icon: Activity,
            color: metrics.sortino_ratio >= 1 ? 'emerald' : 'yellow',
            positive: metrics.sortino_ratio >= 1,
        },
        {
            label: 'Max Drawdown',
            value: `${metrics.max_drawdown_pct.toFixed(2)}%`,
            subValue: `$${Math.abs(metrics.max_drawdown).toLocaleString()}`,
            icon: AlertTriangle,
            color: Math.abs(metrics.max_drawdown_pct) < 10 ? 'yellow' : 'red',
            positive: false,
        },
        {
            label: 'Profit Factor',
            value: metrics.profit_factor.toFixed(2),
            subValue: metrics.profit_factor >= 1.5 ? 'Strong' : metrics.profit_factor >= 1 ? 'Positive' : 'Negative',
            icon: Percent,
            color: metrics.profit_factor >= 1.5 ? 'emerald' : metrics.profit_factor >= 1 ? 'yellow' : 'red',
            positive: metrics.profit_factor >= 1.5,
        },
        {
            label: 'Total Trades',
            value: metrics.total_trades.toString(),
            subValue: `Avg Win: $${metrics.avg_win.toFixed(2)}`,
            icon: TrendingUp,
            color: 'violet',
            positive: true,
        },
        {
            label: 'Final Equity',
            value: `$${metrics.final_equity.toLocaleString()}`,
            subValue: `From $${initialCapital.toLocaleString()}`,
            icon: TrendingUp,
            color: metrics.final_equity >= initialCapital ? 'emerald' : 'red',
            positive: metrics.final_equity >= initialCapital,
        },
    ];

    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
        red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
        yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
        violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metricCards.map((card, idx) => {
                const colors = colorMap[card.color];

                return (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`relative p-4 rounded-xl ${colors.bg} border ${colors.border} backdrop-blur-sm`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <span className="text-xs text-gray-400 font-medium">{card.label}</span>
                            <card.icon className={`w-4 h-4 ${colors.text}`} />
                        </div>

                        <div className={`text-2xl font-bold font-mono ${colors.text} mb-1`}>
                            {card.value}
                        </div>

                        <div className="text-xs text-gray-500">
                            {card.subValue}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
