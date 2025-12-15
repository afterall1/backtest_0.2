'use client';
/**
 * StrategyInput - Cyber HUD Strategy Configuration
 * =================================================
 * Bloomberg Terminal 2077 Aesthetic
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Brain, Shield, Clock, DollarSign, BarChart3, ChevronDown, Sparkles, Target, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { CyberInput, CyberButton, CyberCard, CyberTextarea, CyberSelect, CyberLabel } from './ui/CyberComponents';

const TIMEFRAMES = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' },
];

const EXAMPLE_GENERAL = `Trading BTC/USDT on 1h timeframe.
Looking for momentum-based entries during high volume periods.`;

const EXAMPLE_DETAILS = `Entry: RSI crosses above 30 from oversold + price above EMA(21)
Exit: RSI reaches 70 or price drops below EMA(21)
Take profit at 2:1 reward-risk ratio`;

const EXAMPLE_CONSTRAINTS = `Maximum 3 concurrent positions
Stop loss mandatory: 1.5% below entry
Minimum 4 hour gap between trades`;

export default function StrategyInput() {
    const { strategyParams, setStrategyParams, symbols, fetchSymbols, runBacktest, isLoading, error, clearError } = useAppStore();
    const [expandedSection, setExpandedSection] = useState<string | null>('general');

    useEffect(() => { fetchSymbols(); }, [fetchSymbols]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await runBacktest();
    };

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-5xl mx-auto"
        >
            {/* Header */}
            <div className="text-center mb-8">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-violet-400" />
                    </div>
                    <div className="text-left">
                        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400">
                            Chaos AI Strategy Composer
                        </h1>
                        <p className="text-xs text-gray-500 font-mono">Universal Logic Executor v0.2</p>
                    </div>
                </motion.div>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            <p className="text-sm text-red-300 flex-1">{error}</p>
                            <button onClick={clearError} className="text-red-400 hover:text-red-300">✕</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Left Column - Market Config */}
                    <CyberCard variant="elevated" className="lg:col-span-1">
                        <CyberLabel icon={<BarChart3 className="w-4 h-4" />}>Market Config</CyberLabel>
                        <div className="space-y-6">
                            <CyberSelect label="Trading Pair" value={strategyParams.symbol} onChange={(e) => setStrategyParams({ symbol: e.target.value })} options={symbols.map(s => ({ value: s, label: s }))} />
                            <CyberSelect label="Timeframe" value={strategyParams.timeframe} onChange={(e) => setStrategyParams({ timeframe: e.target.value })} options={TIMEFRAMES} />
                            <CyberInput label="Historical Candles" type="number" value={strategyParams.limit} onChange={(e) => setStrategyParams({ limit: parseInt(e.target.value) || 500 })} icon={<Clock className="w-4 h-4" />} />
                            <CyberInput label="Initial Capital" type="number" value={strategyParams.initial_capital} onChange={(e) => setStrategyParams({ initial_capital: parseFloat(e.target.value) || 10000 })} icon={<DollarSign className="w-4 h-4" />} />
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="bg-black/30 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Candles</p>
                                    <p className="text-lg font-mono text-cyan-400">{strategyParams.limit}</p>
                                </div>
                                <div className="bg-black/30 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Capital</p>
                                    <p className="text-lg font-mono text-emerald-400">${strategyParams.initial_capital.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </CyberCard>

                    {/* Right Column - Strategy Prompts */}
                    <div className="lg:col-span-2 space-y-4">
                        <PromptSection id="general" title="General Strategy Info" subtitle="Trading strategy overview" icon={<Sparkles className="w-4 h-4" />} color="violet" expanded={expandedSection === 'general'} onToggle={() => toggleSection('general')}>
                            <CyberTextarea value={strategyParams.general_info} onChange={(e) => setStrategyParams({ general_info: e.target.value })} placeholder={EXAMPLE_GENERAL} rows={4} />
                        </PromptSection>

                        <PromptSection id="details" title="Execution Details" subtitle="Entry/Exit logic" icon={<Target className="w-4 h-4" />} color="cyan" expanded={expandedSection === 'details'} onToggle={() => toggleSection('details')}>
                            <CyberTextarea value={strategyParams.execution_details} onChange={(e) => setStrategyParams({ execution_details: e.target.value })} placeholder={EXAMPLE_DETAILS} rows={5} />
                        </PromptSection>

                        <PromptSection id="constraints" title="Constraints" subtitle="Risk management (HIGHEST PRIORITY)" icon={<Shield className="w-4 h-4" />} color="amber" expanded={expandedSection === 'constraints'} onToggle={() => toggleSection('constraints')} priority>
                            <CyberTextarea value={strategyParams.constraints} onChange={(e) => setStrategyParams({ constraints: e.target.value })} placeholder={EXAMPLE_CONSTRAINTS} rows={4} />
                        </PromptSection>
                    </div>
                </div>

                {/* Submit */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col items-center gap-4">
                    <CyberButton type="submit" size="lg" loading={isLoading} glow={!isLoading} className="w-full max-w-md">
                        <Zap className="w-5 h-5" />
                        Execute Chaos AI Backtest
                    </CyberButton>
                    <p className="text-xs text-gray-500 text-center max-w-md">
                        Powered by real market data from Binance via CCXT. <span className="text-violet-400">No mock data.</span>
                    </p>
                </motion.div>
            </form>
        </motion.div>
    );
}

// ============================================================
// PROMPT SECTION
// ============================================================
interface PromptSectionProps {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: 'violet' | 'cyan' | 'amber';
    expanded: boolean;
    onToggle: () => void;
    priority?: boolean;
    children: React.ReactNode;
}

function PromptSection({ title, subtitle, icon, color, expanded, onToggle, priority, children }: PromptSectionProps) {
    const styles = {
        violet: { icon: 'text-violet-400', border: 'border-violet-500/30', bg: 'bg-violet-500/10' },
        cyan: { icon: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10' },
        amber: { icon: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
    }[color];

    return (
        <motion.div layout className={`bg-black/40 backdrop-blur-xl border ${styles.border} rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg`}>
            <button type="button" onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${styles.bg} border ${styles.border} flex items-center justify-center`}>
                        <span className={styles.icon}>{icon}</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{title}</h3>
                            {priority && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">Priority</span>}
                        </div>
                        <p className="text-xs text-gray-500">{subtitle}</p>
                    </div>
                </div>
                <motion.div animate={{ rotate: expanded ? 180 : 0 }} className="text-gray-500">
                    <ChevronDown className="w-5 h-5" />
                </motion.div>
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                        <div className="px-4 pb-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
