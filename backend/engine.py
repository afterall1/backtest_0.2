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
    Candle, Trade, BacktestResult,
    TradeType, TradeStatus, BacktestRequest
)

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
        self.capital = initial_capital
        
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
            BacktestResult with all metrics and trade list
        """
        if not data or len(data) < request.sma_slow + 10:
            logger.warning("Insufficient data for backtest")
            return self._empty_result(request)
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        df['time'] = pd.to_datetime(df['time'], unit='s')
        df.set_index('time', inplace=True)
        
        logger.info(f"Running backtest: {request.symbol} | {request.strategy} | {len(df)} candles")
        
        # Route to strategy
        if request.strategy == "sma_crossover":
            trades = self._strategy_sma_crossover(df, request)
        else:
            logger.warning(f"Unknown strategy: {request.strategy}, using SMA crossover")
            trades = self._strategy_sma_crossover(df, request)
        
        # Calculate metrics
        result = self._calculate_metrics(trades, request)
        
        logger.info(f"Backtest complete: {result.total_trades} trades, {result.win_rate:.1f}% win rate")
        
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
    
    def _calculate_metrics(
        self,
        trades: list[Trade],
        request: BacktestRequest
    ) -> BacktestResult:
        """
        Calculate all backtest metrics from trade list.
        """
        if not trades:
            return self._empty_result(request)
        
        # Convert trades to arrays for vectorized calculations
        pnls = np.array([t.pnl for t in trades])
        pnl_percents = np.array([t.pnl_percent for t in trades])
        
        # Basic counts
        total_trades = len(trades)
        winning_trades = sum(1 for t in trades if t.status == TradeStatus.WIN)
        losing_trades = sum(1 for t in trades if t.status == TradeStatus.LOSS)
        
        # Win rate
        win_rate = (winning_trades / total_trades) * 100 if total_trades > 0 else 0
        
        # Profit calculations
        gross_profit = float(np.sum(pnls[pnls > 0])) if np.any(pnls > 0) else 0.0
        gross_loss = float(np.sum(pnls[pnls < 0])) if np.any(pnls < 0) else 0.0
        net_profit = float(np.sum(pnls))
        net_profit_percent = float(np.sum(pnl_percents))
        
        # Profit factor
        profit_factor = abs(gross_profit / gross_loss) if gross_loss != 0 else float('inf')
        if profit_factor == float('inf'):
            profit_factor = gross_profit if gross_profit > 0 else 0.0
        
        # Maximum Drawdown calculation
        cumulative = np.cumsum(pnls)
        running_max = np.maximum.accumulate(cumulative)
        drawdowns = cumulative - running_max
        max_drawdown = float(np.min(drawdowns)) if len(drawdowns) > 0 else 0.0
        
        # Drawdown percentage (relative to initial capital)
        max_drawdown_percent = (max_drawdown / request.initial_capital) * 100
        
        return BacktestResult(
            symbol=request.symbol,
            timeframe=request.timeframe,
            strategy_name=request.strategy,
            total_trades=total_trades,
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            win_rate=round(win_rate, 2),
            net_profit=round(net_profit, 2),
            net_profit_percent=round(net_profit_percent, 2),
            gross_profit=round(gross_profit, 2),
            gross_loss=round(gross_loss, 2),
            max_drawdown=round(max_drawdown, 2),
            max_drawdown_percent=round(max_drawdown_percent, 2),
            profit_factor=round(profit_factor, 2),
            trades=trades
        )
    
    def _empty_result(self, request: BacktestRequest) -> BacktestResult:
        """Return empty result when no trades are generated."""
        return BacktestResult(
            symbol=request.symbol,
            timeframe=request.timeframe,
            strategy_name=request.strategy,
            total_trades=0,
            winning_trades=0,
            losing_trades=0,
            win_rate=0.0,
            net_profit=0.0,
            net_profit_percent=0.0,
            gross_profit=0.0,
            gross_loss=0.0,
            max_drawdown=0.0,
            max_drawdown_percent=0.0,
            profit_factor=0.0,
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
