"""
Configurações da aplicação usando Pydantic v2 Settings.
"""

from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """
    Configurações da aplicação com Pydantic v2.
    """
    
    # Configurações do servidor
    port: int = 8567
    environment: str = "development"
    
    # CORS - usar string simples
    allowed_origins: str = "http://localhost:8570,http://127.0.0.1:8570"
    
    # Limites de upload
    max_file_size_mb: int = 10
    
    # Configurações de API
    api_timeout: int = 30
    rate_limit: int = 60
    
    # Logs
    log_level: str = "INFO"
    
    # Tipos de arquivo permitidos
    allowed_file_types: List[str] = [
        "image/jpeg",
        "image/jpg", 
        "image/png",
        "application/pdf"
    ]
    
    class Config:
        """Configuração do Pydantic v2"""
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"
    
    @property
    def max_file_size_bytes(self) -> int:
        """Calcula tamanho em bytes."""
        return self.max_file_size_mb * 1024 * 1024
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """
        Property que retorna lista de origens permitidas.
        """
        return [
            origin.strip() 
            for origin in self.allowed_origins.split(",") 
            if origin.strip()
        ]


@lru_cache()
def get_settings() -> Settings:
    """Retorna instância única de Settings."""
    return Settings()
