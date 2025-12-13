'use client';
/**
 * StrategyInput - 3-Prompt Chaos AI Input System
 * ================================================
 * Bloomberg/Pro aesthetic with tabbed input structure
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Rocket,
    TrendingUp,
    Clock,
    DollarSign,
    FileText,
    Target,
    AlertTriangle,
    ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

// Validation schema
const schema = z.object({
    symbol: z.string().min(1, 'Select a symbol'),
    timeframe: z.string().min(1, 'Select timeframe'),
    limit: z.number().min(50).max(1000),
    initial_capital: z.number().min(100),
    strategy: z.string(),
    sma_fast: z.number().min(2).max(50),
    sma_slow: z.number().min(10).max(200),
    // 3-Prompt Structure
    generalInfo: z.string().optional(),
    executionDetails: z.string().optional(),
    constraints: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

type TabId = 'general' | 'execution' | 'constraints';

interface Tab {
    id: TabId;
    label: string;
    icon: React.ElementType;
    placeholder: string;
    priority: string;
}

const tabs: Tab[] = [
    {
        id: 'general',
        label: 'Genel Strateji',
        icon: FileText,
        placeholder: 'Stratejinizi genel hatlarıyla açıklayın...\n\nÖrnek:\n- Trend takip stratejisi\n- Momentum bazlı giriş\n- 4 saatlik grafik üzerinde çalışır',
        priority: 'Context',
    },
    {
        id: 'execution',
        label: 'İşlem Detayları',
        icon: Target,
        placeholder: 'Entry, Exit, Stop Loss ve Risk/Reward detayları...\n\nÖrnek:\n- Entry: RSI 30 altında ve fiyat destek seviyesinde\n- Exit: RSI 70 üstünde veya %10 kar\n- Stop Loss: Entry altında %2\n- Risk/Reward: 1:3',
        priority: 'Logic',
    },
    {
        id: 'constraints',
        label: 'Kısıtlamalar',
        icon: AlertTriangle,
        placeholder: 'Backtest için kesin kurallar ve kısıtlamalar...\n\n⚠️ BU ALAN EN YÜKSEK ÖNCELİĞE SAHİPTİR\n\nÖrnek:\n- Stop Loss kesinlikle %2 olmalı\n- Gün içi 3\'ten fazla işlem açılmamalı\n- Hafta sonu işlem yapılmamalı',
        priority: 'HIGHEST',
    },
];

export default function StrategyInput() {
    const { symbols, strategyParams, setStrategyParams, fetchSymbols, runBacktest } = useAppStore();
    const [activeTab, setActiveTab] = useState<TabId>('general');

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            ...strategyParams,
            generalInfo: '',
            executionDetails: '',
            constraints: '',
        },
    });

    useEffect(() => {
        fetchSymbols();
    }, [fetchSymbols]);

    const onSubmit = (data: FormData) => {
        setStrategyParams({
            ...data,
            // Store prompts for Chaos AI
        });
        runBacktest();
    };

    const watchedValues = watch();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-4xl mx-auto"
        >
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent mb-2">
                    Chaos AI Strategy Composer
                </h1>
                <p className="text-gray-400 text-sm">3-Layer Input System • Constraint Priority Architecture</p>
            </div>

            {/* Form Card */}
            <motion.form
                onSubmit={handleSubmit(onSubmit)}
                className="relative rounded-2xl bg-gradient-to-br from-gray-900/90 to-gray-800/70 backdrop-blur-xl border border-gray-700/50 shadow-2xl overflow-hidden"
            >
                {/* Top Bar - Market Settings */}
                <div className="p-4 bg-gray-800/50 border-b border-gray-700/50">
                    <div className="grid grid-cols-4 gap-3">
                        {/* Symbol */}
                        <div>
                            <label className="flex items-center gap-1 text-xs font-medium text-gray-400 mb-1">
                                <TrendingUp className="w-3 h-3" />
                                Trading Pair
                            </label>
                            <select
                                {...register('symbol')}
                                className="w-full px-3 py-2 text-sm bg-gray-900/80 border border-gray-600/50 rounded-lg text-white focus:border-violet-500 transition-all"
                            >
                                {symbols.length > 0 ? (
                                    symbols.slice(0, 50).map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))
                                ) : (
                                    <>
                                        <option value="BTC/USDT">BTC/USDT</option>
                                        <option value="ETH/USDT">ETH/USDT</option>
                                    </>
                                )}
                            </select>
                        </div>

                        {/* Timeframe */}
                        <div>
                            <label className="flex items-center gap-1 text-xs font-medium text-gray-400 mb-1">
                                <Clock className="w-3 h-3" />
                                Timeframe
                            </label>
                            <select
                                {...register('timeframe')}
                                className="w-full px-3 py-2 text-sm bg-gray-900/80 border border-gray-600/50 rounded-lg text-white focus:border-cyan-500 transition-all"
                            >
                                {timeframes.map((tf) => (
                                    <option key={tf} value={tf}>{tf}</option>
                                ))}
                            </select>
                        </div>

                        {/* Capital */}
                        <div>
                            <label className="flex items-center gap-1 text-xs font-medium text-gray-400 mb-1">
                                <DollarSign className="w-3 h-3" />
                                Capital
                            </label>
                            <input
                                type="number"
                                {...register('initial_capital', { valueAsNumber: true })}
                                className="w-full px-3 py-2 text-sm bg-gray-900/80 border border-gray-600/50 rounded-lg text-white font-mono focus:border-emerald-500 transition-all"
                            />
                        </div>

                        {/* Candles */}
                        <div>
                            <label className="flex items-center gap-1 text-xs font-medium text-gray-400 mb-1">
                                Candles
                            </label>
                            <input
                                type="number"
                                {...register('limit', { valueAsNumber: true })}
                                min={50}
                                max={1000}
                                className="w-full px-3 py-2 text-sm bg-gray-900/80 border border-gray-600/50 rounded-lg text-white font-mono focus:border-orange-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Date Range Selection */}
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-700/30">
                        <div>
                            <label className="flex items-center gap-1 text-xs font-medium text-gray-400 mb-1">
                                📅 Start Date
                            </label>
                            <input
                                type="date"
                                onChange={(e) => {
                                    const timestamp = e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : undefined;
                                    setStrategyParams({ start_date: timestamp });
                                }}
                                className="w-full px-3 py-2 text-sm bg-gray-900/80 border border-gray-600/50 rounded-lg text-white focus:border-violet-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1 text-xs font-medium text-gray-400 mb-1">
                                📅 End Date
                            </label>
                            <input
                                type="date"
                                onChange={(e) => {
                                    const timestamp = e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : undefined;
                                    setStrategyParams({ end_date: timestamp });
                                }}
                                className="w-full px-3 py-2 text-sm bg-gray-900/80 border border-gray-600/50 rounded-lg text-white focus:border-violet-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-700/50">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'text-white bg-gray-800/50 border-b-2 border-violet-500'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${tab.id === 'constraints' ? 'text-yellow-400' : ''
                                }`} />
                            {tab.label}
                            {tab.id === 'constraints' && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-400 rounded">
                                    ÖNCELİK
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-4">
                    <AnimatePresence mode="wait">
                        {tabs.map((tab) => (
                            activeTab === tab.id && (
                                <motion.div
                                    key={tab.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs text-gray-500">
                                            {tab.id === 'general' && 'Stratejinizi genel hatlarıyla tanımlayın'}
                                            {tab.id === 'execution' && 'Giriş, çıkış ve risk yönetimi kuralları'}
                                            {tab.id === 'constraints' && '⚠️ Bu alandaki kurallar AI tarafından DEĞİŞTİRİLEMEZ'}
                                        </span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded ${tab.priority === 'HIGHEST'
                                            ? 'bg-yellow-500/20 text-yellow-400'
                                            : 'bg-gray-700/50 text-gray-400'
                                            }`}>
                                            {tab.priority}
                                        </span>
                                    </div>
                                    <textarea
                                        {...register(
                                            tab.id === 'general' ? 'generalInfo' :
                                                tab.id === 'execution' ? 'executionDetails' : 'constraints'
                                        )}
                                        placeholder={tab.placeholder}
                                        rows={8}
                                        className={`w-full px-4 py-3 bg-gray-900/60 border rounded-xl text-white text-sm placeholder-gray-500 focus:ring-2 transition-all resize-none ${tab.id === 'constraints'
                                            ? 'border-yellow-500/30 focus:border-yellow-500 focus:ring-yellow-500/20'
                                            : 'border-gray-600/50 focus:border-violet-500 focus:ring-violet-500/20'
                                            }`}
                                    />
                                </motion.div>
                            )
                        ))}
                    </AnimatePresence>
                </div>

                {/* SMA Quick Settings (fallback) */}
                <div className="px-4 pb-4">
                    <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                        <p className="text-xs text-gray-500 mb-2">Fallback SMA Crossover (Text input boşsa kullanılır)</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-400">Fast SMA:</label>
                                <input
                                    type="number"
                                    {...register('sma_fast', { valueAsNumber: true })}
                                    className="w-16 px-2 py-1 text-xs bg-gray-900/60 border border-gray-600/50 rounded text-white font-mono"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-400">Slow SMA:</label>
                                <input
                                    type="number"
                                    {...register('sma_slow', { valueAsNumber: true })}
                                    className="w-16 px-2 py-1 text-xs bg-gray-900/60 border border-gray-600/50 rounded text-white font-mono"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="p-4 bg-gray-800/30 border-t border-gray-700/50">
                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-500/20 transition-all"
                    >
                        <Rocket className="w-5 h-5" />
                        Run Chaos Backtest
                        <ChevronRight className="w-4 h-4" />
                    </motion.button>

                    <p className="text-center text-xs text-gray-500 mt-2">
                        {watchedValues.symbol} • {watchedValues.timeframe} • {watchedValues.limit} candles
                    </p>
                </div>
            </motion.form>
        </motion.div>
    );
}
