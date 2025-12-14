# 📋 PROJECT ROADMAP & TASK MANAGER
> **Trader Backtest v0.2 - Chaos AI Hybrid System**

---

## ✅ Phase 1: Data Spine
- [x] Initialize project structure
- [x] Setup FastAPI backend
- [x] Setup Next.js 15 frontend
- [x] Integrate CCXT for Binance API
- [x] Implement `data_service.py` with rate limiting
- [x] Create `/api/symbols` and `/api/ohlcv` endpoints

---

## ✅ Phase 2: Core Engine (Universal Interpreter)
- [x] Create `Backtester` class in `engine.py`
- [x] Implement SMA Crossover strategy (fallback)
- [x] Build `IndicatorFactory` (SMA, EMA, RSI, MACD, Bollinger)
- [x] Create `SignalEvaluator` for dynamic rule interpretation
- [x] Implement `_execute_dynamic_strategy` for JSON logic
- [x] Exit classification: TARGET, STOP, SIGNAL

---

## ✅ Phase 3: Analytics
- [x] Implement `PerformanceAnalyzer` class
- [x] Calculate Sharpe Ratio (365-day annualized)
- [x] Calculate Sortino Ratio
- [x] Calculate Max Drawdown ($ and %)
- [x] Compute Win Rate, Profit Factor
- [x] Generate Equity Curve and Drawdown Series

---

## ✅ Phase 4: UI/UX
- [x] Create `StrategyInput` with 3-Prompt Structure
- [x] Build Cinematic `ChaosVisualizer` (Matrix aesthetic)
- [x] Implement `ProChart` with Trade Markers
- [x] Create interactive `TradeList` component
- [x] Build `TradeDetail` panel with R-Multiple
- [x] Create `TradeSnapshot` mini-chart with Price Lines
- [x] Add Error Toast notifications
- [x] Implement Date Range Selection

---

## ✅ Phase 5: System Hardening & Context Lock
- [x] Create `01_ACTIVE_STATE.md` (Brain Dump)
- [x] Create `02_ARCHITECTURE_DECISIONS.md`
- [x] Upgrade `04_TASK_MANAGER.md` (This file)
- [x] Reinforce `.cursorrules` with Immutable Files Protocol
- [x] Create Centralized API Layer (`api.ts`)
- [x] Initialize `prompts/chaos_prime.md`

---

## 🔄 Phase 6: Chaos AI Live Connection (CURRENT)
- [ ] Replace simulation with real LLM API calls
- [ ] Implement prompt engineering for strategy synthesis
- [ ] Add response validation and parsing
- [ ] Create fallback mechanism for API failures
- [ ] Implement token usage tracking

---

## [ ] Phase 7: Production Readiness
- [ ] Environment variable configuration
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Performance optimization
- [ ] Security audit

---

## Known Issues
| ID | Description | Status |
|----|-------------|--------|
| - | None tracked | - |

---

## Quick Commands
```bash
# Backend
cd backend && source venv/bin/activate && uvicorn main:app --reload

# Frontend  
cd frontend && npm run dev
```
