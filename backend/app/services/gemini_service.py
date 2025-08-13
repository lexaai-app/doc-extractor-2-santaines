"""
Serviço para integração com a API do Gemini (Google).
Implementa a lógica específica para extração usando Gemini.
"""

import httpx
import json
from typing import Dict, Any, Optional
import logging
from ..models import DocumentData
from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class GeminiService:
    """
    Classe que encapsula a comunicação com a API do Gemini.
    """
    
    # URL base da API (note o placeholder para a chave)
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    
    @staticmethod
    def get_extraction_prompt() -> str:
        """
        Retorna o mesmo prompt usado no Claude para consistência.
        """
        # Reutilizamos o mesmo prompt do Claude
        from .claude_service import ClaudeService
        return ClaudeService.get_extraction_prompt()
    
    async def extract_document(
        self, 
        api_key: str, 
        file_content: str, 
        file_type: str
    ) -> DocumentData:
        """
        Método assíncrono para extrair dados usando Gemini.
        
        A estrutura é similar ao Claude, mas o formato da API é diferente.
        """
        
        # Montar payload no formato do Gemini
        payload = {
            "contents": [{
                "parts": [
                    {
                        "text": self.get_extraction_prompt()
                    },
                    {
                        "inlineData": {
                            "mimeType": file_type,
                            "data": file_content
                        }
                    }
                ]
            }],
            "generationConfig": {
                "temperature": 0.1,      # Baixa temperatura para respostas consistentes
                "topK": 1,              # Seleciona apenas o token mais provável
                "topP": 0.8,            # Nucleus sampling
                "maxOutputTokens": 2048  # Limite de tokens na resposta
            }
        }
        
        # URL com a chave como query parameter
        url = f"{self.BASE_URL}?key={api_key}"
        
        async with httpx.AsyncClient(timeout=settings.api_timeout) as client:
            try:
                logger.info("Enviando requisição para Gemini API...")
                response = await client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                response.raise_for_status()
                data = response.json()
                
                # Estrutura de resposta do Gemini é diferente
                response_text = (
                    data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "")
                )
                
                # Limpar resposta
                response_text = response_text.strip()
                if response_text.startswith("```"):
                    response_text = response_text.split("```")[1]
                    if response_text.startswith("json"):
                        response_text = response_text[4:]
                
                # Parsear e validar
                extracted_data = json.loads(response_text.strip())
                return DocumentData(**extracted_data)
                
            except httpx.HTTPStatusError as e:
                logger.error(f"Erro HTTP na API Gemini: {e.response.status_code}")
                error_data = e.response.json() if e.response.content else {}
                raise ValueError(f"Erro Gemini API: {error_data.get('error', {}).get('message', 'Erro desconhecido')}")
                
            except Exception as e:
                logger.error(f"Erro inesperado Gemini: {str(e)}")
                raise