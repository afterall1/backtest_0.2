"""
Universal Backtest Engine - Dynamic Logic Executor
===================================================
⚠️ CRITICAL: NO MOCK DATA - Uses real market data passed in

This engine interprets JSON strategy logic from ChaosBridge and
executes any technical indicator combination dynamically.

Core Principle: "AI calculates Logic, Python calculates Math"
"""
import pandas as pd
import numpy as np
from typing import Optional, Callable
import logging

from models import (
    Trade, BacktestResult, BacktestRequest,
    TradeType, TradeStatus, PerformanceMetrics,
    EquityPoint, DrawdownPoint
)
from analytics import PerformanceAnalyzer

logger = logging.getLogger(__name__)


# ============================================================
# INDICATOR FACTORY - Dynamic Technical Indicator Calculator
# ============================================================

class IndicatorFactory:
    """
    Factory for calculating technical indicators dynamically.
    
    Supports: SMA, EMA, RSI, MACD, Bollinger Bands
    Extensible for any pandas-compatible indicator.
    """
    
    @staticmethod
    def calculate(df: pd.DataFrame, indicator_name: str, **params) -> pd.Series:
        """
        Calculate indicator and return the series.
        
        Args:
            df: DataFrame with OHLCV data
            indicator_name: Name of indicator (SMA, EMA, RSI, etc.)
            **params: Indicator-specific parameters
            
        Returns:
            pd.Series with calculated indicator values
        """
        name = indicator_name.upper()
        
        if name == "SMA":
            return IndicatorFactory.sma(df, **params)
        elif name == "EMA":
            return IndicatorFactory.ema(df, **params)
        elif name == "RSI":
            return IndicatorFactory.rsi(df, **params)
        elif name == "MACD":
            return IndicatorFactory.macd(df, **params)
        elif name == "BOLLINGER" or name == "BB":
            return IndicatorFactory.bollinger(df, **params)
        else:
            logger.warning(f"Unknown indicator: {name}, returning close price")
            return df['close']
    
    @staticmethod
    def sma(df: pd.DataFrame, period: int = 20, column: str = 'close') -> pd.Series:
        """Simple Moving Average."""
        return df[column].rolling(window=period).mean()
    
    @staticmethod
    def ema(df: pd.DataFrame, period: int = 20, column: str = 'close') -> pd.Series:
        """Exponential Moving Average."""
        return df[column].ewm(span=period, adjust=False).mean()
    
    @staticmethod
    def rsi(df: pd.DataFrame, period: int = 14, column: str = 'close') -> pd.Series:
        """Relative Strength Index (0-100)."""
        delta = df[column].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    @staticmethod
    def macd(df: pd.DataFrame, fast: int = 12, slow: int = 26, signal: int = 9, column: str = 'close') -> tuple[pd.Series, pd.Series, pd.Series]:
        """MACD (line, signal, histogram)."""
        ema_fast = df[column].ewm(span=fast, adjust=False).mean()
        ema_slow = df[column].ewm(span=slow, adjust=False).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        histogram = macd_line - signal_line
        return macd_line, signal_line, histogram
    
    @staticmethod
    def bollinger(df: pd.DataFrame, period: int = 20, std_dev: float = 2.0, column: str = 'close') -> tuple[pd.Series, pd.Series, pd.Series]:
        """Bollinger Bands (upper, middle, lower)."""
        sma = df[column].rolling(window=period).mean()
        std = df[column].rolling(window=period).std()
        upper = sma + (std * std_dev)
        lower = sma - (std * std_dev)
        return upper, sma, lower


# ============================================================
# SIGNAL EVALUATOR - Dynamic Rule Interpreter
# ============================================================

