"""
Performance Analytics - Quantitative Risk Metrics
===================================================
Professional trading metrics using Pandas/NumPy vectorization.

Standards:
- Crypto markets: 365 days for annualization (24/7 trading)
- No for-loops: Pure vector operations for performance
- Graceful handling of edge cases (division by zero, NaN)
"""
import pandas as pd
import numpy as np
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Crypto annualization factor (365 days, 24/7 market)
TRADING_DAYS_CRYPTO = 365


class PerformanceAnalyzer:
    """
    High-performance analytics engine for backtest results.
    
    Calculates professional trading metrics using vectorized operations.
    All calculations use REAL trade data - no mocks.
    """
    
    def __init__(self, initial_capital: float = 10000.0):
        """
        Initialize the performance analyzer.
        
        Args:
            initial_capital: Starting account balance
        """
        self.initial_capital = initial_capital
        
    def calculate_equity_curve(
        self,
        trades: list[dict],
        candles: list[dict]
    ) -> pd.DataFrame:
        """
        Generate time-series equity curve from trades.
        
        Args:
            trades: List of trade dictionaries with pnl
            candles: Original OHLCV data for time reference
            
        Returns:
            DataFrame with columns: [time, equity, returns]
        """
        if not trades:
            # Return flat equity curve if no trades
            df = pd.DataFrame(candles)
            df['equity'] = self.initial_capital
            df['returns'] = 0.0
            return df[['time', 'equity', 'returns']]
        
        # Create base DataFrame from candles
        df = pd.DataFrame(candles)
        df['equity'] = self.initial_capital
        df['pnl'] = 0.0
        
        # Map trades to timestamps
        for trade in trades:
            exit_time = trade.get('exit_time')
            pnl = trade.get('pnl', 0)
            
            # Find the candle at exit time and add PnL
            mask = df['time'] == exit_time
            if mask.any():
                df.loc[mask, 'pnl'] = df.loc[mask, 'pnl'] + pnl
        
        # Calculate cumulative equity
        df['cumulative_pnl'] = df['pnl'].cumsum()
        df['equity'] = self.initial_capital + df['cumulative_pnl']
        
        # Calculate returns (percentage change)
        df['returns'] = df['equity'].pct_change().fillna(0)
        
        return df[['time', 'equity', 'returns', 'pnl']]
    
    def calculate_drawdown_series(self, equity_curve: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate drawdown at each timestep.
        
        Args:
            equity_curve: DataFrame with 'equity' column
            
        Returns:
            DataFrame with columns: [time, drawdown, drawdown_pct]
        """
        equity = equity_curve['equity']
        
        # Running maximum (high water mark)
        running_max = equity.cummax()
        
        # Drawdown (absolute)
        drawdown = equity - running_max
        
        # Drawdown percentage
        drawdown_pct = (drawdown / running_max) * 100
        drawdown_pct = drawdown_pct.replace([np.inf, -np.inf], 0).fillna(0)
        
        result = pd.DataFrame({
            'time': equity_curve['time'],
            'drawdown': drawdown,
            'drawdown_pct': drawdown_pct
        })
        
        return result
    
    def calculate_sharpe_ratio(
        self,
        returns: pd.Series,
        risk_free_rate: float = 0.0
    ) -> float:
        """
        Calculate annualized Sharpe Ratio.
        
        Formula: (Mean Return - Risk Free) / Std Dev * sqrt(365)
        
        Args:
            returns: Series of daily returns
            risk_free_rate: Annual risk-free rate (default 0 for crypto)
            
        Returns:
            Sharpe Ratio (annualized)
        """
        if returns.empty or returns.std() == 0:
            return 0.0
        
        # Daily risk-free rate
        daily_rf = risk_free_rate / TRADING_DAYS_CRYPTO
        
        # Excess returns
        excess_returns = returns - daily_rf
        
        # Sharpe Ratio
        mean_return = excess_returns.mean()
        std_return = excess_returns.std()
        
        if std_return == 0 or np.isnan(std_return):
            return 0.0
        
        sharpe = (mean_return / std_return) * np.sqrt(TRADING_DAYS_CRYPTO)
        
        return float(np.nan_to_num(sharpe, nan=0.0))
    
    def calculate_sortino_ratio(
        self,
        returns: pd.Series,
        risk_free_rate: float = 0.0
    ) -> float:
        """
        Calculate annualized Sortino Ratio.
        
        Formula: (Mean Return - Risk Free) / Downside Std Dev * sqrt(365)
        
        Uses only negative returns for downside deviation.
        
        Args:
            returns: Series of daily returns
            risk_free_rate: Annual risk-free rate
            
        Returns:
            Sortino Ratio (annualized)
        """
        if returns.empty:
            return 0.0
        
        # Daily risk-free rate
        daily_rf = risk_free_rate / TRADING_DAYS_CRYPTO
        
        # Excess returns
        excess_returns = returns - daily_rf
        
        # Downside returns only (negative)
        downside_returns = excess_returns[excess_returns < 0]
        
        if downside_returns.empty:
            # No downside = infinite Sortino (cap it)
            return 10.0 if excess_returns.mean() > 0 else 0.0
        
        # Downside deviation
        downside_std = np.sqrt((downside_returns ** 2).mean())
        
        if downside_std == 0 or np.isnan(downside_std):
            return 0.0
        
        # Sortino Ratio
        mean_return = excess_returns.mean()
        sortino = (mean_return / downside_std) * np.sqrt(TRADING_DAYS_CRYPTO)
        
        return float(np.nan_to_num(sortino, nan=0.0))
    
    def calculate_max_drawdown(self, equity_curve: pd.DataFrame) -> tuple[float, float]:
        """
        Calculate maximum drawdown.
        
        Args:
            equity_curve: DataFrame with 'equity' column
            
        Returns:
            Tuple of (max_drawdown_absolute, max_drawdown_percent)
        """
        equity = equity_curve['equity']
        
        # Running maximum
        running_max = equity.cummax()
        
        # Drawdown
        drawdown = equity - running_max
        drawdown_pct = (drawdown / running_max) * 100
        
        # Replace infinities
        drawdown_pct = drawdown_pct.replace([np.inf, -np.inf], 0).fillna(0)
        
        max_dd = float(drawdown.min())
        max_dd_pct = float(drawdown_pct.min())
        
        return max_dd, max_dd_pct
    
    def calculate_profit_factor(self, trades: list[dict]) -> float:
        """
        Calculate Profit Factor.
        
        Formula: Gross Profit / |Gross Loss|
        
        Args:
            trades: List of trade dictionaries with pnl
            
        Returns:
            Profit Factor (>1 is profitable)
        """
        if not trades:
            return 0.0
        
        pnls = np.array([t.get('pnl', 0) for t in trades])
        
        gross_profit = float(np.sum(pnls[pnls > 0]))
        gross_loss = float(np.sum(pnls[pnls < 0]))
        
        if gross_loss == 0:
            return gross_profit if gross_profit > 0 else 0.0
        
        return abs(gross_profit / gross_loss)
    
    def calculate_win_rate(self, trades: list[dict]) -> float:
        """
        Calculate Win Rate percentage.
        
        Args:
            trades: List of trade dictionaries with pnl
            
        Returns:
            Win rate as percentage (0-100)
        """
        if not trades:
            return 0.0
        
        wins = sum(1 for t in trades if t.get('pnl', 0) > 0)
        return (wins / len(trades)) * 100
    
    def calculate_all_metrics(
        self,
        trades: list[dict],
        candles: list[dict]
    ) -> dict:
        """
        Calculate all performance metrics.
        
        Args:
            trades: List of trade dictionaries
            candles: Original OHLCV candle data
            
        Returns:
            Dictionary containing all metrics
        """
        # Generate equity curve
        equity_curve = self.calculate_equity_curve(trades, candles)
        
        # Get returns series
        returns = equity_curve['returns']
        
        # Calculate drawdown series
        drawdown_series = self.calculate_drawdown_series(equity_curve)
        
        # Max drawdown
        max_dd, max_dd_pct = self.calculate_max_drawdown(equity_curve)
        
        # PnL arrays
        pnls = np.array([t.get('pnl', 0) for t in trades]) if trades else np.array([])
        
        # Calculate all metrics
        metrics = {
            # Risk-adjusted returns
            'sharpe_ratio': round(self.calculate_sharpe_ratio(returns), 4),
            'sortino_ratio': round(self.calculate_sortino_ratio(returns), 4),
            
            # Drawdown
            'max_drawdown': round(max_dd, 2),
            'max_drawdown_pct': round(max_dd_pct, 2),
            
            # Trade statistics
            'win_rate': round(self.calculate_win_rate(trades), 2),
            'profit_factor': round(self.calculate_profit_factor(trades), 2),
            
            # Returns
            'total_return': round(float(pnls.sum()) if len(pnls) > 0 else 0.0, 2),
            'total_return_pct': round(
                (float(pnls.sum()) / self.initial_capital) * 100 if len(pnls) > 0 else 0.0, 2
            ),
            
            # Trade counts
            'total_trades': len(trades),
            'winning_trades': sum(1 for t in trades if t.get('pnl', 0) > 0),
            'losing_trades': sum(1 for t in trades if t.get('pnl', 0) < 0),
            
            # Profit/Loss
            'gross_profit': round(float(np.sum(pnls[pnls > 0])) if np.any(pnls > 0) else 0.0, 2),
            'gross_loss': round(float(np.sum(pnls[pnls < 0])) if np.any(pnls < 0) else 0.0, 2),
            
            # Average trade
            'avg_win': round(float(np.mean(pnls[pnls > 0])) if np.any(pnls > 0) else 0.0, 2),
            'avg_loss': round(float(np.mean(pnls[pnls < 0])) if np.any(pnls < 0) else 0.0, 2),
            
            # Final equity
            'final_equity': round(float(equity_curve['equity'].iloc[-1]), 2) if not equity_curve.empty else self.initial_capital,
        }
        
        # Equity curve for charting (list of dicts)
        equity_curve_list = equity_curve[['time', 'equity']].to_dict('records')
        
        return {
            'metrics': metrics,
            'equity_curve': equity_curve_list,
            'drawdown_series': drawdown_series[['time', 'drawdown_pct']].to_dict('records')
        }


# ============================================================
# ❌ FORBIDDEN PATTERNS - DO NOT USE
# ============================================================
# import random
# fake_returns = [random.uniform(-0.1, 0.1) for _ in range(100)]  # NEVER
#
# np.random.seed(42)
# mock_equity = np.random.randn(100)  # NEVER
# ============================================================
