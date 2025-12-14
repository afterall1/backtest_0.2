"""
Chaos Bridge - AI Logic Synthesizer (Production-Grade Gemini Integration)
==========================================================================
This module bridges user strategy inputs with the backtest engine.
Uses Google Generative AI (Gemini) for intelligent strategy synthesis.

⚠️ CONSTRAINT PRIORITY RULE:
   User Constraints > AI Interpretation
   
If user specifies a constraint, it MUST NOT be overridden.
"""
import os
import re
import json
import logging
from pathlib import Path
from typing import Optional

import google.generativeai as genai
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ============================================================
# 🔧 CONFIGURATION
# ============================================================

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("✅ Gemini API configured successfully")
else:
    logger.warning("⚠️ GEMINI_API_KEY not found. AI features will use fallback mode.")

# Model Configuration
MODEL_NAME = "gemini-1.5-flash"
GENERATION_CONFIG = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 2048,
}

# Path to system prompt
CHAOS_PRIME_PATH = Path(__file__).parent.parent / "prompts" / "chaos_prime.md"


# ============================================================
# 📦 PYDANTIC MODELS
# ============================================================

class IndicatorConfig(BaseModel):
    """Configuration for a technical indicator."""
    name: str = Field(..., description="Indicator name (e.g., SMA, RSI, MACD)")
    period: Optional[int] = Field(None, description="Lookback period")
    params: dict = Field(default_factory=dict, description="Additional parameters")


class EntryRule(BaseModel):
    """Entry condition for trade."""
    condition: str = Field(..., description="Human-readable condition")
    indicator: Optional[str] = Field(None, description="Primary indicator")
    threshold: Optional[float] = Field(None, description="Threshold value")
    direction: str = Field(default="long", description="Trade direction: long/short")


class ExitRule(BaseModel):
    """Exit condition for trade."""
    condition: str = Field(..., description="Human-readable condition")
    take_profit_pct: Optional[float] = Field(None, description="Take profit percentage")
    stop_loss_pct: Optional[float] = Field(None, description="Stop loss percentage")
    trailing_stop: bool = Field(default=False, description="Use trailing stop")


class Constraint(BaseModel):
    """User-defined constraint that CANNOT be overridden."""
    type: str = Field(..., description="Constraint type")
    value: str = Field(..., description="Constraint value")
    is_absolute: bool = Field(default=True, description="Cannot be changed by AI")


class StrategyLogic(BaseModel):
    """
    Structured strategy logic synthesized from AI response.
    """
    strategy_name: str = Field(default="Chaos Strategy", description="Generated name")
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0, description="AI confidence")
    logic_summary: str = Field(default="", description="AI analysis summary")
    
    indicators: list[IndicatorConfig] = Field(default_factory=list)
    entry_rules: list[EntryRule] = Field(default_factory=list)
    exit_rules: list[ExitRule] = Field(default_factory=list)
    constraints: list[Constraint] = Field(default_factory=list)
    
    risk_per_trade_pct: float = Field(default=1.0)
    max_positions: int = Field(default=1)
    
    use_sma_fallback: bool = Field(default=True)
    sma_fast: int = Field(default=10)
    sma_slow: int = Field(default=30)


# ============================================================
# 🧠 CHAOS SYNTHESIZER (GEMINI INTEGRATION)
# ============================================================

