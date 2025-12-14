'use client';
/**
 * TradeDetail - Trade Analysis Panel
 * ====================================
 * Slide-over panel showing detailed trade metrics
 */
import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Clock, DollarSign, Target, AlertTriangle } from 'lucide-react';
import type { Trade } from '@/lib/types';

interface TradeDetailProps {
    trade: Trade | null;
    onClose: () => void;
}

function TradeDetailComponent({ trade, onClose }: TradeDetailProps) {
    if (!trade) return null;

    const isWin = trade.status === 'win';
    const isLong = trade.type === 'long';

    const formatDateTime = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString('tr-TR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
        });
    };

    const formatPnL = (pnl: number) => {
        const sign = pnl >= 0 ? '+' : '';
        return `${sign}${pnl.toFixed(4)}`;
    };

    // Calculate R-Multiple (assuming 2% stop loss as default)
    const stopLossPct = 2;
    const rMultiple = Math.abs(trade.pnl_percent) / stopLossPct;
    const rMultipleDisplay = trade.pnl >= 0 ? `+${rMultiple.toFixed(2)}R` : `-${rMultiple.toFixed(2)}R`;

    // Duration
    const durationMs = (trade.exit_time - trade.entry_time) * 1000;
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="rounded-xl bg-gray-900/50 border border-gray-800 overflow-hidden"
            >
                {/* Header */}
                <div className={`px-4 py-3 flex items-center justify-between ${isWin ? 'bg-green-500/10 border-b border-green-500/30' : 'bg-red-500/10 border-b border-red-500/30'
                    }`}>
                    <div className="flex items-center gap-2">
                        {isLong ? (
                            <TrendingUp className={`w-5 h-5 ${isWin ? 'text-green-400' : 'text-red-400'}`} />
                        ) : (
                            <TrendingDown className={`w-5 h-5 ${isWin ? 'text-green-400' : 'text-red-400'}`} />
                        )}
                        <span className={`font-semibold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                            {isLong ? 'Long' : 'Short'} Trade - {isWin ? 'WIN' : 'LOSS'}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Strategy Logic Summary */}
                    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                        <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-violet-400" />
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Koşul Özeti</span>
                        </div>
                        <p className="text-sm text-gray-300">
                            Strategy Logic: SMA Crossover Detection
                        </p>
                    </div>

                    {/* Entry/Exit Details */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Entry */}
                        <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                            <div className="flex items-center gap-1 mb-2 text-green-400">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs uppercase">Entry</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-1">{formatDateTime(trade.entry_time)}</p>
                            <p className="text-lg font-mono font-semibold text-white">
                                ${formatPrice(trade.entry_price)}
                            </p>
                        </div>

                        {/* Exit */}
                        <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                            <div className="flex items-center gap-1 mb-2 text-red-400">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs uppercase">Exit</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-1">{formatDateTime(trade.exit_time)}</p>
                            <p className="text-lg font-mono font-semibold text-white">
                                ${formatPrice(trade.exit_price)}
                            </p>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        {/* PnL */}
                        <div className="p-2 rounded-lg bg-gray-800/30 text-center">
                            <p className="text-xs text-gray-400 mb-1">Gross P/L</p>
                            <p className={`text-sm font-mono font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                {formatPnL(trade.pnl)}
                            </p>
                        </div>

                        {/* Percent */}
                        <div className="p-2 rounded-lg bg-gray-800/30 text-center">
                            <p className="text-xs text-gray-400 mb-1">Return %</p>
                            <p className={`text-sm font-mono font-bold ${trade.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                {trade.pnl_percent >= 0 ? '+' : ''}{trade.pnl_percent.toFixed(2)}%
                            </p>
                        </div>

                        {/* R-Multiple */}
                        <div className="p-2 rounded-lg bg-gray-800/30 text-center">
                            <p className="text-xs text-gray-400 mb-1">R-Multiple</p>
                            <p className={`text-sm font-mono font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                {rMultipleDisplay}
                            </p>
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                        <span>Duration:</span>
                        <span className="font-mono">{durationHours}h {durationMins}m</span>
                    </div>

                    {/* Warning if loss */}
                    {!isWin && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Stop Loss triggered or signal reversed</span>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export default memo(TradeDetailComponent);
