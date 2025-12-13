"""
Trader Backtest App - FastAPI Backend
=====================================
Zero-latency, 100% Real Data Backtesting Engine

⚠️ CRITICAL: NO MOCK DATA ALLOWED
All data must come from real Binance API via CCXT.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import ccxt.async_support as ccxt
import logging

from data_service import DataService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize data service (singleton)
data_service = DataService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - startup and shutdown."""
    # Startup
    logger.info("🚀 Starting Trader Backtest API...")
    await data_service.initialize()
    logger.info("✅ DataService connected to Binance")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down...")
    await data_service.close()
    logger.info("✅ Connections closed gracefully")


app = FastAPI(
    title="Trader Backtest API",
    description="Real-data backtesting engine powered by Chaos AI. NO MOCK DATA.",
    version="0.2.0",
    lifespan=lifespan
)

# CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "engine": "Trader Backtest v0.2",
        "data_source": "binance",
        "mock_data": False
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check with connection status."""
    return {
        "status": "healthy",
        "data_source": "binance",
        "mock_data": False,
        "async_mode": True
    }


@app.get("/api/symbols")
async def get_symbols():
    """
    Get all tradable USDT pairs from Binance.
    
    Returns:
        List of trading pair symbols for frontend dropdown.
    """
    try:
        symbols = await data_service.get_usdt_symbols()
        return {
            "count": len(symbols),
            "symbols": symbols
        }
    except ccxt.NetworkError as e:
        logger.error(f"Network error: {e}")
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to Binance. Please try again."
        )
    except ccxt.ExchangeError as e:
        logger.error(f"Exchange error: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"Binance API error: {str(e)}"
        )


@app.get("/api/ohlcv/{symbol}")
async def get_ohlcv(
    symbol: str,
    timeframe: str = "1h",
    limit: int = 100
):
    """
    Fetch REAL OHLCV data from Binance.
    
    Args:
        symbol: Trading pair (e.g., "BTCUSDT" or "BTC/USDT")
        timeframe: Candle timeframe (e.g., "1m", "5m", "1h", "1d")
        limit: Number of candles to fetch (max 1000)
        
    Returns:
        OHLCV data formatted for lightweight-charts:
        { symbol, timeframe, count, data: [{ time, open, high, low, close, volume }] }
    """
    # Normalize symbol format (BTCUSDT → BTC/USDT)
    if "/" not in symbol:
        symbol = f"{symbol[:-4]}/{symbol[-4:]}" if symbol.endswith("USDT") else symbol
    
    # Validate limit
    if limit < 1 or limit > 1000:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 1000"
        )
    
    try:
        data = await data_service.fetch_ohlcv(symbol, timeframe, limit)
        
        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "count": len(data),
            "data": data
        }
        
    except ccxt.NetworkError as e:
        logger.error(f"Network error for {symbol}: {e}")
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to Binance. Please try again."
        )
    except ccxt.RateLimitExceeded as e:
        logger.error(f"Rate limit for {symbol}: {e}")
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please slow down requests."
        )
    except ccxt.ExchangeError as e:
        logger.error(f"Exchange error for {symbol}: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid request: {str(e)}"
        )


@app.get("/api/ticker/{symbol}")
async def get_ticker(symbol: str):
    """
    Get current ticker data for a symbol.
    
    Args:
        symbol: Trading pair (e.g., "BTC/USDT")
    """
    # Normalize symbol format
    if "/" not in symbol:
        symbol = f"{symbol[:-4]}/{symbol[-4:]}" if symbol.endswith("USDT") else symbol
    
    try:
        ticker = await data_service.get_ticker(symbol)
        return ticker
        
    except ccxt.NetworkError as e:
        logger.error(f"Network error for ticker {symbol}: {e}")
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to Binance."
        )
    except ccxt.ExchangeError as e:
        logger.error(f"Exchange error for ticker {symbol}: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid symbol: {symbol}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
