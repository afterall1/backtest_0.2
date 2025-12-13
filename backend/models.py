"""
Pydantic Models - Type Safety for Backtest Engine
==================================================
Strict data models enforcing structure throughout the pipeline.
"""
from pydantic import BaseModel, Field
from typing import Literal
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
    
    class Config:
        json_schema_extra = {
            "example": {
                "time": 1702500000,
                "open": 42150.50,
                "high": 42300.00,
                "low": 42100.00,
                "close": 42250.75,
                "volume": 1234.56
            }
        }


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
    
    class Config:
        json_schema_extra = {
            "example": {
                "entry_time": 1702500000,
                "exit_time": 1702503600,
                "entry_price": 42150.50,
                "exit_price": 42350.00,
                "pnl": 199.50,
                "pnl_percent": 0.47,
                "type": "long",
                "status": "win"
            }
        }


class BacktestResult(BaseModel):
    """
    Complete backtest simulation results.
    """
    symbol: str = Field(..., description="Trading pair")
    timeframe: str = Field(..., description="Candle timeframe")
    strategy_name: str = Field(..., description="Strategy identifier")
    
    # Performance Metrics
    total_trades: int = Field(..., ge=0, description="Total number of trades")
    winning_trades: int = Field(..., ge=0, description="Number of winning trades")
    losing_trades: int = Field(..., ge=0, description="Number of losing trades")
    win_rate: float = Field(..., ge=0, le=100, description="Win rate percentage")
    
    # Financial Metrics
    net_profit: float = Field(..., description="Net profit/loss")
    net_profit_percent: float = Field(..., description="Net profit percentage")
    gross_profit: float = Field(..., ge=0, description="Total profit from wins")
    gross_loss: float = Field(..., le=0, description="Total loss from losses")
    
    # Risk Metrics
    max_drawdown: float = Field(..., le=0, description="Maximum drawdown")
    max_drawdown_percent: float = Field(..., le=0, description="Maximum drawdown %")
    profit_factor: float = Field(..., ge=0, description="Gross profit / Gross loss")
    
    # Trade Details
    trades: list[Trade] = Field(default_factory=list, description="List of all trades")
    
    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "BTC/USDT",
                "timeframe": "1h",
                "strategy_name": "SMA Crossover",
                "total_trades": 25,
                "winning_trades": 15,
                "losing_trades": 10,
                "win_rate": 60.0,
                "net_profit": 1250.50,
                "net_profit_percent": 12.5,
                "gross_profit": 2100.00,
                "gross_loss": -849.50,
                "max_drawdown": -450.00,
                "max_drawdown_percent": -4.5,
                "profit_factor": 2.47,
                "trades": []
            }
        }


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