class ChaosSynthesizer:
    """
    Chaos AI Strategy Synthesizer with Gemini Integration.
    
    Transforms 3-prompt input + chart data into executable StrategyLogic.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.ChaosSynthesizer")
        self._system_prompt: Optional[str] = None
        self._model = None
        
        # Initialize model if API key exists
        if GEMINI_API_KEY:
            try:
                self._model = genai.GenerativeModel(
                    model_name=MODEL_NAME,
                    generation_config=GENERATION_CONFIG,
                )
                self.logger.info(f"✅ Gemini model '{MODEL_NAME}' initialized")
            except Exception as e:
                self.logger.error(f"❌ Failed to initialize Gemini model: {e}")
                self._model = None
    
    def _load_system_prompt(self) -> str:
        """Load system prompt from chaos_prime.md (READ ONLY)."""
        if self._system_prompt:
            return self._system_prompt
        
        try:
            if CHAOS_PRIME_PATH.exists():
                self._system_prompt = CHAOS_PRIME_PATH.read_text(encoding="utf-8")
                self.logger.info(f"📖 Loaded system prompt from {CHAOS_PRIME_PATH}")
                return self._system_prompt
            else:
                self.logger.warning(f"⚠️ System prompt not found at {CHAOS_PRIME_PATH}")
                return self._get_fallback_system_prompt()
        except Exception as e:
            self.logger.error(f"❌ Error loading system prompt: {e}")
            return self._get_fallback_system_prompt()
    
    def _get_fallback_system_prompt(self) -> str:
        """Fallback system prompt if file not found."""
        return """You are Chaos AI, a quantitative trading strategist.
        Output strict JSON with entry_rules, exit_rules, and confidence_score.
        Never violate user constraints."""
    
    def _build_user_prompt(
        self,
        general_info: str,
        execution_details: str,
        constraints: str,
        chart_data: Optional[list[dict]] = None
    ) -> str:
        """Build user prompt from 3-prompt structure and chart data."""
        prompt_parts = []
        
        # Section 1: General Info
        if general_info:
            prompt_parts.append(f"## GENERAL STRATEGY INFO\n{general_info}")
        
        # Section 2: Execution Details
        if execution_details:
            prompt_parts.append(f"## EXECUTION DETAILS\n{execution_details}")
        
        # Section 3: Constraints (HIGHEST PRIORITY)
        if constraints:
            prompt_parts.append(f"## CONSTRAINTS (MUST FOLLOW - HIGHEST PRIORITY)\n{constraints}")
        
        # Section 4: Chart Data Summary (last 50 candles)
        if chart_data and len(chart_data) > 0:
            # Take last 50 candles for context
            recent_candles = chart_data[-50:] if len(chart_data) > 50 else chart_data
            
            chart_summary = "## RECENT PRICE DATA (Last {} candles)\n".format(len(recent_candles))
            chart_summary += "| Time | Open | High | Low | Close |\n"
            chart_summary += "|------|------|------|-----|-------|\n"
            
            for candle in recent_candles[-10:]:  # Show last 10 in table
                chart_summary += f"| {candle.get('time', 'N/A')} | {candle.get('open', 'N/A'):.2f} | {candle.get('high', 'N/A'):.2f} | {candle.get('low', 'N/A'):.2f} | {candle.get('close', 'N/A'):.2f} |\n"
            
            # Add key levels
            closes = [c.get('close', 0) for c in recent_candles if c.get('close')]
            if closes:
                chart_summary += f"\n**Recent High:** {max(closes):.2f}"
                chart_summary += f"\n**Recent Low:** {min(closes):.2f}"
                chart_summary += f"\n**Current Price:** {closes[-1]:.2f}"
            
            prompt_parts.append(chart_summary)
        
        # Final instruction
        prompt_parts.append("""
## OUTPUT INSTRUCTION
Analyze the above and return a JSON object with:
- "logic_summary": Your analysis in 1-2 sentences
- "entry_rules": Array of entry conditions
- "exit_rules": Array of exit conditions  
- "confidence_score": 0-100 integer

