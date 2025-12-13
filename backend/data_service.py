"""
Data Service - Real Market Data Only
=====================================
⚠️ CRITICAL POLICY: NO MOCK DATA GENERATORS

This module fetches REAL market data from Binance via CCXT.
Using random number generators for price data is STRICTLY FORBIDDEN.

Rules enforced:
1. All data comes from ccxt.binance()
2. No random.uniform(), numpy.random, or faker for prices
3. If Binance is unavailable, return error - NOT fake data
"""
import ccxt
import asyncio
from typing import Optional
from datetime import datetime


class DataService:
    """
    Real market data service using CCXT.
    
    This class provides access to historical OHLCV data from Binance.
    Mock data is explicitly forbidden by project policy.
    """
    
    def __init__(self):
        """Initialize the Binance exchange connection."""
        self.exchange = ccxt.binance({
            'enableRateLimit': True,
            'options': {
                'defaultType': 'spot'
            }
        })
        
    async def fetch_ohlcv(
        self,
        symbol: str,
        timeframe: str = "1h",
        limit: int = 100,
        since: Optional[int] = None
    ) -> list:
        """
        Fetch REAL OHLCV (candlestick) data from Binance.
        
        Args:
            symbol: Trading pair (e.g., "BTC/USDT", "ETH/USDT")
            timeframe: Candle timeframe ("1m", "5m", "15m", "1h", "4h", "1d")
            limit: Number of candles to fetch (max 1000)
            since: Start timestamp in milliseconds (optional)
            
        Returns:
            List of OHLCV candles: [[timestamp, open, high, low, close, volume], ...]
            
        Raises:
            Exception: If Binance API is unavailable (NO fallback to mock data)
        """
        # Run in executor to avoid blocking
        loop = asyncio.get_event_loop()
        ohlcv = await loop.run_in_executor(
            None,
            lambda: self.exchange.fetch_ohlcv(symbol, timeframe, since, limit)
        )
        
        # Transform to structured format
        return [
            {
                "timestamp": candle[0],
                "datetime": datetime.utcfromtimestamp(candle[0] / 1000).isoformat(),
                "open": candle[1],
                "high": candle[2],
                "low": candle[3],
                "close": candle[4],
                "volume": candle[5]
            }
            for candle in ohlcv
        ]
    
    async def get_available_symbols(self) -> list:
        """Get list of available trading pairs from Binance."""
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self.exchange.load_markets)
        return list(self.exchange.symbols)
    
    async def get_ticker(self, symbol: str) -> dict:
        """Get current ticker data for a symbol."""
        loop = asyncio.get_event_loop()
        ticker = await loop.run_in_executor(
            None,
            lambda: self.exchange.fetch_ticker(symbol)
        )
        return {
            "symbol": ticker["symbol"],
            "last": ticker["last"],
            "bid": ticker["bid"],
            "ask": ticker["ask"],
            "high": ticker["high"],
            "low": ticker["low"],
            "volume": ticker["baseVolume"],
            "timestamp": ticker["timestamp"]
        }


# ============================================================
# ❌ FORBIDDEN PATTERNS - DO NOT USE
# ============================================================
# import random
# price = random.uniform(100, 200)  # NEVER
#
# import numpy as np
# prices = np.random.randn(100)  # NEVER
#
# from faker import Faker
# fake_price = faker.pyfloat()  # NEVER
# ============================================================
