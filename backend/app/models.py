"""
Modelos Pydantic para validação de dados.
Pydantic automaticamente valida tipos, formatos e conteúdo.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, Literal
from datetime import datetime
import base64

class ExtractionRequest(BaseModel):
    
    """
    Modelo para requisição de extração.
    Valida os dados recebidos do frontend.
    """ 
    # Provedor: só aceita 'claude' ou 'gemini'
    provider: Literal["claude", "gemini"] = Field(
        ..., description= "Provedor de IA para extração"
    )
    
    # Chave da API
    api_key: str = Field(
        ...,
        min_length=10,
        description="Chave de API do provedor"
    )
    
    #  Arquivo em base64
    file_content: str = Field(
        ...,
        min_length=10,
        description="Conteúdo do arquivo em base64"
    )
    
    # Tipo MIME do arquivo
    file_type: str = Field(
        ...,
        description="Tipo MIME do arquivo (ex: image/jpeg)"
    )
    
    # Tipo MIME do arquivo
    file_name: str = Field(
        ...,
        description="Nome original do arquivo"
    )
    
    @validator('api_key')
    def validate_api_key(cls, v:str, values: dict) -> str:
        """
        Validador customizado para chaves de API.
        Verifica formato básico sem expor a chave.
        """
        provider = values.get('provider')
        
        if provider == 'claude' and not v.startswith('sk-ant-api'):
            raise ValueError('Chave Claude deve começar com sk-ant-api')
        if provider == 'gemini' and not v.startswith('AIza'):
            raise ValueError('Chave Gemini deve começar com AIza')
        
        return v
    
    @validator('file_content')
    def validate_base64(cls, v:str) -> str:
        """
        Valida se o conteúdo é base64 válido.
        """       
        
        try:
            base64.b64decode(v)
            return v
        except Exception:
            raise ValueError('Conteúdo do arquivo não é base64 válido')
        
class DocumentData(BaseModel):
    
    """
    Modelo para os dados extraídos do documento.
    Define a estrutura esperada de retorno.
    """
    # Campos obrigatórios
    tipoDocumento: str = Field(..., description="Tipo do documento") 
    
        # Campos opcionais (podem ser None)
    nome: Optional[str] = None
    cpf: Optional[str] = None
    rg: Optional[str] = None
    dataNascimento: Optional[str] = None
    nomeDaMae: Optional[str] = None
    nomeDoPai: Optional[str] = None
    orgaoExpedidor: Optional[str] = None
    dataExpedicao: Optional[str] = None
    dataVencimento: Optional[str] = None
    naturalidade: Optional[str] = None
    uf: Optional[str] = None
    nacionalidade: Optional[str] = None
    estadoCivil: Optional[str] = None
    endereco: Optional[str] = None
    cep: Optional[str] = None
    numeroDocumento: Optional[str] = None       

    # Campos específicos CNH
    categoria: Optional[str] = None
    numeroRegistro: Optional[str] = None
    validade: Optional[str] = None
    primeiraHabilitacao: Optional[str] = None
    
     # Campos adicionais
    observacoes: Optional[str] = None
    outrosDados: Optional[str] = None
    
class ExtractionResponse(BaseModel):
    
    """
    Modelo para resposta da extração.
    Padroniza o formato de retorno da API.
    """
    
    success: bool = Field(..., description="Se a extração foi bem-sucedida")
    data: Optional[DocumentData] = Field(None, description="Dados extraídos")
    error: Optional[str] = Field(None, description="Mensagem de erro, se houver")
    provider: str = Field(..., description="Provedor usado")
    processing_time: float = Field(..., description="Tempo de processamento em segundos")
    timestamp: datetime = Field(default_factory=datetime.now)
    
    class Config:
        """Permite serialização JSON de datetime"""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        
class HealthResponse(BaseModel):
    """
    Modelo para health check da API.
    Usado para monitoramento e status.
    """
    
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = "1.0.0"
    environment: str