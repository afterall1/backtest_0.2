"""
Data Spine - Production-Grade Market Data Service
==================================================
⚠️ CRITICAL POLICY: NO MOCK DATA GENERATORS

This module fetches REAL market data from Binance via CCXT (async mode).
Using random number generators for price data is STRICTLY FORBIDDEN.

Data Format: Optimized for lightweight-charts frontend
- Timestamps converted from ms → seconds (Unix)
- OHLCV structure: { time, open, high, low, close, volume }
"""
import ccxt.async_support as ccxt
from typing import Optional
import logging

# Configure logging
logger = logging.getLogger(__name__)


class DataService:
    """
    Async Market Data Service using CCXT.
    
    Provides real-time access to Binance market data.
    Mock data is explicitly FORBIDDEN by project policy.
    """
    
    def __init__(self):
        """Initialize the async Binance exchange connection."""
        self.exchange: Optional[ccxt.binance] = None
        self._initialized = False
        
    async def initialize(self) -> None:
        """
        Initialize the async exchange connection.
        Must be called before using any data methods.
        """
        if self._initialized:
            return
            
        self.exchange = ccxt.binance({
            'enableRateLimit': True,
            'options': {
                'defaultType': 'spot',
                'adjustForTimeDifference': True
            }
        })
        self._initialized = True
        logger.info("DataService initialized with Binance (async mode)")
        
    async def close(self) -> None:
        """Close the exchange connection gracefully."""
        if self.exchange:
            await self.exchange.close()
            self._initialized = False
            logger.info("DataService connection closed")
        
    async def fetch_ohlcv(
        self,
        symbol: str,
        timeframe: str = "1h",
        limit: int = 100,
        since: Optional[int] = None
    ) -> list[dict]:
        """
        Fetch REAL OHLCV (candlestick) data from Binance.
        
        Args:
            symbol: Trading pair (e.g., "BTC/USDT", "ETH/USDT")
            timeframe: Candle timeframe ("1m", "5m", "15m", "1h", "4h", "1d")
            limit: Number of candles to fetch (max 1000)
            since: Start timestamp in milliseconds (optional)
            
        Returns:
            List of OHLCV candles formatted for lightweight-charts:
            [{ time: int (unix seconds), open, high, low, close, volume }]
            
        Raises:
            ccxt.NetworkError: If Binance API is unreachable
            ccxt.RateLimitExceeded: If rate limit is hit
            ccxt.ExchangeError: For other exchange-related errors
        """
        if not self._initialized:
            await self.initialize()
            
        try:
            logger.info(f"Fetching OHLCV: {symbol} | {timeframe} | limit={limit}")
            
            ohlcv = await self.exchange.fetch_ohlcv(
                symbol=symbol,
                timeframe=timeframe,
                since=since,
                limit=limit
            )
            
            # Transform to lightweight-charts format
            # CRITICAL: Convert timestamp from ms → seconds
            result = [
                {
                    "time": int(candle[0] / 1000),  # ms → seconds
                    "open": float(candle[1]),
                    "high": float(candle[2]),
                    "low": float(candle[3]),
                    "close": float(candle[4]),
                    "volume": float(candle[5])
                }
                for candle in ohlcv
            ]
            
            logger.info(f"Fetched {len(result)} candles for {symbol}")
            return result
            
        except ccxt.NetworkError as e:
            logger.error(f"Network error fetching {symbol}: {e}")
            raise
        except ccxt.RateLimitExceeded as e:
            logger.error(f"Rate limit exceeded for {symbol}: {e}")
            raise
        except ccxt.ExchangeError as e:
            logger.error(f"Exchange error fetching {symbol}: {e}")
            raise
    
    async def get_usdt_symbols(self) -> list[str]:
        """
        Get all tradable USDT pairs from Binance.
        
        Returns:
            List of symbol strings (e.g., ["BTC/USDT", "ETH/USDT", ...])
            
        Raises:
            ccxt.NetworkError: If Binance API is unreachable
        """
        if not self._initialized:
            await self.initialize()
            
        try:
            logger.info("Fetching available USDT trading pairs")
            
            await self.exchange.load_markets()
            
            # Filter for active USDT spot pairs only
            usdt_symbols = [
                symbol for symbol, market in self.exchange.markets.items()
                if (
                    market.get('quote') == 'USDT' and
                    market.get('active', True) and
                    market.get('spot', False)
                )
            ]
            
            # Sort alphabetically
            usdt_symbols.sort()
            
            logger.info(f"Found {len(usdt_symbols)} USDT trading pairs")
            return usdt_symbols
            
        except ccxt.NetworkError as e:
            logger.error(f"Network error fetching symbols: {e}")
            raise
        except ccxt.ExchangeError as e:
            logger.error(f"Exchange error fetching symbols: {e}")
            raise
    
    async def get_ticker(self, symbol: str) -> dict:
        """
        Get current ticker data for a symbol.
        
        Args:
            symbol: Trading pair (e.g., "BTC/USDT")
            
        Returns:
            Ticker dictionary with last price, bid, ask, etc.
        """
        if not self._initialized:
            await self.initialize()
            
        try:
            ticker = await self.exchange.fetch_ticker(symbol)
            
            return {
                "symbol": ticker["symbol"],
                "last": ticker["last"],
                "bid": ticker["bid"],
                "ask": ticker["ask"],
                "high": ticker["high"],
                "low": ticker["low"],
                "volume": ticker["baseVolume"],
                "timestamp": int(ticker["timestamp"] / 1000)  # ms → seconds
            }
            
        except ccxt.NetworkError as e:
            logger.error(f"Network error fetching ticker {symbol}: {e}")
            raise
        except ccxt.ExchangeError as e:
            logger.error(f"Exchange error fetching ticker {symbol}: {e}")
            raise


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
