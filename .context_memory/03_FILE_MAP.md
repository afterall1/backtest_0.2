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
│   ├── data_service.py       # CCXT data fetching
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
| `backend/data_service.py` | Real CCXT data fetching | 🔄 Pending |
| `backend/main.py` | FastAPI server | 🔄 Pending |
| `frontend/` | Next.js UI | 🔄 Pending |

---

## Notes

*Add manual notes here to guide AI understanding*

---

*Last Updated: 2025-12-14T00:57:29+03:00*
