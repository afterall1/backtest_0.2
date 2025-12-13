'use client';
/**
 * Dashboard Page - Main Application Entry
 * =========================================
 * State-based rendering with smooth transitions
 */
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import StrategyInput from '@/components/StrategyInput';
import ChaosVisualizer from '@/components/ChaosVisualizer';
import MetricsGrid from '@/components/MetricsGrid';
import TradeList from '@/components/TradeList';
import { ArrowLeft, Sparkles } from 'lucide-react';

// Dynamic import for chart (SSR disabled)
const ProChart = dynamic(() => import('@/components/ProChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-xl bg-gray-900/50 animate-pulse flex items-center justify-center">
      <span className="text-gray-500">Loading chart...</span>
    </div>
  ),
});

export default function DashboardPage() {
  const { step, backtestResult, reset, strategyParams } = useAppStore();

  // Fetch symbols on mount
  useEffect(() => {
    useAppStore.getState().fetchSymbols();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold">Trader Backtest</h1>
              <p className="text-xs text-gray-500">Powered by Chaos AI</p>
            </div>
          </div>

          {step === 'results' && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:bg-gray-700/50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              New Backtest
            </motion.button>
          )}
        </header>

        {/* Main Content - State Based */}
        <AnimatePresence mode="wait">
          {/* Input State */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-center min-h-[70vh]"
            >
              <StrategyInput />
            </motion.div>
          )}

          {/* Analyzing State */}
          {step === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-center min-h-[70vh]"
            >
              <ChaosVisualizer />
            </motion.div>
          )}

          {/* Results State */}
          {step === 'results' && backtestResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span className="text-violet-400">{backtestResult.symbol}</span>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-400">{backtestResult.timeframe}</span>
                  </h2>
                  <p className="text-sm text-gray-500">
                    {backtestResult.strategy_name} • {backtestResult.metrics.total_trades} trades
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-4">
                  <div className={`text-right ${backtestResult.metrics.total_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    <div className="text-2xl font-bold font-mono">
                      {backtestResult.metrics.total_return >= 0 ? '+' : ''}
                      ${backtestResult.metrics.total_return.toLocaleString()}
                    </div>
                    <div className="text-xs">
                      {backtestResult.metrics.total_return_pct >= 0 ? '+' : ''}
                      {backtestResult.metrics.total_return_pct.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl bg-gray-900/50 border border-gray-700/50 p-4 backdrop-blur-sm"
              >
                {backtestResult.equity_curve && backtestResult.equity_curve.length > 0 ? (
                  <ProChart
                    candles={backtestResult.equity_curve.map((p, i) => ({
                      time: p.time,
                      open: i > 0 ? backtestResult.equity_curve[i - 1].equity : p.equity,
                      high: Math.max(p.equity, i > 0 ? backtestResult.equity_curve[i - 1].equity : p.equity),
                      low: Math.min(p.equity, i > 0 ? backtestResult.equity_curve[i - 1].equity : p.equity),
                      close: p.equity,
                      volume: 0,
                    }))}
                    trades={backtestResult.trades || []}
                    height={400}
                  />
                ) : (
                  <div className="w-full h-[400px] flex items-center justify-center text-gray-500">
                    No equity curve data available
                  </div>
                )}
              </motion.div>

              {/* Metrics Grid */}
              {backtestResult.metrics && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <MetricsGrid
                    metrics={backtestResult.metrics}
                    initialCapital={backtestResult.initial_capital || 10000}
                  />
                </motion.div>
              )}

              {/* Trade List */}
              {backtestResult.trades && backtestResult.trades.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <TradeList trades={backtestResult.trades} />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
