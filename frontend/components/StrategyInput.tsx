'use client';
/**
 * StrategyInput - Premium Strategy Configuration Form
 * =====================================================
 * Glassmorphic design with react-hook-form validation
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
    Rocket,
    TrendingUp,
    Clock,
    DollarSign,
    Activity,
    Zap
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { BacktestRequest } from '@/lib/types';

// Validation schema
const schema = z.object({
    symbol: z.string().min(1, 'Select a symbol'),
    timeframe: z.string().min(1, 'Select timeframe'),
    limit: z.number().min(50).max(1000),
    initial_capital: z.number().min(100),
    strategy: z.string(),
    sma_fast: z.number().min(2).max(50),
    sma_slow: z.number().min(10).max(200),
});

const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

export default function StrategyInput() {
    const { symbols, strategyParams, setStrategyParams, fetchSymbols, runBacktest } = useAppStore();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<BacktestRequest>({
        resolver: zodResolver(schema),
        defaultValues: strategyParams,
    });

    useEffect(() => {
        fetchSymbols();
    }, [fetchSymbols]);

    const onSubmit = (data: BacktestRequest) => {
        setStrategyParams(data);
        runBacktest();
    };

    const watchedValues = watch();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl mx-auto"
        >
            {/* Header */}
            <div className="text-center mb-8">
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-500/30 mb-4"
                >
                    <Zap className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-medium text-violet-300">Real-Time Backtesting</span>
                </motion.div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent mb-2">
                    Strategy Composer
                </h1>
                <p className="text-gray-400">Configure your trading strategy with real Binance data</p>
            </div>

            {/* Form Card */}
            <motion.form
                onSubmit={handleSubmit(onSubmit)}
                className="relative p-8 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 shadow-2xl"
            >
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 blur-xl -z-10" />

                {/* Symbol & Timeframe Row */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Symbol Select */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                            <TrendingUp className="w-4 h-4 text-violet-400" />
                            Trading Pair
                        </label>
                        <select
                            {...register('symbol')}
                            className="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/50 rounded-xl text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer"
                        >
                            {symbols.length > 0 ? (
                                symbols.slice(0, 50).map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))
                            ) : (
                                <>
                                    <option value="BTC/USDT">BTC/USDT</option>
                                    <option value="ETH/USDT">ETH/USDT</option>
                                    <option value="SOL/USDT">SOL/USDT</option>
                                </>
                            )}
                        </select>
                        {errors.symbol && (
                            <p className="text-red-400 text-xs mt-1">{errors.symbol.message}</p>
                        )}
                    </div>

                    {/* Timeframe Select */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                            <Clock className="w-4 h-4 text-cyan-400" />
                            Timeframe
                        </label>
                        <select
                            {...register('timeframe')}
                            className="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/50 rounded-xl text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all appearance-none cursor-pointer"
                        >
                            {timeframes.map((tf) => (
                                <option key={tf} value={tf}>{tf}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Capital & Candles Row */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Initial Capital */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            Initial Capital
                        </label>
                        <input
                            type="number"
                            {...register('initial_capital', { valueAsNumber: true })}
                            className="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/50 rounded-xl text-white font-mono focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                    </div>

                    {/* Candles */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                            <Activity className="w-4 h-4 text-orange-400" />
                            Candles (50-1000)
                        </label>
                        <input
                            type="number"
                            {...register('limit', { valueAsNumber: true })}
                            min={50}
                            max={1000}
                            className="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/50 rounded-xl text-white font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                        />
                    </div>
                </div>

                {/* Strategy Section */}
                <div className="mb-6 p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        SMA Crossover Strategy
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Fast SMA */}
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Fast SMA Period</label>
                            <input
                                type="number"
                                {...register('sma_fast', { valueAsNumber: true })}
                                min={2}
                                max={50}
                                className="w-full px-4 py-2 bg-gray-900/60 border border-gray-600/50 rounded-lg text-white font-mono text-sm focus:border-yellow-500 transition-all"
                            />
                        </div>

                        {/* Slow SMA */}
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Slow SMA Period</label>
                            <input
                                type="number"
                                {...register('sma_slow', { valueAsNumber: true })}
                                min={10}
                                max={200}
                                className="w-full px-4 py-2 bg-gray-900/60 border border-gray-600/50 rounded-lg text-white font-mono text-sm focus:border-yellow-500 transition-all"
                            />
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                        Buy when Fast SMA crosses above Slow SMA. Sell on opposite crossover.
                    </p>
                </div>

                {/* Submit Button */}
                <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                >
                    <Rocket className="w-5 h-5" />
                    Run Backtest
                </motion.button>

                {/* Preview */}
                <div className="mt-4 text-center text-xs text-gray-500">
                    Testing <span className="text-violet-400 font-mono">{watchedValues.symbol}</span> with{' '}
                    <span className="text-cyan-400 font-mono">{watchedValues.limit}</span> candles
                </div>
            </motion.form>
        </motion.div>
    );
}
