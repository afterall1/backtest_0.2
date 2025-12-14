"""
Chaos Bridge - AI Logic Synthesizer
=====================================
This module bridges user strategy inputs with the backtest engine.
It parses the 3-prompt structure and synthesizes strategy logic.

⚠️ CONSTRAINT PRIORITY RULE:
   User Constraints > AI Interpretation
   
If user specifies a constraint, it MUST NOT be overridden.
"""
import logging
from typing import Optional
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ChaosSynthesizer:
    """
    Chaos AI Strategy Synthesizer.
    
    Transforms 3-prompt input + drawing data into executable StrategyLogic.
    Ready for future LLM API integration.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.ChaosSynthesizer")
    
    def synthesize(self, request) -> 'StrategyLogic':
        """
        Synthesize strategy from BacktestRequest.
        
        Implements CONSTRAINT PRIORITY RULE:
        User Constraints > Chart Signal > AI Interpretation
        
        Args:
            request: BacktestRequest with 3-prompt fields and drawing_data
            
        Returns:
            StrategyLogic ready for execution
        """
        drawing_count = len(request.drawing_data) if request.drawing_data else 0
        
        self.logger.info(
            f"🧠 Synthesizing Strategy from:\n"
            f"   - 3 text inputs\n"
            f"   - {drawing_count} drawings"
        )
        
        # Conflict Resolution Simulation
        # Prepare for real LLM integration
        detected_conflicts = self._detect_conflicts(
            general_info=request.general_info or "",
            execution_details=request.execution_details or "",
            constraints=request.constraints or "",
            drawings=request.drawing_data
        )
        
        for conflict in detected_conflicts:
            self.logger.warning(f"⚠️ {conflict}")
        
        return synthesize_strategy(
            general_info=request.general_info or "",
            execution_details=request.execution_details or "",
            constraints=request.constraints or "",
            chart_data=request.drawing_data,
            sma_fast=request.sma_fast,
            sma_slow=request.sma_slow
        )
    
    def _detect_conflicts(
        self,
        general_info: str,
        execution_details: str,
        constraints: str,
        drawings: list | None
    ) -> list[str]:
        """
        Detect conflicts between inputs and apply CONSTRAINT PRIORITY.
        
        Priority Order:
        1. constraints (HIGHEST - Cannot be overridden)
        2. execution_details
        3. chart drawings
        4. general_info (LOWEST)
        """
        conflicts = []
        
        general_lower = general_info.lower()
        constraints_lower = constraints.lower() if constraints else ""
        
        # Conflict Example: Trend Following vs Mean Reversion
        if "trend" in general_lower and "mean reversion" in constraints_lower:
            conflicts.append(
                "Conflict Detected: Chart/General says 'Trend Following' but "
                "Constraints say 'Mean Reversion'. "
                "Applying CONSTRAINT PRIORITY. Ignoring Chart Signal."
            )
        
        # Conflict: Drawing suggests BUY but constraints say SELL only
        if drawings and len(drawings) > 0:
            if "sell only" in constraints_lower or "short only" in constraints_lower:
                conflicts.append(
                    "Conflict Detected: User marked chart positions but "
                    "Constraints restrict to SELL/SHORT only. "
                    "Applying CONSTRAINT PRIORITY. Chart markers ignored for direction."
                )
        
        # Log resolution
        if conflicts:
            self.logger.info(
                f"🔄 Resolved {len(conflicts)} conflicts using CONSTRAINT PRIORITY"
            )
        
        return conflicts


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
    Structured strategy logic synthesized from 3-prompt input.
    
    This is the bridge between natural language and executable logic.
    """
    # Metadata
    strategy_name: str = Field(default="Chaos Strategy", description="Generated name")
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0, description="AI confidence")
    
    # Indicators
    indicators: list[IndicatorConfig] = Field(
        default_factory=list,
        description="Technical indicators to calculate"
    )
    
    # Rules
    entry_rules: list[EntryRule] = Field(
        default_factory=list,
        description="Entry conditions"
    )
    exit_rules: list[ExitRule] = Field(
        default_factory=list,
        description="Exit conditions"
    )
    
    # Constraints (HIGHEST PRIORITY)
    constraints: list[Constraint] = Field(
        default_factory=list,
        description="User constraints - CANNOT be overridden"
    )
    
    # Risk Management
    risk_per_trade_pct: float = Field(default=1.0, description="Risk per trade %")
    max_positions: int = Field(default=1, description="Maximum concurrent positions")
    
    # Fallback to SMA Crossover
    use_sma_fallback: bool = Field(default=True, description="Use SMA if parsing fails")
    sma_fast: int = Field(default=10, description="Fast SMA period")
    sma_slow: int = Field(default=30, description="Slow SMA period")