class SignalEvaluator:
    """
    Evaluates trading signals based on JSON rule definitions.
    
    Interprets entry/exit conditions dynamically.
    """
    
    COMPARATORS = {
        '>': lambda a, b: a > b,
        '<': lambda a, b: a < b,
        '>=': lambda a, b: a >= b,
        '<=': lambda a, b: a <= b,
        '==': lambda a, b: a == b,
        'crosses_above': lambda a, b: (a.shift(1) <= b.shift(1)) & (a > b),
        'crosses_below': lambda a, b: (a.shift(1) >= b.shift(1)) & (a < b),
    }
    
    @staticmethod
    def evaluate_condition(df: pd.DataFrame, condition: dict) -> pd.Series:
        """
        Evaluate a single condition.
        
        Args:
            df: DataFrame with indicator columns
            condition: Dict with 'left', 'operator', 'right'
            
        Returns:
            Boolean Series
        """
        left = condition.get('left', 'close')
        operator = condition.get('operator', '>')
        right = condition.get('right', 0)
        
        # Get left value
        if isinstance(left, str) and left in df.columns:
            left_series = df[left]
        else:
            left_series = pd.Series([left] * len(df), index=df.index)
        
        # Get right value
        if isinstance(right, str) and right in df.columns:
            right_series = df[right]
        else:
            right_series = pd.Series([right] * len(df), index=df.index)
        
        # Apply comparator
        comparator = SignalEvaluator.COMPARATORS.get(operator, lambda a, b: a > b)
        return comparator(left_series, right_series)
    
    @staticmethod
    def evaluate_rules(df: pd.DataFrame, rules: list[dict]) -> pd.Series:
        """
        Evaluate multiple rules (AND logic).
        
        Args:
            df: DataFrame with indicator columns
            rules: List of condition dicts
            
        Returns:
            Boolean Series (True when ALL conditions met)
        """
        if not rules:
            return pd.Series([False] * len(df), index=df.index)
        
        result = pd.Series([True] * len(df), index=df.index)
        
        for rule in rules:
            condition_result = SignalEvaluator.evaluate_condition(df, rule)
            result = result & condition_result
        
        return result


# ============================================================
# UNIVERSAL BACKTESTER - Main Engine
# ============================================================

