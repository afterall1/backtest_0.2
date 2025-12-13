"""
Backtest Engine - High-Speed Vectorized Simulation
===================================================
⚠️ CRITICAL: NO MOCK DATA - Uses real market data passed in

This engine performs mathematical backtesting using Pandas/NumPy.
All calculations are performed on REAL historical data.

Core Principle: "AI calculates Logic, Python calculates Math"
"""
import pandas as pd
import numpy as np
from typing import Optional
import logging

from models import (
    Trade, BacktestResult, BacktestRequest,
    TradeType, TradeStatus, PerformanceMetrics,
    EquityPoint, DrawdownPoint
)
from analytics import PerformanceAnalyzer

logger = logging.getLogger(__name__)


class Backtester:
    """
    Vectorized Backtest Engine using Pandas.
    
    Simulates trading strategies on historical OHLCV data.
    NO mock data generation - all data must be passed in.
    """
    
    def __init__(self, initial_capital: float = 10000.0):
        """
        Initialize the backtester.
        
        Args:
            initial_capital: Starting capital for simulation
        """
        self.initial_capital = initial_capital
        
    def run(
        self,
        data: list[dict],
        request: BacktestRequest
    ) -> BacktestResult:
        """
        Execute backtest on provided market data.
        
        Args:
            data: List of OHLCV candles [{ time, open, high, low, close, volume }]
            request: Backtest parameters including strategy settings
            
        Returns:
            BacktestResult with all metrics, equity curve, and trade list
        """
        if not data or len(data) < request.sma_slow + 10:
            logger.warning("Insufficient data for backtest")
            return self._empty_result(request)
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        df['time_dt'] = pd.to_datetime(df['time'], unit='s')
        df.set_index('time_dt', inplace=True)
        
        logger.info(f"Running backtest: {request.symbol} | {request.strategy} | {len(df)} candles")
        
        # Route to strategy
        if request.strategy == "sma_crossover":
            trades = self._strategy_sma_crossover(df, request)
        else:
            logger.warning(f"Unknown strategy: {request.strategy}, using SMA crossover")
            trades = self._strategy_sma_crossover(df, request)
        
        # Convert Trade objects to dicts for analytics
        trade_dicts = [
            {
                'entry_time': t.entry_time,
                'exit_time': t.exit_time,
                'entry_price': t.entry_price,
                'exit_price': t.exit_price,
                'pnl': t.pnl,
                'pnl_percent': t.pnl_percent,
                'type': t.type.value,
                'status': t.status.value
            }
            for t in trades
        ]
        
        # Calculate analytics
        analyzer = PerformanceAnalyzer(initial_capital=request.initial_capital)
        analytics = analyzer.calculate_all_metrics(trade_dicts, data)
        
        # Build result
        result = self._build_result(request, trades, analytics)
        
        logger.info(f"Backtest complete: {result.metrics.total_trades} trades, {result.metrics.win_rate:.1f}% win rate")
        
        return result
    
    def _strategy_sma_crossover(
        self,
        df: pd.DataFrame,
        request: BacktestRequest
    ) -> list[Trade]:
        """
        Simple Moving Average Crossover Strategy.
        
        - BUY when fast SMA crosses above slow SMA
        - SELL when fast SMA crosses below slow SMA
        """
        # Calculate SMAs
        df['sma_fast'] = df['close'].rolling(window=request.sma_fast).mean()
        df['sma_slow'] = df['close'].rolling(window=request.sma_slow).mean()
        
        # Generate signals
        df['signal'] = 0
        df.loc[df['sma_fast'] > df['sma_slow'], 'signal'] = 1   # Bullish
        df.loc[df['sma_fast'] < df['sma_slow'], 'signal'] = -1  # Bearish
        
        # Detect crossovers (signal change)
        df['crossover'] = df['signal'].diff()
        
        # Remove NaN rows
        df = df.dropna()
        
        trades: list[Trade] = []
        position: Optional[dict] = None
        
        for idx, row in df.iterrows():
            timestamp = int(idx.timestamp())
            
            # Entry signal (crossover from bearish to bullish)
            if row['crossover'] == 2 and position is None:
                position = {
                    'entry_time': timestamp,
                    'entry_price': row['close'],
                    'type': TradeType.LONG
                }
                
            # Exit signal (crossover from bullish to bearish)
            elif row['crossover'] == -2 and position is not None:
                exit_price = row['close']
                entry_price = position['entry_price']
                
                # Calculate PnL
                if position['type'] == TradeType.LONG:
                    pnl = exit_price - entry_price
                    pnl_percent = (pnl / entry_price) * 100
                else:
                    pnl = entry_price - exit_price
                    pnl_percent = (pnl / entry_price) * 100
                
                # Determine status
                if pnl > 0:
                    status = TradeStatus.WIN
                elif pnl < 0:
                    status = TradeStatus.LOSS
                else:
                    status = TradeStatus.BREAKEVEN
                
                trade = Trade(
                    entry_time=position['entry_time'],
                    exit_time=timestamp,
                    entry_price=entry_price,
                    exit_price=exit_price,
                    pnl=round(pnl, 4),
                    pnl_percent=round(pnl_percent, 4),
                    type=position['type'],
                    status=status
                )
                trades.append(trade)
                position = None
        
        return trades
    
    def _build_result(
        self,
        request: BacktestRequest,
        trades: list[Trade],
        analytics: dict
    ) -> BacktestResult:
        """
        Build the final BacktestResult with all data.
        """
        metrics_data = analytics['metrics']
        
        # Create PerformanceMetrics
        metrics = PerformanceMetrics(
            sharpe_ratio=metrics_data['sharpe_ratio'],
            sortino_ratio=metrics_data['sortino_ratio'],
            max_drawdown=metrics_data['max_drawdown'],
            max_drawdown_pct=metrics_data['max_drawdown_pct'],
            win_rate=metrics_data['win_rate'],
            profit_factor=metrics_data['profit_factor'],
            total_return=metrics_data['total_return'],
            total_return_pct=metrics_data['total_return_pct'],
            total_trades=metrics_data['total_trades'],
            winning_trades=metrics_data['winning_trades'],
            losing_trades=metrics_data['losing_trades'],
            gross_profit=metrics_data['gross_profit'],
            gross_loss=metrics_data['gross_loss'],
            avg_win=metrics_data['avg_win'],
            avg_loss=metrics_data['avg_loss'],
            final_equity=metrics_data['final_equity']
        )
        
        # Convert equity curve
        equity_curve = [
            EquityPoint(time=int(p['time']), equity=p['equity'])
            for p in analytics['equity_curve']
        ]
        
        # Convert drawdown series
        drawdown_series = [
            DrawdownPoint(time=int(p['time']), drawdown_pct=p['drawdown_pct'])
            for p in analytics['drawdown_series']
        ]
        
        return BacktestResult(
            symbol=request.symbol,
            timeframe=request.timeframe,
            strategy_name=request.strategy,
            initial_capital=request.initial_capital,
            metrics=metrics,
            equity_curve=equity_curve,
            drawdown_series=drawdown_series,
            trades=trades
        )
    
    def _empty_result(self, request: BacktestRequest) -> BacktestResult:
        """Return empty result when no trades are generated."""
        metrics = PerformanceMetrics(
            sharpe_ratio=0.0,
            sortino_ratio=0.0,
            max_drawdown=0.0,
            max_drawdown_pct=0.0,
            win_rate=0.0,
            profit_factor=0.0,
            total_return=0.0,
            total_return_pct=0.0,
            total_trades=0,
            winning_trades=0,
            losing_trades=0,
            gross_profit=0.0,
            gross_loss=0.0,
            avg_win=0.0,
            avg_loss=0.0,
            final_equity=request.initial_capital
        )
        
        return BacktestResult(
            symbol=request.symbol,
            timeframe=request.timeframe,
            strategy_name=request.strategy,
            initial_capital=request.initial_capital,
            metrics=metrics,
            equity_curve=[],
            drawdown_series=[],
            trades=[]
        )


# ============================================================
# ❌ FORBIDDEN PATTERNS - DO NOT USE
# ============================================================
# import random
# fake_trades = [random.uniform(-100, 100) for _ in range(50)]  # NEVER
#
# np.random.seed(42)
# mock_data = np.random.randn(100)  # NEVER
# ============================================================
