/**
 * Zustand Store - Global State Management
 * ========================================
 * Manages app state: step flow, strategy params, results
 * 
 * ⚠️ ZERO MOCK DATA: All data fetched via centralized API layer
 */
import { create } from 'zustand';
import type { BacktestRequest, BacktestResult, AppStep, DrawingPoint } from './types';
import * as api from './api';

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
    addDrawing: (point: DrawingPoint) => void;
    clearDrawings: () => void;
    fetchSymbols: () => Promise<void>;
    runBacktest: () => Promise<void>;
    addLog: (log: string) => void;
    clearError: () => void;
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
    // Drawing Data
    drawing_data: [],
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

    // Add drawing point to chart
    addDrawing: (point) => set((state) => ({
        strategyParams: {
            ...state.strategyParams,
            drawing_data: [...(state.strategyParams.drawing_data || []), point]
        }
    })),

    // Clear all drawings
    clearDrawings: () => set((state) => ({
        strategyParams: {
            ...state.strategyParams,
            drawing_data: []
        }
    })),

    // Clear error state
    clearError: () => set({ error: null }),

    // ============================================================
    // FETCH SYMBOLS - Using Centralized API Layer
    // ============================================================
    fetchSymbols: async () => {
        try {
            const symbols = await api.getSymbols();
            set({ symbols });
        } catch (error) {
            console.error('Error fetching symbols:', error);

            if (error instanceof api.BackendUnavailableError) {
                set({ error: 'Backend server is not running. Please start the FastAPI server.' });
            }

            // Fallback to common symbols (for UI display only)
            set({ symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT'] });
        }
    },

    // ============================================================
    // RUN BACKTEST - Using Centralized API Layer
    // ============================================================
    runBacktest: async () => {
        const { strategyParams } = get();

        // Transition to analyzing state
        set({
            step: 'analyzing',
            isLoading: true,
            error: null,
            analysisLogs: []
        });

        // Chaos AI Analysis logs (displayed during processing)
        const logs = [
            '🧠 Chaos AI Engine Starting...',
            '📝 Parsing generalInfo prompt...',
            '📝 Parsing executionDetails prompt...',
            '⚠️ Parsing constraints (HIGHEST PRIORITY)...',
            '🔗 Connecting to Binance via CCXT...',
            `📊 Fetching ${strategyParams.limit} candles for ${strategyParams.symbol}...`,
            '✅ Real market data received',
            '🔬 Activating Universal Logic Executor...',
            '📈 IndicatorFactory: Calculating RSI(14)...',
            '📈 IndicatorFactory: Calculating EMA(21)...',
            '📈 IndicatorFactory: Calculating SMA Crossover...',
            '🎯 SignalEvaluator: Detecting entry conditions...',
            '🔄 Vectorized backtest running...',
            '💰 Computing trade PnL matrix...',
            '📉 Computing drawdown series...',
            '🎯 Calculating Sharpe Ratio (annualized 365d)...',
            '🎲 Calculating Sortino Ratio...',
            '✨ Generating performance analytics...',
        ];

        // Add logs with staggered delay
        for (const log of logs) {
            await new Promise(r => setTimeout(r, 250));
            set((state) => ({ analysisLogs: [...state.analysisLogs, log] }));
        }

        try {
            // Construct request from store state
            const request: BacktestRequest = {
                symbol: strategyParams.symbol,
                timeframe: strategyParams.timeframe,
                limit: strategyParams.limit,
                initial_capital: strategyParams.initial_capital,
                strategy: strategyParams.strategy,
                sma_fast: strategyParams.sma_fast,
                sma_slow: strategyParams.sma_slow,
                general_info: strategyParams.general_info,
                execution_details: strategyParams.execution_details,
                constraints: strategyParams.constraints,
                drawing_data: strategyParams.drawing_data,
                start_date: strategyParams.start_date,
                end_date: strategyParams.end_date,
            };

            // Call centralized API
            const result = await api.runBacktest(request);

            // Success log
            set((state) => ({
                analysisLogs: [...state.analysisLogs, '🎉 Chaos AI Analysis Complete!']
            }));

            // Short delay before showing results
            await new Promise(r => setTimeout(r, 500));

            // Update state with results
            set({
                backtestResult: result,
                step: 'results',
                isLoading: false
            });

        } catch (error) {
            let message = 'An unexpected error occurred';

            if (error instanceof api.BackendUnavailableError) {
                message = 'Backend server is not running. Please start FastAPI.';
            } else if (error instanceof api.StrategyRejectedError) {
                message = `Strategy rejected: ${error.message}`;
            } else if (error instanceof api.InsufficientDataError) {
                message = error.message;
            } else if (error instanceof api.ApiError) {
                message = error.message;
            } else if (error instanceof Error) {
                message = error.message;
            }

            // Error log
            set((state) => ({
                analysisLogs: [...state.analysisLogs, `❌ Error: ${message}`]
            }));

            // Return to input with error
            set({
                error: message,
                step: 'input',
                isLoading: false,
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
        strategyParams: defaultParams,
    }),
}));
