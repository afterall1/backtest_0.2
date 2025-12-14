# 🏗️ ARCHITECTURE DECISIONS RECORD
> **Immutable decisions that define the system architecture.**

---

## ADR-001: Hybrid Engine Architecture
**Date:** 2025-12-13
**Status:** Accepted

**Decision:** Separate AI Logic from Python Math.
- **AI (Chaos Bridge):** Interprets natural language, generates strategy JSON
- **Python (Backtester):** Executes vectorized calculations on real data

**Rationale:** Allows deterministic testing while leveraging AI creativity.

---

## ADR-002: Centralized API Layer
**Date:** 2025-12-14
**Status:** Accepted

**Decision:** All frontend API calls go through `lib/api.ts`.

**Components:**
- `apiFetch<T>()` - Generic type-safe wrapper
- Custom error classes: `BackendUnavailableError`, `StrategyRejectedError`
- No direct `fetch()` calls in components

**Rationale:** Single source of truth for API logic, consistent error handling.

---

## ADR-003: State Management (Zustand)
**Date:** 2025-12-13
**Status:** Accepted

**Decision:** Use Zustand for global state management.

**Store Structure:**
```typescript
AppState {
  step: 'input' | 'analyzing' | 'results'
  strategyParams: BacktestRequest
  backtestResult: BacktestResult | null
  error: string | null
}
```

**Rationale:** Lightweight, TypeScript-first, no boilerplate.

---

## ADR-004: Chart Library (Lightweight Charts v5)
**Date:** 2025-12-13
**Status:** Accepted

**Decision:** Use TradingView's Lightweight Charts for all visualizations.

**Features Used:**
- `LineSeries` for equity curves
- `CandlestickSeries` for price data
- `createPriceLine()` for SL/TP levels
- `setMarkers()` for trade entry/exit points

**Rationale:** Professional quality, lightweight, MIT licensed.

---

## ADR-005: No Mock Data Policy
**Date:** 2025-12-13
**Status:** ENFORCED

**Decision:** All market data must come from real Binance API via CCXT.

**Forbidden Patterns:**
```python
# ❌ NEVER
import random
fake_price = random.uniform(100, 200)
mock_candles = generate_fake_data()
```

**Rationale:** Backtesting results must reflect real market behavior.

---

## ADR-006: 3-Prompt Input Structure
**Date:** 2025-12-14
**Status:** Accepted

**Decision:** Strategy input split into three fields:

| Prompt | Priority | Purpose |
|--------|----------|---------|
| `generalInfo` | Context | Strategy overview |
| `executionDetails` | Logic | Entry/Exit rules |
| `constraints` | HIGHEST | Immutable rules |

**Constraint Priority Rule:** User constraints CANNOT be overridden by AI.

---

## ADR-007: Exit Classification System
**Date:** 2025-12-14
**Status:** Accepted

**Decision:** Trade exits classified as:
- `TARGET` - Take Profit hit
- `STOP` - Stop Loss triggered  
- `SIGNAL` - Strategy signal reversal

**Implementation:**
```python
Trade(
    exit_reason="STOP",
    sl_price=entry_price * 0.98,
    tp_price=entry_price * 1.04
)
```
