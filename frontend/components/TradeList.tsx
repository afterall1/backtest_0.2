'use client';
/**
 * TradeList - Trade History Table
 * ================================
 * Detailed trade log with PnL highlighting
 */
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Trade } from '@/lib/types';

interface TradeListProps {
    trades: Trade[];
}

export default function TradeList({ trades }: TradeListProps) {
    const formatTime = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="rounded-xl bg-gray-900/50 border border-gray-700/50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-300">Trade History</h3>
                <p className="text-xs text-gray-500">{trades.length} trades executed</p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-64">
                <table className="w-full text-sm">
                    <thead className="bg-gray-800/30 sticky top-0">
                        <tr className="text-gray-400 text-xs">
                            <th className="px-4 py-2 text-left">#</th>
                            <th className="px-4 py-2 text-left">Type</th>
                            <th className="px-4 py-2 text-left">Entry</th>
                            <th className="px-4 py-2 text-left">Exit</th>
                            <th className="px-4 py-2 text-right">Entry Price</th>
                            <th className="px-4 py-2 text-right">Exit Price</th>
                            <th className="px-4 py-2 text-right">PnL</th>
                            <th className="px-4 py-2 text-right">%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.map((trade, idx) => (
                            <motion.tr
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                            >
                                <td className="px-4 py-2 text-gray-500 font-mono">{idx + 1}</td>
                                <td className="px-4 py-2">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${trade.type === 'long'
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {trade.type === 'long' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        {trade.type.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-gray-400 font-mono text-xs">{formatTime(trade.entry_time)}</td>
                                <td className="px-4 py-2 text-gray-400 font-mono text-xs">{formatTime(trade.exit_time)}</td>
                                <td className="px-4 py-2 text-right text-white font-mono">${trade.entry_price.toFixed(2)}</td>
                                <td className="px-4 py-2 text-right text-white font-mono">${trade.exit_price.toFixed(2)}</td>
                                <td className={`px-4 py-2 text-right font-mono font-semibold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                                </td>
                                <td className={`px-4 py-2 text-right font-mono text-xs ${trade.pnl_percent >= 0 ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                    {trade.pnl_percent >= 0 ? '+' : ''}{trade.pnl_percent.toFixed(2)}%
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
