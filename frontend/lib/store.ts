/**
 * Zustand Store - Global State Management
 * ========================================
 * Manages app state: step flow, strategy params, results
 */
import { create } from 'zustand';
import type { BacktestRequest, BacktestResult, AppStep } from './types';

const API_BASE = 'http://localhost:8000';

interface AppState {
    // Current step in the flow
    step: AppStep;

    // Loading state
    isLoading: boolean;
    error: string | null;

    // Strategy parameters
    strategyParams: BacktestRequest;

    // Backtest results
    backtestResult: BacktestResult | null;

    // Available symbols
    symbols: string[];

    // Analysis logs (for ChaosVisualizer)
    analysisLogs: string[];

    // Actions
    setStep: (step: AppStep) => void;
    setStrategyParams: (params: Partial<BacktestRequest>) => void;
    fetchSymbols: () => Promise<void>;
    runBacktest: () => Promise<void>;
    addLog: (log: string) => void;
    reset: () => void;
}

const defaultParams: BacktestRequest = {
    symbol: 'BTC/USDT',
    timeframe: '1h',
    limit: 500,
    initial_capital: 10000,
    strategy: 'sma_crossover',
    sma_fast: 10,
    sma_slow: 30,
    // 3-Prompt Structure
    general_info: '',
    execution_details: '',
    constraints: '',
};

export const useAppStore = create<AppState>((set, get) => ({
    // Initial state
    step: 'input',
    isLoading: false,
    error: null,
    strategyParams: defaultParams,
    backtestResult: null,
    symbols: [],
    analysisLogs: [],

    // Set current step
    setStep: (step) => set({ step }),

    // Update strategy parameters
    setStrategyParams: (params) => set((state) => ({
        strategyParams: { ...state.strategyParams, ...params }
    })),

    // Fetch available symbols from API
    fetchSymbols: async () => {
        try {
            const res = await fetch(`${API_BASE}/api/symbols`);
            if (!res.ok) throw new Error('Failed to fetch symbols');
            const data = await res.json();
            set({ symbols: data.symbols || [] });
        } catch (error) {
            console.error('Error fetching symbols:', error);
            // Fallback symbols
            set({ symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT'] });
        }
    },

    // Run backtest
    runBacktest: async () => {
        const { strategyParams } = get();

        set({
            step: 'analyzing',
            isLoading: true,
            error: null,
            analysisLogs: []
        });

        // Chaos AI Analysis logs
        const logs = [
            '🧠 Chaos AI Engine Starting...',
            '📝 Parsing generalInfo prompt...',
            '📝 Parsing executionDetails prompt...',
            '⚠️ Parsing constraints (HIGHEST PRIORITY)...',
            '🔗 Connecting to Binance...',
            `📊 Fetching ${strategyParams.limit} candles for ${strategyParams.symbol}...`,
            '✅ Market data received',
            '🔬 Synthesizing StrategyLogic...',
            `⚡ Fallback SMA: Fast=${strategyParams.sma_fast} | Slow=${strategyParams.sma_slow}`,
            '🔄 Detecting trade signals...',
            '💰 Calculating trade PnL...',
            '📉 Computing drawdown series...',
            '🎯 Calculating Sharpe Ratio...',
            '🎲 Calculating Sortino Ratio...',
            '✨ Generating performance report...',
        ];

        // Add logs with delay
        for (const log of logs) {
            await new Promise(r => setTimeout(r, 300));
            set((state) => ({ analysisLogs: [...state.analysisLogs, log] }));
        }

        try {
            const res = await fetch(`${API_BASE}/api/backtest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(strategyParams),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Backtest failed');
            }

            const result: BacktestResult = await res.json();

            // Add completion log
            set((state) => ({
                analysisLogs: [...state.analysisLogs, '🎉 Backtest complete!']
            }));

            // Short delay before showing results
            await new Promise(r => setTimeout(r, 500));

            set({
                backtestResult: result,
                step: 'results',
                isLoading: false
            });

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({
                error: message,
                step: 'input',
                isLoading: false,
                analysisLogs: [...get().analysisLogs, `❌ Error: ${message}`]
            });
        }
    },

    // Add single log
    addLog: (log) => set((state) => ({
        analysisLogs: [...state.analysisLogs, log]
    })),

    // Reset to initial state
    reset: () => set({
        step: 'input',
        isLoading: false,
        error: null,
        backtestResult: null,
        analysisLogs: [],
    }),
}));