Return ONLY valid JSON, no markdown code blocks.""")
        
        return "\n\n".join(prompt_parts)
    
    def _parse_ai_response(self, response_text: str) -> dict:
        """
        Parse AI response, handling markdown code blocks and edge cases.
        """
        text = response_text.strip()
        
        # Remove markdown code blocks if present
        if text.startswith("```"):
            # Find the end of the code block
            lines = text.split("\n")
            # Remove first line (```json or ```)
            if lines[0].startswith("```"):
                lines = lines[1:]
            # Remove last line if it's just ```
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines)
        
        # Try to extract JSON from text
        try:
            # First try direct parse
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to find JSON object in text
            json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    pass
        
        self.logger.warning("⚠️ Could not parse AI response as JSON")
        return {}
    
    async def synthesize_async(self, request) -> StrategyLogic:
        """
        Async synthesize strategy using Gemini API.
        
        Falls back to deterministic strategy if API fails.
        """
        self.logger.info("🧠 Starting async strategy synthesis...")
        
        # Try Gemini API first
        if self._model and GEMINI_API_KEY:
            try:
                return await self._synthesize_with_gemini(request)
            except Exception as e:
                self.logger.error(f"❌ Gemini API error: {e}. Using fallback.")
        
        # Fallback to deterministic strategy
        return self._synthesize_fallback(request)
    
    async def _synthesize_with_gemini(self, request) -> StrategyLogic:
        """Call Gemini API and parse response."""
        # Load prompts
        system_prompt = self._load_system_prompt()
        user_prompt = self._build_user_prompt(
            general_info=request.general_info or "",
            execution_details=request.execution_details or "",
            constraints=request.constraints or "",
            chart_data=request.drawing_data
        )
        
        self.logger.info(f"📤 Sending request to Gemini ({MODEL_NAME})...")
        
        # Combine system and user prompt
        full_prompt = f"{system_prompt}\n\n---\n\n# USER REQUEST\n\n{user_prompt}"
        
        # Call Gemini async
        response = await self._model.generate_content_async(full_prompt)
        
        self.logger.info("📥 Received response from Gemini")
        
        # Parse response
        response_text = response.text
        parsed = self._parse_ai_response(response_text)
        
        # Build StrategyLogic from parsed response
        return self._build_strategy_from_ai(parsed, request)
    
    def _build_strategy_from_ai(self, ai_response: dict, request) -> StrategyLogic:
        """Convert AI response to StrategyLogic."""
        # Parse constraints from request
        parsed_constraints = parse_constraints(request.constraints or "")
        
        # Extract entry rules
        entry_rules = []
        for rule in ai_response.get("entry_rules", []):
            if isinstance(rule, dict):
                entry_rules.append(EntryRule(
                    condition=rule.get("condition", rule.get("logic", "AI Generated")),
                    indicator=rule.get("indicator"),
                    threshold=rule.get("threshold"),
                    direction=rule.get("direction", "long")
                ))
        
        # Extract exit rules
        exit_rules = []
        for rule in ai_response.get("exit_rules", []):
            if isinstance(rule, dict):
                exit_rules.append(ExitRule(
                    condition=rule.get("condition", rule.get("reason", "AI Generated")),
                    stop_loss_pct=rule.get("stop_loss_pct") or rule.get("value"),
                    take_profit_pct=rule.get("take_profit_pct"),
                    trailing_stop=rule.get("trailing_stop", False)
                ))
        
        # Build confidence score
        confidence = ai_response.get("confidence_score", 75)
        if isinstance(confidence, (int, float)):
            confidence = min(100, max(0, confidence)) / 100
        else:
            confidence = 0.75
        
        return StrategyLogic(
            strategy_name="Chaos AI Strategy",
            confidence_score=confidence,
            logic_summary=ai_response.get("logic_summary", "AI-generated strategy"),
            indicators=[
                IndicatorConfig(name="RSI", period=14),
                IndicatorConfig(name="EMA", period=21),
                IndicatorConfig(name="SMA", period=request.sma_fast),
                IndicatorConfig(name="SMA", period=request.sma_slow),
            ],
            entry_rules=entry_rules or [EntryRule(
                condition="SMA Fast crosses above SMA Slow",
                indicator="SMA_Crossover",
                direction="long"
            )],
            exit_rules=exit_rules or [ExitRule(
                condition="Stop Loss or Signal Reversal",
                stop_loss_pct=2.0
            )],
            constraints=parsed_constraints,
            sma_fast=request.sma_fast,
            sma_slow=request.sma_slow,
            use_sma_fallback=False
        )
    
    def _synthesize_fallback(self, request) -> StrategyLogic:
        """Deterministic fallback when API is unavailable."""
        self.logger.info("🔄 Using deterministic fallback strategy...")
        
        parsed_constraints = parse_constraints(request.constraints or "")
        
        return StrategyLogic(
            strategy_name="Fallback SMA Strategy",
            confidence_score=0.70,
            logic_summary="Fallback: SMA Crossover with RSI filter",
            indicators=[
                IndicatorConfig(name="RSI", period=14, params={"overbought": 70, "oversold": 30}),
                IndicatorConfig(name="EMA", period=21),
                IndicatorConfig(name="SMA", period=request.sma_fast),
                IndicatorConfig(name="SMA", period=request.sma_slow),
            ],
            entry_rules=[
                EntryRule(
                    condition="RSI below 30 (oversold) with SMA crossover",
                    indicator="RSI_SMA_Combo",
                    threshold=30.0,
                    direction="long"
                )
            ],
            exit_rules=[
                ExitRule(
                    condition="RSI above 70 or Stop Loss hit",
                    take_profit_pct=5.0,
                    stop_loss_pct=2.0,
                    trailing_stop=False
                )
            ],
            constraints=parsed_constraints,
            sma_fast=request.sma_fast,
            sma_slow=request.sma_slow,
            use_sma_fallback=False
        )
    
    def synthesize(self, request) -> StrategyLogic:
        """
        Synchronous wrapper for backward compatibility.
        Uses fallback since sync context can't easily call async.
        """
        self.logger.info("🧠 Synthesizing Strategy (sync mode)...")
        
        if self._model and GEMINI_API_KEY:
            self.logger.info("⚠️ Sync mode detected. Using fallback. Use synthesize_async() for Gemini.")
        
        return self._synthesize_fallback(request)


# ============================================================
# 🔧 UTILITY FUNCTIONS
# ============================================================

def parse_constraints(constraints_text: str) -> list[Constraint]:
    """
    Parse user constraints from text.
    These constraints are ABSOLUTE and cannot be overridden by AI.
    """
    if not constraints_text or not constraints_text.strip():
        return []
    
    parsed = []
    lines = constraints_text.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
            
        for prefix in ['- ', '• ', '* ', '> ']:
            if line.startswith(prefix):
                line = line[len(prefix):]
                break
        
        if line:
            parsed.append(Constraint(
                type="user_defined",
                value=line,
                is_absolute=True
            ))
    
    logger.info(f"Parsed {len(parsed)} constraints from user input")
    return parsed


# Legacy function for backward compatibility
def synthesize_strategy(
    general_info: str,
    execution_details: str,
    constraints: str,
    chart_data: Optional[list[dict]] = None,
    sma_fast: int = 10,
    sma_slow: int = 30
) -> StrategyLogic:
    """Legacy synchronous synthesis function."""
    from models import BacktestRequest
    
    # Create a minimal request object
    class MinimalRequest:
        def __init__(self):
            self.general_info = general_info
            self.execution_details = execution_details
            self.constraints = constraints
            self.drawing_data = chart_data
            self.sma_fast = sma_fast
            self.sma_slow = sma_slow
    
    synthesizer = ChaosSynthesizer()
    return synthesizer.synthesize(MinimalRequest())


# ============================================================
# ❌ FORBIDDEN PATTERNS
# ============================================================
# DO NOT generate random strategy parameters
# DO NOT override user constraints
# DO NOT modify prompts/chaos_prime.md
# ============================================================
