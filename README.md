# Trader Backtest App v0.2

> **Zero-latency, 100% Real Data Backtesting** powered by Chaos AI

## 🏗️ Architecture

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, TypeScript, TailwindCSS, Shadcn/UI, Lightweight-Charts |
| **Backend** | Python 3.12, FastAPI |
| **Engine** | Pandas, NumPy |
| **Data** | CCXT (Binance - Real Data Only) |

## 📁 Project Structure

```
backtest_0.2/
├── .context_memory/      # 🔒 AI Context Preservation (Protected)
├── prompts/              # 🔒 AI System Prompts (Protected)
├── backend/              # Python FastAPI Backend
│   ├── main.py           # API Entry Point
│   ├── data_service.py   # CCXT Data Fetching
│   └── requirements.txt  # Python Dependencies
├── frontend/             # Next.js 15 Frontend
└── .cursorrules          # AI Behavior Configuration
```

## 🚀 Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## ⚠️ Core Rules

1. **NO MOCK DATA** - All market data must come from Binance via CCXT
2. **AI calculates Logic, Python calculates Math**
3. `.context_memory/` and `prompts/` are READ-ONLY for AI

---

*Initialized: 2025-12-14*
