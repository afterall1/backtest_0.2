from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging

# Modern Imports
from models import BacktestRequest, BacktestResult
from data_service import DataService
from engine import Backtester
from chaos_bridge import ChaosSynthesizer  # Direct Import

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TraderApp")

app = FastAPI(title="Trader Backtest API v0.2")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
data_service = DataService()
# Chaos AI Instance (Initialized once)
chaos_ai = ChaosSynthesizer() 

@app.get("/api/symbols")
async def get_symbols():
    """Fetch available trading pairs."""
    await data_service.initialize()
    symbols = await data_service.get_usdt_symbols()
    return {"count": len(symbols), "symbols": symbols}

@app.post("/api/backtest", response_model=BacktestResult)
async def run_backtest(request: BacktestRequest):
    """
    Execute Backtest:
    1. Fetch Data (Async)
    2. Synthesize Strategy via Chaos AI (Async)
    3. Run Simulation (CPU-bound)
    """
    try:
        logger.info(f"🚀 Starting backtest for {request.symbol}")
        
        # Initialize data service if needed
        await data_service.initialize()
        
        # 1. Fetch Market Data
        candles = await data_service.fetch_ohlcv(
            request.symbol, 
            request.timeframe, 
            request.limit,
            request.start_date,
            request.end_date
        )
        
        # 2. Chaos AI Synthesis (The Brain)
        # Calling the async synthesize method directly
        strategy_logic = await chaos_ai.synthesize(request)
        
        # 3. Execution Engine (The Muscle)
        engine = Backtester(initial_capital=request.initial_capital)
        result = engine.run(candles, request, strategy_logic)
        
        return result

    except Exception as e:
        logger.error(f"Backtest failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))