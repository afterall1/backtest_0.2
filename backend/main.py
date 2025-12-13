"""
Trader Backtest App - FastAPI Backend
=====================================
Zero-latency, 100% Real Data Backtesting Engine

⚠️ CRITICAL: NO MOCK DATA ALLOWED
All data must come from real Binance API via CCXT.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from data_service import DataService

app = FastAPI(
    title="Trader Backtest API",
    description="Real-data backtesting engine powered by Chaos AI",
    version="0.2.0"
)

# CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
data_service = DataService()


@app.get("/")
async def root():
    return {"status": "online", "engine": "Trader Backtest v0.2"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "data_source": "binance", "mock_data": False}


@app.get("/api/ohlcv/{symbol}")
async def get_ohlcv(
    symbol: str,
    timeframe: str = "1h",
    limit: int = 100
):
    """
    Fetch real OHLCV data from Binance.
    
    Args:
        symbol: Trading pair (e.g., "BTC/USDT")
        timeframe: Candle timeframe (e.g., "1m", "5m", "1h", "1d")
        limit: Number of candles to fetch (max 1000)
    """
    data = await data_service.fetch_ohlcv(symbol, timeframe, limit)
    return {"symbol": symbol, "timeframe": timeframe, "data": data}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
