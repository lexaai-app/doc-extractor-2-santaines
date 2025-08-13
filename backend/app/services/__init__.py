"""
Marca o diretório services como pacote Python.
"""

# Imports convenientes
from .claude_service import ClaudeService
from .gemini_service import GeminiService

__all__ = ["ClaudeService", "GeminiService"]