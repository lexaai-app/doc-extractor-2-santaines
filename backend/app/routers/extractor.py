"""
Router (controlador) para endpoints de extração.
Define as rotas HTTP e coordena os serviços.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import time
import logging
from ..models import ExtractionRequest, ExtractionResponse, DocumentData
from ..services.claude_service import ClaudeService
from ..services.gemini_service import GeminiService
from ..config import get_settings

# Criar router - agrupa endpoints relacionados
router = APIRouter(
    prefix="/api/extract",  # Prefixo para todas as rotas
    tags=["extraction"]     # Tag para documentação
)

logger = logging.getLogger(__name__)
settings = get_settings()

# Instanciar serviços
claude_service = ClaudeService()
gemini_service = GeminiService()


@router.post("/", response_model=ExtractionResponse)
async def extract_document(request: ExtractionRequest) -> ExtractionResponse:
    """
    Endpoint principal para extração de documentos.
    
    POST /api/extract/
    
    Recebe:
    - provider: claude ou gemini
    - api_key: chave da API
    - file_content: arquivo em base64
    - file_type: tipo MIME
    - file_name: nome original
    
    Retorna:
    - success: booleano
    - data: dados extraídos
    - error: mensagem de erro (se houver)
    - processing_time: tempo de processamento
    """
    
    # Marcar tempo inicial
    start_time = time.time()
    
    try:
        # Validar tamanho do arquivo
        # Base64 aumenta o tamanho em ~33%
        estimated_size = len(request.file_content) * 0.75
        if estimated_size > settings.max_file_size_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"Arquivo muito grande. Máximo: {settings.max_file_size_mb}MB"
            )
        
        # Validar tipo de arquivo
        if request.file_type not in settings.allowed_file_types:
            raise HTTPException(
                status_code=415,
                detail=f"Tipo de arquivo não suportado: {request.file_type}"
            )
        
        # Escolher serviço baseado no provider
        if request.provider == "claude":
            logger.info(f"Processando com Claude: {request.file_name}")
            document_data = await claude_service.extract_document(
                api_key=request.api_key,
                file_content=request.file_content,
                file_type=request.file_type
            )
        else:  # gemini
            logger.info(f"Processando com Gemini: {request.file_name}")
            document_data = await gemini_service.extract_document(
                api_key=request.api_key,
                file_content=request.file_content,
                file_type=request.file_type
            )
        
        # Calcular tempo de processamento
        processing_time = time.time() - start_time
        
        # Retornar resposta de sucesso
        return ExtractionResponse(
            success=True,
            data=document_data,
            provider=request.provider,
            processing_time=round(processing_time, 2)
        )
        
    except ValueError as e:
        # Erros de validação ou API
        logger.error(f"Erro de validação: {str(e)}")
        return ExtractionResponse(
            success=False,
            error=str(e),
            provider=request.provider,
            processing_time=round(time.time() - start_time, 2)
        )
        
    except HTTPException:
        # Re-lançar exceções HTTP
        raise
        
    except Exception as e:
        # Erros inesperados
        logger.error(f"Erro inesperado: {str(e)}", exc_info=True)
        return ExtractionResponse(
            success=False,
            error="Erro interno no servidor",
            provider=request.provider,
            processing_time=round(time.time() - start_time, 2)
        )


@router.get("/test")
async def test_endpoint():
    """
    Endpoint de teste simples.
    GET /api/extract/test
    """
    return {
        "message": "API de extração funcionando!",
        "providers": ["claude", "gemini"],
        "max_file_size_mb": settings.max_file_size_mb
    }