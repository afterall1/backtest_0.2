'use client';
/**
 * ChaosVisualizer - Cinematic AI Processing View
 * ================================================
 * Matrix/Terminal aesthetic with staggered animations
 * Simulates watching a supercomputer think
 */
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';

// System logs that simulate AI processing
const SYSTEM_LOGS = [
    { text: '🔌 Initializing Chaos AI Engine v0.2...', delay: 0 },
    { text: '🔗 Establishing Binance WebSocket connection...', delay: 200 },
    { text: '✓ Real-time liquidity feed connected', delay: 400 },
    { text: '📊 Fetching historical OHLCV data...', delay: 600 },
    { text: '✓ 500 candles loaded into memory buffer', delay: 900 },
    { text: '🧠 Parsing 3-Prompt Input Structure...', delay: 1100 },
    { text: '  → generalInfo: Strategy context loaded', delay: 1300 },
    { text: '  → executionDetails: Entry/Exit rules parsed', delay: 1500 },
    { text: '  → constraints: ⚠️ PRIORITY RULES LOCKED', delay: 1700 },
    { text: '🔬 Activating Universal Logic Executor...', delay: 2000 },
    { text: '📈 IndicatorFactory: Calculating RSI(14)...', delay: 2200 },
    { text: '📈 IndicatorFactory: Calculating EMA(21)...', delay: 2400 },
    { text: '📈 IndicatorFactory: Calculating SMA Crossover...', delay: 2600 },
    { text: '🎯 SignalEvaluator: Detecting entry conditions...', delay: 2900 },
    { text: '🔄 Pattern Detected: Bullish Divergence', delay: 3200 },
    { text: '📉 Vectorized backtest running...', delay: 3400 },
    { text: '💰 Computing trade PnL matrix...', delay: 3600 },
    { text: '📊 Calculating Sharpe Ratio (annualized 365d)...', delay: 3800 },
    { text: '📊 Calculating Sortino Ratio...', delay: 4000 },
    { text: '📊 Computing Maximum Drawdown...', delay: 4200 },
    { text: '✨ Generating performance analytics...', delay: 4400 },
    { text: '🎉 Chaos AI Analysis Complete', delay: 4700 },
];

export default function ChaosVisualizer() {
    const { analysisLogs } = useAppStore();
    const [displayLogs, setDisplayLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Animate system logs
    useEffect(() => {
        const timers: NodeJS.Timeout[] = [];

        SYSTEM_LOGS.forEach((log, index) => {
            const timer = setTimeout(() => {
                setDisplayLogs(prev => [...prev, log.text]);
                setProgress((index + 1) / SYSTEM_LOGS.length * 100);

                // Auto-scroll to bottom
                if (containerRef.current) {
                    containerRef.current.scrollTop = containerRef.current.scrollHeight;
                }
            }, log.delay);
            timers.push(timer);
        });

        return () => timers.forEach(t => clearTimeout(t));
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-4xl mx-auto"
        >
            {/* Header */}
            <div className="text-center mb-6">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400"
                >
                    Chaos AI Processing
                </motion.h1>
                <p className="text-gray-500 text-sm mt-1">Universal Logic Executor Active</p>
            </div>

            {/* Main Terminal */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative rounded-2xl overflow-hidden bg-gray-950 border border-cyan-500/30 shadow-2xl shadow-cyan-500/10"
            >
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs text-gray-500 font-mono">chaos_ai_engine.exe</span>
                    <div className="flex items-center gap-2">
                        <PulseIndicator />
                        <span className="text-xs text-cyan-400 font-mono">RUNNING</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-gray-900 relative overflow-hidden">
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                    <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>

                {/* Log Container */}
                <div
                    ref={containerRef}
                    className="h-[400px] overflow-y-auto p-4 font-mono text-sm scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
                >
                    <AnimatePresence mode="popLayout">
                        {displayLogs.map((log, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.15 }}
                                className={`py-0.5 ${log.includes('✓') ? 'text-green-400' :
                                        log.includes('⚠️') ? 'text-yellow-400' :
                                            log.includes('🎉') ? 'text-fuchsia-400' :
                                                log.includes('Pattern Detected') ? 'text-cyan-400 font-bold' :
                                                    log.startsWith('  →') ? 'text-gray-500 pl-4' :
                                                        'text-gray-300'
                                    }`}
                            >
                                <span className="text-gray-600 mr-2">[{String(index + 1).padStart(2, '0')}]</span>
                                {log}
                                {log.includes('🎉') && <CelebrationEffect />}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Blinking Cursor */}
                    {progress < 100 && (
                        <motion.span
                            className="inline-block w-2 h-4 bg-cyan-400 ml-1"
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                        />
                    )}
                </div>

                {/* Status Bar */}
                <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500">
                            CPU: <span className="text-cyan-400">87%</span>
                        </span>
                        <span className="text-xs text-gray-500">
                            MEM: <span className="text-violet-400">2.4GB</span>
                        </span>
                        <span className="text-xs text-gray-500">
                            GPU: <span className="text-fuchsia-400">CUDA Active</span>
                        </span>
                    </div>
                    <span className="text-xs text-gray-500">
                        Progress: <span className="text-white">{Math.round(progress)}%</span>
                    </span>
                </div>
            </motion.div>

            {/* Neural Grid Background */}
            <NeuralGrid />
        </motion.div>
    );
}

// Pulsing indicator component
function PulseIndicator() {
    return (
        <div className="relative">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <motion.div
                className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-400"
                animate={{ scale: [1, 2], opacity: [0.8, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
            />
        </div>
    );
}

// Celebration effect when complete
function CelebrationEffect() {
    return (
        <motion.span
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="inline-block ml-2"
        >
            ✨
        </motion.span>
    );
}

// Neural network grid background
function NeuralGrid() {
    return (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <svg className="w-full h-full opacity-5">
                <defs>
                    <pattern id="neural-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="20" cy="20" r="1" fill="currentColor" className="text-cyan-500" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#neural-grid)" />
            </svg>
        </div>
    );
}
