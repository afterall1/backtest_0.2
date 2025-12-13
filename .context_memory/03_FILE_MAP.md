# 🗺️ FILE MAP — Trader Backtest App

> **Reference document for AI context preservation**

---

## Directory Structure

```
backtest_0.2/
├── .context_memory/          # 🔒 PROTECTED - Context preservation
│   ├── 00_PROJECT_DNA.md     # Core identity & rules
│   └── 03_FILE_MAP.md        # This file
│
├── prompts/                  # 🔒 PROTECTED - AI system prompts
│   └── chaos_prime.md        # Master Chaos AI prompt
│
├── backend/                  # Python FastAPI backend
│   ├── main.py               # FastAPI entry point
│   ├── data_service.py       # CCXT data fetching (async)
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Next.js 15 frontend
│   ├── app/                  # App Router pages
│   ├── components/           # React components
│   └── package.json          # Node dependencies
│
└── .cursorrules              # AI behavior configuration
```

---

## Key Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `backend/data_service.py` | Async CCXT data fetching (Binance) | ✅ Active / Real Data Connected |
| `backend/main.py` | FastAPI server with /api/ohlcv, /api/symbols | ✅ Active / Real Data Connected |
| `frontend/` | Next.js 15 UI | 🔄 Pending Integration |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/api/health` | GET | Detailed health status |
| `/api/symbols` | GET | All tradable USDT pairs |
| `/api/ohlcv/{symbol}` | GET | OHLCV candlestick data |
| `/api/ticker/{symbol}` | GET | Current ticker price |

---

## Notes

- Data format optimized for `lightweight-charts` (timestamps in Unix seconds)
- All market data comes from Binance via async CCXT
- NO mock data generators allowed

---

*Last Updated: 2025-12-14T01:03:53+03:00*
