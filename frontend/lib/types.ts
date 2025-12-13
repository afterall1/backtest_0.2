/**
 * TypeScript Types - Matching Backend Pydantic Models
 * =====================================================
 * Strict type definitions for frontend/backend sync
 */

// Trade Types
export type TradeType = 'long' | 'short';
export type TradeStatus = 'win' | 'loss' | 'breakeven';

// App States
export type AppStep = 'input' | 'analyzing' | 'results';

// OHLCV Candle
export interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// Individual Trade
export interface Trade {
    entry_time: number;
    exit_time: number;
    entry_price: number;
    exit_price: number;
    pnl: number;
    pnl_percent: number;
    type: TradeType;
    status: TradeStatus;
}

// Equity Curve Point
export interface EquityPoint {
    time: number;
    equity: number;
}

// Drawdown Point
export interface DrawdownPoint {
    time: number;
    drawdown_pct: number;
}

// Performance Metrics
export interface PerformanceMetrics {
    sharpe_ratio: number;
    sortino_ratio: number;
    max_drawdown: number;
    max_drawdown_pct: number;
    win_rate: number;
    profit_factor: number;
    total_return: number;
    total_return_pct: number;
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    gross_profit: number;
    gross_loss: number;
    avg_win: number;
    avg_loss: number;
    final_equity: number;
}

// Complete Backtest Result
export interface BacktestResult {
    symbol: string;
    timeframe: string;
    strategy_name: string;
    initial_capital: number;
    metrics: PerformanceMetrics;
    equity_curve: EquityPoint[];
    drawdown_series: DrawdownPoint[];
    trades: Trade[];
}

// Backtest Request
export interface BacktestRequest {
    symbol: string;
    timeframe: string;
    limit: number;
    initial_capital: number;
    strategy: string;
    sma_fast: number;
    sma_slow: number;
}

// API Response types
export interface SymbolsResponse {
    count: number;
    symbols: string[];
}

export interface OHLCVResponse {
    symbol: string;
    timeframe: string;
    count: number;
    data: Candle[];
}

// Chart Marker types
export interface ChartMarker {
    time: number;
    position: 'aboveBar' | 'belowBar';
    color: string;
    shape: 'arrowUp' | 'arrowDown';
    text: string;
}
