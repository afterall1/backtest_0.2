'use client';
/**
 * Main Page - Chaos AI Backtesting Terminal
 * ==========================================
 * Bloomberg Terminal 2077 Aesthetic
 */
import { Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';

// Dynamic imports
const ChaosField = dynamic(() => import('@/components/3d/ChaosField'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#030712] -z-10" />,
});

const StrategyInput = dynamic(() => import('@/components/StrategyInput'), {
  ssr: false,
  loading: () => <LoadingSkeleton />,
});

const ChaosVisualizer = dynamic(() => import('@/components/ChaosVisualizer'), {
  ssr: false,
  loading: () => <LoadingSkeleton />,
});

const MetricsGrid = dynamic(() => import('@/components/MetricsGrid'), { ssr: false });
const TradeList = dynamic(() => import('@/components/TradeList'), { ssr: false });
const ProChart = dynamic(() => import('@/components/ProChart'), { ssr: false });

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.98 },
};

const pageTransition = { duration: 0.5, ease: [0.23, 1, 0.32, 1] as const };

export default function HomePage() {
  const { step, backtestResult, strategyParams, reset } = useAppStore();

  return (
    <main className="relative min-h-screen font-sans">
      {/* Layer 0: 3D Background */}
      <Suspense fallback={<div className="fixed inset-0 bg-[#030712] -z-10" />}>
        <ChaosField />
      </Suspense>

      {/* Layer 1: UI Content */}
      <div className="relative z-10 min-h-screen">
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="min-h-screen flex items-center justify-center px-4 py-12"
            >
              <StrategyInput />
            </motion.div>
          )}

          {step === 'analyzing' && (
            <motion.div
              key="analyzing"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="min-h-screen flex items-center justify-center px-4 py-12"
            >
              <ChaosVisualizer />
            </motion.div>
          )}

          {step === 'results' && backtestResult && (
            <motion.div
              key="results"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="min-h-screen px-4 py-8"
            >
              <ResultsView result={backtestResult} params={strategyParams} onReset={reset} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* HUD Corner Decorations */}
      <CornerDecorations />
    </main>
  );
}

// ============================================================
// RESULTS VIEW
// ============================================================
import type { BacktestResult, BacktestRequest, Trade, Candle } from '@/lib/types';
import { ArrowLeft, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { CyberButton, CyberCard } from '@/components/ui/CyberComponents';

interface ResultsViewProps {
  result: BacktestResult;
  params: BacktestRequest;
  onReset: () => void;
}

function ResultsView({ result, params, onReset }: ResultsViewProps) {
  const isProfit = result.metrics.total_return >= 0;
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const equityAsCandles: Candle[] = result.equity_curve.map((point, i, arr) => {
    const prevEquity = i > 0 ? arr[i - 1].equity : point.equity;
    return {
      time: point.time,
      open: prevEquity,
      high: Math.max(prevEquity, point.equity),
      low: Math.min(prevEquity, point.equity),
      close: point.equity,
      volume: 0,
    };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CyberButton variant="ghost" onClick={onReset}>
            <ArrowLeft className="w-4 h-4" />
            New Backtest
          </CyberButton>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <h1 className="text-xl font-bold text-white">{result.symbol} Backtest Results</h1>
            <p className="text-xs text-gray-500 font-mono">Strategy: {result.strategy_name} | Timeframe: {result.timeframe}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isProfit ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            {isProfit ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
            <span className={`text-lg font-bold font-mono ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}{result.metrics.total_return_pct.toFixed(2)}%
            </span>
          </div>
          <CyberButton variant="secondary" size="sm">
            <Download className="w-4 h-4" />
            Export
          </CyberButton>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <MetricsGrid metrics={result.metrics} initialCapital={params.initial_capital} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <CyberCard variant="elevated" className="p-0 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-semibold text-white">Equity Curve & Trade Markers</h3>
          </div>
          <div className="h-[400px]">
            <ProChart candles={equityAsCandles} trades={result.trades} onTradeClick={setSelectedTrade} />
          </div>
        </CyberCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <CyberCard variant="elevated" className="p-0 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-semibold text-white">Trade History</h3>
            <p className="text-xs text-gray-500">{result.trades.length} trades executed</p>
          </div>
          <TradeList trades={result.trades} onSelectTrade={setSelectedTrade} selectedTrade={selectedTrade} />
        </CyberCard>
      </motion.div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto p-8">
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-white/5 rounded-xl w-3/4 mx-auto" />
        <div className="h-64 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-white/5 rounded-xl" />
          <div className="h-32 bg-white/5 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function CornerDecorations() {
  return (
    <>
      <div className="fixed top-6 left-6 w-16 h-16 pointer-events-none z-50">
        <svg className="w-full h-full text-violet-500/30" viewBox="0 0 64 64" fill="none">
          <path d="M0 20 L0 0 L20 0" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
        </svg>
      </div>
      <div className="fixed top-6 right-6 w-16 h-16 pointer-events-none z-50">
        <svg className="w-full h-full text-cyan-500/30" viewBox="0 0 64 64" fill="none">
          <path d="M44 0 L64 0 L64 20" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
        </svg>
      </div>
      <div className="fixed bottom-6 left-6 w-16 h-16 pointer-events-none z-50">
        <svg className="w-full h-full text-cyan-500/30" viewBox="0 0 64 64" fill="none">
          <path d="M0 44 L0 64 L20 64" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
        </svg>
      </div>
      <div className="fixed bottom-6 right-6 w-16 h-16 pointer-events-none z-50">
        <svg className="w-full h-full text-violet-500/30" viewBox="0 0 64 64" fill="none">
          <path d="M64 44 L64 64 L44 64" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
        </svg>
      </div>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-50">
        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-gray-400">CHAOS AI ONLINE</span>
        </div>
      </div>
    </>
  );
}
