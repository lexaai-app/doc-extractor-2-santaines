// js/extractor.js
import { elements, state } from './config.js';
import { showAlert, showLoading, hideLoading, displayExtractedData } from './ui.js';
import { api } from './api.js';  // Importar a API

export async function extractData() {
    if (!state.currentFile) return;
    
    elements.extractBtn.disabled = true;
    showLoading();
    
    try {
        if (state.apiEnabled && state.apiKey) {
            // Verificar se API está online
            const isApiOnline = await api.checkHealth();
            if (!isApiOnline) {
                throw new Error('API offline. Verifique se o servidor está rodando.');
            }
            
            showLoading(`Processando com ${state.currentProvider === 'claude' ? 'Claude' : 'Gemini'}...`);
            
            // Converter arquivo para base64
            const base64 = await fileToBase64(state.currentFile);
            
            // Chamar API
            const response = await api.extractDocument(
                state.currentProvider,
                state.apiKey,
                base64,
                state.currentFile.type,
                state.currentFile.name
            );
            
            if (response.success) {
                displayExtractedData(response.data, false, 'ai');
                showAlert(
                    `✅ Dados extraídos com sucesso! Tempo: ${response.processing_time}s`, 
                    'success'
                );
            } else {
                throw new Error(response.error || 'Erro na extração');
            }
            
        } else {
            showLoading('Preparando campos para preenchimento...');
            await extractManually();
        }
    } catch (error) {
        console.error('Erro na extração:', error);
        showAlert(`❌ ${error.message}`, 'error');
        
        // Fallback para modo manual
        await extractManually();
    } finally {
        elements.extractBtn.disabled = false;
        hideLoading();
    }
}

// Resto do código permanece igual...
async function extractWithClaude() {
    try {
        const base64 = await fileToBase64(state.currentFile);
        
        const requestBody = {
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 3000,
            messages: [{
                role: "user",
                content: [
                    {
                        type: state.currentFile.type === 'application/pdf' ? 'document' : 'image',
                        source: {
                            type: "base64",
                            media_type: state.currentFile.type,
                            data: base64
                        }
                    },
                    {
                        type: "text",
                        text: `Analise este documento de identificação brasileiro e extraia os dados disponíveis. Responda APENAS com JSON válido no seguinte formato:

{
  "tipoDocumento": "tipo do documento",
  "nome": "nome completo",
  "nomeDaMae": "nome da mãe",
  "nomeDoPai": "nome do pai",
  "cpf": "CPF",
  "rg": "RG",
  "orgaoExpedidor": "órgão expedidor",
  "dataExpedicao": "data expedição",
  "dataVencimento": "data vencimento", 
  "dataNascimento": "data nascimento",
  "naturalidade": "naturalidade",
  "uf": "UF",
  "nacionalidade": "nacionalidade",
  "estadoCivil": "estado civil",
  "endereco": "endereço",
  "cep": "CEP",
  "numeroDocumento": "número documento",
  "categoria": "categoria CNH",
  "outrosDados": "outros dados relevantes"
}

Use null para campos não encontrados. Apenas JSON válido, sem explicações.`
                    }
                ]
            }]
        };
        
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": state.apiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`Erro na API (${response.status})`);
        }
        
        const data = await response.json();
        let responseText = data.content[0].text;
        
        // Clean up response
        responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        
        const extractedInfo = JSON.parse(responseText);
        displayExtractedData(extractedInfo, false, 'ai');
        
    } catch (error) {
        console.log('Erro na API Claude, usando modo manual:', error);
        await extractManually();
    }
}

async function extractWithGemini() {
    try {
        const base64 = await fileToBase64(state.currentFile);
        
        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: `Analise este documento de identificação brasileiro e extraia os dados disponíveis. Responda APENAS com JSON válido no seguinte formato:

{
  "tipoDocumento": "tipo do documento",
  "nome": "nome completo",
  "nomeDaMae": "nome da mãe",
  "nomeDoPai": "nome do pai",
  "cpf": "CPF",
  "rg": "RG",
  "orgaoExpedidor": "órgão expedidor",
  "dataExpedicao": "data expedição",
  "dataVencimento": "data vencimento", 
  "dataNascimento": "data nascimento",
  "naturalidade": "naturalidade",
  "uf": "UF",
  "nacionalidade": "nacionalidade",
  "estadoCivil": "estado civil",
  "endereco": "endereço",
  "cep": "CEP",
  "numeroDocumento": "número documento",
  "categoria": "categoria CNH",
  "outrosDados": "outros dados relevantes"
}

Use null para campos não encontrados. Apenas JSON válido, sem explicações.`
                    },
                    {
                        inlineData: {
                            mimeType: state.currentFile.type,
                            data: base64
                        }
                    }
                ]
            }]
        };
        
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${state.apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            }
        );
        
        if (!response.ok) {
            throw new Error(`Erro na API (${response.status})`);
        }
        
        const data = await response.json();
        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        // Clean up response
        const cleanedResponse = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        
        const extractedInfo = JSON.parse(cleanedResponse);
        displayExtractedData(extractedInfo, false, 'ai');
        
    } catch (error) {
        console.log('Erro na API Gemini, usando modo manual:', error);
        await extractManually();
    }
}

async function extractManually() {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Analyze filename for document type
    const fileName = state.currentFile.name.toLowerCase();
    let documentType = "Documento de Identificação";
    
    if (fileName.includes('rg') || fileName.includes('identidade')) {
        documentType = "RG - Registro Geral";
    } else if (fileName.includes('cnh') || fileName.includes('habilitacao')) {
        documentType = "CNH - Carteira de Habilitação";  
    } else if (fileName.includes('cpf')) {
        documentType = "CPF - Cadastro de Pessoa Física";
    }
    
    const templateData = {
        tipoDocumento: documentType,
        nome: "[CLIQUE PARA INSERIR NOME]",
        cpf: "[000.000.000-00]",
        rg: "[00.000.000-0]",
        dataNascimento: "[DD/MM/AAAA]",
        nomeDaMae: "[NOME DA MÃE]",
        nomeDoPai: "[NOME DO PAI]",
        orgaoExpedidor: "[ÓRGÃO/UF]",
        naturalidade: "[CIDADE]",
        uf: "[UF]",
        endereco: "[ENDEREÇO COMPLETO]",
        cep: "[00000-000]",
        dataExpedicao: "[DD/MM/AAAA]",
        numeroDocumento: "[NÚMERO]",
        outrosDados: `Arquivo: ${state.currentFile.name} (${(state.currentFile.size / 1024 / 1024).toFixed(2)}MB)`
    };
    
    displayExtractedData(templateData, false, 'manual');
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(",")[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}