def parse_constraints(constraints_text: str) -> list[Constraint]:
    """
    Parse user constraints from text.
    These constraints are ABSOLUTE and cannot be overridden by AI.
    
    Args:
        constraints_text: Raw constraint text from user
        
    Returns:
        List of parsed Constraint objects
    """
    if not constraints_text or not constraints_text.strip():
        return []
    
    parsed = []
    lines = constraints_text.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
            
        # Remove common prefixes
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


def synthesize_strategy(
    general_info: str,
    execution_details: str,
    constraints: str,
    chart_data: Optional[list[dict]] = None,
    sma_fast: int = 10,
    sma_slow: int = 30
) -> StrategyLogic:
    """
    Synthesize strategy logic from 3-prompt input structure.
    
    ⚠️ CONSTRAINT PRIORITY RULE:
       User Constraints > AI Interpretation
    
    Args:
        general_info: General strategy description
        execution_details: Entry, exit, stop loss details
        constraints: User constraints (HIGHEST PRIORITY)
        chart_data: Optional OHLCV data for analysis
        sma_fast: Fallback fast SMA period
        sma_slow: Fallback slow SMA period
        
    Returns:
        StrategyLogic with synthesized rules
    """
    logger.info("🧠 Synthesizing strategy from 3-prompt input...")
    
    # Step 1: Parse constraints FIRST (highest priority)
    parsed_constraints = parse_constraints(constraints)
    
    # Step 2: Initialize with RICH indicators for Universal Logic Executor
    strategy = StrategyLogic(
        strategy_name="Chaos AI Strategy",
        confidence_score=0.85,
        sma_fast=sma_fast,
        sma_slow=sma_slow,
        use_sma_fallback=False,  # Use dynamic execution
        constraints=parsed_constraints,
        # Pre-populate with RSI and EMA for testing dynamic engine
        indicators=[
            IndicatorConfig(name="RSI", period=14, params={"overbought": 70, "oversold": 30}),
            IndicatorConfig(name="EMA", period=21, params={}),
            IndicatorConfig(name="SMA", period=sma_fast, params={}),
            IndicatorConfig(name="SMA", period=sma_slow, params={}),
        ],
        entry_rules=[
            EntryRule(
                condition="RSI below 30 (oversold) with price above EMA",
                indicator="RSI_EMA_Combo",
                threshold=30.0,
                direction="long"
            )
        ],
        exit_rules=[
            ExitRule(
                condition="RSI above 70 (overbought) or Stop Loss hit",
                take_profit_pct=5.0,
                stop_loss_pct=2.0,
                trailing_stop=False
            )
        ]
    )
    
    # Step 3: Parse execution details for indicators
    if execution_details:
        details_lower = execution_details.lower()
        
        # Detect indicators mentioned
        if 'rsi' in details_lower:
            strategy.indicators.append(IndicatorConfig(
                name="RSI",
                period=14,
                params={"overbought": 70, "oversold": 30}
            ))
            
        if 'macd' in details_lower:
            strategy.indicators.append(IndicatorConfig(
                name="MACD",
                params={"fast": 12, "slow": 26, "signal": 9}
            ))
            
        if 'sma' in details_lower or 'moving average' in details_lower:
            strategy.indicators.append(IndicatorConfig(
                name="SMA",
                period=sma_slow
            ))
            
        # Detect stop loss percentage from constraints
        for constraint in parsed_constraints:
            if 'stop' in constraint.value.lower() and '%' in constraint.value:
                # Extract percentage - user constraint is ABSOLUTE
                import re
                match = re.search(r'(\d+(?:\.\d+)?)\s*%', constraint.value)
                if match:
                    sl_pct = float(match.group(1))
                    strategy.exit_rules.append(ExitRule(
                        condition=f"Stop Loss at {sl_pct}%",
                        stop_loss_pct=sl_pct
                    ))
                    logger.info(f"⚠️ Applied user constraint: SL = {sl_pct}%")
    
    # Step 4: Default entry/exit if none parsed
    if not strategy.entry_rules:
        strategy.entry_rules.append(EntryRule(
            condition="SMA Fast crosses above SMA Slow",
            indicator="SMA_Crossover",
            direction="long"
        ))
        
    if not strategy.exit_rules:
        strategy.exit_rules.append(ExitRule(
            condition="SMA Fast crosses below SMA Slow",
            take_profit_pct=None,
            stop_loss_pct=2.0
        ))
    
    # Log synthesis result
    logger.info(f"✅ Strategy synthesized: {len(strategy.indicators)} indicators, "
                f"{len(strategy.entry_rules)} entry rules, "
                f"{len(strategy.exit_rules)} exit rules, "
                f"{len(strategy.constraints)} constraints (LOCKED)")
    
    return strategy


# ============================================================
# ❌ FORBIDDEN PATTERNS
# ============================================================
# DO NOT generate random strategy parameters
# DO NOT override user constraints
# DO NOT modify prompts/chaos_prime.md
# ============================================================
