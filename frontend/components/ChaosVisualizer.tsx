'use client';
/**
 * ChaosVisualizer - AI Thinking State Animation
 * ===============================================
 * Premium loading state with terminal-style logs
 */
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Terminal, Cpu, Zap, Activity } from 'lucide-react';

export default function ChaosVisualizer() {
    const { analysisLogs, strategyParams } = useAppStore();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-3xl mx-auto"
        >
            {/* Header */}
            <div className="text-center mb-8">
                <motion.div
                    animate={{
                        boxShadow: [
                            '0 0 20px rgba(139, 92, 246, 0.3)',
                            '0 0 40px rgba(139, 92, 246, 0.5)',
                            '0 0 20px rgba(139, 92, 246, 0.3)',
                        ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 mb-6"
                >
                    <Cpu className="w-10 h-10 text-white" />
                </motion.div>

                <h2 className="text-3xl font-bold text-white mb-2">
                    Analyzing Strategy
                </h2>
                <p className="text-gray-400">
                    Processing {strategyParams.symbol} with {strategyParams.strategy}
                </p>
            </div>

            {/* Scanning Animation */}
            <div className="relative mb-8">
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                    <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="h-full w-1/3 bg-gradient-to-r from-transparent via-violet-500 to-transparent"
                    />
                </div>
            </div>

            {/* Terminal Card */}
            <motion.div
                className="relative rounded-2xl bg-gray-900/90 border border-gray-700/50 overflow-hidden shadow-2xl"
            >
                {/* Terminal Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/80 border-b border-gray-700/50">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-sm text-gray-400 font-mono flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        chaos-engine v0.2
                    </span>
                </div>

                {/* Terminal Content */}
                <div className="p-4 h-80 overflow-y-auto font-mono text-sm">
                    {analysisLogs.map((log, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-start gap-2 mb-2"
                        >
                            <span className="text-gray-500 select-none">[{String(idx).padStart(2, '0')}]</span>
                            <span className={`
                ${log.includes('✅') || log.includes('🎉') ? 'text-emerald-400' : ''}
                ${log.includes('❌') ? 'text-red-400' : ''}
                ${log.includes('📊') || log.includes('📈') || log.includes('📉') ? 'text-cyan-400' : ''}
                ${log.includes('🔗') || log.includes('🔄') ? 'text-violet-400' : ''}
                ${log.includes('💰') || log.includes('🎯') || log.includes('🎲') ? 'text-yellow-400' : ''}
                ${log.includes('⚡') ? 'text-orange-400' : ''}
                ${!log.match(/[✅❌📊📈📉🔗🔄💰🎯🎲⚡🎉]/) ? 'text-gray-300' : ''}
              `}>
                                {log}
                            </span>
                        </motion.div>
                    ))}

                    {/* Cursor blink */}
                    <motion.div
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="inline-block w-2 h-4 bg-violet-400 ml-1"
                    />
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                    { icon: Activity, label: 'Candles', value: strategyParams.limit, color: 'text-cyan-400' },
                    { icon: Zap, label: 'Strategy', value: 'SMA', color: 'text-yellow-400' },
                    { icon: Terminal, label: 'Status', value: 'Live', color: 'text-emerald-400' },
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                        className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 text-center"
                    >
                        <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                        <div className="text-xl font-bold text-white font-mono">{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
