"""
Pydantic Models - Type Safety for Backtest Engine
==================================================
Strict data models enforcing structure throughout the pipeline.
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class TradeType(str, Enum):
    """Trade direction type."""
    LONG = "long"
    SHORT = "short"


class TradeStatus(str, Enum):
    """Trade outcome status."""
    WIN = "win"
    LOSS = "loss"
    BREAKEVEN = "breakeven"


class Candle(BaseModel):
    """
    OHLCV candlestick data model.
    Optimized for lightweight-charts compatibility.
    """
    time: int = Field(..., description="Unix timestamp in seconds")
    open: float = Field(..., ge=0, description="Opening price")
    high: float = Field(..., ge=0, description="Highest price")
    low: float = Field(..., ge=0, description="Lowest price")
    close: float = Field(..., ge=0, description="Closing price")
    volume: float = Field(..., ge=0, description="Trading volume")


class Trade(BaseModel):
    """
    Individual trade record from backtest simulation.
    """
    entry_time: int = Field(..., description="Entry Unix timestamp (seconds)")
    exit_time: int = Field(..., description="Exit Unix timestamp (seconds)")
    entry_price: float = Field(..., ge=0, description="Entry price")
    exit_price: float = Field(..., ge=0, description="Exit price")
    pnl: float = Field(..., description="Profit/Loss amount")
    pnl_percent: float = Field(..., description="Profit/Loss percentage")
    type: TradeType = Field(..., description="Trade direction (long/short)")
    status: TradeStatus = Field(..., description="Trade outcome (win/loss)")


class EquityPoint(BaseModel):
    """Single point on equity curve for charting."""
    time: int = Field(..., description="Unix timestamp in seconds")
    equity: float = Field(..., description="Account balance at this time")


class DrawdownPoint(BaseModel):
    """Single point on drawdown curve."""
    time: int = Field(..., description="Unix timestamp in seconds")
    drawdown_pct: float = Field(..., description="Drawdown percentage")


class PerformanceMetrics(BaseModel):
    """
    Professional trading performance metrics.
    
    Annualized using 365 days (crypto standard).
    """
    # Risk-adjusted returns
    sharpe_ratio: float = Field(..., description="Sharpe Ratio (annualized, 365 days)")
    sortino_ratio: float = Field(..., description="Sortino Ratio (annualized)")
    
    # Drawdown
    max_drawdown: float = Field(..., description="Maximum drawdown (absolute)")
    max_drawdown_pct: float = Field(..., description="Maximum drawdown (%)")
    
    # Trade statistics
    win_rate: float = Field(..., description="Win rate percentage")
    profit_factor: float = Field(..., description="Gross Profit / |Gross Loss|")
    
    # Returns
    total_return: float = Field(..., description="Net profit/loss")
    total_return_pct: float = Field(..., description="Total return percentage")
    
    # Trade counts
    total_trades: int = Field(..., ge=0, description="Total number of trades")
    winning_trades: int = Field(..., ge=0, description="Number of winning trades")
    losing_trades: int = Field(..., ge=0, description="Number of losing trades")
    
    # Profit/Loss
    gross_profit: float = Field(..., description="Total profit from wins")
    gross_loss: float = Field(..., description="Total loss from losses")
    
    # Average trade
    avg_win: float = Field(..., description="Average winning trade")
    avg_loss: float = Field(..., description="Average losing trade")
    
    # Final equity
    final_equity: float = Field(..., description="Final account balance")


class BacktestResult(BaseModel):
    """
    Complete backtest simulation results with analytics.
    """
    # Identifiers
    symbol: str = Field(..., description="Trading pair")
    timeframe: str = Field(..., description="Candle timeframe")
    strategy_name: str = Field(..., description="Strategy identifier")
    initial_capital: float = Field(default=10000.0, description="Starting capital")
    
    # Performance Metrics
    metrics: PerformanceMetrics = Field(..., description="All performance metrics")
    
    # Time series for charting
    equity_curve: list[EquityPoint] = Field(
        default_factory=list, 
        description="Equity curve for charting"
    )
    drawdown_series: list[DrawdownPoint] = Field(
        default_factory=list,
        description="Drawdown percentage over time"
    )
    
    # Trade Details
    trades: list[Trade] = Field(default_factory=list, description="List of all trades")


class BacktestRequest(BaseModel):
    """
    Request model for backtest endpoint.
    """
    symbol: str = Field(..., description="Trading pair (e.g., BTC/USDT)")
    timeframe: str = Field(default="1h", description="Candle timeframe")
    limit: int = Field(default=500, ge=50, le=1000, description="Number of candles")
    initial_capital: float = Field(default=10000.0, ge=100, description="Starting capital")
    
    # Strategy Parameters
    strategy: str = Field(default="sma_crossover", description="Strategy name")
    sma_fast: int = Field(default=10, ge=2, le=50, description="Fast SMA period")
    sma_slow: int = Field(default=30, ge=10, le=200, description="Slow SMA period")
    
    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "BTC/USDT",
                "timeframe": "1h",
                "limit": 500,
                "initial_capital": 10000,
                "strategy": "sma_crossover",
                "sma_fast": 10,
                "sma_slow": 30
            }
        }
