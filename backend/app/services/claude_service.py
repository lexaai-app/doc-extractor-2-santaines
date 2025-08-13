"""
Serviço para integração com a API do Claude (Anthropic).
Implementa a lógica específica para extração usando Claude.
"""

import httpx
import json
from typing import Dict, Any, Optional
import logging
from ..models import DocumentData
from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class ClaudeService:
    
    """
    Classe que encapsula a comunicação com a API do Claude.
    Usa o padrão de classe para facilitar testes e manutenção.
    """  
    
    BASE_URL = "https://api.anthropic.com/v1/messages"
    MODEL = "claude-3-5-sonnet-20241022"
    
    @staticmethod
    def get_extraction_prompt() -> str:
        """
        Retorna o prompt otimizado para extração de documentos.
        Separado em método para facilitar ajustes.
        """
        return """Analise este documento de identificação brasileiro e extraia TODOS os dados disponíveis. 

IMPORTANTE: 
- Extraia TODOS os campos visíveis no documento
- Use formatação brasileira para datas (DD/MM/AAAA)
- Mantenha CPF e RG com a formatação original
- Se um campo não existir no documento, use null

Responda APENAS com JSON válido no seguinte formato:

{
  "tipoDocumento": "tipo do documento (RG, CNH, CPF, etc)",
  "nome": "nome completo",
  "nomeDaMae": "nome da mãe",
  "nomeDoPai": "nome do pai",
  "cpf": "CPF com formatação (000.000.000-00)",
  "rg": "RG com formatação",
  "orgaoExpedidor": "órgão expedidor/UF",
  "dataExpedicao": "DD/MM/AAAA",
  "dataVencimento": "DD/MM/AAAA", 
  "dataNascimento": "DD/MM/AAAA",
  "naturalidade": "cidade de nascimento",
  "uf": "estado (sigla)",
  "nacionalidade": "nacionalidade",
  "estadoCivil": "estado civil",
  "endereco": "endereço completo",
  "cep": "CEP com formatação (00000-000)",
  "numeroDocumento": "número do documento",
  "categoria": "categoria CNH (se aplicável)",
  "numeroRegistro": "número de registro (CNH)",
  "validade": "validade da CNH",
  "primeiraHabilitacao": "data primeira habilitação",
  "observacoes": "observações do documento",
  "outrosDados": "outros dados relevantes"
}

Retorne APENAS o JSON, sem explicações ou formatação markdown."""

    async def extract_document(
        self,
        api_key:str,
        file_content: str,
        file_type:  str
    ) -> DocumentData:
        """
        Método assíncrono para extrair dados do documento.
        
        Args:
            api_key: Chave da API do Claude
            file_content: Conteúdo do arquivo em base64
            file_type: Tipo MIME do arquivo
            
        Returns:
            DocumentData: Dados extraídos e validados
            
        Raises:
            httpx.HTTPError: Erro na comunicação HTTP
            json.JSONDecodeError: Erro ao parsear resposta
            ValueError: Outros erros de validação
        """
        
        # Determinar tipo de conteúdo (image ou document)
        content_type = "document" if file_type == "application/pdf" else "image"
        
        # Montar o payload da requisição
        payload = {
            "model": self.MODEL,
            "max_tokens": 3000,
            "messages": [{
                "role": "user",
                "content": [
                    {
                        "type": content_type,
                        "source": {
                            "type": "base64",
                            "media_type": file_type,
                            "data": file_content
                        }
                    },
                    {
                        "type": "text",
                        "text": self.get_extraction_prompt()
                    }
                ]
            }]
        }       

        # Headers da requisição
        headers = {
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01"
        }
        
        # Cliente HTTP assíncrono com timeout
        async with httpx.AsyncClient(timeout=settings.api_timeout) as client:
            try:
                # Fazer requisição POST
                logger.info("Enviando requisição para Claude API...")
                response = await client.post(
                    self.BASE_URL,
                    json=payload,
                    headers=headers
                )
                
                # Verificar status HTTP
                response.raise_for_status()
                
                # Parsear resposta JSON
                data = response.json()
                
                # Extrair texto da resposta
                response_text = data.get("content", [{}])[0].get("text", "")
                
                # Limpar resposta (remover markdown se houver)
                response_text = response_text.strip()
                if response_text.startswith("```"):
                    # Remove blocos de código markdown
                    response_text = response_text.split("```")[1]
                    if response_text.startswith("json"):
                        response_text = response_text[4:]
                
                # Parsear JSON extraído
                extracted_data = json.loads(response_text.strip())
                
                # Validar e retornar usando modelo Pydantic
                return DocumentData(**extracted_data)
                
            except httpx.HTTPStatusError as e:
                # Erro HTTP (4xx, 5xx)
                logger.error(f"Erro HTTP na API Claude: {e.response.status_code}")
                error_data = e.response.json() if e.response.content else {}
                raise ValueError(f"Erro Claude API: {error_data.get('error', {}).get('message', 'Erro desconhecido')}")
                
            except json.JSONDecodeError as e:
                # Erro ao parsear JSON
                logger.error(f"Erro ao parsear resposta JSON: {str(e)}")
                raise ValueError("Resposta inválida da API Claude")
                
            except Exception as e:
                # Outros erros
                logger.error(f"Erro inesperado: {str(e)}")
                raise