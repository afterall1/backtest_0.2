"""
Chaos Bridge - Real AI Logic Synthesizer (Gemini Pro)
=====================================================
Pure Async Implementation. No Legacy Wrappers.
"""
import os
import json
import logging
import asyncio
from typing import Optional
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Configure Gemini
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    logger.warning("⚠️ GEMINI_API_KEY not found. Chaos Bridge running in FALLBACK mode.")
else:
    genai.configure(api_key=API_KEY)

class ChaosSynthesizer:
    """
    Real-time interface to Chaos AI (Gemini Pro).
    """
    
    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.ChaosSynthesizer")
        self.model = genai.GenerativeModel('gemini-pro') if API_KEY else None
    
    async def synthesize(self, request) -> dict:
        """
        Synthesize strategy using Generative AI (Async).
        """
        if not self.model:
            return self._fallback_logic(request, reason="No API Key")

        try:
            system_instruction = self._load_system_prompt()
            user_prompt = self._construct_user_prompt(request)
            
            self.logger.info("🧠 Chaos AI: Thinking... (Sending request to Gemini)")
            
            # Non-blocking API call
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: self.model.generate_content(f"{system_instruction}\n\nUSER REQUEST:\n{user_prompt}")
            )
            
            cleaned_json = self._clean_json_string(response.text)
            strategy_logic = json.loads(cleaned_json)
            
            self.logger.info("✅ Chaos AI: Strategy Synthesized Successfully.")
            return strategy_logic

        except Exception as e:
            self.logger.error(f"❌ Chaos AI Error: {str(e)}")
            return self._fallback_logic(request, reason=str(e))

    def _load_system_prompt(self) -> str:
        try:
            with open("prompts/chaos_prime.md", "r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            return "You are a trading assistant. Output strict JSON."

    def _construct_user_prompt(self, request) -> str:
        drawings_summary = "No manual chart markers."
        if request.drawing_data:
            drawings_summary = f"User marked {len(request.drawing_data)} points: {json.dumps(request.drawing_data)}"

        return f"""
        **MARKET CONTEXT:**
        Symbol: {request.symbol}, Timeframe: {request.timeframe}
        **USER INPUTS:**
        1. General: "{request.general_info or 'N/A'}"
        2. Details: "{request.execution_details or 'N/A'}"
        3. CONSTRAINTS: "{request.constraints or 'N/A'}"
        4. Drawings: {drawings_summary}
        """

    def _clean_json_string(self, text: str) -> str:
        cleaned = text.strip()
        if cleaned.startswith("```json"): cleaned = cleaned[7:]
        if cleaned.startswith("```"): cleaned = cleaned[3:]
        if cleaned.endswith("```"): cleaned = cleaned[:-3]
        return cleaned.strip()

    def _fallback_logic(self, request, reason: str) -> dict:
        self.logger.warning(f"⚠️ Fallback Logic. Reason: {reason}")
        return {
            "strategy_name": "Fallback SMA",
            "indicators": [{"name": "SMA", "period": request.sma_fast}, {"name": "SMA", "period": request.sma_slow}],
            "entry_rules": [{"condition": "Fast SMA crosses above Slow SMA"}],
            "exit_rules": [{"type": "stop_loss", "value": 2.0}]
        }