'use client';
/**
 * TradeDetail - Trade Analysis Panel with Mini Chart
 * ====================================================
 * Slide-over panel showing detailed trade metrics and snapshot
 */
import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { X, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, Zap } from 'lucide-react';
import type { Trade, Candle } from '@/lib/types';

// Dynamic import for TradeSnapshot (SSR disabled)
const TradeSnapshot = dynamic(() => import('./TradeSnapshot'), {
    ssr: false,
    loading: () => (
        <div className="h-[150px] rounded-lg bg-gray-800/30 animate-pulse" />
    ),
});

interface TradeDetailProps {
    trade: Trade | null;
    candles?: Candle[];
    onClose: () => void;
}

function TradeDetailComponent({ trade, candles = [], onClose }: TradeDetailProps) {
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

    // Calculate R-Multiple
    const stopLossPct = trade.sl_price
        ? Math.abs((trade.entry_price - trade.sl_price) / trade.entry_price * 100)
        : 2;
    const rMultiple = Math.abs(trade.pnl_percent) / stopLossPct;
    const rMultipleDisplay = trade.pnl >= 0 ? `+${rMultiple.toFixed(2)}R` : `-${rMultiple.toFixed(2)}R`;

    // Duration
    const durationMs = (trade.exit_time - trade.entry_time) * 1000;
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    // Exit reason badge
    const getExitReasonBadge = () => {
        switch (trade.exit_reason) {
            case 'TARGET':
                return <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">🎯 Target</span>;
            case 'STOP':
                return <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">🛑 Stop</span>;
            default:
                return <span className="px-2 py-0.5 rounded text-xs bg-gray-500/20 text-gray-400">Signal</span>;
        }
    };

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
                        {getExitReasonBadge()}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    {/* Trade Snapshot Chart */}
                    {candles.length > 0 && (
                        <TradeSnapshot
                            candles={candles}
                            trade={trade}
                            height={150}
                        />
                    )}

                    {/* Strategy Logic Summary */}
                    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-4 h-4 text-violet-400" />
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Entry Logic</span>
                        </div>
                        <p className="text-sm text-gray-300 font-mono">
                            {trade.entry_logic || 'SMA Crossover Detection'}
                        </p>
                    </div>

                    {/* Entry/Exit Details */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-gray-800/30 border border-gray-700/30">
                            <div className="flex items-center gap-1 mb-1 text-blue-400">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px] uppercase">Entry</span>
                            </div>
                            <p className="text-[10px] text-gray-400">{formatDateTime(trade.entry_time)}</p>
                            <p className="text-sm font-mono font-semibold text-white">
                                ${formatPrice(trade.entry_price)}
                            </p>
                        </div>

                        <div className="p-2 rounded-lg bg-gray-800/30 border border-gray-700/30">
                            <div className="flex items-center gap-1 mb-1 text-orange-400">
                                <Target className="w-3 h-3" />
                                <span className="text-[10px] uppercase">Exit</span>
                            </div>
                            <p className="text-[10px] text-gray-400">{formatDateTime(trade.exit_time)}</p>
                            <p className="text-sm font-mono font-semibold text-white">
                                ${formatPrice(trade.exit_price)}
                            </p>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-1.5">
                        <div className="p-1.5 rounded-lg bg-gray-800/30 text-center">
                            <p className="text-[10px] text-gray-400">P/L</p>
                            <p className={`text-xs font-mono font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatPnL(trade.pnl)}
                            </p>
                        </div>

                        <div className="p-1.5 rounded-lg bg-gray-800/30 text-center">
                            <p className="text-[10px] text-gray-400">%</p>
                            <p className={`text-xs font-mono font-bold ${trade.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {trade.pnl_percent >= 0 ? '+' : ''}{trade.pnl_percent.toFixed(2)}%
                            </p>
                        </div>

                        <div className="p-1.5 rounded-lg bg-gray-800/30 text-center">
                            <p className="text-[10px] text-gray-400">R</p>
                            <p className={`text-xs font-mono font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {rMultipleDisplay}
                            </p>
                        </div>
                    </div>

                    {/* Duration + SL/TP */}
                    <div className="flex items-center justify-between text-[10px] text-gray-400 px-1">
                        <span>Duration: <span className="font-mono text-gray-300">{durationHours}h {durationMins}m</span></span>
                        {trade.sl_price && (
                            <span>SL: <span className="font-mono text-red-400">${formatPrice(trade.sl_price)}</span></span>
                        )}
                    </div>

                    {/* Warning */}
                    {trade.exit_reason === 'STOP' && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Stop Loss triggered</span>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export default memo(TradeDetailComponent);