class Backtester:
    """
    Universal Vectorized Backtest Engine.
    
    Interprets JSON strategy logic from ChaosBridge and executes
    any technical indicator combination dynamically.
    
    NO mock data generation - all data must be passed in.
    """
    
    def __init__(self, initial_capital: float = 10000.0):
        """Initialize the backtester."""
        self.initial_capital = initial_capital
        self.indicator_factory = IndicatorFactory()
        
    def run(
        self,
        data: list[dict],
        request: BacktestRequest,
        strategy_logic: dict = None
    ) -> BacktestResult:
        """
        Execute backtest on provided market data.
        
        Args:
            data: List of OHLCV candles
            request: Backtest parameters
            strategy_logic: Optional StrategyLogic JSON from ChaosBridge
            
        Returns:
            BacktestResult with all metrics
        """
        if not data or len(data) < request.sma_slow + 10:
            logger.warning("Insufficient data for backtest")
            return self._empty_result(request)
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        df['time_dt'] = pd.to_datetime(df['time'], unit='s')
        df.set_index('time_dt', inplace=True)
        
        logger.info(f"Running backtest: {request.symbol} | {request.strategy} | {len(df)} candles")
        
        # Use strategy_logic if provided, otherwise fallback to simple SMA
        if strategy_logic and 'indicators' in strategy_logic:
            trades = self._execute_dynamic_strategy(df, request, strategy_logic)
        else:
            trades = self._strategy_sma_crossover(df, request)
        
        # Convert Trade objects to dicts for analytics
        trade_dicts = [
            {
                'entry_time': t.entry_time,
                'exit_time': t.exit_time,
                'entry_price': t.entry_price,
                'exit_price': t.exit_price,
                'pnl': t.pnl,
                'pnl_percent': t.pnl_percent,
                'type': t.type.value,
                'status': t.status.value
            }
            for t in trades
        ]
        
        # Calculate analytics
        analyzer = PerformanceAnalyzer(initial_capital=request.initial_capital)
        analytics = analyzer.calculate_all_metrics(trade_dicts, data)
        
        # Build result
        result = self._build_result(request, trades, analytics)
        
        logger.info(f"Backtest complete: {result.metrics.total_trades} trades, {result.metrics.win_rate:.1f}% win rate")
        
        return result
    
    def _execute_dynamic_strategy(
        self,
        df: pd.DataFrame,
        request: BacktestRequest,
        strategy_logic: dict
    ) -> list[Trade]:
        """
        Execute strategy from ChaosBridge JSON logic.
        
        This is the Universal Logic Executor that interprets
        AI-generated strategy definitions dynamically.
        """
        logger.info("🧠 Executing Dynamic Strategy from ChaosBridge")
        
        # Step 1: Calculate all required indicators
        indicators = strategy_logic.get('indicators', [])
        for ind in indicators:
            name = ind.get('name', 'SMA')
            period = ind.get('period', 20)
            params = ind.get('params', {})
            
            col_name = f"{name.lower()}_{period}" if period else name.lower()
            
            if name.upper() == 'RSI':
                df[col_name] = IndicatorFactory.rsi(df, period=period)
                logger.info(f"  ✓ Calculated RSI({period})")
            elif name.upper() == 'EMA':
                df[col_name] = IndicatorFactory.ema(df, period=period)
                logger.info(f"  ✓ Calculated EMA({period})")
            elif name.upper() == 'SMA':
                df[col_name] = IndicatorFactory.sma(df, period=period)
                logger.info(f"  ✓ Calculated SMA({period})")
            elif name.upper() == 'MACD':
                fast = params.get('fast', 12)
                slow = params.get('slow', 26)
                signal = params.get('signal', 9)
                macd, signal_line, hist = IndicatorFactory.macd(df, fast, slow, signal)
                df['macd'] = macd
                df['macd_signal'] = signal_line
                df['macd_hist'] = hist
                logger.info(f"  ✓ Calculated MACD({fast},{slow},{signal})")
        
        # Step 2: Generate entry signals
        entry_rules = strategy_logic.get('entry_rules', [])
        if entry_rules:
            # Convert entry rules to evaluable conditions
            conditions = []
            for rule in entry_rules:
                indicator = rule.get('indicator', '').lower()
                threshold = rule.get('threshold')
                
                if 'rsi' in indicator and threshold:
                    # RSI oversold condition
                    conditions.append({
                        'left': 'rsi_14',
                        'operator': '<' if 'oversold' in rule.get('condition', '').lower() else '>',
                        'right': threshold
                    })
                elif 'crossover' in indicator.lower() or 'cross' in rule.get('condition', '').lower():
                    # SMA/EMA crossover
                    fast_col = f"sma_{request.sma_fast}"
                    slow_col = f"sma_{request.sma_slow}"
                    if fast_col not in df.columns:
                        df[fast_col] = IndicatorFactory.sma(df, request.sma_fast)
                    if slow_col not in df.columns:
                        df[slow_col] = IndicatorFactory.sma(df, request.sma_slow)
                    conditions.append({
                        'left': fast_col,
                        'operator': 'crosses_above',
                        'right': slow_col
                    })
            
            if conditions:
                df['entry_signal'] = SignalEvaluator.evaluate_rules(df, conditions)
            else:
                # Fallback to SMA crossover
                df['sma_fast'] = IndicatorFactory.sma(df, request.sma_fast)
                df['sma_slow'] = IndicatorFactory.sma(df, request.sma_slow)
                df['entry_signal'] = SignalEvaluator.evaluate_condition(df, {
                    'left': 'sma_fast', 'operator': 'crosses_above', 'right': 'sma_slow'
                })
        else:
            df['sma_fast'] = IndicatorFactory.sma(df, request.sma_fast)
            df['sma_slow'] = IndicatorFactory.sma(df, request.sma_slow)
            df['entry_signal'] = SignalEvaluator.evaluate_condition(df, {
                'left': 'sma_fast', 'operator': 'crosses_above', 'right': 'sma_slow'
            })
        
        # Step 3: Generate exit signals (opposite of entry for now)
        df['exit_signal'] = df['entry_signal'].shift(1) & ~df['entry_signal']
        
        # Alternative: Use explicit exit rules if provided
        exit_rules = strategy_logic.get('exit_rules', [])
        stop_loss_pct = None
        for rule in exit_rules:
            if rule.get('stop_loss_pct'):
                stop_loss_pct = rule['stop_loss_pct'] / 100
        
        # Step 4: Execute trades
        df = df.dropna()
        trades: list[Trade] = []
        position: Optional[dict] = None
        
        for idx, row in df.iterrows():
            timestamp = int(idx.timestamp())
            
            # Check entry
            if row.get('entry_signal', False) and position is None:
                position = {
                    'entry_time': timestamp,
                    'entry_price': row['close'],
                    'type': TradeType.LONG,
                    'stop_loss': row['close'] * (1 - stop_loss_pct) if stop_loss_pct else None
                }
            
            # Check exit
            elif position is not None:
                exit_trade = False
                exit_reason = ""
                
                # Check stop loss
                if position['stop_loss'] and row['low'] <= position['stop_loss']:
                    exit_trade = True
                    exit_reason = "stop_loss"
                # Check exit signal
                elif row.get('exit_signal', False):
                    exit_trade = True
                    exit_reason = "signal"
                
                if exit_trade:
                    exit_price = position['stop_loss'] if exit_reason == "stop_loss" else row['close']
                    entry_price = position['entry_price']
                    
                    pnl = exit_price - entry_price
                    pnl_percent = (pnl / entry_price) * 100
                    
                    status = TradeStatus.WIN if pnl > 0 else TradeStatus.LOSS if pnl < 0 else TradeStatus.BREAKEVEN
                    
                    trade = Trade(
                        entry_time=position['entry_time'],
                        exit_time=timestamp,
                        entry_price=entry_price,
                        exit_price=exit_price,
                        pnl=round(pnl, 4),
                        pnl_percent=round(pnl_percent, 4),
                        type=position['type'],
                        status=status
                    )
                    trades.append(trade)
                    position = None
        
        logger.info(f"  ✓ Generated {len(trades)} trades from dynamic strategy")
        return trades
    
    def _strategy_sma_crossover(
        self,
        df: pd.DataFrame,
        request: BacktestRequest
    ) -> list[Trade]:
        """Legacy SMA Crossover Strategy (fallback)."""
        df['sma_fast'] = df['close'].rolling(window=request.sma_fast).mean()
        df['sma_slow'] = df['close'].rolling(window=request.sma_slow).mean()
        
        df['signal'] = 0
        df.loc[df['sma_fast'] > df['sma_slow'], 'signal'] = 1
        df.loc[df['sma_fast'] < df['sma_slow'], 'signal'] = -1
        
        df['crossover'] = df['signal'].diff()
        df = df.dropna()
        
        trades: list[Trade] = []
        position: Optional[dict] = None
        
        for idx, row in df.iterrows():
            timestamp = int(idx.timestamp())
            
            if row['crossover'] == 2 and position is None:
                position = {
                    'entry_time': timestamp,
                    'entry_price': row['close'],
                    'type': TradeType.LONG
                }
            elif row['crossover'] == -2 and position is not None:
                exit_price = row['close']
                entry_price = position['entry_price']
                
                pnl = exit_price - entry_price
                pnl_percent = (pnl / entry_price) * 100
                
                status = TradeStatus.WIN if pnl > 0 else TradeStatus.LOSS if pnl < 0 else TradeStatus.BREAKEVEN
                
                trade = Trade(
                    entry_time=position['entry_time'],
                    exit_time=timestamp,
                    entry_price=entry_price,
                    exit_price=exit_price,
                    pnl=round(pnl, 4),
                    pnl_percent=round(pnl_percent, 4),
                    type=position['type'],
                    status=status
                )
                trades.append(trade)
                position = None
        
        return trades
    
    def _build_result(
        self,
        request: BacktestRequest,
        trades: list[Trade],
        analytics: dict
    ) -> BacktestResult:
        """Build the final BacktestResult with all data."""
        metrics_data = analytics['metrics']
        
        metrics = PerformanceMetrics(
            sharpe_ratio=metrics_data['sharpe_ratio'],
            sortino_ratio=metrics_data['sortino_ratio'],
            max_drawdown=metrics_data['max_drawdown'],
            max_drawdown_pct=metrics_data['max_drawdown_pct'],
            win_rate=metrics_data['win_rate'],
            profit_factor=metrics_data['profit_factor'],
            total_return=metrics_data['total_return'],
            total_return_pct=metrics_data['total_return_pct'],
            total_trades=metrics_data['total_trades'],
            winning_trades=metrics_data['winning_trades'],
            losing_trades=metrics_data['losing_trades'],
            gross_profit=metrics_data['gross_profit'],
            gross_loss=metrics_data['gross_loss'],
            avg_win=metrics_data['avg_win'],
            avg_loss=metrics_data['avg_loss'],
            final_equity=metrics_data['final_equity']
        )
        
        equity_curve = [
            EquityPoint(time=int(p['time']), equity=p['equity'])
            for p in analytics['equity_curve']
        ]
        
        drawdown_series = [
            DrawdownPoint(time=int(p['time']), drawdown_pct=p['drawdown_pct'])
            for p in analytics['drawdown_series']
        ]
        
        return BacktestResult(
            symbol=request.symbol,
            timeframe=request.timeframe,
            strategy_name=request.strategy,
            initial_capital=request.initial_capital,
            metrics=metrics,
            equity_curve=equity_curve,
            drawdown_series=drawdown_series,
            trades=trades
        )
    
    def _empty_result(self, request: BacktestRequest) -> BacktestResult:
        """Return empty result when no trades are generated."""
        metrics = PerformanceMetrics(
            sharpe_ratio=0.0,
            sortino_ratio=0.0,
            max_drawdown=0.0,
            max_drawdown_pct=0.0,
            win_rate=0.0,
            profit_factor=0.0,
            total_return=0.0,
            total_return_pct=0.0,
            total_trades=0,
            winning_trades=0,
            losing_trades=0,
            gross_profit=0.0,
            gross_loss=0.0,
            avg_win=0.0,
            avg_loss=0.0,
            final_equity=request.initial_capital
        )
        
        return BacktestResult(
            symbol=request.symbol,
            timeframe=request.timeframe,
            strategy_name=request.strategy,
            initial_capital=request.initial_capital,
            metrics=metrics,
            equity_curve=[],
            drawdown_series=[],
            trades=[]
        )


# ============================================================
# ❌ FORBIDDEN PATTERNS - DO NOT USE
# ============================================================
# import random
# fake_trades = [random.uniform(-100, 100) for _ in range(50)]  # NEVER
#
# np.random.seed(42)
# mock_data = np.random.randn(100)  # NEVER
# ============================================================
