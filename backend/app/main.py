"""
Arquivo principal da aplicação FastAPI.
Define a aplicação, middlewares, e configurações gerais.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time
from contextlib import asynccontextmanager
from .config import get_settings
from .routers import extractor
from .models import HealthResponse

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Carregar configurações
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerenciador de contexto para startup e shutdown.
    """
    # Startup
    logger.info(f"Iniciando aplicação em modo {settings.environment}")
    logger.info(f"Servidor rodando na porta {settings.port}")
    yield
    # Shutdown
    logger.info("Encerrando aplicação...")


# Criar aplicação FastAPI
app = FastAPI(
    title="Document Extractor API",
    description="API para extração de dados de documentos usando IA",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list, # Usar o método que retorna lista
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Middleware customizado para logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Middleware que loga todas as requisições.
    """
    start_time = time.time()
    
    # Log da requisição
    logger.info(f"Requisição: {request.method} {request.url.path}")
    
    # Processar requisição
    response = await call_next(request)
    
    # Calcular tempo de processamento
    process_time = time.time() - start_time
    
    # Adicionar header customizado
    response.headers["X-Process-Time"] = str(round(process_time, 3))
    
    # Log da resposta
    logger.info(
        f"Resposta: {request.method} {request.url.path} "
        f"- Status: {response.status_code} - Tempo: {process_time:.3f}s"
    )
    
    return response


# Incluir routers (SEM prefixo adicional, pois já está definido no router)
app.include_router(extractor.router)


# Rota raiz
@app.get("/", response_model=HealthResponse)
async def root():
    """
    Endpoint raiz - health check básico.
    """
    return HealthResponse(
        environment=settings.environment
    )


# Health check em /health (compatibilidade)
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check para monitoramento.
    """
    return HealthResponse(
        environment=settings.environment
    )


# Health check em /api/health (para o frontend)
@app.get("/api/health", response_model=HealthResponse)
async def api_health_check():
    """
    Health check da API.
    """
    return HealthResponse(
        environment=settings.environment
    )


# Informações em /info (compatibilidade)
@app.get("/info")
async def info():
    """
    Retorna informações sobre a API.
    """
    return api_info_response()


# Informações em /api/info (para o frontend)
@app.get("/api/info")
async def api_info():
    """
    Retorna informações sobre a API.
    """
    return api_info_response()


def api_info_response():
    """
    Resposta padrão para informações da API.
    """
    return {
        "name": "Document Extractor API",
        "version": "1.0.0",
        "environment": settings.environment,
        "features": {
            "providers": ["claude", "gemini"],
            "file_types": settings.allowed_file_types,
            "max_file_size_mb": settings.max_file_size_mb
        },
        "endpoints": {
            "docs": "/docs",
            "health": "/api/health",
            "extract": "/api/extract/",
            "info": "/api/info"
        }
    }


# Handler global de exceções
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Captura exceções não tratadas e retorna resposta padronizada.
    """
    logger.error(f"Exceção não tratada: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Erro interno do servidor",
            "detail": str(exc) if settings.environment == "development" else None
        }
    )