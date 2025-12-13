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
from models import BacktestRequest, BacktestResult
from engine import Backtester

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize services (singletons)
data_service = DataService()
backtester = Backtester()


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


# ============================================================
# HEALTH ENDPOINTS
# ============================================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "engine": "Trader Backtest v0.2",
        "phase": "Phase 2 - Core Engine Active",
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
        "async_mode": True,
        "engine_ready": True
    }


# ============================================================
# DATA ENDPOINTS
# ============================================================

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


# ============================================================
# BACKTEST ENDPOINT
# ============================================================

@app.post("/api/backtest", response_model=BacktestResult)
async def run_backtest(request: BacktestRequest):
    """
    Execute a backtest simulation on real market data.
    
    This endpoint:
    1. Fetches REAL historical data from Binance
    2. Runs the specified strategy through the backtest engine
    3. Returns comprehensive performance metrics
    
    NO MOCK DATA - All calculations use real market data.
    """
    # Normalize symbol
    symbol = request.symbol
    if "/" not in symbol:
        symbol = f"{symbol[:-4]}/{symbol[-4:]}" if symbol.endswith("USDT") else symbol
    
    logger.info(f"🧪 Backtest request: {symbol} | {request.timeframe} | {request.strategy}")
    
    try:
        # Step 1: Fetch REAL market data
        data = await data_service.fetch_ohlcv(
            symbol=symbol,
            timeframe=request.timeframe,
            limit=request.limit
        )
        
        if not data:
            raise HTTPException(
                status_code=404,
                detail=f"No data available for {symbol}"
            )
        
        logger.info(f"📊 Fetched {len(data)} candles for backtest")
        
        # Step 2: Update request with normalized symbol
        request_copy = BacktestRequest(
            symbol=symbol,
            timeframe=request.timeframe,
            limit=request.limit,
            initial_capital=request.initial_capital,
            strategy=request.strategy,
            sma_fast=request.sma_fast,
            sma_slow=request.sma_slow
        )
        
        # Step 3: Run backtest engine
        result = backtester.run(data=data, request=request_copy)
        
        logger.info(f"✅ Backtest complete: {result.metrics.total_trades} trades")
        
        return result
        
    except ccxt.NetworkError as e:
        logger.error(f"Network error during backtest: {e}")
        raise HTTPException(
            status_code=503,
            detail="Unable to fetch market data. Please try again."
        )
    except ccxt.ExchangeError as e:
        logger.error(f"Exchange error during backtest: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid symbol or request: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Backtest engine error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Backtest engine error: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
