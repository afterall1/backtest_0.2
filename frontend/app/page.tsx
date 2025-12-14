'use client';
/**
 * Dashboard Page - Professional Trading Results View
 * ====================================================
 * Chart (60vh) + Two-Column Results Layout
 */
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import StrategyInput from '@/components/StrategyInput';
import ChaosVisualizer from '@/components/ChaosVisualizer';
import MetricsGrid from '@/components/MetricsGrid';
import TradeList from '@/components/TradeList';
import TradeDetail from '@/components/TradeDetail';
import { ArrowLeft, Sparkles } from 'lucide-react';
import type { Trade } from '@/lib/types';

// Dynamic import for chart (SSR disabled)
const ProChart = dynamic(() => import('@/components/ProChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[60vh] rounded-xl bg-gray-900/50 animate-pulse flex items-center justify-center">
      <span className="text-gray-500">Loading chart...</span>
    </div>
  ),
});

export default function DashboardPage() {
  const { step, backtestResult, reset, error, clearError } = useAppStore();
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);

  // Fetch symbols on mount
  useEffect(() => {
    useAppStore.getState().fetchSymbols();
  }, []);

  // Scroll to results when backtest completes
  useEffect(() => {
    if (step === 'results' && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [step]);

  // Error Toast Effect
  useEffect(() => {
    if (error) {
      setToastMessage(error);
      setShowToast(true);

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setShowToast(false);
        clearError();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Handle trade selection
  const handleSelectTrade = (trade: Trade) => {
    setSelectedTrade(trade);
  };

  const handleCloseTradeDetail = () => {
    setSelectedTrade(null);
  };

  const handleDismissToast = () => {
    setShowToast(false);
    clearError();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
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
              onClick={() => {
                reset();
                setSelectedTrade(null);
              }}
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
              ref={resultsRef}
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

              {/* Chart Section - 60vh Dominant */}
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
                    height={Math.min(window.innerHeight * 0.5, 500)}
                    onTradeClick={handleSelectTrade}
                  />
                ) : (
                  <div className="w-full h-[400px] flex items-center justify-center text-gray-500">
                    No equity curve data available
                  </div>
                )}
              </motion.div>

              {/* Two-Column Layout: TradeList (70%) + Metrics/Detail (30%) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-4"
              >
                {/* Left: Trade List */}
                <div>
                  {backtestResult.trades && backtestResult.trades.length > 0 && (
                    <TradeList
                      trades={backtestResult.trades}
                      onSelectTrade={handleSelectTrade}
                      selectedTrade={selectedTrade}
                    />
                  )}
                </div>

                {/* Right: Metrics + Trade Detail */}
                <div className="space-y-4">
                  {/* Metrics Grid */}
                  {backtestResult.metrics && (
                    <MetricsGrid
                      metrics={backtestResult.metrics}
                      initialCapital={backtestResult.initial_capital || 10000}
                    />
                  )}

                  {/* Trade Detail Panel */}
                  <TradeDetail
                    trade={selectedTrade}
                    onClose={handleCloseTradeDetail}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50 max-w-sm"
          >
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/90 border border-red-400 shadow-2xl shadow-red-500/30 backdrop-blur-sm">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Error</p>
                <p className="text-xs text-red-100 mt-1">{toastMessage}</p>
              </div>
              <button
                onClick={handleDismissToast}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-red-600 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {/* Progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5, ease: 'linear' }}
              className="h-1 bg-white/50 rounded-b-xl origin-left mt-0.5"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
