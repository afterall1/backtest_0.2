'use client';
/**
 * TradeList - Interactive Trade History Table
 * ============================================
 * Professional data table with row selection
 */
import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, CheckCircle, XCircle } from 'lucide-react';
import type { Trade } from '@/lib/types';

interface TradeListProps {
    trades: Trade[];
    onSelectTrade: (trade: Trade) => void;
    selectedTrade?: Trade | null;
}

function TradeListComponent({ trades, onSelectTrade, selectedTrade }: TradeListProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
        });
    };

    const formatPnL = (pnl: number) => {
        const sign = pnl >= 0 ? '+' : '';
        return `${sign}${pnl.toFixed(4)}`;
    };

    const formatPercent = (pct: number) => {
        const sign = pct >= 0 ? '+' : '';
        return `${sign}${pct.toFixed(2)}%`;
    };

    if (trades.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
                No trades to display
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-gray-900/50 border border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Trade History</h3>
                <span className="text-xs text-gray-400">{trades.length} trades</span>
            </div>

            {/* Table Container - Scrollable with Sticky Header */}
            <div className="relative max-h-[600px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900/50">
                {/* Scroll Shadow Indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900/90 to-transparent pointer-events-none z-10" />

                <table className="w-full text-sm">
                    <thead className="bg-gray-800/95 sticky top-0 z-20 shadow-md shadow-black/30 backdrop-blur-sm">
                        <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-700">
                            <th className="px-4 py-2">#</th>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Type</th>
                            <th className="px-4 py-2 text-right">Entry</th>
                            <th className="px-4 py-2 text-right">Exit</th>
                            <th className="px-4 py-2 text-right">PnL</th>
                            <th className="px-4 py-2 text-right">%</th>
                            <th className="px-4 py-2 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.map((trade, index) => {
                            const isSelected = selectedTrade?.entry_time === trade.entry_time;
                            const isHovered = hoveredIndex === index;
                            const isWin = trade.status === 'win';
                            const isLong = trade.type === 'long';

                            return (
                                <motion.tr
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    onClick={() => onSelectTrade(trade)}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    className={`cursor-pointer transition-all border-b border-gray-800/50 ${isSelected
                                        ? 'bg-violet-500/20 border-violet-500/50'
                                        : isHovered
                                            ? 'bg-gray-800/50'
                                            : ''
                                        }`}
                                >
                                    {/* Index */}
                                    <td className="px-4 py-3 font-mono text-gray-500">
                                        {index + 1}
                                    </td>

                                    {/* Date */}
                                    <td className="px-4 py-3 text-gray-300">
                                        {formatDate(trade.entry_time)}
                                    </td>

                                    {/* Type */}
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${isLong
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {isLong ? (
                                                <ArrowUpRight className="w-3 h-3" />
                                            ) : (
                                                <ArrowDownRight className="w-3 h-3" />
                                            )}
                                            {isLong ? 'Long' : 'Short'}
                                        </span>
                                    </td>

                                    {/* Entry Price */}
                                    <td className="px-4 py-3 text-right font-mono text-gray-300">
                                        {formatPrice(trade.entry_price)}
                                    </td>

                                    {/* Exit Price */}
                                    <td className="px-4 py-3 text-right font-mono text-gray-300">
                                        {formatPrice(trade.exit_price)}
                                    </td>

                                    {/* PnL */}
                                    <td className={`px-4 py-3 text-right font-mono font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {formatPnL(trade.pnl)}
                                    </td>

                                    {/* PnL Percent */}
                                    <td className={`px-4 py-3 text-right font-mono text-xs ${trade.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {formatPercent(trade.pnl_percent)}
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-3 text-center">
                                        {isWin ? (
                                            <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                                        )}
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Summary Footer */}
            <div className="px-4 py-2 bg-gray-800/30 border-t border-gray-700 flex items-center justify-between text-xs">
                <span className="text-gray-400">
                    Wins: <span className="text-green-400">{trades.filter(t => t.status === 'win').length}</span>
                    {' / '}
                    Losses: <span className="text-red-400">{trades.filter(t => t.status === 'loss').length}</span>
                </span>
                <span className={`font-medium ${trades.reduce((sum, t) => sum + t.pnl, 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                    Net: {formatPnL(trades.reduce((sum, t) => sum + t.pnl, 0))}
                </span>
            </div>
        </div>
    );
}

export default memo(TradeListComponent);
