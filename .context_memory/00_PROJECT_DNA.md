# 🧬 PROJECT DNA: Trader Backtest App v0.2

> **IMMUTABLE CORE DOCUMENT** — This file defines the soul of the project.

---

## 🎯 Mission Statement

**"Zero-latency, 100% Real Data Backtesting App driven by Chaos AI interpretation."**

This application exists to backtest trading strategies using ONLY real market data from Binance. No simulations. No random generators. No mock data. Ever.

---

## ⚖️ The Fundamental Law

```
╔══════════════════════════════════════════════════════════════╗
║         AI CALCULATES LOGIC, PYTHON CALCULATES MATH         ║
╚══════════════════════════════════════════════════════════════╝
```

- **Chaos AI** interprets trading strategies, identifies patterns, and makes decisions.
- **Python Engine** executes precise mathematical calculations for backtesting.
- **Never** mix these responsibilities.

---

## 🎛️ 3-Prompt Input Structure

All strategy inputs follow this strict hierarchy:

| # | Field | Purpose | Priority |
|---|-------|---------|----------|
| 1 | `generalInfo` | Genel Strateji Bilgileri | Context |
| 2 | `executionDetails` | Strateji İşlem Detayları (Entry, Exit, SL, R:R) | Logic |
| 3 | `constraints` | Backtest İçin Dikkat Edilmesi Gerekenler | **HIGHEST** |

### Constraint Priority Rule
```
╔══════════════════════════════════════════════════════════════╗
║       USER CONSTRAINTS  >  AI INTERPRETATION                 ║
╚══════════════════════════════════════════════════════════════╝
```

If the user specifies a constraint (e.g., "SL must be exactly 2%"), the AI **MUST NOT** override or reinterpret it. User constraints are absolute.

---

## 🔒 Sacred Rules

### 1. NO MOCKS — REAL DATA ONLY
```python
# ❌ FORBIDDEN
import random
price = random.uniform(100, 200)  # NEVER

# ✅ REQUIRED
import ccxt
exchange = ccxt.binance()
ohlcv = exchange.fetch_ohlcv('BTC/USDT', '1h')  # ALWAYS REAL
```

### 2. IMMUTABLE DIRECTORIES
The following paths are **PROTECTED** from AI modification:
- `/.context_memory/` — Can be READ, never WRITTEN without Sudo Override
- `/prompts/` — Master prompts are sacred, **READ-ONLY** (User-only files)

### 3. HYBRID ARCHITECTURE
| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15, TypeScript, TailwindCSS | User Interface |
| Backend | Python 3.12, FastAPI | API Server |
| Chaos Bridge | Python | AI Logic Synthesizer |
| Engine | Pandas, NumPy | Mathematical Calculations |
| Data | CCXT (Binance) | Real Market Data |
| Communication | REST + WebSocket | Real-time Updates |

---

## 🧠 Context Preservation Protocol

This project uses **Context Memory Files** to maintain AI understanding across sessions:

| File | Purpose |
|------|---------|
| `00_PROJECT_DNA.md` | Core identity (this file) |
| `03_FILE_MAP.md` | Directory structure reference |
| `04_TASK_MANAGER.md` | Active tasks and module status |

When AI loses context, it should **READ these files FIRST** before any action.

---

## 📝 Changelog

| Date | Event |
|------|-------|
| 2025-12-14 | Project DNA initialized |
| 2025-12-14 | Added 3-Prompt Input Structure |
| 2025-12-14 | Added Constraint Priority Rule |

---

*Last Updated: 2025-12-14T02:31:50+03:00*
