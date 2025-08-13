// js/api.js
/**
 * Módulo de comunicação com o backend
 * Centraliza todas as chamadas à API
 */

import { API_BASE_URL } from './config.js';

/**
 * Classe para gerenciar comunicação com a API
 */
class DocumentExtractorAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    /**
     * Verifica se a API está online
     */
    async checkHealth() {
        try {
            // Em desenvolvimento: http://localhost:8527/api/health
            // Em produção: https://dominio.com.br/api/health
            const response = await fetch(`${this.baseURL}/api/health`);
            return response.ok;
        } catch (error) {
            console.error('API offline:', error);
            return false;
        }
    }

    /**
     * Extrai dados do documento usando IA
     */
    async extractDocument(provider, apiKey, fileContent, fileType, fileName) {
        try {
            // CORREÇÃO: adicionar /api no início
            const response = await fetch(`${this.baseURL}/api/extract/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider: provider,
                    api_key: apiKey,
                    file_content: fileContent,
                    file_type: fileType,
                    file_name: fileName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || data.error || 'Erro na API');
            }

            return data;
        } catch (error) {
            console.error('Erro na extração:', error);
            throw error;
        }
    }

    /**
     * Obtém informações da API
     */
    async getInfo() {
        try {
            const response = await fetch(`${this.baseURL}/api/info`);
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter informações:', error);
            throw error;
        }
    }

    /**
     * Testa o endpoint de extração
     */
    async testExtraction() {
        try {
            const response = await fetch(`${this.baseURL}/api/extract/test`);
            return await response.json();
        } catch (error) {
            console.error('Erro ao testar extração:', error);
            throw error;
        }
    }
}

// Exportar instância única
export const api = new DocumentExtractorAPI();

// Log da URL da API em desenvolvimento
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('API Base URL:', API_BASE_URL);
}